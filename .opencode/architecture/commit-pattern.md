# Commit Message Convention

## Format

```
type: description
```

## Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, missing semicolons, etc. (no code change) |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Adding or modifying tests |
| `chore` | Maintenance tasks (build, deps, tools) |

## Rules

- **Always use lowercase** for type and scope
- **Description**: imperative mood, concise, no trailing period
- **Max 72 chars** for the first line
- **Body**: NEVER

## Examples

```
feat: implement job matching algorithm fixes
fix: resolve skill move bug in autocomplete
docs: update agent rules for pipeline.yaml ownership
refactor: normalize NormalizedJob DTO structure
test: add seniority penalty test cases
chore: update pnpm to v11
```

## Enforcement

- Used by all agents when creating commits
- CI/CD (when added) should validate format