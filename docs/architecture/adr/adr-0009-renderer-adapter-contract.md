# ADR-0009: Renderer Adapter Contract Before Implementation

Status: Proposed

Date: 2026-07-25

## Context

Phase 1 added a React shell without migrating renderer behavior. The v4.9.22 baseline still owns rendering behavior for KaTeX, MathLive, Mermaid, JSXGraph, Plotly, Plotly Explore, Arquero, SVG, Manim/video placeholders, calculator widgets, and statistics widgets.

Renderer behavior has high regression risk because many libraries depend on visible containers, stable ids, cleanup, source preservation, export behavior, and mobile-specific interaction. MathLive also requires real iPhone keyboard evidence.

## Decision

Define and review the renderer adapter contract, fixture inventory, test strategy, diagnostics policy, and acceptance criteria before implementing any runtime renderer adapter.

Use TypeScript-like pseudocode in documentation during planning. Do not create production adapter TypeScript files in this branch.

Each later adapter implementation should be small, test-backed, and limited to one renderer family unless reviewers explicitly approve a coupled dependency pair.

React renderer hosts should own stable containers and lifecycle scheduling. Adapter modules should own validation, mount, optional update, optional resize, optional export, diagnostics, and unmount. Production React code should not directly call third-party renderer internals.

## Explicit Non-Scope

This planning branch does not implement renderer adapters.

It does not migrate MathLive.

It does not install dependencies.

It does not add runtime renderer components.

It does not change schemas.

It does not mutate `legacy/mathlesson-v4.9.22/`.

## Consequences

Renderer migration can proceed one adapter at a time with a known lifecycle and test matrix.

Source preservation becomes a hard contract before export, print, authoring, and diagnostics work depends on renderer output.

Hidden-container, duplicate-initialization, cleanup, resize/orientation, and mobile risks are treated as first-class acceptance criteria instead of late bug fixes.

MathLive parity remains blocked on real iPhone evidence and must not be claimed from automated tests alone.

## Follow-Up

Review `docs/architecture/renderer-adapter-contract.md`, `docs/testing/renderer-adapter-test-plan.md`, and `docs/testing/fixtures/renderer-fixture-inventory.md` before the first adapter implementation PR.

After approval, implement one adapter at a time behind tests and update the manual checklist only with actual evidence.
