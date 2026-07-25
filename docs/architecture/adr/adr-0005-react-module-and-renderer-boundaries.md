# ADR-0005: React Module And Renderer Boundaries

Status: Proposed

Date: 2026-07-25

## Context

The v4.9.22 implementation is a large single-file app with mixed DOM rendering, persistence, grading, authoring, renderer lifecycle, and export generation.

Renderer-specific APIs have high regression risk, especially MathLive keyboard behavior, Mermaid source preservation, Plotly sizing, JSXGraph cleanup, and generated student/Reveal runtime behavior.

## Decision

Use React components for UI composition, user interaction, and stable DOM hosts.

Move parsing, grading, persistence, schema normalization, calculator/statistics logic, and export builders into services or pure modules rather than React components.

Put renderer-specific lifecycle code behind adapter modules under `src/renderers/*`.

Use stable container refs for DOM-backed renderers. Components should call adapter interfaces and should not directly call Plotly, JSXGraph, Mermaid, MathLive keyboard globals, or KaTeX internals.

Keep raw legacy HTML rendering isolated to a small number of section or renderer host components during parity.

Use a motion adapter for GSAP or any animation library so reduced-motion behavior and cleanup are centralized.

## Consequences

React state remains focused on application state rather than third-party renderer internals.

Renderer lifecycles become testable through init, update, resize, and cleanup contracts.

Generated export runtime sharing must be designed deliberately instead of copied from components.

## Follow-Up

Phase 2 should define the renderer adapter contract before migrating learner features. Phase 5 should decide how export runtimes reuse or mirror adapter behavior.
