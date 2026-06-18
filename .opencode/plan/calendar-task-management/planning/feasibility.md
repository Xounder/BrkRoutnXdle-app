# Feasibility Analysis

## Phase 1 — Settings (Recommended)

### Description

Wire Sidebar Settings button to open SettingsModal. Fix Available Start/End Hour to bind to CalendarView `slotMinTime`/`slotMaxTime`. Replace Timezone free-text input with a `<select>` of common IANA timezones.

### Advantages

- Low risk, small surface area
- Settings modal code already exists — only wiring/fixes needed
- Timezone selector is a pure UI change

### Estimated Effort

Small

---

## Phase 2 — Calendar Overhaul

### Description

Change CalendarView to always show 24h. Enable `selectable` for click-to-create modal (Block vs Task). Enable `editable` always (not only preview). Map BlockedSlots to calendar events. Handle `eventDrop` for both tasks and blocks. Handle `eventClick` for edit/delete.

### Advantages

- FullCalendar natively supports all these features
- No backend changes required
- Blocks already in BlockContext — just need rendering

### Estimated Effort

Large

---

## Phase 3 — Task Restrictions

### Description

Extend `TaskRestriction` type with `frequency`, `gapDays`, `allowSameDay`. Add UI in TaskModal for defining time groups (morning/afternoon/evening/night + custom ranges) and frequency/gap/same-day. Update domain algorithm to respect new constraints when generating schedule.

### Advantages

- Domain package is already modular (taskDistributor, availabilityCalculator)
- Separate fields preserve backward compatibility

### Estimated Effort

Medium

---

## Alternative Approaches

### Approach B — All-at-once monolithic

#### Description

Implement all three phases as a single effort.

#### Advantages

Single coherent effort, no intermediate refactoring.

#### Disadvantages

High risk, long feedback loop, hard to isolate issues.

#### Estimated Effort

Large

---

### Approach C — Calendar-first minimal

#### Description

Defer task restrictions to a future project. Focus only on calendar UX improvements.

#### Advantages

Fastest path to core UX improvement.

#### Disadvantages

Leaves task restrictions for later, requiring another round of calendar changes.

#### Estimated Effort

Medium

---

### Custom Approach

#### Description

User could reorder phases or add additional time group presets during implementation.

#### Notes

Flexible ordering — phases are independent in code and can be reordered.
