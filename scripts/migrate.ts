// Applies supabase/migrations/*.sql that haven't run yet, each in its own
// transaction, and records them in supabase_migrations.schema_migrations (the
// same table the Supabase CLI uses, so the two stay compatible).
//
//   npm run db:migrate
//
// Needs DATABASE_URL in .env.local: Supabase → Connect → Session pooler.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL in .env.local (Supabase → Connect → Session pooler).");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

await client.query(`
  create schema if not exists supabase_migrations;
  create table if not exists supabase_migrations.schema_migrations (
    version text primary key, statements text[], name text
  );`);
const { rows } = await client.query<{ version: string }>("select version from supabase_migrations.schema_migrations");
const applied = new Set(rows.map((r) => r.version));

const dir = "supabase/migrations";
let ran = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  const [version, ...rest] = file.replace(/\.sql$/, "").split("_");
  if (applied.has(version)) continue;
  const sql = readFileSync(join(dir, file), "utf8");
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query(
      "insert into supabase_migrations.schema_migrations (version, statements, name) values ($1, $2, $3)",
      [version, [sql], rest.join("_")],
    );
    await client.query("commit");
    console.log(`applied ${file}`);
    ran++;
  } catch (err) {
    await client.query("rollback");
    console.error(`failed ${file}: ${(err as Error).message}`);
    process.exitCode = 1;
    break;
  }
}
if (!ran && !process.exitCode) console.log("Database is up to date.");
await client.end();
