#!/usr/bin/env node

/**
 * Supabase local health check:
 * - Container statuses
 * - Health endpoints + pg_isready
 * - Migration drift vs linked project (suggest --include-all)
 */

const { execSync } = require('node:child_process');
const fetch = global.fetch;

const PROJECT_REF_PATH = 'supabase/.temp/project-ref';
const HOST = process.env.SUPABASE_HOST || '127.0.0.1';
const API_PORT = process.env.SUPABASE_API_PORT || 54321;
const DB_PORT = process.env.SUPABASE_DB_PORT || 54322;

function section(title) {
  console.log(`\n=== ${title} ===`);
}

function run(cmd) {
  try {
    return execSync(cmd, { stdio: 'pipe', encoding: 'utf8' }).trim();
  } catch (err) {
    return { error: err };
  }
}

section('Container status');
const containers = run('docker ps --filter "name=supabase_.*_open_people" --format "{{.Names}}\\t{{.Status}}"');
if (containers.error) {
  console.log('docker ps failed:', containers.error.message.trim());
} else if (containers.length === 0) {
  console.log('No supabase_*_open_people containers found. Try `supabase start --debug --include-all`.');
} else {
  containers.split('\n').forEach(line => console.log(line));
}

section('Health endpoints');
const endpoints = [
  `http://${HOST}:${API_PORT}`,
  `http://${HOST}:${API_PORT}/rest/v1/`,
  `http://${HOST}:${API_PORT}/auth/v1/health`,
  `http://${HOST}:${API_PORT}/storage/v1/version`,
  `http://${HOST}:${API_PORT}/graphql/v1`,
];

async function checkEndpoint(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    console.log(`${url} -> ${res.status}`);
  } catch (err) {
    console.log(`${url} -> ERROR ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  for (const url of endpoints) {
    // eslint-disable-next-line no-await-in-loop
    await checkEndpoint(url);
  }

  section('pg_isready');
  const pgReady = run(`pg_isready -h ${HOST} -p ${DB_PORT} -d postgres -U postgres`);
  if (pgReady.error) {
    console.log('pg_isready failed (is Postgres client installed?):', pgReady.error.message.trim());
  } else {
    console.log(pgReady);
  }

  section('Migration drift vs linked project');
  let projectRef = 'unknown';
  try {
    projectRef = run(`cat ${PROJECT_REF_PATH}`) || 'unknown';
  } catch (_) {}

  const tableRaw = run(`supabase migration list --linked`);
  if (tableRaw.error) {
    console.log('Could not list migrations; run with --debug for details.');
  } else {
    const lines = tableRaw.split('\n').filter(l => l.trim().match(/^\d/));
    const pending = [];
    for (const line of lines) {
      const [local, remote] = line.split('|').map(s => s.trim());
      if (local && (!remote || remote.length === 0)) {
        pending.push(local);
      }
    }
    if (pending.length === 0) {
      console.log(`✅ Local migrations are aligned with linked project (${projectRef}).`);
    } else {
      console.log('⚠️  Local migrations not on linked project:');
      pending.forEach(name => console.log(` - ${name}`));
      console.log('\nRun with --include-all to apply them anyway:');
      console.log('  supabase start --debug --include-all');
    }
  }

  section('Log tail (manual)');
  console.log('Examples:');
  console.log('  docker logs -f supabase_db_open_people');
  console.log('  docker logs -f supabase_auth_open_people | egrep --line-buffered \"(ERROR|WARN|INFO)\"');
}

main().catch(err => {
  console.error('Health check failed:', err);
  process.exit(1);
});
