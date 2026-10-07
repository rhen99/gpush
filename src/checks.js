'use strict';

const { spawnSync } = require('child_process');

function runCheck(command, cwd) {
  const res = spawnSync(command, { cwd, shell: true, stdio: 'inherit' });
  return !res.error && res.status === 0;
}

function runChecks(checks, { cwd = process.cwd() } = {}) {
  for (const command of checks) {
    const ok = runCheck(command, cwd);
    if (ok) {
      console.log(`\u2713 ${command}`);
    } else {
      console.log(`\u2717 ${command}`);
      return { ok: false, failed: command };
    }
  }

  return { ok: true, failed: null };
}

module.exports = { runChecks };
