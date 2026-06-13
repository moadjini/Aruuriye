import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  // Test connection
  const { error: catError } = await supabase.from("categories").select("id").limit(1);

  if (!catError) {
    console.log("✓ Database already set up — categories table exists");
    const { count } = await supabase.from("categories").select("*", { count: "exact", head: true });
    console.log(`  Categories: ${count}`);
    return;
  }

  if (catError.code === "PGRST205" || catError.message?.includes("does not exist")) {
    console.log("Tables not found. Running migrations via Supabase SQL API...");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const migration1 = readFileSync(join(__dirname, "../supabase/migrations/001_initial_schema.sql"), "utf8");
    const migration2 = readFileSync(join(__dirname, "../supabase/migrations/002_storage_buckets.sql"), "utf8");

    // Use Supabase database query endpoint (requires service role on some setups)
    for (const [name, sql] of [["001_initial_schema", migration1], ["002_storage_buckets", migration2]]) {
      const res = await fetch(`${url}/rest/v1/rpc/`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      });
      // rpc won't work for raw SQL — fall through
      console.log(`Migration ${name}: needs manual run or DB password`);
    }

    console.log("\n⚠ Schema not applied automatically.");
    console.log("Please run the SQL files in Supabase Dashboard → SQL Editor:");
    console.log("  1. supabase/migrations/001_initial_schema.sql");
    console.log("  2. supabase/migrations/002_storage_buckets.sql");
    process.exit(1);
  }

  console.error("Connection error:", catError.message);
  process.exit(1);
}

main();
