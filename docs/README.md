# RepoSmith — Documentation Index

## How to use these files

These documents capture the product spec, architecture, types, and implementation plan for RepoSmith. Read them together when you need the full project context.

### Documentation files (for context and spec)

| File | Purpose | Read first? |
|------|---------|-------------|
| `../AGENTS.md` | Agent instruction file for working on this project | Yes, always |
| `PRD.md` | Product requirements: features, scope, success criteria | Yes |
| `ARCHITECTURE.md` | Technical design: layers, data flow, project structure | Yes |
| `TYPES.md` | All TypeScript interfaces and data types | Reference |
| `IMPLEMENTATION_PLAN.md` | Week-by-week build plan with concrete tasks | When building |

### Repo root files

| File | Purpose |
|------|---------|
| `package.json` | npm package config with all dependencies |
| `tsconfig.json` | TypeScript compiler config (strict mode) |
| `tsup.config.ts` | Bundler config for CLI distribution |
| `vitest.config.ts` | Test runner config |
| `README.md` | Public-facing README (launch asset) |

### Recommended workflow

1. Start with `../AGENTS.md` for the working conventions.
2. Read `PRD.md`, `ARCHITECTURE.md`, and `IMPLEMENTATION_PLAN.md` for product and build context.
3. Use `TYPES.md` as the interface reference while implementing features.
4. Run `pnpm install` from the repo root.
5. Keep the long-form docs in `docs/` and the runnable project files at the repo root.

The agent should be able to implement the full MVP by following the implementation plan week by week. Each week's deliverable is testable independently.

### Key principle

These docs are designed so that the agent has complete context without needing to ask clarifying questions. If the agent needs to make a design decision not covered here, the guiding principle is: **analyze any repo, generate agent-friendly docs, produce a shareable score. Everything else can wait.**
