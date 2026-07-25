# ADR-0007: Local Agent Skills And Tool Provenance

Status: Proposed

Date: 2026-07-25

## Context

Project-local OpenCode skills were installed under `.agents/skills/` during Phase 0 and recorded in `skills-lock.json` and `docs/tooling/skills-manifest.md`.

One requested source command for `find-skills` failed because the target repository did not contain that skill at the time. The installed source was recorded separately.

Skills can affect agent behavior and should be treated as tooling dependencies with provenance and risk notes.

## Decision

Keep project-local skills under `.agents/skills/` so future agents can use the same skill set.

Keep `skills-lock.json` and `docs/tooling/skills-manifest.md` updated whenever skills are added, removed, or updated.

Do not install or update skills automatically during migration work unless the user approves the tooling change.

Use design and critique skills for planning and review only until baseline parity is proven. They must not override v4.9.22 behavior during parity phases.

## Consequences

Tooling decisions are reviewable and reproducible.

Security and provenance risks remain visible instead of hidden in agent state.

Future design improvements are separated from parity-critical behavior.

## Follow-Up

Re-run skill listing and frontmatter validation if skills change. Update the manifest with command results and risk notes.
