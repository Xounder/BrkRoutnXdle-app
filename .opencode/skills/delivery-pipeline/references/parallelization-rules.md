# Parallelization Rules

## Allowed

Frontend and Backend tasks may execute simultaneously when:

* Dependencies are satisfied
* Contracts are already defined
* No blocking dependency exists

Example:

```text
Backend creates API

Frontend consumes API contract

Both may proceed if the contract is already defined.
```

## Not Allowed

Tasks with unmet dependencies must wait.

Example:

```text
TASK-02 depends on TASK-01

TASK-02 must not start until TASK-01 completes.
```

## Shared Config File Ownership

When parallel tasks share a config file (e.g. `package.json` test infrastructure), the orchestrator MUST assign single-owner responsibility in each dispatch prompt.

Parallel agents must not both claim the same file or file section:

```text
Invalid:
TASK-01 and TASK-02 both add the test script + devDependency to package.json

Valid:
TASK-01 owns package.json (test script + vitest devDependency)
TASK-02 relies on TASK-01's infra and adds only its own test file
```

Missing single-ownership causes agents to defer work (e.g. "TASK-01 owns infra, so I won't add my test"), incomplete validation, and orchestrator re-dispatch loops.
