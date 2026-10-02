import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/20260320120000_initial.sql",
);

describe("supabase migration", () => {
  const sql = readFileSync(migrationPath, "utf8");

  it("defines cases, public view, admins, and stills bucket policies", () => {
    expect(sql).toMatch(/create table if not exists public\.cases/i);
    expect(sql).toMatch(/create or replace view public\.public_cases/i);
    expect(sql).not.toMatch(/public_cases[\s\S]*answer/i);
    expect(sql).toMatch(/create table if not exists public\.admins/i);
    expect(sql).toMatch(/bucket_id = 'stills'/i);
    expect(sql).toMatch(/public\.is_admin\(\)/i);
  });
});
