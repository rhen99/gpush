#!/usr/bin/env node
'use strict';

const { runWorkflow } = require('./workflow');

function parseMessage(args) {
  return args
    .filter((arg) => !arg.startsWith('-'))
    .join(' ')
    .trim();
}

function main(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: gpush <commit-message>');
    console.log('');
    console.log('Runs checks, commits changes, and pushes the current branch.');
    console.log('');
    console.log('  --help, -h   Show this help.');
    return 0;
  }

  const message = parseMessage(args);
  if (!message) {
    console.error('Error: commit message required.');
    console.error('Usage: gpush <commit-message>');
    return 1;
  }

  return runWorkflow({ message });
}

process.exitCode = main(process.argv.slice(2));
