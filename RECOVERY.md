# Calendar Scheduling Recovery

## Record provenance

This record was reconstructed on 2026-10-23 from the retained conversation,
current source changes, and validation commands executed during commit closure.
The earlier `.opencode/pipeline.yaml` and recovery planning/QA documents are
absent from the current submodule checkout. This file does not recreate their
original contents or constitute a new independent QA approval.

## TASK-01 — Viewed-week scheduling

- Generate for the requested local week, honoring timezone, DST and week start.
- Validate whole occurrence intervals, frequency, same-day and gap constraints.
- Respect partial blocks and existing events; never propose elapsed slots.
- Preserve previews when no different feasible allocation can be found.
- Implementation commit: `1e4621f`.
- Retained earlier domain QA evidence: 24/24 passed.
- Fresh domain run at 2026-10-23 23:31 UTC: **23 passed, 1 failed**.
  `generateSchedule.test.ts:256` dynamically uses the current week and assumes
  free future work time remains. Its UTC Monday-Friday 09:00-17:00 window had
  ended at this run. The implementation correctly excludes elapsed slots.
- This additional failure is outside the four-case frontend acceptance exception
  and requires explicit acceptance review. The existing test was not modified.
