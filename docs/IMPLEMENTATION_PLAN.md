# RepoSmith — Implementation Plan

## Timeline: 4 weeks to MVP

Each week has a clear deliverable. At the end of each week, the tool should be runnable and produce useful output for the features completed so far.

---

## Week 1: Foundation + Filesystem Scanner + Stack Detection

**Goal:** `npx reposmith init` runs on any repo, detects the stack, and outputs basic info.

### Tasks

1. **Project scaffold**
   - Initialize pnpm project with TypeScript strict mode
   - Configure tsup for bundling (ESM output, single entry point)
   - Configure vitest
   - Set up bin entry in package.json pointing to built CLI
   - Add shebang (`#!/usr/bin/env node`) to entry point
   - Create the directory structure from ARCHITECTURE.md

2. **CLI framework**
   - Set up commander with four commands: `init`, `score`, `graph`, `scan`
   - `score`, `graph`, `scan` initially print "coming soon" and exit
   - `init` runs the analysis pipeline
   - Terminal output formatting with chalk and ora (spinner during analysis)
   - Handle errors gracefully (catch at top level, print friendly message)

3. **Filesystem scanner**
   - Implement parallel directory walker using `fs.opendir` with streaming
   - Implement .gitignore parsing using the `ignore` package
   - Add default ignore patterns (node_modules, .git, vendor, dist, etc.)
   - Implement file classifier (source, test, config, doc, build, asset, generated)
   - Build `FileEntry[]` inventory
   - Write tests against fixture repos

4. **Stack detector**
   - Implement manifest parsers for: package.json, Cargo.toml, pyproject.toml, go.mod, pom.xml, build.gradle
   - Use js-yaml for YAML, toml package for TOML, fast-xml-parser for XML
   - Implement framework hint detection from dependencies
   - Extract build/test/lint/start commands from scripts and CI configs
   - Detect monorepo tools (pnpm workspaces, npm workspaces, Cargo workspaces, nx, turborepo)
   - Build `StackProfile` output
   - Write tests with fixture manifests

5. **Basic init output**
   - Print detected stack info to terminal
   - Print file counts by role
   - Generate a minimal `repo-summary.md` in `.reposmith/`

### Week 1 deliverable

Running `npx reposmith init` on any repo:
- Shows a spinner
- Prints detected language(s), framework(s), file counts
- Creates `.reposmith/repo-summary.md`

---

## Week 2: Dependency Graph + Tree-sitter Adapters

**Goal:** RepoSmith detects module boundaries, extracts imports, builds a dependency graph, and visualizes it.

### Tasks

1. **Module detector**
   - Implement module boundary detection with precedence rules:
     1. Workspace members (from manifest)
     2. Subdirectories with own manifest
     3. Top-level source directories
     4. Single-module fallback
   - Build `Module[]` with file assignments
   - Write tests for each detection strategy

2. **Tree-sitter integration**
   - Install `web-tree-sitter`
   - Download and bundle WASM grammars for: TypeScript, Python, Go, Rust, Java
   - Implement lazy grammar loading (only load grammars for detected languages)
   - Implement the base `LanguageAdapter` interface
   - Write the TypeScript/JavaScript adapter (import extraction + entry point detection)
   - Write the Python adapter
   - Write the Go adapter
   - Write the Rust adapter
   - Write the Java adapter
   - Write the regex fallback adapter

3. **Smart sampling**
   - Implement file sampling strategy:
     - Quick regex pre-scan to identify most-imported files
     - At least one file per module
     - All entry point files
     - Skip files > 50KB
     - Cap at 200 files total
   - Parse sampled files with appropriate tree-sitter adapter

4. **Import resolution**
   - Resolve extracted import paths to modules using path prefix matching
   - Classify imports as external, internal, or cross-module
   - Build edges from cross-module imports

5. **Repo graph**
   - Implement `RepoGraph` data structure
   - Implement Tarjan's algorithm for cycle detection
   - Calculate import chain depth (longest path)
   - Identify root and leaf modules

6. **Graph command**
   - Implement `reposmith graph` command
   - ASCII graph visualization (modules as nodes, arrows as edges, highlight cycles)
   - Output `dependency-graph.json`
   - Write tests for graph construction and cycle detection

### Week 2 deliverable

Running `reposmith graph` shows an ASCII dependency graph.
Running `reposmith init` now also outputs `.reposmith/dependency-graph.json`.

---

## Week 3: Documentation Generation

**Goal:** `reposmith init` generates the full `.reposmith/` knowledge base and root-level AGENTS.md.

### Tasks

1. **AGENTS.md generator (hero feature)**
   - Generate root-level AGENTS.md from RepoProfile
   - Include: project overview, tech stack, architecture summary, key entry points, build commands, detected conventions, module boundaries
   - Keep output between 80-120 lines
   - Format for both human and LLM readability
   - If an AGENTS.md already exists, do not overwrite without confirmation. Print diff or offer to merge.

2. **Architecture doc generator**
   - Generate `.reposmith/architecture.md`
   - Module map with descriptions
   - Dependency directions (which modules depend on which)
   - Layer boundaries (if detectable)
   - Circular dependency warnings

3. **Modules doc generator**
   - Generate `.reposmith/modules.md`
   - Per-module sections: purpose, key files, dependencies, depended-on-by, tests
   - Pull module descriptions from package.json description, README first paragraph, or directory name
   - List key files (entry points, most-imported files)

4. **Conventions doc generator**
   - Generate `.reposmith/conventions.md`
   - Detected patterns from tree-sitter analysis (error handling, dependency injection, export patterns)
   - Naming conventions (detected from file/directory naming patterns)
   - Detected architectural rules (layer direction, module boundaries)
   - If no patterns detected with confidence, note that conventions should be manually added

5. **Entry points doc generator**
   - Generate `.reposmith/entrypoints.md`
   - List all detected entry points with file path, type (main, route, export, CLI), and brief context

6. **Repo summary generator**
   - Enhance `.reposmith/repo-summary.md` with full stack info, file statistics, team size heuristics (from git if available)

7. **Score JSON generator**
   - Placeholder for now (score engine comes in week 4)
   - Generate `.reposmith/score.json` with empty structure

### Week 3 deliverable

Running `reposmith init` creates:
- Root-level `AGENTS.md`
- Complete `.reposmith/` directory with all documentation files

---

## Week 4: Scoring Engine + Remote Scanning + Polish

**Goal:** `reposmith score` produces a detailed health report. `reposmith scan` works on GitHub URLs. README and launch assets are complete.

### Tasks

1. **Scoring engine**
   - Implement score orchestrator that runs all category scorers
   - Implement architecture scorer (cycles, depth, coupling, boundaries)
   - Implement documentation scorer (README, AGENTS.md, module docs, inline docs)
   - Implement complexity scorer (file sizes, module sizes, nesting depth)
   - Implement test scorer (ratio, coverage, framework detection)
   - Apply weights: architecture 25%, documentation 35%, complexity 20%, tests 20%
   - Generate suggestions sorted by priority
   - Write `score.json` output
   - Write snapshot tests for known repo profiles

2. **Score command**
   - Implement `reposmith score` command
   - Terminal output with category breakdowns, check results, and suggestions
   - Use colored output: green for pass, yellow for warn, red for fail
   - Print total score prominently

3. **Remote GitHub scanner**
   - Implement GitHub URL parser (handle github.com/owner/repo, with or without https://)
   - Implement GitHub API client (tree fetch, content fetch, metadata fetch)
   - Support GITHUB_TOKEN env var for authenticated requests
   - Handle rate limiting with clear error messages
   - Adapt analysis pipeline for remote mode (skip unavailable checks)
   - Implement `reposmith scan` command
   - Print condensed score report (no doc generation for remote)
   - Write tests with mocked GitHub API responses

4. **Init command integration**
   - Wire score engine into `reposmith init` so it prints the score after generating docs
   - Update `score.json` generation with real scores

5. **README**
   - Write README.md with:
     - One-line description
     - Terminal output screenshot/demo
     - Installation: `npx reposmith init`
     - Commands reference (init, score, graph, scan)
     - Example outputs for each command
     - Comparison scores for well-known repos
     - How the score works (brief)
     - Contributing guide link
     - License (MIT)
   - The README is a launch asset. It should be compelling, not just informative.

6. **Polish**
   - End-to-end testing: run on 5+ real open-source repos across different languages
   - Fix edge cases discovered during real-repo testing
   - Ensure `npx reposmith init` works from a fresh npm environment
   - Verify all terminal output is clean and aligned
   - Add `--json` flag to `score` command for CI consumption
   - Add `--no-write` flag to `init` for dry-run mode (print what would be generated)

### Week 4 deliverable

Complete MVP ready for npm publish and launch.

---

## Test Fixture Repos

Create minimal fixture repos for testing. Each should be 5-15 files with realistic structure.

| Fixture | Language | Structure | Tests |
|---------|----------|-----------|-------|
| `typescript-nextjs` | TypeScript | Next.js app with 3 modules (api, ui, lib) | Jest |
| `python-django` | Python | Django project with 2 apps | pytest |
| `rust-workspace` | Rust | Cargo workspace with 3 crates | built-in |
| `go-monorepo` | Go | Multi-package Go project | built-in |
| `java-spring` | Java | Spring Boot with 2 modules | JUnit |
| `mixed-language` | TS + Python | Monorepo with frontend (TS) and backend (Python) | mixed |
| `minimal-repo` | JavaScript | Single file, no tests, no docs (should score very low) | none |
| `well-documented` | TypeScript | Has AGENTS.md, full docs, good tests (should score high) | vitest |

---

## Post-MVP Roadmap (Do Not Build Yet)

These are noted for future planning only. None should be started during the 4-week MVP sprint.

- **CI integration** — GitHub Action that runs `reposmith score` on PRs and comments with the report
- **Score badges** — SVG badge for README showing agent readiness score
- **Public leaderboard** — Web service at reposmith.dev showing scores for scanned repos
- **LLM enrichment** — Optional mode that uses an LLM to enhance convention detection
- **Agent-specific output** — Generate CLAUDE.md, .cursor/rules, .github/copilot-instructions.md from the same source
- **Watch mode** — `reposmith watch` that re-scores on file changes
- **Config file** — `.reposmith.config.json` for custom scoring rules and ignore patterns
- **IDE plugin** — JetBrains / VS Code extension showing harness health in the editor
