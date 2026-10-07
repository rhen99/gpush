'use strict';

const { spawnSync } = require('child_process');

function runGit(args, options = {}) {
  const { cwd, ...rest } = options;
  return spawnSync('git', args, Object.assign({ encoding: 'utf8', cwd }, rest));
}

function isInsideGit(cwd) {
  const res = runGit(['rev-parse', '--is-inside-work-tree'], { cwd, stdio: 'pipe' });
  if (res.error) return false;
  return (res.stdout || '').toString().trim() === 'true';
}

function getCurrentBranch(cwd) {
  const res = runGit(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd, stdio: 'pipe' });
  if (res.error) return '';
  return (res.stdout || '').toString().trim();
}

function getRemotes(cwd) {
  const res = runGit(['remote'], { cwd, stdio: 'pipe' });
  if (res.error) return [];
  return (res.stdout || '')
    .toString()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function hasRemote(cwd) {
  return getRemotes(cwd).length > 0;
}

function getStatus(cwd) {
  const res = runGit(['status', '--short', '--untracked-files=all'], { cwd, stdio: 'pipe' });
  if (res.error) return '';
  return (res.stdout || '').toString();
}

function hasChanges(cwd) {
  return getStatus(cwd).trim().length > 0;
}

function addAll(cwd) {
  const res = runGit(['add', '.'], { cwd, stdio: 'inherit' });
  return { ok: res.status === 0 };
}

function commit(message, cwd) {
  const res = runGit(['commit', '-m', message], { cwd, stdio: 'inherit' });
  return { ok: res.status === 0 };
}

function push(cwd) {
  const res = runGit(['push'], { cwd, stdio: 'inherit' });
  return { ok: res.status === 0 };
}

module.exports = {
  isInsideGit,
  getCurrentBranch,
  getRemotes,
  hasRemote,
  getStatus,
  hasChanges,
  addAll,
  commit,
  push,
};
