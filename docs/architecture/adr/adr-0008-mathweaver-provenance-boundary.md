# ADR-0008: MathWeaver Provenance Boundary

Status: Proposed

Date: 2026-07-25

## Context

MathWeaver may contain useful ideas for future MathLesson work, but inspecting or integrating it before MathLesson parity risks mixing provenance, behavior, and acceptance criteria.

The migration objective is first to preserve and reproduce MathLesson v4.9.22 behavior.

## Decision

Do not inspect, copy, adapt, or integrate MathWeaver before MathLesson parity is accepted.

After parity, inspect MathWeaver only with explicit user approval and document the comparison independently.

Classify any later ideas as independent reimplementation, conceptual adaptation, rejection, or deferral. Do not copy MathWeaver source into MathLesson without explicit provenance and license review.

## Consequences

The migration has a clean behavioral baseline.

Parity work is not diluted by new feature ideas.

Future MathWeaver-inspired work can be assessed as post-parity product planning.

## Follow-Up

Keep MathWeaver comparison as a later phase, currently listed as Phase 7 in `docs/architecture/phased-migration-plan.md`.
