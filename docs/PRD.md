# RepoSmith — Product Requirements Document

## One-Line Summary

RepoSmith scans any codebase, builds a dependency graph, generates agent-readable documentation, and scores how ready the repository is for AI coding agents.

## Problem

Every developer gets disappointing results the first time they run an AI coding agent on a real codebase. Not because the agent is bad, but because the codebase isn't ready for it. OpenAI built a million-line product with zero human-written code, but the secret wasn't a better model. It was the harness: structured documentation agents can navigate, architectural guardrails, golden principles encoded in the repo, and automated cleanup. They call this harness engineering. They didn't open-source any of it. Every team adopting AI agents now rediscovers the same lessons through weeks of trial and error.

## Solution

An open-source CLI that analyzes any repository, generates the scaffolding AI agents need to do reliable work, and provides a shareable score measuring agent-readiness. One command. Works with any language, any framework, any agent.

## Guiding Principle

Analyze any repo, generate agent-friendly docs, produce a shareable score. Everything else can wait.

## Success Criteria

A developer runs `npx reposmith init` and learns something new about their repo within 10 seconds.

---

## Core Features (MVP)

### Feature 1: Repo Analysis (`reposmith init`)

The CLI scans the repository and extracts:

- Programming language(s) and framework(s)
- Module structure (packages, workspaces, top-level domains)
- Dependency graph (inter-module imports)
- Entry points (main files, route handlers, exported APIs)
- Test coverage and test structure
- Documentation coverage
- Existing agent instruction files (AGENTS.md, CLAUDE.md, .cursor/rules, etc.)

**Command:**

```
npx reposmith init
```

**Example output:**

```
✔ Detected TypeScript + Next.js
✔ Found 412 source files across 9 modules
✔ Built dependency graph (63 edges)
✔ Generated agent documentation

Agent Readiness Score: 71 / 100

Created:
  AGENTS.md                          (root-level agent entry point)
  .reposmith/architecture.md       (module map and boundaries)
  .reposmith/modules.md            (per-module documentation)
  .reposmith/conventions.md        (detected golden principles)
  .reposmith/entrypoints.md        (key entry points and APIs)
  .reposmith/dependency-graph.json (machine-readable graph)
  .reposmith/score.json            (health score breakdown)
```

**Key requirement:** Works on any repo with zero configuration. No config files, no setup wizard, no API keys.

### Feature 2: Agent-Readable Documentation

The tool generates a structured knowledge base optimized for LLM navigation.

**Root-level AGENTS.md** (the hero artifact):

This is the most important output. A short (~100 line) file in the repo root that serves as a table of contents pointing into `.reposmith/`. Every major AI coding agent (Claude Code, Codex, Cursor, Copilot) automatically reads instruction files from the root. This file should:

- Summarize the project (purpose, stack, structure)
- List module boundaries with one-line descriptions
- Link to detailed docs in `.reposmith/`
- Include detected golden principles (conventions the codebase follows)
- Mention key entry points and build/test/lint commands

Format the content so it is useful to both humans and LLMs. Use clear headers, short paragraphs, and explicit cross-references.

**.reposmith/ directory:**

```
.reposmith/
  architecture.md          # Module map, dependency directions, layer boundaries
  modules.md               # Per-module docs: purpose, key files, dependencies, tests
  conventions.md            # Detected golden principles and patterns
  entrypoints.md            # Key entry points, route handlers, CLI commands
  dependency-graph.json     # Machine-readable module dependency graph
  repo-summary.md           # Stack, team size heuristics, build commands
  score.json                # Health score breakdown (machine-readable)
```

**Module entry format (in modules.md):**

```markdown
## payments

**Purpose:** Handles payment processing and Stripe integration.

**Key files:**
- src/payments/charge.ts (payment initiation)
- src/payments/refund.ts (refund processing)
- src/payments/webhooks.ts (Stripe webhook handler)

**Dependencies:** stripe-sdk, billing-service, events

**Depended on by:** api, admin-dashboard

**Tests:** src/payments/__tests__/ (4 test files)
```

### Feature 3: Harness Health Score

**Command:**

```
reposmith score
```

**Example output:**

```
RepoSmith Health Report

Agent Readiness Score: 64 / 100

Architecture                    72 / 100
  ⚠ 3 circular dependencies detected
  ⚠ 2 modules without clear ownership
  ⚠ Max import chain depth: 7 (target: ≤4)

Documentation                   48 / 100
  ⚠ 7 of 12 modules have no description
  ⚠ No root-level AGENTS.md found
  ✔ README.md exists

Complexity                      68 / 100
  ⚠ 4 files exceed 1000 lines
  ⚠ 2 modules contain 50+ files
  ✔ Average file size: 142 lines

Tests                           70 / 100
  ✔ Test directory detected
  ⚠ Test-to-source ratio: 0.3 (target: ≥0.5)
  ⚠ 3 modules have no test files

Suggestions:
  → Add module descriptions for: auth, billing, notifications, queue, admin, utils, config
  → Resolve circular dependency: billing ↔ payments
  → Split src/legacy/session.ts (1,847 lines)
  → Add tests for: notifications, admin, config
```

**Score calculation:**

| Category       | Weight | What it measures |
|----------------|--------|------------------|
| Architecture   | 25%    | Circular deps, import chain depth, module coupling, boundary clarity |
| Documentation  | 35%    | Module descriptions, README presence, AGENTS.md, doc coverage |
| Complexity     | 20%    | File sizes, module sizes, deeply nested structures |
| Tests          | 20%    | Test-to-source ratio, module test coverage, test file presence |

Documentation is weighted highest because it is the single biggest predictor of agent performance and the easiest thing for a developer to improve after seeing their score.

### Feature 4: Remote GitHub Scanning

**Command:**

```
npx reposmith scan github.com/vercel/next.js
```

**Example output:**

```
Scanning vercel/next.js via GitHub API...

Next.js — Agent Readiness Score: 73 / 100

Architecture     ██████████░░  82
Documentation    ████████░░░░  67
Complexity       ██████░░░░░░  58
Tests            █████████░░░  85

View full report: https://reposmith.dev/scores/vercel/next.js
```

This command scores any public GitHub repository without cloning it. Uses the GitHub REST API to fetch repository tree, config files, and representative source files. Results can optionally be cached and published to a public leaderboard.

This is the viral feature. Developers will scan popular repos, compare scores, and share results. Monthly "State of Agent Readiness" reports across ecosystems drive sustained engagement.

**Implementation approach:**
- Use GitHub API to fetch repo tree (`GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`)
- Fetch config files and representative source files via content API
- Run the same analysis engine as local mode, with some checks disabled (no git history, no local file system)
- Output a condensed report since full doc generation requires local clone

### Feature 5: Dependency Graph Visualization

**Command:**

```
reposmith graph
```

**Example output (ASCII):**

```
api → services → db
 ↓        ↓
ui    payments → events
         ↕
      billing      ⚠ circular
```

Also outputs `dependency-graph.json` for tooling consumption.

---

## CLI Commands (Complete MVP Surface)

| Command | Description |
|---------|-------------|
| `reposmith init` | Analyze repo, generate .reposmith/ docs, produce score |
| `reposmith score` | Print health report (re-scans, no doc generation) |
| `reposmith graph` | Output dependency graph (ASCII + JSON) |
| `reposmith scan <github-url>` | Score a public GitHub repo remotely |

No other commands for MVP.

---

## What NOT to Build

These are explicitly out of scope for the MVP. Do not build them.

- IDE integrations (plugins, extensions)
- LLM/AI integration (no API calls, no model inference)
- CI/CD integration (GitHub Actions, pre-commit hooks)
- Configuration files or rule DSL
- Auto-fix or refactoring capabilities
- Agent-specific output formats (no CLAUDE.md vs .cursor/rules splitting)
- Web dashboard or hosted service (beyond optional scan leaderboard)
- User accounts or authentication

---

## Technical Positioning

RepoSmith is technology-agnostic. It must work on any codebase in any language. The architecture achieves this through four layers:

1. **Filesystem scanner** — fast parallel directory walk, ignore handling, file classification
2. **Universal repo graph** — language-agnostic data structure representing modules and their relationships
3. **Tree-sitter language adapters** — thin query layers for extracting imports and structural patterns per language
4. **Heuristic fallback engine** — regex and pattern matching for languages without tree-sitter adapters

See ARCHITECTURE.md for detailed technical design.

---

## Launch Strategy

**Target:** Hacker News Show HN, GitHub trending, dev Twitter/LinkedIn

**Show HN title options:**

- "Show HN: RepoSmith — Make your codebase readable for AI agents"
- "Show HN: One command to make your codebase agent-ready"

**Demo assets for launch:**

- README with clear terminal output screenshots
- Comparison scores across popular repos (React, Next.js, Express, Django, Rails)
- Before/after agent performance anecdote (same prompt, with and without RepoSmith)

**Post-launch content engine:**

- Monthly "State of Agent Readiness" reports by ecosystem
- Scores for trending open-source projects
- "I scored the top 50 GitHub repos" thread format
