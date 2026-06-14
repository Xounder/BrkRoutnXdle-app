# Architecture

## Overview

- [architecture.md](architecture.md) — System architecture, core principles, tech stack, and ADR references
- [monorepo-structure.md](monorepo-structure.md) — Monorepo folder structure and dependency rules
- [package-contracts.md](package-contracts.md) — Package boundaries, allowed/forbidden imports, and data flow

## Domain

- [canonical-data-model.md](canonical-data-model.md) — Canonical data model shared across all packages
- [domain-model.md](domain-model.md) — Domain entities, value objects, invariants, and ubiquitous language
- [event-classification.md](event-classification.md) — Event type taxonomy and classification rules

## Algorithm

- [generation-algorithm.md](generation-algorithm.md) — Schedule generation algorithm, phases, and validation

## Integration

- [google-calendar-integration.md](google-calendar-integration.md) — Google Calendar OAuth, CRUD, sync, and conflict resolution

## UX & Design

- [ux-flows.md](ux-flows.md) — User experience flows, UI states, and interaction patterns
- [docs/design-system.md](docs/design-system.md) — Visual design system: colors, typography, components, animations

## Development Conventions

- [commit-pattern.md](commit-pattern.md) — Commit message format

## Features

- [docs/feature/index.md](docs/feature/index.md) — Feature tracker with completion status for all features
- [docs/feature/google-oauth-authentication.md](docs/feature/google-oauth-authentication.md) — OAuth 2.0 login and session management
- [docs/feature/dedicated-calendar-setup.md](docs/feature/dedicated-calendar-setup.md) — Auto-create BrkRoutnXdle calendar
- [docs/feature/task-management.md](docs/feature/task-management.md) — CRUD for task definitions
- [docs/feature/blocked-slot-management.md](docs/feature/blocked-slot-management.md) — CRUD for unavailability blocks
- [docs/feature/calendar-navigation.md](docs/feature/calendar-navigation.md) — Day/Week/Month views and navigation
- [docs/feature/schedule-preview.md](docs/feature/schedule-preview.md) — Preview before save with visual diff
- [docs/feature/manual-calendar-editing.md](docs/feature/manual-calendar-editing.md) — Drag, resize, delete events in preview
- [docs/feature/save-to-google-calendar.md](docs/feature/save-to-google-calendar.md) — Diff-based persistence to Google Calendar
- [docs/feature/completion-flow.md](docs/feature/completion-flow.md) — Mark events as completed
- [docs/feature/calendar-sync-refresh.md](docs/feature/calendar-sync-refresh.md) — Sync external Google Calendar changes
- [docs/feature/settings-management.md](docs/feature/settings-management.md) — Global preferences (shuffle, hours, week start)
- [docs/feature/unsaved-changes-protection.md](docs/feature/unsaved-changes-protection.md) — Warn before discarding preview
- [docs/feature/conflict-handling.md](docs/feature/conflict-handling.md) — Google Calendar conflict resolution
- [docs/feature/allocation-failure-handling.md](docs/feature/allocation-failure-handling.md) — Partial allocation and failure reports
- [docs/feature/mobile-experience.md](docs/feature/mobile-experience.md) — Mobile layout and touch interactions
- [docs/feature/accessibility.md](docs/feature/accessibility.md) — Keyboard nav, screen reader, color independence
- [docs/feature/error-handling-and-retry.md](docs/feature/error-handling-and-retry.md) — Error categories, retry strategy, UI states
- [docs/feature/design-system-implementation.md](docs/feature/design-system-implementation.md) — Visual design token implementation
- [docs/feature/future-features-roadmap.md](docs/feature/future-features-roadmap.md) — V2+ planned features

---

## Detailed Docs

- [docs/adrs/](docs/adrs/) — Architecture Decision Records (ADR-001 through ADR-009)
- [docs/frontend/component-architecture.md](docs/frontend/component-architecture.md) — Frontend component tree, contexts, hooks, and state management
- [docs/backend/api-specification.md](docs/backend/api-specification.md) — Backend REST API specification
- [docs/feature/task-priority-and-weight.md](docs/feature/task-priority-and-weight.md) — Task priority levels and allocation ordering
- [docs/feature/schedule-generation-workflow.md](docs/feature/schedule-generation-workflow.md) — Generate, preview, recalculate, and save workflow
- [docs/feature/](docs/feature/) — Complete feature catalog (19 feature specification files)
- [docs/testing-strategy.md](docs/testing-strategy.md) — Testing approach, scope, and responsibilities per package
- [docs/deployment-strategy.md](docs/deployment-strategy.md) — Build, deploy, hosting, and environment configuration
- [docs/security-architecture.md](docs/security-architecture.md) — Threat model, token management, and security boundaries
- [docs/error-handling-strategy.md](docs/error-handling-strategy.md) — Error categories, retry strategy, and UI error states
- [docs/logging-monitoring-strategy.md](docs/logging-monitoring-strategy.md) — Logging rules, health checks, and monitoring approach

## Reference Files

Detailed content extracted to stay within the 400-line limit:

- [references/domain-model-references.md](references/domain-model-references.md) — Entity rules, examples, and enumerations
- [references/canonical-model-notes.md](references/canonical-model-notes.md) — Entity descriptions and future extensions
- [references/event-details.md](references/event-details.md) — Event lifecycles, conflict scenarios, and JSON examples
- [references/algorithm-phases.md](references/algorithm-phases.md) — Detailed phase rules, weight mapping, and allocation examples
- [references/google-operations.md](references/google-operations.md) — API endpoint details, payloads, and error handling
- [references/ux-states.md](references/ux-states.md) — Empty, loading, and error UI states with message texts
- [references/monorepo-details.md](references/monorepo-details.md) — Expanded package responsibilities and versioning
- [references/contract-enforcement.md](references/contract-enforcement.md) — Import enforcement, stability rules, and CI
- [references/transformation-pipeline.md](references/transformation-pipeline.md) — Data transformation pipeline flow diagrams
- [docs/backend/references/api-endpoints.md](docs/backend/references/api-endpoints.md) — Detailed API endpoint specs with JSON examples
- [docs/frontend/references/component-specs.md](docs/frontend/references/component-specs.md) — Detailed component specifications with TSX samples
- [docs/feature/references/workflow-details.md](docs/feature/references/workflow-details.md) — Detailed workflow states and save strategy
