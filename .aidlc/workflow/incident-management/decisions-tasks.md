# Tasks Decisions (D4)

## Context Summary
Task planning is governed by the workspace hands-on-project build-order policy, which overrides default AI-DLC sequencing.

## Decisions Summary
- D4-1 Wave strategy: Groups map to workspace build order — G1 Setup, G2 FE+mock, G3 FE+backend/DB, G4 extras, G5 test/verify, G6 deploy.
- D4-2 Test placement: Deferred to G5 (workspace policy overrides "test each task"); Definition of Done = working software verified per group.
- D4-3 Task size: 0.5–1.5 day tasks, sequential within group, stop for user confirmation at each group boundary.
- D4-4 File ownership: single-writer per task; no decomposition into units (comprehensive mode).
- D4-5 Verify gate: each group ends with a build/dev run verification before proceeding.

Validation: no conflicts. Consistent with comprehensive mode + workspace policy.
