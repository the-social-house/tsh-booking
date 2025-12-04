#!/usr/bin/env node

/**
 * Release helper script
 *
 * Creates a GitHub pull request from `develop` to `main` using the version
 * from this project's package.json.
 *
 * Requirements for developers:
 * - GitHub CLI installed: https://cli.github.com
 * - Authenticated via `gh auth login`
 *
 * Usage:
 *   npm run release
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import url from "node:url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_SSH_REMOTE_REGEX = /^git@github\.com:/u;
const GITHUB_HTTPS_REMOTE_REGEX = /^https:\/\/github\.com\//u;
const GIT_SUFFIX_REGEX = /\.git$/u;

type BumpType = "major" | "minor" | "patch";

function run(cmd: string): string {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] })
      .toString()
      .trim();
  } catch (error) {
    const err = error as { stderr?: Buffer } | Error;
    const stderr =
      "stderr" in err && err.stderr
        ? err.stderr.toString()
        : (err as Error).message;
    throw new Error(`Command failed: ${cmd}\n${stderr}`);
  }
}

function ensureCleanWorkingTree(): void {
  const status = run("git status --porcelain");
  if (status !== "") {
    throw new Error(
      "Working tree is not clean. Please commit or stash your changes before creating a release."
    );
  }
}

function ensureOnDevelopBranch(): void {
  const branch = run("git rev-parse --abbrev-ref HEAD");
  if (branch !== "develop") {
    throw new Error(
      `Releases must be created from the 'develop' branch. Current branch: '${branch}'.`
    );
  }
}

function updateDevelopFromOrigin(): void {
  console.log("Updating local 'develop' from 'origin/develop'...");
  run("git fetch origin");
  run("git pull origin develop");
}

function getPackageVersion(): string {
  const pkgPath = path.join(__dirname, "..", "package.json");
  const raw = fs.readFileSync(pkgPath, "utf8");
  const pkg = JSON.parse(raw) as { version?: unknown };

  if (typeof pkg.version !== "string" || pkg.version.length === 0) {
    throw new Error("Could not read a valid 'version' from package.json.");
  }

  return pkg.version;
}

function setPackageVersion(newVersion: string): void {
  const pkgPath = path.join(__dirname, "..", "package.json");
  const raw = fs.readFileSync(pkgPath, "utf8");
  const pkg = JSON.parse(raw) as { version?: unknown; [key: string]: unknown };

  pkg.version = newVersion;

  const updated = `${JSON.stringify(pkg, null, 2)}\n`;
  fs.writeFileSync(pkgPath, updated, "utf8");
}

function bumpVersion(current: string, bumpType: BumpType): string {
  const parts = current.split(".");
  if (parts.length !== 3) {
    throw new Error(
      `Invalid version '${current}'. Expected semantic versioning MAJOR.MINOR.PATCH.`
    );
  }

  const [majorStr, minorStr, patchStr] = parts;
  let major = Number.parseInt(majorStr, 10);
  let minor = Number.parseInt(minorStr, 10);
  let patch = Number.parseInt(patchStr, 10);

  if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patch)) {
    throw new Error(
      `Invalid version '${current}'. Expected numeric MAJOR.MINOR.PATCH.`
    );
  }

  if (bumpType === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (bumpType === "minor") {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
}

async function promptBumpType(currentVersion: string): Promise<BumpType> {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(
    `Current version is ${currentVersion}. Select version bump type (major/minor/patch) [patch]: `
  );
  rl.close();

  const normalized = answer.trim().toLowerCase();

  if (
    normalized === "major" ||
    normalized === "minor" ||
    normalized === "patch"
  ) {
    return normalized;
  }

  return "patch";
}

function getRepositorySlug(): string {
  // Prefer explicit env if present (useful for CI)
  const envRepo = process.env.GITHUB_REPOSITORY;
  if (envRepo?.includes("/")) {
    return envRepo;
  }

  // Fallback to git remote
  const remoteUrl = run("git remote get-url origin");

  // Handle SSH and HTTPS formats
  // git@github.com:owner/repo.git
  // https://github.com/owner/repo.git
  const slug = remoteUrl
    .replace(GITHUB_SSH_REMOTE_REGEX, "")
    .replace(GITHUB_HTTPS_REMOTE_REGEX, "")
    .replace(GIT_SUFFIX_REGEX, "");

  if (!slug.includes("/")) {
    throw new Error(
      `Unable to determine GitHub repository slug from remote URL: ${remoteUrl}`
    );
  }

  return slug;
}

async function main(): Promise<void> {
  try {
    // Basic safety checks
    ensureCleanWorkingTree();
    ensureOnDevelopBranch();
    updateDevelopFromOrigin();

    // Ensure GitHub CLI is available
    try {
      run("gh --version");
    } catch {
      throw new Error(
        "GitHub CLI ('gh') is not available. Please install it from https://cli.github.com and run `gh auth login`."
      );
    }

    const currentVersion = getPackageVersion();

    console.log(`Current version: v${currentVersion}`);

    const bumpType = await promptBumpType(currentVersion);
    const version = bumpVersion(currentVersion, bumpType);

    console.log(`Bumping version: ${currentVersion} → ${version}`);

    setPackageVersion(version);

    // Commit and tag the version bump
    run("git add package.json");
    run(`git commit -m "chore: bump version to v${version}"`);
    run(`git tag -a v${version} -m "release v${version}"`);
    run("git push origin develop");
    run(`git push origin v${version}`);

    const repoSlug = getRepositorySlug();

    const title = `release: v${version}`;
    const compareUrl = `https://github.com/${repoSlug}/compare/main...develop`;

    const bodyLines = [
      `Release PR for version **v${version}**`,
      "",
      "### Summary",
      "- Ensure version in `package.json` is correct for this release.",
      "- Review the changes from `develop` to `main`.",
      "",
      "### Links",
      `- Changes: ${compareUrl}`,
    ];

    const body = bodyLines.join("\n");

    // Check if a release PR already exists for this head/base combo
    try {
      const existing = run(
        "gh pr list --state open --base main --head develop --json number,title"
      );
      const existingPrs = JSON.parse(existing) as
        | Array<{ number: number; title: string }>
        | undefined;
      if (Array.isArray(existingPrs) && existingPrs.length > 0) {
        const [first] = existingPrs;

        console.log(
          `An open PR from 'develop' to 'main' already exists: #${first.number} - ${first.title}`
        );
        process.exit(0);
      }
    } catch {
      // If this check fails, continue and attempt to create the PR anyway.
    }

    const createArgs = [
      "gh pr create",
      "--base main",
      "--head develop",
      `--title "${title.replace(/"/g, '\\"')}"`,
      `--body "${body.replace(/"/g, '\\"')}"`,
    ].join(" ");

    console.log("Creating GitHub pull request from 'develop' to 'main'...");
    run(createArgs);

    console.log(`Release pull request created for v${version}.`);
  } catch (error) {
    console.error(String(error instanceof Error ? error.message : error));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
});
