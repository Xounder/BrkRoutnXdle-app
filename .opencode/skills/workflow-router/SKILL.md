---
name: workflow-router
description: Classifies incoming requests and selects the appropriate workflow entry point (Product Manager, Planning Analyst, or Tech Lead) based on codebase presence, requirement clarity, complexity, scope, and planning needs.
---

# Workflow Router Skill

## Purpose

Determine which workflow path should be executed.

The router never creates files and never modifies source code.

Its only responsibility is selecting the correct entry point.

## Decision Tree

```mermaid
flowchart LR

A[User Request] --> B{Codebase Exists?}

B -->|No| PM[Product Manager]

B -->|Yes| C{Request Type}

C -->|Idea / Undefined Requirements| PM

C -->|Medium or Large Change| PA[Planning Analyst]

C -->|Small Well Defined Change| TL[Tech Lead]
```

## Routing Rules

### Route to Product Manager

Use when:

- No codebase exists
- Requirements are unclear
- User provides only a high-level idea
- MVP definition is required
- Epics need to be created

Examples:

- "I want to build a school system"
- "I have an idea for an app"
- "Help me define what should be built"

### Route to Planning Analyst

Use when:

- Codebase already exists
- User requests analysis
- User requests feasibility evaluation
- User requests architectural guidance
- User requests medium or large changes
- Multiple implementation approaches exist

Examples:

- "Add multi-tenancy"
- "Migrate authentication to OAuth"
- "What could break if we change X?"

### Route to Tech Lead

Use when:

- Requirements are already defined
- Scope is small
- Implementation approach is obvious
- Planning is unnecessary

Examples:

- "Add a column to the user table"
- "Create an endpoint for X"
- "Add validation to Y"

## Complexity Classification

### Small

Characteristics:

- Single layer affected
- Low risk
- Obvious implementation
- No architectural impact

Route:

```text
Tech Lead
```

### Medium

Characteristics:

- Multiple files
- Multiple possible approaches
- Architectural decisions required

Route:

```text
Planning Analyst
```

### Large

Characteristics:

- Cross-cutting changes
- Significant architectural impact
- High implementation risk

Route:

```text
Planning Analyst
```

## Output

Return:

```yaml
route: product-manager | planning-analyst | tech-lead

reason: "<why the route was selected>"

complexity: small | medium | large
```

## Constraints

- Never create files
- Never modify source code
- Never execute implementation tasks
- Never generate epics
- Never generate planning documents
- Never generate technical tasks
- Only classify and route requests
- Prefer Tech Lead when planning is unnecessary
- Prefer Planning Analyst when multiple viable approaches exist
- Prefer Product Manager when requirements are incomplete