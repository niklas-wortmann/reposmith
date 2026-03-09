# RepoSmith — Core Types Reference

This document defines the central data types that flow through the analysis pipeline. All types are defined in `src/types/` and shared across analyzers, scorers, and generators.

## RepoProfile (Central Data Type)

The `RepoProfile` is the single data structure that the analysis pipeline produces and all downstream components consume. Every analyzer contributes to it, and every generator and scorer reads from it.

```typescript
interface RepoProfile {
  /** Absolute path to the repo root (null for remote scans) */
  rootPath: string | null;

  /** Repository metadata */
  meta: {
    name: string;
    description?: string;
    defaultBranch?: string;
    remoteUrl?: string;
  };

  /** Complete file inventory */
  files: FileEntry[];

  /** Detected technology stack */
  stack: StackProfile;

  /** Module structure */
  modules: Module[];

  /** Dependency graph between modules */
  graph: RepoGraph;

  /** Existing agent instruction files found */
  existingAgentFiles: AgentFile[];

  /** Analysis metadata */
  analysis: {
    timestamp: string;
    version: string;
    mode: "local" | "remote";
    filesScanned: number;
    filesParsed: number;       // tree-sitter parsed
    parseErrors: number;
    duration: number;          // milliseconds
  };
}
```

## FileEntry

```typescript
interface FileEntry {
  /** Path relative to repo root */
  path: string;

  /** File extension without dot */
  extension: string;

  /** File size in bytes */
  size: number;

  /** Classified role */
  role: FileRole;

  /** Detected programming language (null if not a source file) */
  language: string | null;
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

## StackProfile

```typescript
interface StackProfile {
  /** Languages detected with percentage of source files */
  languages: LanguageInfo[];

  /** Frameworks detected from dependencies */
  frameworks: string[];

  /** Build tool (npm, pnpm, yarn, cargo, gradle, maven, make, etc.) */
  buildTool?: string;

  /** Test framework (jest, vitest, pytest, go test, junit, etc.) */
  testFramework?: string;

  /** Package manager */
  packageManager?: string;

  /** Monorepo info if detected */
  monorepo?: MonorepoInfo;

  /** Detected commands */
  commands: {
    build?: string;
    test?: string;
    lint?: string;
    start?: string;
    [key: string]: string | undefined;
  };
}

interface LanguageInfo {
  name: string;
  /** Percentage of source files in this language (0-100) */
  percentage: number;
  /** Number of source files */
  fileCount: number;
}

interface MonorepoInfo {
  tool: string;              // pnpm, npm, yarn, cargo, nx, turborepo, lerna
  workspaces: string[];      // workspace glob patterns or paths
}
```

## Module

```typescript
interface Module {
  /** Module name (package name, directory name, or crate name) */
  name: string;

  /** Path relative to repo root */
  path: string;

  /** How this module was detected */
  detectedBy: "workspace" | "manifest" | "directory" | "single";

  /** All files belonging to this module */
  files: FileEntry[];

  /** Source files only */
  sourceFiles: FileEntry[];

  /** Test files only */
  testFiles: FileEntry[];

  /** Documentation files */
  docFiles: FileEntry[];

  /** Detected entry points */
  entryPoints: EntryPoint[];

  /** Module description (from package.json, README, etc.) */
  description?: string;

  /** Names of modules this module depends on */
  dependencies: string[];

  /** Names of modules that depend on this module */
  dependedOnBy: string[];
}
```

## RepoGraph

```typescript
interface RepoGraph {
  /** All modules as graph nodes */
  modules: Module[];

  /** Dependency edges between modules */
  edges: GraphEdge[];

  /** Circular dependency cycles (each array is a cycle of module names) */
  cycles: string[][];

  /** Longest path through the dependency graph */
  maxDepth: number;

  /** Modules with no incoming edges (nothing depends on them) */
  roots: string[];

  /** Modules with no outgoing edges (they depend on nothing internal) */
  leaves: string[];
}

interface GraphEdge {
  /** Source module name */
  from: string;

  /** Target module name */
  to: string;

  /** Number of import statements from source to target */
  weight: number;

  /** Sample import paths (up to 3, for documentation purposes) */
  sampleImports: string[];
}
```

## Language Adapter Types

```typescript
interface LanguageAdapter {
  /** Language names this adapter handles */
  languages: string[];

  /** File extensions this adapter handles (without dot) */
  extensions: string[];

  /** Extract import statements from a parsed tree */
  extractImports(tree: Parser.Tree, source: string): ImportStatement[];

  /** Detect entry point patterns */
  detectEntryPoints(tree: Parser.Tree, source: string): EntryPoint[];

  /** Extract structural patterns for convention detection (optional) */
  extractPatterns?(tree: Parser.Tree, source: string): CodePattern[];
}

interface ImportStatement {
  /** The import path as written in the source */
  path: string;

  /** Static or dynamic import */
  type: "static" | "dynamic";

  /** Line number in the source file */
  line: number;
}

interface EntryPoint {
  /** Name of the entry point (function name, file name, route path) */
  name: string;

  /** Type of entry point */
  type: "main" | "export" | "route" | "handler" | "cli";

  /** Line number */
  line: number;

  /** File path */
  file: string;
}

interface CodePattern {
  /** Pattern type identifier */
  type: string;

  /** Human-readable description */
  description: string;

  /** Confidence level 0-1 */
  confidence: number;

  /** Number of times this pattern appears */
  occurrences: number;
}
```

## Score Types

```typescript
interface ScoreReport {
  /** Overall score 0-100 */
  total: number;

  /** Per-category breakdown */
  breakdown: {
    architecture: CategoryScore;
    documentation: CategoryScore;
    complexity: CategoryScore;
    tests: CategoryScore;
  };

  /** Actionable suggestions sorted by priority */
  suggestions: Suggestion[];

  /** Timestamp of scoring */
  timestamp: string;

  /** RepoSmith version */
  version: string;
}

interface CategoryScore {
  /** Category score 0-100 */
  score: number;

  /** Weight in total score 0-1 */
  weight: number;

  /** Individual checks within this category */
  checks: Check[];
}

interface Check {
  /** Check identifier */
  id: string;

  /** Human-readable check name */
  name: string;

  /** Result */
  status: "pass" | "warn" | "fail";

  /** Description of what was found */
  message: string;

  /** Points deducted for this check (0 if pass) */
  impact: number;

  /** Specific items that triggered this check */
  details?: string[];
}

interface Suggestion {
  /** Priority level */
  priority: "high" | "medium" | "low";

  /** Actionable suggestion text */
  message: string;

  /** Which score category this improves */
  category: "architecture" | "documentation" | "complexity" | "tests";

  /** Estimated score improvement if addressed */
  estimatedImpact?: number;
}
```

## Agent File Detection

```typescript
interface AgentFile {
  /** Path relative to repo root */
  path: string;

  /** Type of agent instruction file */
  type: "agents-md" | "claude-md" | "cursor-rules" | "copilot-instructions" | "other";

  /** File size in bytes */
  size: number;
}

/**
 * Known agent instruction file locations to check:
 * - AGENTS.md (root)
 * - CLAUDE.md (root)
 * - .claude/CLAUDE.md
 * - .cursor/rules
 * - .github/copilot-instructions.md
 * - .windsurfrules
 * - CONVENTIONS.md
 * - CONTRIBUTING.md
 */
```

## Configuration (Post-MVP)

Not implemented in MVP, but the type is defined here for future reference.

```typescript
interface RepoSmithConfig {
  /** Custom ignore patterns (in addition to defaults) */
  ignore?: string[];

  /** Custom score weights (must sum to 1.0) */
  weights?: {
    architecture?: number;
    documentation?: number;
    complexity?: number;
    tests?: number;
  };

  /** Custom module detection overrides */
  modules?: {
    include?: string[];
    exclude?: string[];
  };

  /** Thresholds for checks */
  thresholds?: {
    maxFileLines?: number;       // default: 1000
    maxModuleFiles?: number;     // default: 50
    maxImportDepth?: number;     // default: 4
    minTestRatio?: number;       // default: 0.5
  };
}
```
