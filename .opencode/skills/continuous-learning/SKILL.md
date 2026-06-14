---
name: continuous-learning
description: Receives the evaluation from the learning-improvement skill, analyzes which .opencode/ docs can be improved based on learnings, creates a change plan and presents it to the user for approval before applying.
---

# Continuous Learning Skill

## When to use

Use this skill after `learning-improvement` in the STOP hook. It is the **second** of 3 skills in the STOP chain — see [learning-improvement/references/stop-chain.md](../learning-improvement/references/stop-chain.md).

## Workflow

1. **Receive evaluation** — read the output of the `learning-improvement` skill (DONE, WRONG, IMPROV, LEARN, NEXT)
2. **Analyze existing docs** — consult `.opencode/docs-catalog.md` to map which file to modify, then review the relevant files:
   - `project-structure.md` — keep updated if important folders/files changed
    - `docs-catalog.md` — keep updated if new `.md` files were created in `.opencode/` **(excluding `.opencode/plan/`)**; **remove completely** the entries for files that no longer exist in the project tree (do not leave strikethrough markdown)
    - `AGENTS.md` — commands, scripts, conventions
    - `INDEX.md` — central guide, references
    - `skills/**/SKILL.md` — skills that need adjustment
    - `commands/*.md` — chat commands
    - `architecture/*.md` — architecture docs
3. **Create change plan** — list files and proposed changes, with justification based on session learnings. **Do NOT edit any files during this step** — planning only.
4. **Present plan to the user** — display clearly in chat using the template format. **Do NOT edit any files during this step** — presentation only:
   ```
   ## Doc update plan
   
   Based on the session evaluation, I propose:
   
   `Where`:  `path/file.md`
   `Why`: Session context explaining why this change is needed
   `Best`: Why this file is the correct location (docs-catalog mapping)
   `Modification`: 
   	~ Modified line description #(line X -> switch)
   	- Removed line description #(line Y -> remove)
   	+ Added line description #(line Z -> add)
   
   Would you like to apply these changes?
   ```
5. **Wait for user response**:
   - If **yes**: apply all changes
   - If **adjustments**: user informs what to adjust
     - **RE-PLAN PHASE**: Create NEW plan (do NOT edit files), present updated `<changes>` template, wait for "yes"
     - **NEVER edit files between receiving 'adjustments' and receiving 'yes' on updated plan**
6. **Chain to `session-save` IMMEDIATELY** — after applying changes (or determining no changes are needed), you MUST load the `session-save` skill without waiting for user input. Never stop after step 5.

## Rules

- Never modify application source code (only docs in `.opencode/`)
- **ONLY modify .md files in .opencode/ — ignore .opencode/node_modules, .opencode/plan, .opencode/.gitignore, .opencode/package-lock.json, .opencode/package.json, .opencode/pipeline.yaml**
- **ALWAYS consult .opencode/docs-catalog.md to identify which file to modify before making any changes**
- **ALWAYS present detailed change proposal to user and wait for explicit confirmation before modifying any file**
- **Change proposal MUST use the <changes> template format**
- Always justify each proposed change based on the session evaluation
- If no changes are needed, inform the user and proceed
- After applying changes, **do not save session** — this is the responsibility of the `session-save` skill
- **AFTER analyzing existing docs, CHECK if session learnings indicate need for NEW skill/agent/document creation**
- **ALWAYS consult .opencode/docs-catalog.md FIRST to verify no existing file covers the need and identify correct location for new file**
- **If new file needed, include in change proposal with file path, why (session context), why correct location (docs-catalog mapping), and template content**
