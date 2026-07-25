# ADR-0011: Renderer Bundle Budget Policy

Status: Accepted

Date: 2026-07-25

## Context

Phase 2 has introduced exact-pinned KaTeX, Mermaid, and Plotly renderer packages. KaTeX is part of the app shell CSS/font path. Mermaid and Plotly are dynamically imported by renderer adapters and are expected to produce large lazy chunks.

The full baseline-compatible Plotly package is intentionally large because it mirrors the v4.9.22 CDN package and keeps 3D surface support available for later safe Plotly Explore planning. Additional heavy renderer work needs a budget policy before more dependency-bearing adapters are added.

## Decision

Renderer dependencies must stay isolated behind adapter-owned dynamic imports unless a later ADR approves eager loading.

Current approved budgets are:

| Budget | Limit | Rationale |
| --- | ---: | --- |
| Initial entry JS chunk | 560 KiB minified / 175 KiB gzip | Keeps the React shell near the current post-Plotly baseline while allowing normal hash/build variance. |
| Individual lazy Mermaid renderer chunk | 760 KiB minified / 180 KiB gzip | Covers the current Mermaid 11 lazy graph without making Mermaid part of the initial shell. |
| Lazy Plotly renderer chunk | 3,900 KiB minified / 1,250 KiB gzip | Documents the accepted full Plotly 2.32.0 package cost for baseline-compatible 3D support. |

Any new renderer dependency that creates an unclassified chunk over 500 KiB minified requires an explicit dependency and bundle-size review before merge.

## Enforcement

Vite builds now emit `dist/.vite/manifest.json`. `npm run bundle:report` reads that manifest, reports the largest JS chunks, and fails if an initial or approved renderer chunk exceeds its budget or if a new unclassified chunk exceeds 500 KiB minified.

`npm run check` runs the bundle report after the production build.

## Consequences

The existing Mermaid and Plotly large lazy chunks remain accepted, documented, and measured.

Future Plotly work remains limited to safe structured source until a separate declarative Plotly Explore plan exists. Plotly Explore, JSXGraph, Arquero, calculators, statistics execution, and authoring execution remain blocked on safe declarative or sandbox decisions.

The budgets are intentionally conservative guardrails, not final product performance targets. Mobile and real-device performance still require manual evidence before parity claims.
