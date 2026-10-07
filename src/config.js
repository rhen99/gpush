'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = '.gpush.json';

const PREFERRED = ['lint', 'test', 'build', 'check', 'typecheck'];
const COMMON = [
  'type-check',
  'tsc',
  'jest',
  'mocha',
  'eslint',
  'prettier',
  'format:check',
  'format',
];

function scriptToCommand(name) {
  return name === 'test' ? 'npm test' : `npm run ${name}`;
}

function readPackageScripts(cwd) {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;

  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch (err) {
    throw new Error(`Could not parse package.json: ${err.message}`);
  }

  if (!pkg || typeof pkg.scripts !== 'object' || pkg.scripts === null) return {};
  return pkg.scripts;
}

function detectChecks(scripts) {
  if (!scripts) return [];

  const names = Object.keys(scripts);
  const preferred = PREFERRED.filter((name) => names.includes(name));
  const selected = preferred.length > 0 ? preferred : COMMON.filter((name) => names.includes(name));

  return selected.map(scriptToCommand);
}

function validateConfig(data) {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`${CONFIG_FILE} must contain a JSON object.`);
  }

  const { checks } = data;
  if (checks === undefined) return { checks: [] };

  if (!Array.isArray(checks)) {
    throw new Error(`${CONFIG_FILE} "checks" must be an array of strings.`);
  }

  for (const check of checks) {
    if (typeof check !== 'string') {
      throw new Error(`${CONFIG_FILE} "checks" must only contain strings.`);
    }
  }

  return { checks };
}

function writeConfig(file, config) {
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
}

function loadConfig(cwd = process.cwd()) {
  const file = path.join(cwd, CONFIG_FILE);

  if (!fs.existsSync(file)) {
    const checks = detectChecks(readPackageScripts(cwd));
    const config = { checks };
    writeConfig(file, config);
    return { checks, created: true, path: file };
  }

  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    throw new Error(`Could not read ${CONFIG_FILE}: ${err.message}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid ${CONFIG_FILE}: ${err.message}`);
  }

  const validated = validateConfig(data);
  return { checks: validated.checks, created: false, path: file };
}

module.exports = {
  CONFIG_FILE,
  PREFERRED,
  COMMON,
  detectChecks,
  validateConfig,
  loadConfig,
};
