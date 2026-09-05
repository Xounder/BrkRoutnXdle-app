---
name: delivery-pipeline:resume
description: Resumes the current delivery workflow from the persisted pipeline state.
---

Invoke the `delivery-pipeline` skill in resume mode.

If `read-pipeline-state` fails on `pipeline.yaml` (invalid YAML, e.g., duplicate keys), repair or rewrite the file first, then resume.