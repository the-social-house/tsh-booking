#!/usr/bin/env node

import "dotenv/config";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectId = process.env.SUPABASE_PROJECT_ID;

if (!projectId) {
  console.error("Error: SUPABASE_PROJECT_ID environment variable is not set");
  process.exit(1);
}

const outputFile = path.join(process.cwd(), "supabase", "types", "database.ts");

try {
  console.log(`Generating types for project: ${projectId}`);
  const types = execSync(`npx supabase gen types --project-id ${projectId}`, {
    encoding: "utf-8",
  });

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, types);

  console.log(`✓ Types generated at ${outputFile}`);
} catch (error) {
  console.error("Error generating types:", error);
  process.exit(1);
}
