# mathlesson

Full framework for the creation of mathematical and applied-mathematical lessons on the web.

## Migration Audit

Phase 0 preserves the MathLesson v4.9.22 baseline and documents the React migration plan. Start with `docs/migration/phase-0-audit-summary.md`.

The preserved baseline is under `legacy/mathlesson-v4.9.22/`. Derived static analysis is under `analysis/` and must not be imported by future production code.

## React Shell

Phase 1 starts the Vite/React shell without migrating lesson behavior. See `docs/migration/phase-1-shell.md`.

Run `npm run check` to typecheck, test, and build the shell.
