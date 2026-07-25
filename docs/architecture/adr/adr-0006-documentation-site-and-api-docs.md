# ADR-0006: Documentation Site And API Docs

Status: Proposed

Date: 2026-07-25

## Context

The migration needs persistent architecture records, developer guides, schema documentation, renderer contracts, and future API documentation from TypeScript source.

The proposed documentation site plan uses VitePress and TypeDoc, but Phase 0 does not scaffold the app or docs build.

## Decision

Use Markdown in `docs/` as the source of truth for architecture, audit, migration, testing, schema, renderer, authoring, and user guide documents.

Use VitePress for a future static documentation site after package scaffolding is approved.

Use TypeDoc plus a Markdown output integration for future API docs generated from TSDoc/JSDoc comments.

Commit generated `docs/api/**` Markdown only if generation is deterministic and useful for review.

Do not commit VitePress build output, TypeDoc intermediate JSON, or `.codegraph/` indexes.

## Consequences

Documentation remains readable in GitHub before the static site exists.

API documentation can become part of CI later without blocking Phase 0.

Generated documentation requires deterministic tooling before it is committed.

## Follow-Up

Phase 1 should add docs scripts only after `package.json` exists. CI should eventually include docs build and link checks.
