import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface CliResult {
  exitCode: 0 | 1;
  output: string;
}

function getPackageJsonPath() {
  const currentFile = fileURLToPath(import.meta.url);
  return resolve(dirname(currentFile), "../../package.json");
}

export function getPackageVersion() {
  const packageJson = JSON.parse(readFileSync(getPackageJsonPath(), "utf8")) as {
    version?: string;
  };

  return packageJson.version ?? "0.0.0";
}

export function runCli(args: string[]): CliResult {
  if (args.includes("--version") || args.includes("-v")) {
    return {
      exitCode: 0,
      output: `${getPackageVersion()}\n`,
    };
  }

  if (args.includes("--help") || args.includes("-h")) {
    return {
      exitCode: 0,
      output: [
        "RepoForge",
        "",
        "Usage:",
        "  repoforge [--help] [--version]",
        "",
        "Status:",
        "  CLI scaffolding is in place. Analysis commands are not implemented yet.",
        "",
      ].join("\n"),
    };
  }

  return {
    exitCode: 0,
    output:
      "RepoForge CLI scaffolding is in place. Analysis commands are not implemented yet.\n",
  };
}

export function main(args = process.argv.slice(2)) {
  const result = runCli(args);
  process.stdout.write(result.output);
  return result.exitCode;
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : "";

if (entrypoint && fileURLToPath(import.meta.url) === entrypoint) {
  process.exitCode = main();
}
