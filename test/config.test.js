'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadConfig } = require('../src/config');

test('creates .gpush.json when missing', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'gpush-test-'));
  const pkg = path.join(cwd, 'package.json');
  fs.writeFileSync(pkg, JSON.stringify({ scripts: { lint: 'eslint .', test: 'node --test', build: 'node build.js' } }));
  const result = loadConfig(cwd);
  assert.strictEqual(result.created, true);
  assert.ok(fs.existsSync(path.join(cwd, '.gpush.json')));
  assert.deepStrictEqual(result.checks, ['npm run lint', 'npm test', 'npm run build']);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('returns existing config', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'gpush-test-'));
  const cfg = path.join(cwd, '.gpush.json');
  fs.writeFileSync(cfg, JSON.stringify({ checks: ['npm test'] }));
  const result = loadConfig(cwd);
  assert.strictEqual(result.created, false);
  assert.deepStrictEqual(result.checks, ['npm test']);
  fs.rmSync(cwd, { recursive: true, force: true });
});
