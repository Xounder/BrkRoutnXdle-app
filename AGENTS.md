# AGENTS.md

**Startup ritual (run in every new session):**

Read:

```text
.opencode/INDEX.md
```

This is the project's single entry point for architecture, workflow, agents, skills, templates, and documentation navigation.

## Purpose

This file contains operational rules and execution conventions.

Architecture, workflow, agent responsibilities, templates, and project documentation are referenced through:

```text
.opencode/INDEX.md
```

## Core Rules

### Project Boundary

Never:

* Read files outside the project root
* Write files outside the project root
* Request files outside the project root

All operations must remain inside the repository.

### Documentation Language

All project documentation must be written in English.

Applies to:

* Markdown
* YAML
* JSON
* Source code comments
* Generated documentation

### File Size Limit

No file may exceed:

```text
400 lines
```

When a documentation file exceeds this limit:

1. Split the content into smaller files inside a dedicated folder `references`
2. Replace the oversized content in the original file with references to the new files
3. Update all references and navigation paths
4. Preserve the original document as the entry point whenever possible

### Commit Convention

Before making any commit, read:

```text
.opencode/architecture/commit-pattern.md
```

All commits must follow the pattern defined there. If a commit fails validation, consult the file again before retrying.

## Process Handling

Never:

* Check running processes
* Kill running processes
* Manage operating system processes directly

If execution fails because of a running process:

* Report the error
* Continue following pipeline rules

## Validation

When application execution is required:

1. Start application
2. Execute validation
3. Stop application

Applications must not remain running after validation.

## Error Reporting

All agents must report using the [standard agent response format](.opencode/skills/delivery-pipeline/references/agent-response-format.md).

## Parallel Execution

Safe parallel execution should always be preferred.

Examples:

```text
Frontend + Backend
```

```text
QA Frontend + QA Backend
```

provided dependencies are satisfied.

## Task Completion

Work is not complete until:

* Implementation is complete
* Validation is complete
* QA approval is complete
* Pipeline state is updated

Partial completion is not considered completion.

## Mandatory Codebase Discovery

Before reading, analyzing, modifying, reviewing, or searching for files, execute the `codebase-analysis` skill once at the start of the task.

Do not inspect any files before the skill completes.

This requirement applies to every new task, even when the requested file path is already known.

> **Exception:** Pipeline subagents (Senior Frontend, Senior Backend, QA Frontend, QA Backend) dispatched by the delivery-pipeline orchestrator MUST NOT run `codebase-analysis`. The orchestrator provides all required context (file paths, code snippets, dependency info). Running the skill again is wasteful and may interfere with the pipeline flow.

### Codebase Analysis Mode

Use when the task involves:

* Source code
* Architecture
* Refactoring
* Bug fixing
* Feature implementation
* Testing
* Dependency analysis

Required action:

```text
Run skill: codebase-analysis
Mode: implementation
```

The skill must perform the repository structural analysis workflow and collect code-level context before any file inspection.

### Documentation Analysis Mode

Use when the task involves:

* Markdown documentation
* AGENTS.md
* INDEX.md
* Templates
* Workflows
* Operational guides
* Documentation refactoring

Required action:

```text
Run skill: codebase-analysis
Mode: docs
```

The skill must perform the documentation discovery workflow and build a documentation map before reading individual documents.

### Enforcement

Agents must not:

* Start file exploration manually
* Read multiple files blindly
* Perform repository-wide searches before running the skill

The `codebase-analysis` skill is always the first discovery step.

Only after the skill completes may the agent inspect specific files, documentation, or implementation details.

## External files restriction

Never open, read, write, or request files outside this project directory. All operations must stay within the project root.

## Agent rules

### External files restriction
Never open, read, write, or request files outside this project directory. All operations must stay within the project root.

### Process handling
- **Never check if a process is running** (no Get-Process, ps, etc.)
- **Never kill/taskkill processes yourself** — just run `pnpm` commands as-is
- If a port is already in use, report the error to the orchestrator — do not resolve it

### Tool preference for file operations
Prefer the **dedicated tools** (`grep`, `glob`, `read`, `edit`, `write`) for file searching and content operations over `bash`/PowerShell. Use `bash` only as a last resort when the dedicated tools cannot accomplish the task.

### Bash command restrictions
The shell environment rejects the following patterns:
- **Chained commands**: `&&`, `||`, `;`, `|`, backticks (`\``), `$()`, `${}`, literal newlines — each command must be a single statement
- **Unrecognized commands**: only the commands documented in this file (pnpm, git, docker, curl, ls, cat, etc.) and a few utility commands are accepted
- **Node/tsx execution**: scripts must be inside the project directory with `.ts`, `.js`, or `.tsx` extension; the script path is resolved from the project root (not from any `workdir` override); flags like `-e`, `--eval`, `--require` are blocked
- **File operations**: all file paths must resolve inside the project root
- **Curl**: only allowed to `localhost` URLs

### Standard Response Format
All subagents MUST return results using the [standard agent response format](.opencode/skills/delivery-pipeline/references/agent-response-format.md):
- `summary.changes` — files created or modified
- `summary.validations` — build/lint/test results
- `concerns` — any issues, blockers, or deviations
- `errors` — failures encountered

If a subagent does not follow this format, the orchestrator must re-call it specifying the required format.

### Retry Limit (failure escalation)
All subagents dispatched by the orchestrator implement a **3-attempt retry limit**. If the same action fails 3 consecutive times, the subagent must stop and report to the orchestrator which action failed, the error reason, and that it cannot proceed.

The orchestrator must then re-dispatch the subagent with appropriate error context — never attempt to resolve the failure directly.

## References

All project documentation is cataloged in:

```text
.opencode/INDEX.md
```
