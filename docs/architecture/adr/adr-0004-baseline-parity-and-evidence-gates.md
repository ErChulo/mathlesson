# ADR-0004: Baseline Parity And Evidence Gates

Status: Proposed

Date: 2026-07-25

## Context

Phase 0 has preserved the v4.9.22 files found in the supplied package and generated static inventories. No real browser, iPhone, visual, or full manual acceptance test has been executed in this phase.

Missing expected evidence is listed in `docs/audit/missing-evidence.md`.

## Decision

Treat `legacy/mathlesson-v4.9.22/` plus its `SHA256SUMS` file as the authoritative baseline evidence currently available.

Treat `analysis/baseline-audit-v4.9.22.json` and `docs/audit/*.md` as derived evidence, not proof of runtime parity.

Do not claim React parity until automated tests, desktop manual checks, and required real-device iPhone checks have been run and recorded.

Use `docs/testing/manual-checklists/mathlesson-v4.9.22-parity.md` before migrating learner behavior. The checklist includes MathLive keyboard open/dismiss behavior, JSXGraph, Plotly, Mermaid, import/export, student export, Reveal export, print/PDF, persistence, quiz, and inline exercises, but Phase 0 does not claim any item has passed.

Keep visual screenshots, recordings, and manually supplied legacy fixtures as evidence once they are created or provided.

## Consequences

Static analysis can guide migration, but it cannot close parity risk.

Phase 1 can build shell infrastructure without claiming behavior equivalence.

Release readiness requires evidence artifacts, not just implementation completion.

## Follow-Up

Before Phase 3, add fixture-based automated tests for schema, quiz, exercises, persistence, and representative renderer blocks. Before Phase 5, add generated export golden tests.
