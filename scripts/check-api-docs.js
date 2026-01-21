#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'docs', 'api');
const skip = new Set(['overview.md', 'STANDARDS.md', 'openapi.json', 'supplier-insights.md']);

function listMarkdown(dir) {
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !skip.has(path.relative(baseDir, path.join(dir, f))))
    .map((f) => path.join(dir, f));
}

const groups = ['core', 'features', 'admin', 'integrations'];
let files = [];
for (const g of groups) {
  const dir = path.join(baseDir, g);
  if (fs.existsSync(dir)) files = files.concat(listMarkdown(dir));
}
// top-level md (if any)
files = files.concat(listMarkdown(baseDir));

const errors = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const firstLine = content.split('\n')[0];
  if (!/# .*\((stable|beta|experimental)\)/i.test(firstLine)) {
    errors.push(`${file}: missing stability tag in first heading`);
  }
  const envelopeRegex = /Envelope:\s*`?\{[^\}]*data[^\}]*error[^\}]*traceId[^\}]*\}`?/i;
  if (!envelopeRegex.test(content)) {
    errors.push(`${file}: missing envelope note { data, error, traceId }`);
  }
}

if (errors.length) {
  console.error('API doc check failed:');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}

console.log('API docs OK: stability + envelope present');
