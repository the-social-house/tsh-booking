#!/usr/bin/env node

/**
 * Release helper script
 *
 * Creates a GitHub pull request from a release branch to `main` using the version
 * from this project's package.json.
 *
 * Process:
 * 1. Creates a release branch from `develop`
 * 2. Merges `main` into the release branch (to sync history and prevent conflicts)
 * 3. Bumps the version in package.json
 * 4. Pushes the release branch and creates a PR to `main`
 *
 * This workflow prevents merge conflicts by ensuring the release branch contains
 * both main's history (including previous release commits) and develop's new features.
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

// function ensureOnDevelopBranch(): void {
//   const branch = run("git rev-parse --abbrev-ref HEAD");
//   if (branch !== "develop") {
//     throw new Error(
//       `Releases must be created from the 'develop' branch. Current branch: '${branch}'.`
//     );
//   }
// }

function updateBranchesFromOrigin(): void {
  console.log("Fetching latest from origin...");
  run("git fetch origin");

  console.log("Updating local 'develop' from 'origin/develop'...");
  run("git pull origin develop");

  console.log("Updating local 'main' from 'origin/main'...");
  run("git fetch origin main:main");
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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Select } = require("enquirer") as {
  // Keep types minimal to avoid depending on @types/enquirer.
  Select: new (options: {
    name: string;
    message: string;
    choices: Array<{ name: string; message: string }>;
    initial?: number;
  }) => { run: () => Promise<string> };
};

async function promptBumpType(currentVersion: string): Promise<BumpType> {
  const prompt = new Select({
    name: "bump",
    message: `Current version: v${currentVersion}\nSelect version bump type`,
    choices: [
      { name: "major", message: "major - breaking changes" },
      { name: "minor", message: "minor - new features, backwards compatible" },
      {
        name: "patch",
        message: "patch - bug fixes and small improvements (default)",
      },
    ],
    initial: 2, // default to "patch"
  });

  const answer = (await prompt.run()) as string;

  if (answer === "major" || answer === "minor" || answer === "patch") {
    return answer;
  }

  // Fallback to patch if something unexpected happens
  return "patch";
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

async function main(): Promise<void> {
  try {
    // Basic safety checks
    ensureCleanWorkingTree();
    // ensureOnDevelopBranch();
    updateBranchesFromOrigin();

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

    const releaseBranch = `release/v${version}`;

    // Create release branch from develop
    console.log(`Creating release branch '${releaseBranch}' from 'develop'...`);
    run(`git checkout -b ${releaseBranch} develop`);

    // Merge main into release branch to bring in any previous release commits
    // This prevents merge conflicts when the PR is created
    console.log("Merging 'main' into release branch to sync history...");
    try {
      run(
        `git merge main --no-edit -m "chore: merge main into release branch"`
      );
    } catch {
      // If merge fails, check if it's just a version conflict in package.json
      const status = run("git status --porcelain");
      if (status.includes("package.json")) {
        console.log("Resolving version conflict in package.json...");
        // Keep develop's version (we're about to bump it anyway)
        run("git checkout --ours package.json");
        run("git add package.json");
        run(
          `git commit --no-edit -m "chore: merge main into release branch (resolved version conflict)"`
        );
      } else {
        // Other conflicts - let user resolve manually
        console.error(
          "Merge conflict detected. Please resolve conflicts manually and run:"
        );
        console.error("  git add .");
        console.error("  git commit --no-edit");
        throw new Error("Merge conflict requires manual resolution");
      }
    }

    // Now bump the version on the release branch
    setPackageVersion(version);
    run("git add package.json");
    run(`git commit -m "chore: bump version to v${version}"`);

    // Push the release branch
    console.log(`Pushing release branch '${releaseBranch}' to origin...`);
    run(`git push origin ${releaseBranch}`);

    const title = `release: v${version}`;

    const bodyLines = [`Release PR for version **v${version}**`];

    const body = bodyLines.join("\n");

    // Check if a release PR already exists for this head/base combo
    try {
      const existing = run(
        `gh pr list --state open --base main --head ${releaseBranch} --json number,title`
      );
      const existingPrs = JSON.parse(existing) as
        | Array<{ number: number; title: string }>
        | undefined;
      if (Array.isArray(existingPrs) && existingPrs.length > 0) {
        const [first] = existingPrs;

        console.log(
          `An open PR from '${releaseBranch}' to 'main' already exists: #${first.number} - ${first.title}`
        );
        process.exit(0);
      }
    } catch {
      // If this check fails, continue and attempt to create the PR anyway.
    }

    const createArgs = [
      "gh pr create",
      "--base main",
      `--head ${releaseBranch}`,
      `--title "${title.replace(/"/g, '\\"')}"`,
      `--body "${body.replace(/"/g, '\\"')}"`,
    ].join(" ");

    console.log(
      `Creating GitHub pull request from '${releaseBranch}' to 'main'...`
    );
    run(createArgs);

    console.log(`Release pull request created for v${version}.`);

    // Switch back to develop branch
    console.log("Switching back to 'develop' branch...");
    run("git checkout develop");
  } catch (error) {
    console.error(String(error instanceof Error ? error.message : error));
    // Try to switch back to develop on error
    try {
      run("git checkout develop");
    } catch {
      // Ignore checkout errors
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
});
