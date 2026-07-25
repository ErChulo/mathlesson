# ADR-0010: Canonical Source And Executable Content Policy

Status: Accepted

Date: 2026-07-25

## Context

The v4.9.22 baseline stores and executes some renderer source through live DOM state. Mermaid source can be read from `data-*` attributes, Plotly Explore reads `data-fn`, JSXGraph and Arquero read inline script blocks, and several paths use `new Function` or revived function strings.

Those behaviors are baseline facts, not policies to preserve unchanged in the React migration. They create export ambiguity, make generated DOM appear canonical, and allow imported or teacher-authored lesson content to execute code by default.

## Decision

Structured lesson JSON with typed adapter source objects is the canonical lesson source after migration. React state is a runtime projection of that source. Generated DOM, generated SVG, third-party renderer instances, media elements, Plotly plots, JSXGraph boards, tables, and MathLive fields are runtime artifacts.

Renderer hosts and adapters may write stable ids, renderer ids, block ids, diagnostic handles, and non-source render state to the DOM. They must not serialize full adapter source, raw authored source, or serialized source keys into DOM `data-*` attributes.

Lesson content is untrusted by default. Imported lessons, teacher-authored lessons, student files, Plotly Explore function strings, JSXGraph scripts, and Arquero scripts must not execute by default. Malicious executable content should be rejected by default. Declarative content may be sanitized where possible. Sandboxed executable content requires a later explicit design decision.

Unsafe baseline behavior using `new Function`, function-string revival, or `eval` must be documented and intentionally replaced. It must not be silently reintroduced for parity.

Renderer failures should produce safe student-facing fallback cards or diagnostics. Detailed diagnostics and source excerpts are reserved for author/developer contexts and must come from canonical source access, not DOM scraping.

Schema-compatible v4.9.22 saved lessons may be internally normalized without a user-visible migration step, but normalization must preserve canonical source in structured data rather than in generated DOM.

## Enforcement

`npm run safety:guard` scans production `src` files for these disallowed patterns:

1. `data-source-*` attributes other than `data-source-id`.
2. `element.dataset.*Source` writes or reads intended to carry source blobs.
3. DOM-exposed `rendererSourceKey` markers.
4. `Function` constructors and `eval`.

`npm run check` includes this guard so new renderer work fails fast if it tries to make DOM state canonical or execute lesson-authored strings.

## Consequences

Adapter tests must prove source preservation through adapter instances, typed source objects, and export APIs rather than by scraping DOM attributes.

Plotly Explore, JSXGraph, Arquero, calculators, statistics, authoring, and export runtime work must use safe declarative models or receive an explicit sandboxing decision before migration.

MathLive parity remains blocked on real iPhone Safari evidence. No automated test or desktop browser run can close that gate.

Bundle budgets for heavy lazy renderers remain a follow-up decision before adding more large renderer dependencies.
