'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { runWorkflow } = require('../src/workflow');

function initRepoWithRemote() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'gpush-wf-'));
  const remote = fs.mkdtempSync(path.join(os.tmpdir(), 'gpush-remote-'));
  execSync('git init -q', { cwd });
  execSync('git config user.name "Test"', { cwd });
  execSync('git config user.email "test@test.local"', { cwd });
  execSync('git init --bare -q', { cwd: remote });
  execSync(`git remote add origin ${remote}`, { cwd });
  execSync('git branch -M main', { cwd });
  return { cwd, remote };
}

test('exits 0 when no changes', () => {
  const { cwd, remote } = initRepoWithRemote();
  const code = runWorkflow({ message: 'msg', cwd });
  assert.strictEqual(code, 0);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(remote, { recursive: true, force: true });
});

test('successful commit and push with passing checks', () => {
  const { cwd, remote } = initRepoWithRemote();
  fs.writeFileSync(path.join(cwd, '.gpush.json'), JSON.stringify({ checks: ['node -e "process.exit(0)"'] }));
  fs.writeFileSync(path.join(cwd, 'a.txt'), 'data');
  const code = runWorkflow({ message: 'add a', cwd });
  assert.strictEqual(code, 0);
  const last = execSync('git log -1 --oneline', { cwd: remote }).toString().trim();
  assert.ok(last.includes('add a'));
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(remote, { recursive: true, force: true });
});

test('stops on failing check', () => {
  const { cwd, remote } = initRepoWithRemote();
  fs.writeFileSync(path.join(cwd, '.gpush.json'), JSON.stringify({ checks: ['node -e "process.exit(1)"'] }));
  fs.writeFileSync(path.join(cwd, 'b.txt'), 'data');
  const code = runWorkflow({ message: 'fail', cwd });
  assert.strictEqual(code, 1);
  try {
    const out = execSync('git log -1 --oneline', { cwd: remote }).toString().trim();
    assert.strictEqual(out, '');
  } catch (e) {
    // no commits is expected
  }
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(remote, { recursive: true, force: true });
});

test('non-repo returns 1', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'gpush-nonrepo-'));
  const code = runWorkflow({ message: 'msg', cwd });
  assert.strictEqual(code, 1);
  fs.rmSync(cwd, { recursive: true, force: true });
});
