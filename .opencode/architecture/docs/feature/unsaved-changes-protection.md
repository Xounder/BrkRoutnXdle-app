# Unsaved Changes Protection

## Status

Planned (V1)

---

## Purpose

Prevent accidental loss of preview changes when the user tries to leave or refresh while a Working State exists.

---

## Source Documents

- `schedule-generation-workflow.md` — Working state, discard flow
- `references/workflow-details.md` — Unsaved changes protection

---

## Trigger Scenarios

| Action | Behavior |
|---|---|
| Refresh page | Prompt before reload |
| Navigate away | Prompt before leaving |
| Logout | Prompt before logout |

---

## Prompt

```text
You Have Unsaved Changes

Discard your current preview?
```

---

## Options

| Option | Action |
|---|---|
| Stay | Return to preview, keep Working State |
| Discard | Delete Working State, reload persisted state |

---

## Flow

```text
Working State Exists
    ↓
User Triggers Leave Action
    ↓
Show Unsaved Changes Prompt
    ↓
User Chooses
    ├── Stay → Keep Working State
    └── Discard → Delete Working State
                  ↓
                Reload Persisted State
```

---

## Success Criteria

1. User is warned when leaving with unsaved changes.
2. User can choose to stay and keep changes.
3. User can discard changes and revert.
4. No data is lost accidentally.

---

## References

- `schedule-generation-workflow.md` — Working and persisted states
- `references/workflow-details.md` — Detailed protection flow
