# Schedule Preview

## Status

Planned (V1)

---

## Purpose

Allow the user to inspect the generated schedule before any changes are persisted.

No structural change is saved immediately — the user always previews first.

---

## Source Documents

- `schedule-generation-workflow.md` — Preview state, working state, user actions
- `ux-flows.md` — Preview before save principle
- `design-system.md` — Preview state card styling
- `component-architecture.md` — CalendarContext, previewEvents

---

## Core Principle

```text
Generate
    ↓
Preview
    ↓
User Review
    ↓
Save
```

The algorithm never modifies Google Calendar automatically.

---

## States

### Persisted State

Current state in Google Calendar. Unchanged until save is confirmed.

### Working State

Temporary state in memory. Contains all preview modifications.

---

## Preview User Actions

| Action | Description |
|---|---|
| Move Events | Drag and drop to reschedule |
| Resize Events | Change event duration |
| Delete Events | Remove occurrences from preview |
| Generate Again | Discard and create new distribution |
| Save | Persist working state to Google Calendar |
| Discard | Cancel all changes, revert to persisted state |

---

## Visual Diff

During preview:

- New events: dashed teal border, teal glow shadow
- Removed events: strikethrough text, coral tint
- Modified events: gold left accent, gold glow shadow

---

## Multiple Simulations

```text
Generate → Preview #1
Generate Again → Preview #2
Generate Again → Preview #3
```

Only the last version can be saved.

---

## Success Criteria

1. User can generate a schedule and see preview.
2. User can generate multiple versions.
3. User can edit the preview manually.
4. User can discard changes.
5. User can save changes.
6. No changes are saved without explicit confirmation.

---

## References

- `schedule-generation-workflow.md` — Full workflow specification
- `references/workflow-details.md` — Preview editing details
- `design-system.md` — Preview state visual tokens
