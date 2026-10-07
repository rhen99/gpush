'use strict';

const fs = require('fs');
const path = require('path');

const git = require('./git');
const { loadConfig, CONFIG_FILE } = require('./config');
const { runChecks } = require('./checks');

function getProjectName(cwd) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    if (pkg && pkg.name) return pkg.name;
  } catch (err) {
    // fall through to directory name
  }
  return path.basename(cwd);
}

function runWorkflow({ message, cwd = process.cwd() } = {}) {
  if (!git.isInsideGit(cwd)) {
    console.error('Error: This directory is not a Git repository.');
    return 1;
  }

  const branch = git.getCurrentBranch(cwd) || '(unknown)';
  const remotes = git.getRemotes(cwd);
  if (remotes.length === 0) {
    console.error('Error: No Git remote configured.');
    return 1;
  }
  const remote = remotes[0];

  console.log(`Project: ${getProjectName(cwd)}`);
  console.log(`Branch: ${branch}`);

  let config;
  try {
    config = loadConfig(cwd);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    return 1;
  }

  if (config.created) {
    console.log(`Created ${CONFIG_FILE}`);
  }

  console.log('\nRunning checks...');
  const result = runChecks(config.checks, { cwd });
  if (!result.ok) {
    console.error('\nChecks failed. Push cancelled.');
    return 1;
  }

  if (!git.hasChanges(cwd)) {
    console.log('\nNo changes to commit.');
    return 0;
  }

  console.log('\nChanges detected:');
  process.stdout.write(git.getStatus(cwd));

  console.log('Staging changes...');
  if (!git.addAll(cwd).ok) {
    console.error('Error: Failed to stage changes.');
    return 1;
  }

  console.log('Creating commit...');
  if (!git.commit(message, cwd).ok) {
    console.error('Error: Commit failed. Push cancelled.');
    return 1;
  }
  console.log('\u2713 Commit created');

  console.log(`\nPushing to ${remote}/${branch}...`);
  if (!git.push(cwd).ok) {
    console.error('Error: Push failed.');
    return 1;
  }
  console.log('\u2713 Push successful');

  return 0;
}

module.exports = { runWorkflow };
