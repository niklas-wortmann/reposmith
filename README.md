# RepoSmith

**Make your codebase agent-ready. One command.**

RepoSmith scans your repository, builds a dependency graph, generates documentation that AI coding agents can navigate, and scores how ready your codebase is for agent-assisted development.

```
$ npx reposmith init

✔ Detected TypeScript + Next.js (pnpm workspace)
✔ Scanned 412 source files across 9 modules
✔ Built dependency graph (63 edges, 0 cycles)
✔ Generated agent documentation

Agent Readiness Score: 71 / 100

Created:
  AGENTS.md                          → root-level agent entry point
  .reposmith/architecture.md       → module map and boundaries
  .reposmith/modules.md            → per-module documentation
  .reposmith/conventions.md        → detected coding conventions
  .reposmith/entrypoints.md        → key entry points and APIs
  .reposmith/dependency-graph.json → machine-readable graph
  .reposmith/score.json            → health score breakdown
```

Your AI agent just got a lot smarter about your codebase.

## Why

Every developer gets disappointing results the first time they point an AI coding agent at a real codebase. Not because the agent is bad, but because the codebase isn't ready for it.

OpenAI shipped a million-line product using only AI agents. Their secret wasn't a better model. It was what they built *around* the model: structured docs agents can navigate, architectural guardrails, codified conventions. They call it [harness engineering](https://openai.com/index/harness-engineering/). They didn't open-source any of it.

RepoSmith gives you that harness in one command.

## Install

No installation needed. Run directly:

```bash
npx reposmith init
```

Or install globally:

```bash
npm install -g reposmith
```

## Project Docs

Product and implementation docs live in [`docs/README.md`](docs/README.md), with the main specs in [`docs/PRD.md`](docs/PRD.md) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Release

RepoSmith uses a tag-driven release flow built around `bumpp`, `changelogen`, and GitHub Actions.

```bash
pnpm install
pnpm release patch
```

`pnpm release <patch|minor|major|prepatch|preminor|premajor|prerelease>` bumps `package.json`, regenerates `CHANGELOG.md`, creates a `chore: release vX.Y.Z` commit, tags it as `vX.Y.Z`, and pushes `main` plus the tag.

When that tag lands on GitHub, [`.github/workflows/release.yml`](.github/workflows/release.yml) verifies the package, publishes it to npm, and creates a GitHub release with generated release notes. GitHub's release notes include contributor credits automatically, and `CHANGELOG.md` stays conventional-commit based for the repository itself.

Use conventional commit messages if you want clean changelog sections. The changelog generator groups entries by commit type.

### npm Setup

Preferred: configure npm trusted publishing for the `niklas-wortmann/reposmith` package against `.github/workflows/release.yml`.

Fallback: add an `NPM_TOKEN` repository secret and the same workflow will publish with that token instead.

## Semantic Commits

This repository uses semantic commit messages and enforces them with both a local `commit-msg` hook and GitHub Actions.

Valid formats:

```text
feat(cli): add graph command scaffold
fix: handle empty repositories
docs(readme): document release flow
chore: release v0.1.1
```

Rules:

- Use one of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, or `revert`
- Keep the subject lowercase and imperative
- Omit the scope when no single area is dominant
- Do not end the subject with a period

Local installs configure `core.hooksPath` to use [`.githooks/commit-msg`](.githooks/commit-msg). To validate an existing range manually, run `pnpm commit:check -- HEAD~3..HEAD`.

## Commands

### `reposmith init`

Analyze your repo and generate the full agent documentation suite.

```
$ reposmith init

✔ Detected Python + Django
✔ Scanned 287 source files across 6 modules
✔ Built dependency graph (24 edges, 1 cycle)
✔ Generated agent documentation

Agent Readiness Score: 58 / 100
```

### `reposmith score`

Print a detailed health report without generating docs.

```
$ reposmith score

RepoSmith Health Report

Agent Readiness Score: 58 / 100

Architecture                    62 / 100
  ⚠ 1 circular dependency: billing ↔ payments
  ⚠ Max import chain depth: 6 (target: ≤4)

Documentation                   42 / 100
  ⚠ 4 of 6 modules have no description
  ⚠ No AGENTS.md found

Complexity                      72 / 100
  ⚠ 2 files exceed 1000 lines

Tests                           60 / 100
  ⚠ Test-to-source ratio: 0.3 (target: ≥0.5)
  ⚠ 2 modules have no test files

Suggestions:
  → Add module descriptions for: billing, payments, notifications, queue
  → Resolve circular dependency: billing ↔ payments
  → Split app/legacy/views.py (2,100 lines)
  → Add tests for: notifications, queue
```

### `reposmith graph`

Visualize module dependencies.

```
$ reposmith graph

  api → services → db
   ↓       ↓
  ui   payments → events
          ↕
       billing      ⚠ circular
```

### `reposmith scan <github-url>`

Score any public GitHub repo without cloning it.

```
$ reposmith scan github.com/vercel/next.js

Scanning vercel/next.js via GitHub API...

Next.js — Agent Readiness Score: 73 / 100

Architecture     ██████████░░  82
Documentation    ████████░░░░  67
Complexity       ██████░░░░░░  58
Tests            █████████░░░  85
```

## How Scoring Works

RepoSmith evaluates four dimensions of agent readiness:

| Category | Weight | What it measures |
|----------|--------|------------------|
| **Documentation** | 35% | Module descriptions, README, AGENTS.md, doc coverage |
| **Architecture** | 25% | Circular deps, import chain depth, module coupling |
| **Complexity** | 20% | File sizes, module sizes, nesting depth |
| **Tests** | 20% | Test-to-source ratio, module test coverage |

Documentation is weighted highest because it has the biggest impact on agent performance and is the easiest thing to improve.

## What Gets Generated

RepoSmith creates a root-level `AGENTS.md` that AI coding agents automatically discover, plus a `.reposmith/` directory with detailed analysis:

```
AGENTS.md                          # ~100 lines, table of contents for agents
.reposmith/
  architecture.md                  # Module map, dependency directions, boundaries
  modules.md                       # Per-module: purpose, key files, deps, tests
  conventions.md                   # Detected coding patterns and golden principles
  entrypoints.md                   # Main files, route handlers, exported APIs
  repo-summary.md                  # Stack info, file statistics, build commands
  dependency-graph.json            # Machine-readable module dependency graph
  score.json                       # Health score breakdown
```

## Language Support

RepoSmith works on any codebase. It uses tree-sitter for accurate import analysis in supported languages, with regex fallback for everything else.

| Language | Import Analysis | Entry Point Detection |
|----------|----------------|----------------------|
| TypeScript / JavaScript | tree-sitter | ✔ |
| Python | tree-sitter | ✔ |
| Go | tree-sitter | ✔ |
| Rust | tree-sitter | ✔ |
| Java | tree-sitter | ✔ |
| All others | regex fallback | basic |

## Contributing

Contributions welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

The easiest way to contribute is adding a tree-sitter language adapter. Each adapter is a thin set of tree-sitter queries (~100-200 lines). See `src/analyzer/adapters/` for examples.

## License

MIT
