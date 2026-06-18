# Failure Recovery

After every agent execution:

1. Save pipeline state.
2. Save summary.
3. Save errors.
4. Save concerns.
5. Save history entry.

Examples of what to record:
- **errors**: build failures, runtime crashes, test failures, compilation errors
- **concerns**: shell restrictions, ambiguous specifications, tool limitations, environment issues

### Resume Metadata Accuracy

After updating pipeline state, verify that `resume.last_completed_agent` and `resume.last_completed_step` match the actual completed work. These fields must be updated when a step finishes — never leave them pointing to a pending step.

### Git Diff Tool Limitations

The `get-git-diff` tool may fail with `undefined..undefined` because its default arguments are not applied at runtime. Use `bash` with explicit refs as a fallback:

```text
git diff HEAD~1 -- apps/web/
```

Specify both `baseRef` and `headRef` explicitly when calling the tool.

---

If execution stops unexpectedly:

```text
delivery-pipeline:resume
```

must continue from the latest persisted state.

Completed work must never be repeated.
