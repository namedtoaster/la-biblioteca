#!/usr/bin/env node
// House rule: no long dashes (em or en) in code, copy or docs.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' })
  .split('\n')
  .filter((f) => /\.(md|ts|tsx|mjs|css|json)$/.test(f) && f !== 'package-lock.json');

const bad = [];
for (const file of files) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (/[\u2013\u2014]/.test(line)) bad.push(`${file}:${i + 1}`);
  });
}

if (bad.length) {
  console.error('Long dashes found:\n' + bad.join('\n'));
  process.exit(1);
}
console.log(`check: ${files.length} files, no long dashes`);
