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
  // Note: We'll update local branches when we checkout them
}

function getPackageVersion(branch = "HEAD"): string {
  // Read version from a specific branch to ensure we get the correct source of truth
  const pkgPath = path.join(__dirname, "..", "package.json");
  let raw: string;

  if (branch === "HEAD") {
    // Read from current working directory
    raw = fs.readFileSync(pkgPath, "utf8");
  } else {
    // Read from specific branch
    raw = run(`git show ${branch}:package.json`);
  }

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

function ensureGitHubCLI(): void {
  try {
    run("gh --version");
  } catch {
    throw new Error(
      "GitHub CLI ('gh') is not available. Please install it from https://cli.github.com and run `gh auth login`."
    );
  }
}

function prepareDevelopBranch(): string {
  // Ensure we're on develop branch to read the correct version (source of truth)
  console.log("Switching to 'develop' branch to read version...");
  run("git checkout develop");

  // Ensure local develop is exactly in sync with origin/develop
  // Since we have a clean working tree, we can safely reset
  console.log("Updating local 'develop' to match 'origin/develop'...");
  run("git reset --hard origin/develop");

  // Read version from develop branch (source of truth)
  const currentVersion = getPackageVersion("develop");
  console.log(`Current version (from develop): v${currentVersion}`);
  return currentVersion;
}

async function getNewVersion(currentVersion: string): Promise<string> {
  const bumpType = await promptBumpType(currentVersion);
  const version = bumpVersion(currentVersion, bumpType);
  console.log(`Bumping version: ${currentVersion} → ${version}`);
  return version;
}

function createReleaseBranch(version: string): string {
  const releaseBranch = `release/v${version}`;
  console.log(`Creating release branch '${releaseBranch}' from 'develop'...`);
  run(`git checkout -b ${releaseBranch} develop`);
  return releaseBranch;
}

function resolveMergeConflicts(): void {
  // Check if we're still in a merge state by checking for MERGE_HEAD
  const mergeHeadPath = path.join(__dirname, "..", ".git", "MERGE_HEAD");
  const isMerging = fs.existsSync(mergeHeadPath);

  if (isMerging) {
    // First, handle package.json (source of truth from develop)
    console.log("Restoring package.json from develop (source of truth)...");
    run("git checkout develop -- package.json");
    run("git add package.json");

    // Then resolve other conflicts in favor of release branch (develop's changes)
    console.log(
      "Resolving other conflicts in favor of release branch (develop's changes)..."
    );

    // Get list of remaining conflicted files (excluding package.json)
    const conflictedFiles = run("git diff --name-only --diff-filter=U")
      .split("\n")
      .filter((file) => file && file !== "package.json" && file.trim() !== "");

    // Resolve conflicts for each remaining file
    if (conflictedFiles.length > 0) {
      for (const file of conflictedFiles) {
        run(`git checkout --ours "${file}"`);
        run(`git add "${file}"`);
      }
    }

    // Complete the merge - try merge --continue first, fallback to commit if needed
    try {
      run("git merge --continue");
    } catch {
      // If merge --continue fails, the merge might have been auto-completed
      // Check if we need to commit staged changes
      const status = run("git status --porcelain");
      if (status.trim() !== "") {
        // There are staged changes, commit them
        run(
          `git commit -m "chore: merge main into release branch (resolved conflicts, kept develop's package.json)"`
        );
      }
    }
  } else {
    console.log("Merge state lost, retrying with strategy...");
    // If merge state was lost, abort and retry with strategy
    try {
      run("git merge --abort");
    } catch {
      // Ignore if already aborted or not in merge
    }
    // Retry merge with strategy option to prefer our changes
    run(
      `git merge main -X ours --no-edit -m "chore: merge main into release branch"`
    );
  }
}

function mergeMainIntoRelease(): void {
  console.log("Merging 'main' into release branch to sync history...");
  console.log(
    "Note: package.json will be restored from develop after merge to maintain version source of truth"
  );
  try {
    // Merge main into release branch
    run(`git merge main --no-edit -m "chore: merge main into release branch"`);
  } catch {
    // If merge fails due to conflicts, resolve them
    console.log("Merge conflicts detected. Resolving...");
    resolveMergeConflicts();
  }
}

function restorePackageJsonFromDevelop(currentVersion: string): void {
  // After merge, ensure package.json has develop's version (source of truth)
  // This ensures we have the correct base version even if merge succeeded without conflicts
  const versionAfterMerge = getPackageVersion("HEAD");
  if (versionAfterMerge !== currentVersion) {
    console.log(
      `Restoring package.json from develop (source of truth): ${versionAfterMerge} → ${currentVersion}`
    );
    run("git checkout develop -- package.json");
    run("git add package.json");
    run(`git commit -m "chore: restore package.json version from develop"`);
  } else {
    console.log(
      "package.json already has correct version from develop, skipping restore"
    );
  }
}

function bumpVersionOnReleaseBranch(version: string): void {
  // Now bump the version on the release branch
  setPackageVersion(version);
  run("git add package.json");
  run(`git commit -m "chore: bump version to v${version}"`);
}

function createReleasePR(releaseBranch: string, version: string): void {
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
}

async function main(): Promise<void> {
  try {
    // Basic safety checks
    ensureCleanWorkingTree();
    updateBranchesFromOrigin();
    ensureGitHubCLI();

    // Prepare develop branch and get current version
    const currentVersion = prepareDevelopBranch();

    // Get new version from user
    const version = await getNewVersion(currentVersion);
    const releaseBranch = createReleaseBranch(version);

    // Merge main into release branch
    mergeMainIntoRelease();
    restorePackageJsonFromDevelop(currentVersion);

    // Bump version and create PR
    bumpVersionOnReleaseBranch(version);
    createReleasePR(releaseBranch, version);

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
