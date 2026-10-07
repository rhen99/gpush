'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const git = require('../src/git');

function initRepo(dir) {
  execSync('git init -q', { cwd: dir });
  execSync('git config user.name "Test"', { cwd: dir });
  execSync('git config user.email "test@test.local"', { cwd: dir });
}

test('isInsideGit detects repo', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'gpush-git-'));
  assert.strictEqual(git.isInsideGit(cwd), false);
  initRepo(cwd);
  assert.strictEqual(git.isInsideGit(cwd), true);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('branch and hasRemote', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'gpush-git-'));
  initRepo(cwd);
  assert.strictEqual(git.hasRemote(cwd), false);
  const remote = fs.mkdtempSync(path.join(os.tmpdir(), 'gpush-remote-'));
  execSync('git init --bare -q', { cwd: remote });
  execSync(`git remote add origin ${remote}`, { cwd });
  assert.strictEqual(git.hasRemote(cwd), true);
  const branch = git.getCurrentBranch(cwd);
  assert.ok(branch.length > 0);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(remote, { recursive: true, force: true });
});

test('detects changes and stages', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'gpush-git-'));
  initRepo(cwd);
  assert.strictEqual(git.hasChanges(cwd), false);
  fs.writeFileSync(path.join(cwd, 'x.txt'), 'hi');
  assert.strictEqual(git.hasChanges(cwd), true);
  git.addAll(cwd);
  assert.strictEqual(git.hasChanges(cwd), true);
  fs.rmSync(cwd, { recursive: true, force: true });
});
