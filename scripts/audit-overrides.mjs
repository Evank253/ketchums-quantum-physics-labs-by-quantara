#!/usr/bin/env node
// Flags overrides in package.json that may no longer be necessary.
// Usage: node scripts/audit-overrides.mjs
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const overrides = { ...(pkg.overrides ?? {}), ...(pkg.pnpm?.overrides ?? {}) };
const names = Object.keys(overrides);
if (!names.length) {
  console.log("No overrides declared.");
  process.exit(0);
}

console.log(`Auditing ${names.length} override(s)...\n`);
for (const name of names) {
  const pinned = overrides[name];
  try {
    const latest = execSync(`npm view ${name} version`, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    const status = latest === pinned ? "OK (latest)" : `pinned=${pinned} latest=${latest}`;
    console.log(`- ${name}: ${status}`);
  } catch {
    console.log(`- ${name}: (could not query npm)`);
  }
}
console.log(`\nRun 'bun audit --audit-level=high' after removing any obsolete override.`);
