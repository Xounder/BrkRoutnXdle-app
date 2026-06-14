# Settings Management

## Status

Planned (V1)

---

## Purpose

Allow the user to configure global preferences that affect schedule generation and calendar display.

Settings are stored locally and apply to all tasks.

---

## Source Documents

- `ux-flows.md` — Settings flow, available settings
- `domain-model.md` — Settings entity
- `canonical-data-model.md` — UserSettings canonical model
- `component-architecture.md` — SettingsPanel, SettingsModal, SettingsContext

---

## Settings Model

```ts
type Settings = {
  shuffleEnabled: boolean;
  weekStartsOn: "monday" | "sunday";
  availableStartHour: string;
  availableEndHour: string;
};
```

---

## Available Settings

| Setting | Options | Default | Impact |
|---|---|---|---|
| Shuffle | Enabled / Disabled | Enabled | Randomizes distribution |
| Week Start | Monday / Sunday | Monday | Calendar first day of week |
| Available Hours | Start Hour / End Hour | 08:00 - 18:00 | Defines scheduling window |

---

## UX Flow

### Open Settings

- Click settings icon in header
- Opens modal with global configuration

### Modify Setting

- Change value in modal
- Changes apply immediately to calendar view
- Next generation uses updated settings

---

## Data Storage

Settings stored in localStorage under `settings` key.

---

## Business Rules

| Rule | Description |
|---|---|
| INV-005 | Events cannot be generated outside Available Hours |
| Shuffle | When enabled, previous week repetition is penalized |

---

## Success Criteria

1. User can toggle shuffle on/off.
2. User can change week start day.
3. User can configure available hours.
4. Settings persist across page refreshes.
5. Changes affect next schedule generation.

---

## References

- `ux-flows.md` — Settings UX flow
- `domain-model.md` — Settings entity and invariants
- `generation-algorithm.md` — How settings affect algorithm
