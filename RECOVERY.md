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

## TASK-07 — Persistent manual placement

- Shared events and creation payloads expose an optional `isPinned` marker.
- POST/PATCH persist it in Google private metadata; normalized GET returns it.
- A PATCH without the marker preserves the stored value.
- Implementation commit: `bf431be` (contract dependency for frontend placement).
- Fresh calendar tests: **5/5 passed**, including three pin roundtrip cases.
- Fresh API build passed. Real Google-account validation remains outstanding.

## TASK-02 — Definition-only creation

- Sidebar creation stores a task definition without scheduling an event.
- Explicit slot placement creates a unique local occurrence with exact times
  and a pin. Editing a definition preserves occurrence IDs, times and pins.
- Implementation commit: `531a905`.
- The user explicitly superseded automatic sidebar placement. Prior QA accepted
  the delivery with an exception limited to four immutable `TASK-02.spec.ts`
  cases at lines 59, 90, 118 and 170.
- Retained independent web evidence: **32 passed, 4 failed**, no retries, exit
  code **1**. This suite was not rerun during commit closure and is not green.
- Existing tests remain unchanged; no skipping, filtering or conditional gating.

## TASK-03 — Preview lifecycle

- Generate against the viewed civil week, timezone and configured week start.
- Keep the base calendar separate from the overlay and capture an immutable
  remote replacement baseline. Discard/navigation remove proposals only.
- Preserve the current preview when no alternative exists; prevent edits to
  base events during preview and reject stale asynchronous generation results.
- Implementation commit: `b7ac695`. Shared dashboard/calendar integration also
  wires TASK-04 save and TASK-05 refresh; their dependent commits follow.
- New lifecycle coverage passed in the retained independent frontend QA run.
- Fresh full web build passed before staging; no source changes since that build.

## TASK-04 — Authoritative occurrence saves

- Require a successful authoritative GET before writing. Match occurrences by
  remote ID or exact task/time slot, never by task identity alone.
- Normalize API-origin events at trusted GET/POST boundaries; pending UUIDs
  remain local. The backend's `brkroutnxdle` source is not proof of a local draft.
- Save pinned placements alongside proposals; reject changed remote baselines
  and journal confirmed POST/PATCH/DELETE writes for partial retry.
- Implementation commit: `d465245`.
- Occurrence, pin reload, failed-GET and retry coverage passed in prior QA.
- Validation uses mocked API/Google contracts; live Google remains unverified.

## TASK-05 — Viewed-range refresh

- Refresh fetches the displayed range even outside preview, preserving pending
  placements and removing confirmed remote occurrences deleted in that range.
- Detect remote changes against the earlier confirmed snapshot. Distinguish
  network, authentication, permission, missing-calendar and upstream failures.
- Navigation releases loading and prevents obsolete results from being applied.
- Implementation commit: `3056d4b`; dashboard wiring is in TASK-03's commit.
- New refresh/diagnostic tests passed in retained frontend QA evidence.
