#!/usr/bin/env node

/**
 * Create Supabase migration script
 *
 * Creates a new Supabase migration by running `supabase db diff` to generate
 * a migration file based on the current database schema changes.
 *
 * Usage:
 *   npm run supabase:migration <migration-name>
 *   tsx scripts/create-migration.ts <migration-name>
 *
 * Example:
 *   npm run supabase:migration add_user_email_index
 *   npm run supabase:migration create-bookings-table
 */

import { execSync } from "node:child_process";

/**
 * Validates migration name format
 * Accepts kebab-case, snake_case, or alphanumeric with hyphens/underscores
 */
const VALID_MIGRATION_NAME_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/u;

/**
 * Validates that the migration name is in a valid format
 * Accepts kebab-case, snake_case, or alphanumeric with hyphens/underscores
 */
function validateMigrationName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new Error("Migration name is required");
  }

  if (!VALID_MIGRATION_NAME_PATTERN.test(name)) {
    throw new Error(
      `Invalid migration name: "${name}". ` +
        "Migration names must be lowercase and use kebab-case or snake_case (e.g., 'add-user-index' or 'add_user_index')"
    );
  }
}

/**
 * Runs a shell command and returns the output
 */
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

function main(): void {
  try {
    // Get migration name from command line arguments
    const migrationName = process.argv[2];

    if (!migrationName) {
      console.error("Error: Migration name is required");
      console.log("\nUsage:");
      console.log("  npm run supabase:migration <migration-name>");
      console.log("  tsx scripts/create-migration.ts <migration-name>");
      console.log("\nExample:");
      console.log("  npm run supabase:migration add-user-email-index");
      process.exit(1);
    }

    // Validate migration name
    validateMigrationName(migrationName);

    // Check if Supabase CLI is available
    try {
      run("npx supabase --version");
    } catch {
      throw new Error(
        "Supabase CLI is not available. Please ensure it's installed: npm install -g supabase"
      );
    }

    console.log(`Creating migration: ${migrationName}`);

    // Run the supabase db diff command
    const command = `npx supabase db diff -f ${migrationName}`;
    run(command);

    console.log(`✓ Migration created successfully: ${migrationName}`);
  } catch (error) {
    console.error(String(error instanceof Error ? error.message : error));
    process.exit(1);
  }
}

main();
