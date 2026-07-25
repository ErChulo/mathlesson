# ADR-0003: Package Manager And Dependency Pinning

Status: Proposed

Date: 2026-07-25

## Context

The v4.9.22 app loads many runtime dependencies from CDNs. Several references are unpinned or broad, including MathLive, Cortex Compute Engine, Arquero `latest`, JSXGraph, Mermaid major version `11`, and Reveal major version `5`.

No package manager policy exists yet in the active repository.

## Decision

Use npm for the initial Vite/React/TypeScript scaffold because it is available in the environment and no competing project policy exists.

Commit `package-lock.json` once `package.json` is introduced.

Pin production and development dependencies to exact versions during scaffolding. Do not introduce unbounded `latest`, caret, or tilde ranges for dependencies that affect runtime, build, docs, or tests.

Verify package licenses before adding runtime dependencies.

Prefer bundling runtime dependencies through Vite for the main app. Generated standalone exports may embed bundled assets or pinned CDN URLs only after an export ADR decides the packaging strategy.

## Consequences

The React migration becomes reproducible and less exposed to CDN drift.

Dependency changes become explicit review events instead of silent runtime behavior changes.

Generated export files need their own dependency inclusion policy before Phase 5.

## Follow-Up

Phase 1 should create the initial package files only after this ADR is accepted. Phase 1 should also document exact selected versions and license checks.
