# Failure Recovery

After every agent execution:

1. Save pipeline state.
2. Save summary.
3. Save errors.
4. Save concerns.
5. Save history entry.

If execution stops unexpectedly:

```text
delivery-pipeline:resume
```

must continue from the latest persisted state.

Completed work must never be repeated.
