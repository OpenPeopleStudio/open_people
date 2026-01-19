#!/usr/bin/env node

/**
 * Vault CLI - Quick upload tool
 * 
 * Usage:
 *   vault-upload file.pdf
 *   vault-upload -v invoice.pdf receipt.jpg
 *   vault-upload --watch ./inbox
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.vault-cli', 'config.json');

function loadConfig() {
  let config = {
    endpoint: process.env.VAULT_ENDPOINT,
    token: process.env.VAULT_TOKEN,
  };
  
  // Try to load from config file
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const fileConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      config = { ...config, ...fileConfig };
    }
  } catch (err) {
    // Ignore config file errors
  }
  
  return config;
}

function parseArgs(args) {
  const options = {
    files: [],
    verbose: false,
    watch: null,
    status: false,
    help: false,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '-v' || arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '-w' || arg === '--watch') {
      options.watch = args[++i];
    } else if (arg === '-s' || arg === '--status') {
      options.status = true;
    } else if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (!arg.startsWith('-')) {
      options.files.push(arg);
    }
  }
  
  return options;
}

function printHelp() {
  console.log(`
Vault CLI - Upload files to your encrypted vault

Usage:
  vault-upload [options] <file...>

Options:
  -v, --verbose    Show detailed output
  -w, --watch DIR  Watch directory for new files
  -s, --status     Check connection status
  -h, --help       Show this help message

Examples:
  vault-upload invoice.pdf
  vault-upload -v document.pdf image.png
  vault-upload --watch ./inbox

Configuration:
  Set VAULT_ENDPOINT and VAULT_TOKEN environment variables, or create:
  ~/.vault-cli/config.json with { "endpoint": "...", "token": "..." }
`);
}

async function uploadFile(filePath, config, verbose) {
  return new Promise((resolve, reject) => {
    const filename = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);
    
    if (verbose) {
      console.log(`  Uploading: ${filename} (${formatSize(stats.size)})`);
    }
    
    // Create multipart form data
    const boundary = '----VaultCLI' + Date.now();
    const header = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: application/octet-stream\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileBuffer, footer]);
    
    const url = new URL(config.endpoint);
    const httpModule = url.protocol === 'https:' ? https : http;
    
    const req = httpModule.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'x-vault-token': config.token,
        'User-Agent': 'vault-cli/1.0',
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            resolve({ filename, ...result });
          } else {
            reject(new Error(result.error || 'Upload failed'));
          }
        } catch (err) {
          reject(new Error(`Invalid response: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function printResult(result, verbose) {
  console.log(`\n✓ ${result.filename}`);
  
  if (result.ai_category) {
    console.log(`  Category: ${result.ai_category}`);
  }
  if (result.ai_tags?.length) {
    console.log(`  Tags: ${result.ai_tags.join(', ')}`);
  }
  if (result.suggested_folder) {
    console.log(`  Suggested: ${result.suggested_folder}`);
  }
  if (verbose && result.ai_summary) {
    console.log(`  Summary: ${result.ai_summary}`);
  }
  
  console.log(`  Status: ${result.auto_approved ? 'Auto-approved' : 'Pending review'}`);
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  
  if (options.help || (options.files.length === 0 && !options.status && !options.watch)) {
    printHelp();
    process.exit(0);
  }
  
  const config = loadConfig();
  
  if (!config.endpoint || !config.token) {
    console.error('Error: Missing configuration.');
    console.error('Set VAULT_ENDPOINT and VAULT_TOKEN environment variables, or create ~/.vault-cli/config.json');
    process.exit(1);
  }
  
  if (options.status) {
    console.log('Vault CLI Configuration:');
    console.log(`  Endpoint: ${config.endpoint}`);
    console.log(`  Token: ${config.token.slice(0, 12)}...`);
    process.exit(0);
  }
  
  // Upload files
  let success = 0;
  let failed = 0;
  
  for (const filePath of options.files) {
    if (!fs.existsSync(filePath)) {
      console.error(`✗ File not found: ${filePath}`);
      failed++;
      continue;
    }
    
    try {
      const result = await uploadFile(filePath, config, options.verbose);
      printResult(result, options.verbose);
      success++;
    } catch (err) {
      console.error(`✗ Failed: ${filePath} - ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\nComplete: ${success} uploaded, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
