---
name: learning-improvement
description: Analyzes the session that just occurred and extracts learnings: what was done, what went right, what went wrong, what can be improved. Generates the evaluation for the following skills (continuous-learning and session-save).
---

# Learning Improvement Skill

## When to use

Use this skill at the end of a complete implementation (e.g.: Frontend → QA → STOP). It is the **first** of 3 skills in the STOP chain — see [learning-improvement/references/stop-chain.md](../learning-improvement/references/stop-chain.md).

## Workflow

1. Review the current session history (tool calls, errors, results)
2. Extract the following topics:
   - **DONE**: What was accomplished in the session
   - **WRONG**: What went wrong (bugs, bad decisions, rework)
   - **IMPROV**: Improvements to apply in future sessions
   - **LEARN**: Discoveries and lessons learned
   - **NEXT**: Suggested next steps

3. **Output the evaluation** — produce DONE, WRONG, IMPROV, LEARN, NEXT in text (English, 5-7 lines)
4. **Chain to next skills IMMEDIATELY** — after outputting the evaluation, you MUST call the `continuous-learning` skill (load via skill tool) and pass the evaluation as context. After `continuous-learning` completes, you MUST call `session-save`.
5. **Never stop after step 3** — producing the evaluation without chaining is a failure. The three skills are a single atomic sequence.

## Expected output

- Text evaluation with DONE, WRONG, IMPROV, LEARN, NEXT (5-7 lines, English)
- Pass this evaluation to the `continuous-learning` skill as input

## Enforcement

- This skill is invoked by the STOP hook in pipeline agents. The hook expects all 3 skills to run.
- If only the evaluation is produced and the chain stops, the session is considered incomplete.
- Whether loaded via `skill` tool or triggered by a direct command, the full chain MUST execute.
