import pg from "pg";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

const client = process.env.PGHOST
  ? new pg.Client({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE || "postgres",
      ssl: { rejectUnauthorized: false },
    })
  : dbUrl
    ? new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
    : null;

if (!client) {
  console.error("Set DATABASE_URL or PGHOST/PGPASSWORD");
  process.exit(1);
}

const files = [
  "001_initial_schema.sql",
  "002_storage_buckets.sql",
];

async function main() {
  await client.connect();
  console.log("Connected to database");

  for (const file of files) {
    const sql = readFileSync(join(__dirname, "../supabase/migrations", file), "utf8");
    console.log(`Running ${file}...`);
    try {
      await client.query(sql);
      console.log(`✓ ${file}`);
    } catch (err) {
      console.error(`✗ ${file}:`, err.message);
      if (!err.message.includes("already exists")) throw err;
      console.log("  (skipped — already exists)");
    }
  }

  await client.end();
  console.log("\n✓ Migrations complete!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
