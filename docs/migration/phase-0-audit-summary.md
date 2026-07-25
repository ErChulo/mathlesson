# Phase 0 Audit Summary

Status: ready for review. Phase 0 is evidence, documentation, and tooling only; it does not scaffold the React application.

Date: 2026-07-25

Branch: `migration/phase-0-audit`

Verification status: `sha256sum -c legacy/mathlesson-v4.9.22/SHA256SUMS`, `node tools/analysis/extract-v4.9.22.mjs`, `node tools/analysis/audit-v4.9.22.mjs`, and `node tools/analysis/verify-phase-0.mjs` passed on 2026-07-25.

## Acceptance Matrix

| Criterion | Evidence | Status |
| --- | --- | --- |
| Preserve v4.9.22 baseline files | `legacy/mathlesson-v4.9.22/`, `legacy/mathlesson-v4.9.22/SHA256SUMS`, `legacy/mathlesson-v4.9.22/BASELINE.md` | Verified |
| Keep derived analysis outside production code | `analysis/baseline-audit-v4.9.22.json`, `analysis/extracted-v4.9.22/`, `tools/analysis/*` | Complete |
| Inventory dependencies, features, global state, events, schemas, renderers, exports, persistence, risks, and evidence gaps | `docs/audit/*.md` | Complete |
| Propose migration architecture | `docs/architecture/proposed-module-architecture.md`, `docs/architecture/proposed-react-component-tree.md`, `docs/architecture/documentation-site-plan.md`, `docs/architecture/phased-migration-plan.md` | Complete |
| Record proposed ADRs | `docs/architecture/adr/` | Complete |
| Record missing evidence | `docs/audit/missing-evidence.md` | Complete |
| Record baseline manual checklist without claiming pass/fail | `docs/testing/manual-checklists/mathlesson-v4.9.22-parity.md` | Complete, not executed |
| Avoid production React implementation | No `src/` and no `package.json` in Phase 0 | Complete |
| Record project-local skills provenance | `.agents/skills/`, `skills-lock.json`, `docs/tooling/skills-manifest.md` | Complete |

## Verification Commands

Run these from the repository root:

```bash
sha256sum -c legacy/mathlesson-v4.9.22/SHA256SUMS
node tools/analysis/extract-v4.9.22.mjs
node tools/analysis/audit-v4.9.22.mjs
node tools/analysis/verify-phase-0.mjs
```

## Phase 0 Boundary

Phase 0 does not claim runtime parity, browser parity, mobile parity, visual parity, or export parity. It only preserves evidence and maps risks so later migration phases can be tested against the baseline.

Production code must not import from `legacy/` or `analysis/`. Future app code should start under `src/` only after Phase 1 is approved.

## Remaining Decisions Before Phase 1

| Decision | Current recommendation | Evidence |
| --- | --- | --- |
| UI direction | Preserve the current UI first, migrate internals, then redesign only after parity | `legacy/mathlesson-v4.9.22/next-shit.txt:35-41` |
| Repository shape | Start as one Vite app, not a workspace, unless a concrete workspace need appears | `docs/architecture/adr/adr-0001-repository-and-baseline-layout.md` |
| Package manager | Use npm initially and pin exact versions | `docs/architecture/adr/adr-0003-package-manager-and-dependency-pinning.md` |
| React shell scope | Build shell/navigation/theme/layout placeholders only; do not claim renderer migration | `docs/architecture/phased-migration-plan.md` |
| Baseline evidence capture | Execute the manual checklist and capture screenshots/recordings before claiming parity | `docs/testing/manual-checklists/mathlesson-v4.9.22-parity.md` |
| Real iPhone gate | Keep MathLive keyboard portrait/landscape behavior as a release gate | `docs/audit/regression-risk-register.md` |

## Open Phase 0 Risks

| Risk | Why it remains open | Follow-up |
| --- | --- | --- |
| No original ZIP preserved in repo | The supplied directory did not include the package archive | Preserve authentic ZIP if provided and record hash |
| No executed manual report | Phase 0 prepared a checklist but did not run browser/device tests | Execute checklist before behavior migration claims |
| No screenshots or recordings | Visual/mobile baseline evidence was absent | Capture desktop and iPhone evidence during checklist run |
| Static audit limitations | Scripted text scans miss runtime-only behavior | Add Playwright, fixture, and real-device tests in later phases |
| CDN drift in baseline | Several baseline dependencies are unpinned or broad-version CDN URLs | Pin package versions during Phase 1 and document export policy before Phase 5 |
