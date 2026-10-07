# gpush — Personal Development Workflow CLI

## 1. Project Goal

Build a personal command-line tool that automates the repetitive workflow of:

1. Running the project's required checks and tests
2. Stopping immediately if a check fails
3. Staging changes
4. Creating a Git commit
5. Pushing the current branch to its remote repository

The primary purpose is to **reduce unnecessary token usage when working with coding agents**.

Instead of repeatedly asking an agent to perform routine Git and testing operations, the agent can invoke:

```bash
gpush
```

The CLI handles the mechanical workflow locally.

---

# 2. Core Workflow

The intended workflow is:

```text
gpush
  │
  ├── Verify we're inside a Git repository
  │
  ├── Load project configuration
  │
  ├── Run configured checks/tests
  │
  ├── If a check fails → stop
  │
  ├── Check for changes
  │
  ├── Create commit
  │
  └── Push current branch to remote
```

Example:

```text
$ gpush

Project: booking-app
Branch: main

Running checks...
✓ npm run lint
✓ npm test
✓ npm run build

Changes detected:
  M src/booking.js
  M src/styles.css

Creating commit...
✓ Commit created

Pushing to origin/main...
✓ Push successful
```

If a check fails:

```text
$ gpush

Running checks...
✓ npm run lint
✗ npm test

Tests failed.

Push cancelled.
```

The tool should never push when a required check fails.

---

# 3. Technology Stack

## Runtime

**Node.js**

The CLI will run locally and interact with the operating system and Git.

## Language

**TypeScript**

Reasons:

- Strong typing
- Good fit for CLI development
- Useful professional development practice
- Easier to maintain as the tool grows

## Package manager

**npm**

Used for dependencies, scripts, and global installation.

## Git integration

Use the installed **Git CLI** rather than a Git library.

The application will execute commands such as:

```text
git status
git add .
git commit
git push
```

This keeps Git behavior delegated to Git itself.

## CLI framework

**None initially.**

Start with Node's built-in argument handling.

A framework such as Commander can be introduced later if the CLI becomes complex enough to justify it.

## Testing

Use Node's **built-in test runner** initially.

---

# 4. Project Configuration

Each project that uses `gpush` can eventually contain:

```text
.gpush.json
```

Example:

```json
{
  "checks": ["npm run lint", "npm test", "npm run build"]
}
```

Another project might use:

```json
{
  "checks": ["php artisan test", "npm run build"]
}
```

The important idea is that `gpush` does not need to understand every technology.

The project tells `gpush` what needs to be checked.

---

# 5. V1 Features

## Repository validation

Before doing anything:

- Verify the current directory is inside a Git repository.
- Determine the current branch.
- Verify a remote exists.

## Configuration

- Look for `.gpush.json`.
- Read the configured checks.
- Provide a useful error if the configuration is invalid.

## Checks

Execute configured commands sequentially.

Example:

```text
npm run lint
npm test
npm run build
```

If any command exits unsuccessfully:

```text
STOP
```

No commit or push should occur.

## Change detection

After checks pass:

```text
git status
```

Determine whether there are changes to commit.

If there are no changes:

```text
No changes to commit.
```

Then exit without creating an empty commit.

## Commit

Create a commit using a supplied message.

For the initial version, decide on one simple interface, such as:

```bash
gpush "updated booking form"
```

or:

```bash
gpush
```

with the CLI obtaining the message another way.

The simplest initial design is likely to require the message:

```bash
gpush "updated booking form"
```

## Push

Push the current branch to its configured remote.

The tool should not assume that the branch is always `main`.

For example:

```text
main
feature/booking
fix/login
```

should all work according to the repository's existing Git configuration.

---

# 6. Error Handling

The CLI should fail safely.

Important cases:

### Not a Git repository

```text
Error: This directory is not a Git repository.
```

### Missing configuration

Decide whether V1 should:

- require `.gpush.json`, or
- allow projects with no checks.

Recommended:

> Allow an empty/missing configuration but require explicit configuration when checks are desired.

This keeps the tool useful for simple projects.

### Invalid configuration

Explain what is wrong rather than producing a cryptic JSON error.

### Check failure

Stop immediately.

```text
✗ npm test

Push cancelled.
```

### No changes

Do not create an empty commit.

### Commit failure

Stop before pushing.

### Push failure

Show Git's error and exit with a failure status.

---

# 7. CLI Exit Codes

The tool should use meaningful process exit codes.

Conceptually:

```text
0 → successful workflow
1 → workflow failed
```

This is important because coding agents and other automation can use the exit code to determine whether `gpush` succeeded.

For example:

```text
Agent
  ↓
gpush
  ↓
exit 0 → continue
exit 1 → investigate failure
```

This is one of the most important design considerations for the project's intended use.

---

# 8. Non-Interactive Design

Because the main purpose is reducing agent interaction and token usage, V1 should avoid unnecessary prompts.

Prefer:

```bash
gpush "fixed booking validation"
```

over:

```text
Commit message: ______
Continue? [Y/n]
```

The workflow should be deterministic.

Human intervention should primarily occur when something actually fails.

---

# 9. Safety Rules

The tool should not:

- Force push
- Automatically resolve merge conflicts
- Automatically pull/rebase
- Delete files
- Reset changes
- Switch branches
- Modify unrelated Git configuration

The initial philosophy is:

> Automate the repetitive safe path, but don't make potentially destructive Git decisions on the user's behalf.

---

# 10. Project Structure

Initial structure:

```text
gpush/
├── src/
│   ├── cli.ts
│   ├── git.ts
│   ├── checks.ts
│   ├── config.ts
│   └── workflow.ts
│
├── test/
│   ├── config.test.ts
│   ├── git.test.ts
│   └── workflow.test.ts
│
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

The exact structure can change as implementation reveals better boundaries.

---

# 11. Development Milestones

## Milestone 1 — CLI foundation

Create the Node.js CLI project (Vanilla JS, CommonJS).

Requirements:

- [x] npm project
- [ ] TypeScript configuration (skipped per request — Vanilla JS)
- [ ] build script (not needed)
- [x] executable CLI entry point
- [x] local development command

Goal:

```bash
gpush --help
```

works. [x] Done.

---

## Milestone 2 — Git integration

Implement basic Git command execution.

The CLI should be able to:

- [x] detect repository
- [x] get current branch
- [x] inspect status
- [x] detect remote

Goal:

```text
gpush
→ understands the current Git repository
``` [x] Done.

---

## Milestone 3 — Project configuration

Implement `.gpush.json`.

Support:

```json
{
  "checks": ["npm test", "npm run build"]
}
```

[x] Implemented. Also auto-generates `.gpush.json` from `package.json` scripts when missing. Validation errors are descriptive.

---

## Milestone 4 — Check execution

Execute checks sequentially.

Requirements:

- [x] stream useful output
- [x] detect failure
- [x] stop immediately on failure
- [x] return appropriate exit code

Goal:

```text
checks pass → continue
checks fail → stop
``` [x] Done.

---

## Milestone 5 — Commit workflow

Implement:

```text
status
→ add
→ commit
```

Requirements:

- [x] don't commit if there are no changes
- [x] require a commit message
- [x] surface Git errors

[x] Done.

---

## Milestone 6 — Push workflow

Implement:

```text
commit
→ push
```

[x] Done. Uses `git push` (respects upstream/current branch/remote config). Requires remote configured.

---

## Milestone 7 — End-to-end workflow

Combine everything:

```bash
gpush "updated booking system"
```

Expected flow:

```text
Validate
↓
Checks
↓
Status
↓
Commit
↓
Push
```

[x] Done (`src/workflow.js` + `src/cli.js`). Works end-to-end with proper exit codes.

---

## Milestone 8 — Automated testing

Test the CLI against temporary Git repositories.

Important:

> Tests must never operate on your actual development repositories.

Test cases should include:

- valid repository
- non-repository
- passing checks
- failing checks
- no changes
- successful commit
- failed commit
- successful push
- failed push
- invalid configuration

---

# 12. V1 Definition of Done

V1 is finished when this works reliably:

```bash
gpush "my commit message"
```

from inside a configured project.

The CLI should:

```text
✓ Detect Git repository
✓ Load configuration
✓ Run checks
✓ Stop on failure
✓ Detect changes
✓ Commit changes
✓ Push current branch
✓ Return useful output
✓ Return appropriate exit code
```

And importantly:

> An AI coding agent should be able to invoke `gpush` instead of spending multiple tool calls and tokens performing these steps manually.

---

# 13. Explicitly Out of Scope for V1

Do not add these unless a real need appears:

- AI-generated commit messages
- GitHub API integration
- GitHub repository creation
- Pull requests
- Releases
- Automatic branch creation
- Automatic merging
- Automatic rebasing
- Force pushing
- GUI
- Cloud service
- telemetry
- plugin system
- elaborate configuration management
- automatic detection of every project type

The goal is a **small reliable local tool**, not a Git replacement.

---

# 14. Future Possibilities

Only after V1 proves useful:

```text
gpush init
```

Generate project configuration.

```text
gpush --dry-run
```

Show what would happen without modifying Git.

```text
gpush --verbose
```

Show detailed command output.

Project presets:

```text
WordPress
Laravel
React/Vite
Node
PHP
```

Potentially:

```text
gpush --ai
```

for optional AI-assisted commit messages or project workflow detection.

These are future ideas, not V1 requirements.

---

# 15. Success Metric

The primary measure of success is not the number of features.

It is:

> **How much repetitive agent work can be replaced by one reliable command?**

If the agent can go from:

```text
"Changes are ready."
```

to:

```bash
gpush "implemented booking validation"
```

and the tool safely handles the rest, the project has accomplished its main purpose.
