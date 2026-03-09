# RepoSmith — Architecture

## System Overview

RepoSmith is a CLI tool written in TypeScript that runs on Node.js. It analyzes codebases through four layered analysis stages, produces a universal repo graph, generates agent-readable documentation, and calculates a health score.

```
┌─────────────────────────────────────────────────────────┐
│                    CLI Interface                         │
│         init  |  score  |  graph  |  scan               │
└──────────┬──────────────────────────────────┬───────────┘
           │                                  │
           ▼                                  ▼
┌─────────────────────┐          ┌────────────────────────┐
│   Local Analyzer     │          │   Remote Analyzer       │
│                      │          │   (GitHub API)          │
└──────────┬──────────┘          └──────────┬─────────────┘
           │                                │
           ▼                                ▼
┌─────────────────────────────────────────────────────────┐
│                   Analysis Pipeline                      │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐ │
│  │Filesystem│→ │ Stack     │→ │ Repo     │→ │ Score  │ │
│  │ Scanner  │  │ Detector  │  │ Graph    │  │ Engine │ │
│  └──────────┘  └───────────┘  └──────────┘  └────────┘ │
│                      ↑                                   │
│              ┌───────┴────────┐                          │
│              │ Language       │                          │
│              │ Adapters       │                          │
│              │ (tree-sitter)  │                          │
│              └────────────────┘                          │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Output Generators                      │
│                                                          │
│  AGENTS.md  |  .reposmith/*  |  score.json  |  ASCII  │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
reposmith/
├── src/
│   ├── cli/
│   │   ├── index.ts              # Entry point, argument parsing
│   │   ├── commands/
│   │   │   ├── init.ts           # init command handler
│   │   │   ├── score.ts          # score command handler
│   │   │   ├── graph.ts          # graph command handler
│   │   │   └── scan.ts           # scan command handler (GitHub remote)
│   │   └── output.ts             # Terminal formatting, progress, colors
│   │
│   ├── analyzer/
│   │   ├── pipeline.ts           # Orchestrates the full analysis pipeline
│   │   ├── filesystem/
│   │   │   ├── scanner.ts        # Fast parallel directory walker
│   │   │   ├── ignore.ts         # .gitignore + default ignore patterns
│   │   │   └── classifier.ts     # Classifies files by role (source, test, config, doc, etc.)
│   │   ├── stack/
│   │   │   ├── detector.ts       # Detects languages, frameworks, tools
│   │   │   └── manifests.ts      # Parses package.json, Cargo.toml, pyproject.toml, etc.
│   │   ├── graph/
│   │   │   ├── repo-graph.ts     # Universal repo graph data structure
│   │   │   ├── module-detector.ts # Identifies module boundaries
│   │   │   ├── import-resolver.ts # Resolves imports to modules
│   │   │   └── cycle-detector.ts  # Finds circular dependencies
│   │   ├── adapters/
│   │   │   ├── adapter.ts        # Base adapter interface
│   │   │   ├── typescript.ts     # TypeScript/JavaScript tree-sitter adapter
│   │   │   ├── python.ts         # Python tree-sitter adapter
│   │   │   ├── go.ts             # Go tree-sitter adapter
│   │   │   ├── rust.ts           # Rust tree-sitter adapter
│   │   │   ├── java.ts           # Java tree-sitter adapter
│   │   │   └── fallback.ts       # Regex-based fallback for unsupported languages
│   │   └── remote/
│   │       ├── github.ts         # GitHub API client for remote scanning
│   │       └── remote-analyzer.ts # Adapted pipeline for remote repos
│   │
│   ├── scoring/
│   │   ├── engine.ts             # Score calculation orchestrator
│   │   ├── architecture.ts       # Architecture score (cycles, depth, coupling)
│   │   ├── documentation.ts      # Documentation score (coverage, AGENTS.md, README)
│   │   ├── complexity.ts         # Complexity score (file sizes, module sizes)
│   │   └── tests.ts              # Test score (ratio, coverage, presence)
│   │
│   ├── generators/
│   │   ├── agents-md.ts          # Generates root-level AGENTS.md
│   │   ├── architecture-md.ts    # Generates .reposmith/architecture.md
│   │   ├── modules-md.ts         # Generates .reposmith/modules.md
│   │   ├── conventions-md.ts     # Generates .reposmith/conventions.md
│   │   ├── entrypoints-md.ts     # Generates .reposmith/entrypoints.md
│   │   ├── repo-summary-md.ts    # Generates .reposmith/repo-summary.md
│   │   ├── graph-json.ts         # Generates .reposmith/dependency-graph.json
│   │   ├── score-json.ts         # Generates .reposmith/score.json
│   │   └── graph-ascii.ts        # ASCII dependency graph visualization
│   │
│   └── types/
│       ├── repo-profile.ts       # Central data type for all analysis results
│       ├── module.ts             # Module definition
│       ├── dependency.ts         # Dependency edge definition
│       └── score.ts              # Score breakdown types
│
├── grammars/                     # Tree-sitter WASM grammar files
│   ├── tree-sitter-typescript.wasm
│   ├── tree-sitter-python.wasm
│   ├── tree-sitter-go.wasm
│   ├── tree-sitter-rust.wasm
│   └── tree-sitter-java.wasm
│
├── test/
│   ├── fixtures/                 # Sample repos for testing
│   │   ├── typescript-nextjs/
│   │   ├── python-django/
│   │   ├── rust-workspace/
│   │   ├── go-monorepo/
│   │   ├── java-spring/
│   │   └── mixed-language/
│   ├── analyzer/
│   ├── scoring/
│   └── generators/
│
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Layer 1: Filesystem Scanner

### Purpose

Fast, parallel directory traversal that builds a complete file inventory with classification metadata.

### Implementation

```typescript
interface FileEntry {
  path: string;           // relative to repo root
  extension: string;
  size: number;           // bytes
  role: FileRole;         // source | test | config | doc | build | asset | generated | unknown
  language?: string;      // detected from extension + shebang
}

type FileRole =
  | "source"
  | "test"
  | "config"
  | "doc"
  | "build"
  | "asset"
  | "generated"
  | "unknown";
```

### Ignore handling

Respect `.gitignore` patterns. Additionally, always ignore:

```
node_modules/
.git/
vendor/
dist/
build/
target/
__pycache__/
.next/
.nuxt/
coverage/
*.min.js
*.bundle.js
*.map
```

### File classification rules

- **source**: matches known source extensions (.ts, .py, .rs, .go, .java, .rb, .php, .cs, .cpp, .c, .swift, .kt, etc.)
- **test**: filename contains `test`, `spec`, `_test`, `.test.`, `.spec.` OR lives under a directory named `test`, `tests`, `__tests__`, `spec`, `specs`
- **config**: known config filenames (package.json, tsconfig.json, Cargo.toml, pyproject.toml, Makefile, Dockerfile, docker-compose.yml, .eslintrc, .prettierrc, etc.)
- **doc**: .md, .mdx, .txt, .rst, .adoc files
- **build**: CI/CD files (.github/workflows/*.yml, .gitlab-ci.yml, Jenkinsfile, etc.)
- **asset**: images, fonts, media files
- **generated**: files in known generated directories or with generated-file markers
- **unknown**: everything else

### Performance target

Complete scan of a 10,000-file repo in under 2 seconds. Use streaming `fs.opendir` with concurrent directory processing via a worker pool (2-4 parallel directory reads).

## Layer 2: Stack Detector

### Purpose

Identify the technology stack from config files and file patterns. No tree-sitter needed.

### Detection sources

Parse these files when found (in priority order):

| File | Extracts |
|------|----------|
| `package.json` | JS/TS ecosystem, framework (from dependencies), scripts (build, test, lint commands), workspaces |
| `tsconfig.json` | TypeScript confirmation, path aliases |
| `Cargo.toml` | Rust, workspace members, edition |
| `pyproject.toml` | Python, framework (django, flask, fastapi from deps), tool configs |
| `go.mod` | Go, module path |
| `pom.xml` | Java, Maven, Spring from dependencies |
| `build.gradle` / `build.gradle.kts` | Java/Kotlin, Gradle, Spring from plugins |
| `Gemfile` | Ruby, Rails from gems |
| `composer.json` | PHP, Laravel/Symfony from require |
| `pubspec.yaml` | Dart/Flutter |
| `Package.swift` | Swift |
| `.github/workflows/*.yml` | CI commands, test commands, build commands |
| `Makefile` | build/test/lint commands |
| `Dockerfile` | runtime info |

### Framework detection

Map dependency names to frameworks:

```typescript
const FRAMEWORK_HINTS: Record<string, string> = {
  // JS/TS
  "next": "Next.js",
  "react": "React",
  "vue": "Vue",
  "svelte": "Svelte",
  "@angular/core": "Angular",
  "express": "Express",
  "fastify": "Fastify",
  "hono": "Hono",
  "nestjs": "NestJS",
  // Python
  "django": "Django",
  "flask": "Flask",
  "fastapi": "FastAPI",
  // Ruby
  "rails": "Rails",
  // Java
  "spring-boot": "Spring Boot",
  // Rust
  "actix-web": "Actix",
  "axum": "Axum",
  "rocket": "Rocket",
  // Go (from imports, not manifests)
  "gin-gonic/gin": "Gin",
  "labstack/echo": "Echo",
};
```

### Output

```typescript
interface StackProfile {
  languages: Array<{ name: string; percentage: number }>;  // by file count
  frameworks: string[];
  buildTool?: string;
  testFramework?: string;
  packageManager?: string;
  monorepo?: { tool: string; workspaces: string[] };
  commands: {
    build?: string;
    test?: string;
    lint?: string;
    start?: string;
  };
}
```

## Layer 3: Universal Repo Graph

### Purpose

Represent the codebase as a graph of modules (nodes) and dependencies (edges). This is the central data structure that powers scoring, documentation, and visualization.

### Module detection

Modules are identified by the following precedence:

1. **Workspace members** — if the repo is a monorepo with declared workspaces (package.json workspaces, Cargo workspace members, Go workspace, pnpm-workspace.yaml), each workspace member is a module.
2. **Subdirectories with own manifest** — any subdirectory containing its own package.json, Cargo.toml, go.mod, or pyproject.toml is a module.
3. **Top-level source directories** — if neither of the above applies, use top-level directories under the source root (src/, lib/, app/, packages/) as modules.
4. **Single-module project** — if the project has a flat structure with no clear module boundaries, treat the entire repo as a single module.

```typescript
interface Module {
  name: string;
  path: string;               // relative to repo root
  files: FileEntry[];
  sourceFiles: FileEntry[];
  testFiles: FileEntry[];
  docFiles: FileEntry[];
  entryPoints: string[];       // detected entry files
  description?: string;        // from README or package description
  dependencies: string[];      // names of other modules this depends on
  dependedOnBy: string[];      // names of modules that depend on this
}
```

### Import resolution

To build edges (dependencies between modules), RepoSmith must resolve import statements to modules.

**Step 1:** Extract import paths from source files. This uses tree-sitter adapters (Layer 4) or the regex fallback.

**Step 2:** Classify each import as:

- **External** — refers to a third-party package (ignore for module graph)
- **Internal** — refers to another file in the same module (ignore for module graph)
- **Cross-module** — refers to a file in a different module (creates an edge)

**Step 3:** Classify imports by checking whether the resolved path falls within any detected module boundary. Use path prefix matching against module paths.

### Cycle detection

Use Tarjan's algorithm on the module dependency graph to find strongly connected components. Any SCC with more than one node indicates a circular dependency.

### Import chain depth

Calculate the longest path from any root module (one with no incoming edges) to any leaf module (one with no outgoing edges). This measures the maximum depth an agent must traverse to understand a code path.

### Graph data structure

```typescript
interface RepoGraph {
  modules: Module[];
  edges: Array<{
    from: string;      // module name
    to: string;        // module name
    weight: number;    // number of import statements
  }>;
  cycles: string[][];  // arrays of module names forming cycles
  maxDepth: number;    // longest path through the graph
  roots: string[];     // modules with no incoming edges
  leaves: string[];    // modules with no outgoing edges
}
```

## Layer 4: Language Adapters (Tree-sitter)

### Purpose

Extract import statements and structural patterns from source files using tree-sitter AST parsing. Each adapter is a thin set of tree-sitter queries for a specific language.

### Tree-sitter integration

Use `web-tree-sitter` (WASM variant) for zero-native-dependency installation. This is slower than native tree-sitter but eliminates all compilation friction when running via `npx`.

```typescript
import Parser from "web-tree-sitter";

// Initialize once
await Parser.init();
const parser = new Parser();
const lang = await Parser.Language.load("path/to/tree-sitter-typescript.wasm");
parser.setLanguage(lang);

// Parse a file
const tree = parser.parse(sourceCode);
```

Bundle WASM grammar files in the `grammars/` directory of the npm package. MVP languages: TypeScript/JavaScript, Python, Go, Rust, Java.

### Adapter interface

```typescript
interface LanguageAdapter {
  /** Languages this adapter handles */
  languages: string[];

  /** File extensions this adapter handles */
  extensions: string[];

  /** Extract import paths from a source file */
  extractImports(tree: Parser.Tree, source: string): ImportStatement[];

  /** Detect entry point patterns (main functions, route handlers, exports) */
  detectEntryPoints(tree: Parser.Tree, source: string): EntryPoint[];

  /** Extract structural patterns (optional, for conventions detection) */
  extractPatterns?(tree: Parser.Tree, source: string): CodePattern[];
}

interface ImportStatement {
  path: string;          // the import path as written
  type: "static" | "dynamic";
  line: number;
}

interface EntryPoint {
  name: string;
  type: "main" | "export" | "route" | "handler" | "cli";
  line: number;
}

interface CodePattern {
  type: string;          // e.g., "error-handling", "dependency-injection", "factory"
  description: string;
  confidence: number;    // 0-1
  occurrences: number;
}
```

### TypeScript/JavaScript adapter

Tree-sitter queries to extract:

```
;; Static imports
(import_statement
  source: (string) @import_path)

;; Dynamic imports
(call_expression
  function: (import)
  arguments: (arguments (string) @import_path))

;; Require calls
(call_expression
  function: (identifier) @func (#eq? @func "require")
  arguments: (arguments (string) @import_path))

;; Re-exports
(export_statement
  source: (string) @import_path)
```

Entry point detection:

- Files named `index.ts`, `main.ts`, `server.ts`, `app.ts`
- Files with default exports
- Files with route-handler patterns (Express, Next.js API routes)

### Python adapter

```
;; Import statements
(import_from_statement
  module_name: (dotted_name) @import_path)

(import_statement
  name: (dotted_name) @import_path)
```

Entry points:

- Files with `if __name__ == "__main__":` blocks
- Files named `__init__.py`, `app.py`, `main.py`, `manage.py`, `wsgi.py`

### Go adapter

```
;; Import specs
(import_spec
  path: (interpreted_string_literal) @import_path)
```

Entry points:

- Files with `func main()` in `package main`
- Files in `cmd/` directories

### Rust adapter

```
;; Use statements
(use_declaration
  argument: (scoped_identifier) @import_path)

(use_declaration
  argument: (use_wildcard
    (scoped_identifier) @import_path))
```

Entry points:

- `main.rs`, `lib.rs`
- Files with `fn main()`

### Java adapter

```
;; Import declarations
(import_declaration
  (scoped_identifier) @import_path)
```

Entry points:

- Classes with `public static void main`
- Classes annotated with `@SpringBootApplication`
- Classes annotated with `@RestController`

### Fallback adapter (regex-based)

For languages without a tree-sitter adapter, use regex patterns:

```typescript
const IMPORT_PATTERNS: RegExp[] = [
  /^import\s+.*from\s+['"](.+)['"]/gm,           // JS/TS
  /^from\s+(\S+)\s+import/gm,                     // Python
  /^import\s+\(\s*\n([\s\S]*?)\)/gm,              // Go
  /^use\s+([\w:]+)/gm,                            // Rust
  /^import\s+([\w.]+)/gm,                         // Java
  /^require\s+['"](.+)['"]/gm,                    // Ruby
  /^#include\s+[<"](.+)[>"]/gm,                   // C/C++
  /^using\s+([\w.]+)/gm,                          // C#
];
```

The fallback is less accurate but ensures RepoSmith produces useful output for any language.

### Smart sampling

Do not parse every source file with tree-sitter. Use smart sampling to keep analysis fast:

1. Parse all files that other files import (detected via quick regex pre-scan). These are the most architecturally important files.
2. Parse at least one file per module directory to detect patterns.
3. Parse entry point files.
4. Skip files larger than 50KB (likely generated or vendored).
5. Cap total tree-sitter parses at 200 files. For repos larger than this, sample proportionally across modules.

## Scoring Engine

### Architecture

The scoring engine receives the complete `RepoProfile` and produces a `ScoreReport`.

```typescript
interface ScoreReport {
  total: number;                          // 0-100
  breakdown: {
    architecture: CategoryScore;
    documentation: CategoryScore;
    complexity: CategoryScore;
    tests: CategoryScore;
  };
  suggestions: Suggestion[];
}

interface CategoryScore {
  score: number;                          // 0-100
  weight: number;                         // 0-1 (sums to 1.0)
  checks: Check[];
}

interface Check {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
  impact: number;                         // points deducted (0-25)
}

interface Suggestion {
  priority: "high" | "medium" | "low";
  message: string;
  category: string;
}
```

### Score weights

```
Architecture:   25%  (0.25)
Documentation:  35%  (0.35)
Complexity:     20%  (0.20)
Tests:          20%  (0.20)
```

### Architecture checks (25 points total)

| Check | Impact | Condition |
|-------|--------|-----------|
| No circular dependencies | -8 per cycle | Cycles detected by Tarjan's |
| Import chain depth ≤ 4 | -3 per level above 4 | Max path length in graph |
| No highly coupled modules | -4 per module | Module with edges to >60% of other modules |
| Clear module boundaries | -5 | More than 30% of modules have bidirectional edges |

### Documentation checks (35 points total)

| Check | Impact | Condition |
|-------|--------|-----------|
| Root-level README exists | -5 | No README.md in root |
| AGENTS.md or equivalent exists | -8 | No AGENTS.md, CLAUDE.md, or similar |
| Module descriptions | -2 per module | Module has no README, no package description, no docstring |
| Architecture docs exist | -5 | No architecture.md or similar in docs/ |
| Inline documentation ratio | -5 | Less than 10% of source files contain doc comments |

### Complexity checks (20 points total)

| Check | Impact | Condition |
|-------|--------|-----------|
| No oversized files | -2 per file | Source file exceeds 1000 lines |
| No oversized modules | -3 per module | Module contains more than 50 source files |
| Reasonable nesting depth | -3 | Average directory depth > 6 levels |
| No monolithic entry points | -3 per file | Entry point file exceeds 500 lines |

### Test checks (20 points total)

| Check | Impact | Condition |
|-------|--------|-----------|
| Tests exist | -10 | No test files found anywhere |
| Test-to-source ratio ≥ 0.5 | -5 | Ratio of test files to source files below 0.5 |
| All modules have tests | -2 per module | Module has source files but no test files |
| Test framework detected | -3 | No test runner in dependencies or scripts |

### Score clamping

Each category score is clamped to 0-100. The total score is the weighted sum of category scores, also clamped to 0-100.

## Remote Analyzer (GitHub Scanning)

### Purpose

Enable `reposmith scan <github-url>` to score public repos without cloning.

### GitHub API usage

1. **Parse URL** — extract owner and repo from `github.com/owner/repo` format
2. **Fetch repo metadata** — `GET /repos/{owner}/{repo}` for default branch, description, size
3. **Fetch file tree** — `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1` for complete file listing
4. **Fetch config files** — `GET /repos/{owner}/{repo}/contents/{path}` for package.json, Cargo.toml, etc.
5. **Fetch sample source files** — fetch up to 50 representative source files for tree-sitter analysis

### Rate limiting

GitHub API allows 60 requests/hour unauthenticated, 5000/hour with a token. Support `GITHUB_TOKEN` environment variable for authenticated requests. Display clear error messages when rate limited.

### Limitations compared to local mode

- No git history analysis (team size heuristics, file age)
- No file content for very large files (GitHub API limits content fetch to files under 1MB)
- No `.gitignore` parsing (use default ignore patterns only)
- Import resolution may be less accurate (fewer files parsed)

The remote analyzer produces the same `RepoProfile` data structure as local analysis, with missing fields set to null/undefined. The scoring engine handles missing data gracefully by skipping checks that require unavailable information and annotating the score accordingly.

## Output Generators

### AGENTS.md generator

The most important output. Generates a root-level AGENTS.md file approximately 80-120 lines long.

Structure:

```markdown
# AGENTS.md

> Generated by [RepoSmith](https://github.com/niklas-wortmann/reposmith).
> Agent Readiness Score: {score}/100

## Project Overview

{1-3 sentences: what this project does, detected from README or package description}

## Tech Stack

{language(s), framework(s), build tool, test framework, package manager}

## Architecture

{module count} modules with the following structure:

{module list with one-line descriptions}

For detailed module documentation, see [.reposmith/modules.md](.reposmith/modules.md).
For dependency graph, see [.reposmith/dependency-graph.json](.reposmith/dependency-graph.json).

## Key Entry Points

{list of main entry points with brief descriptions}

## Build & Test

{detected build, test, lint, start commands}

## Conventions

{detected golden principles — coding patterns, architectural rules, naming conventions}

For full conventions documentation, see [.reposmith/conventions.md](.reposmith/conventions.md).

## Module Boundaries

{brief description of which modules should not depend on which, based on detected layer structure}
```

### Other generators

Each generator takes the `RepoProfile` and produces a single file. Generators are pure functions with no side effects. The CLI orchestrates writing files to disk.

## Dependencies

### Runtime dependencies

| Package | Purpose | Why this one |
|---------|---------|--------------|
| `web-tree-sitter` | AST parsing via WASM | Zero native deps, works everywhere |
| `commander` | CLI argument parsing | Standard, lightweight |
| `chalk` | Terminal colors | Standard |
| `ora` | Spinner/progress | Lightweight progress indicators |
| `fast-glob` | File pattern matching | Fast, respects gitignore |
| `ignore` | .gitignore parsing | Standard .gitignore implementation |
| `js-yaml` | YAML parsing (CI configs) | Lightweight |
| `toml` | TOML parsing (Cargo.toml, pyproject.toml) | Lightweight |
| `fast-xml-parser` | XML parsing (pom.xml) | Fast, no native deps |

### Dev dependencies

| Package | Purpose |
|---------|---------|
| `vitest` | Test runner |
| `typescript` | Compilation |
| `tsup` | Bundling |
| `@types/node` | Node type definitions |

### Total dependency footprint

Keep the install size under 20MB. The WASM grammar files are the largest component (~2-3MB each, ~10-15MB total for 5 languages). Consider lazy-loading grammars only when needed for the detected language.

## Performance Targets

| Repo size | `init` time | `score` time |
|-----------|-------------|--------------|
| Small (< 500 files) | < 2s | < 1s |
| Medium (500-5,000 files) | < 5s | < 2s |
| Large (5,000-50,000 files) | < 15s | < 5s |
| Remote scan | < 10s | < 5s |

These targets assume warm filesystem cache. First run may be slower due to WASM grammar loading.

## Error Handling

RepoSmith should never crash on unexpected input. If a file can't be parsed, skip it and log a warning. If a language isn't supported, fall back to regex. If the repo structure is unusual, do best-effort analysis and note limitations in the output.

Always produce some output, even if incomplete. A partial score with caveats is more useful than a crash.
