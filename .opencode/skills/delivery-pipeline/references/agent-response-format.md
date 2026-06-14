# Standard Agent Response Format

All agents should return:

```yaml
summary:
  changes:
    - item
  validations:
    - item
concerns:
  - item
errors:
  - item
```

Errors may be empty.
Concerns may be empty.
