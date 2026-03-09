# AGENTS.md

RepoSmith is a CLI tool that analyzes codebases and generates agent-readable documentation. Written in TypeScript, runs on Node.js, distributed via npm.

## Quick Reference

- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js >= 20
- **Package manager:** pnpm
- **Test runner:** vitest
- **Bundler:** tsup
- **Entry point:** src/cli/index.ts

## Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build with tsup
pnpm test             # Run tests with vitest
pnpm dev              # Run CLI in development mode (tsx)
pnpm lint             # Run eslint
pnpm commit:check -- <range>   # Validate commit messages for a git range
```

## Architecture

Four-layer analysis pipeline. Each layer feeds the next.

```
Filesystem Scanner → Stack Detector → Repo Graph Builder → Score Engine
                          ↑
                   Language Adapters (tree-sitter)
```

See `docs/ARCHITECTURE.md` for the full technical design.
See `docs/PRD.md` for product requirements and feature specifications.

## Project Structure

- `src/cli/` — CLI commands and terminal output formatting
- `src/analyzer/` — The four analysis layers (filesystem, stack, graph, adapters)
- `src/scoring/` — Health score calculation (architecture, documentation, complexity, tests)
- `src/generators/` — Output file generators (AGENTS.md, .reposmith/* docs)
- `src/types/` — Shared TypeScript types and interfaces
- `grammars/` — Tree-sitter WASM grammar files (do not edit manually)
- `test/fixtures/` — Sample repos for testing each language/framework

## Conventions

- Pure functions wherever possible. Generators and scorers take data in, return strings or objects out. No side effects.
- Only the CLI command handlers (src/cli/commands/) perform I/O (reading files, writing output).
- All analysis results flow through the central `RepoProfile` type defined in `src/types/repo-profile.ts`.
- Tree-sitter adapters are thin. Each adapter is a set of tree-sitter queries plus extraction logic. No complex analysis.
- The regex fallback adapter must handle any language. It is less accurate but must never crash.
- Never require an API key or network access for local analysis. The GitHub remote scanner is the only feature that makes network requests.
- Use `web-tree-sitter` (WASM), not native tree-sitter bindings. Zero native compilation dependencies.
- Errors in individual files should be caught and skipped with a warning, never crash the entire analysis.
- When creating or suggesting commits, apply the repository's semantic-commit workflow by default. Format commits as `type(scope): summary` or `type: summary`, with lowercase imperative subjects and no trailing period.
- Valid commit types are `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, and `revert`. Use `chore: release vX.Y.Z` for release commits.
- Read `.agents/skills/semantic-commits/SKILL.md` before creating or validating commits in this repository.

## Testing

- Every analyzer component should have unit tests using fixture repos in `test/fixtures/`.
- Fixture repos are minimal but realistic: 5-15 files each, representing real project structures.
- Scoring tests should use snapshot testing: given a known repo profile, verify the score breakdown.
- Generator tests should verify output structure (correct headers, expected sections) not exact content.

## Key Design Decisions

- **WASM over native tree-sitter** — Install friction matters more than parse speed for an npx tool.
- **Smart sampling over full parsing** — Parse ~200 representative files max, not every file.
- **Documentation weight is 35%** — Highest weight because it's the biggest predictor of agent performance and the easiest to improve.
- **AGENTS.md is the hero output** — Root-level file that agents auto-discover. The .reposmith/ directory is supporting detail.
- **No LLM dependency** — All analysis is deterministic. No API calls, no model inference.
