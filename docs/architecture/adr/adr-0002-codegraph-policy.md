# ADR-0002: CodeGraph Policy

Status: Proposed

Date: 2026-07-25

## Context

CodeGraph is available locally through `/home/herick/.local/bin/codegraph` and the MCP tool. The local CLI previously reported version `1.4.1`; the server message notes `1.5.0` is available.

This repository currently has no `.codegraph/` index. Index creation is a user/project decision, and the index can be large or machine-specific.

## Decision

Keep `.codegraph/` ignored in Git.

Do not commit CodeGraph indexes or generated CodeGraph databases.

Do not run `codegraph init` automatically. If the user wants CodeGraph enabled for this repository, they should explicitly approve or run it.

When a `.codegraph/` index exists, use CodeGraph before ad hoc text search or file reads for architecture questions, symbol exploration, bug diagnosis, and impact analysis.

When querying this repository through MCP, pass `projectPath: /home/herick/Documents/mathlesson-development/mathlesson` unless the server has a default project.

## Consequences

The migration keeps source control clean while still allowing CodeGraph-assisted navigation after indexing.

Future agents avoid relying on stale indexes because index generation remains explicit.

## Follow-Up

If the user approves indexing, run CodeGraph initialization outside committed artifacts, then record the command and version in tooling notes.
