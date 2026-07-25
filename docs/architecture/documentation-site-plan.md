# Documentation Site Plan

Goal: publish reproducible project documentation with VitePress and generated API Markdown from TypeScript documentation comments.

## Proposed Structure

```text
docs/
  .vitepress/
    config.ts
    theme/
  index.md
  guide/
  architecture/
  migration/
  schemas/
  renderers/
  authoring/
  testing/
  api/
```

## Pipeline

```text
TSDoc/JSDoc comments in TypeScript source
-> TypeDoc extraction
-> Markdown generation
-> generated Markdown under docs/api/
-> VitePress static build
```

## Tool Evaluation Plan

| Tool | Role | Compatibility checks before adoption | Policy |
| --- | --- | --- | --- |
| `vitepress` | Static documentation site | Verify current version supports project TypeScript config and Netlify static output | Pin exact version in dev dependencies |
| `typedoc` | Extract API docs from TypeScript comments | Verify current version supports chosen TypeScript version and project references | Pin exact version and fail CI on warnings where practical |
| TypeDoc Markdown integration | Generate Markdown for VitePress | Compare current maintained options, VitePress links, frontmatter/sidebar behavior | Select only after version compatibility check, not popularity |
| Link checker | Broken-link validation | Verify generated API links and source-code links | Include in `docs:build` or CI if stable |

## Generated File Policy

| Generated output | Commit? | Reason |
| --- | --- | --- |
| `docs/api/**` Markdown | Proposed yes, if output is deterministic and useful for GitHub review | VitePress site can build without running TypeDoc in simple static hosts; diffs show API changes |
| `docs/.vitepress/dist/**` | No | Build output, reproducible from source |
| TypeDoc JSON intermediate | No by default | Rebuildable unless needed for diff tooling |
| `.codegraph/**` | No | Local development index, ignored by policy |

## Scripts Interface

Future `package.json` should support a command surface similar to:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "docs:dev": "vitepress dev docs",
    "docs:api": "typedoc",
    "docs:build": "npm run docs:api && vitepress build docs",
    "docs:preview": "vitepress preview docs",
    "check": "npm run lint && npm run typecheck && npm run test && npm run docs:build"
  }
}
```

This is a planned interface only; Phase 0 does not scaffold the Vite app.

## Documentation Content Boundaries

| Area | Content |
| --- | --- |
| `guide/` | User and developer guides after parity evidence exists |
| `architecture/` | ADRs, migration plans, component/module architecture |
| `migration/` | Phase notes, behavior-change log, parity evidence |
| `schemas/` | Lesson, section, quiz, block, persistence, export schemas |
| `renderers/` | Adapter contracts and lifecycle docs |
| `authoring/` | Author workspace/editor/import/export behavior |
| `testing/` | Automated and manual checklists, iPhone MathLive protocol |
| `api/` | Generated TypeDoc Markdown |

## API Visibility Rules

| API kind | Documentation treatment |
| --- | --- |
| Public app/domain APIs | Document with TSDoc and include in TypeDoc |
| Renderer adapter interfaces | Document as public internal contracts |
| Internal implementation helpers | Mark `@internal` and exclude unless useful for maintainers |
| Legacy compatibility codecs | Document because persistence/schema compatibility depends on them |
| Generated templates | Document entry points and data contracts, not every string helper |

## Source Links And Examples

Enable source-code links only after repository URLs and branch conventions are stable. Examples should be small and tested where possible, especially schema and renderer adapter examples.

## Netlify Static Deployment

Vite app and VitePress docs should both emit static assets. Later deployment policy must decide whether Netlify deploys the app only, docs only, or both under separate paths. No backend is required.

## Documentation Tests

1. `docs:api` produces deterministic Markdown.
2. `docs:build` succeeds from clean checkout.
3. Broken links fail CI once configured.
4. API docs exclude private helpers unless intentionally documented.
5. Examples compile or are checked by tests where feasible.
