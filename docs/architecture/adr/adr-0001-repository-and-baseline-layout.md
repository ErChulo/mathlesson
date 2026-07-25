# ADR-0001: Repository And Baseline Layout

Status: Proposed

Date: 2026-07-25

## Context

The supplied v4.9.22 package was a source folder, not a Git repository. The active Git repository is `/home/herick/Documents/mathlesson-development/mathlesson` on branch `migration/phase-0-audit`.

The migration needs a stable baseline that can be audited without being changed by later React implementation work.

## Decision

Use `/home/herick/Documents/mathlesson-development/mathlesson` as the only project repository root.

Keep preserved v4.9.22 artifacts under `legacy/mathlesson-v4.9.22/` and treat them as immutable evidence.

Keep derived files under `analysis/`, including extracted source and generated audit JSON. Production code must not import from `analysis/`.

Keep Phase 0 audit and architecture records under `docs/`.

Create future application code under `src/` only after Phase 1 is approved.

Keep future automated tests under `src/**/__tests__`, colocated `*.test.ts`, or top-level `tests/` depending on test type. Use `docs/testing/` for manual checklists and reports.

## Consequences

Baseline files can be hash-verified independently of implementation work.

Generated analysis can be regenerated or discarded without changing original evidence.

The repository can move toward Vite/React/TypeScript without mixing migration code into the legacy artifact.

## Follow-Up

Before Phase 1, confirm whether this repository should remain a single Vite app or use a workspace layout. No workspace is proposed until there is a concrete need.
