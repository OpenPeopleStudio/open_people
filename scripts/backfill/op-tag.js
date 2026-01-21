#!/usr/bin/env node

/**
 * Backfill script scaffold to tag existing data with the `op` flag.
 *
 * - Discovers tables that expose a `meta` jsonb or `op_tag` boolean column.
 * - Emits SQL statements to set `meta.op = true` or `op_tag = true` where missing.
 * - Writes the SQL to scripts/backfill/op-tag.sql so it can be run via psql/Supabase SQL editor.
 *
 * Requirements:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node scripts/backfill/op-tag.js
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fetchCandidateColumns() {
  const { data, error } = await supabase
    .from("information_schema.columns")
    .select("table_schema, table_name, column_name, data_type")
    .in("table_schema", ["public", "storage", "auth"])
    .in("column_name", ["meta", "op_tag"]);

  if (error) {
    const err = new Error(`Failed to load column metadata: ${error.message}`);
    err.name = "SchemaIntrospectionError";
    throw err;
  }

  return data || [];
}

function buildSqlStatements(columns) {
  const metaTables = new Set();
  const opTagTables = new Set();

  columns.forEach((col) => {
    if (col.column_name === "meta") {
      metaTables.add(`${col.table_schema}.${col.table_name}`);
    }
    if (col.column_name === "op_tag") {
      opTagTables.add(`${col.table_schema}.${col.table_name}`);
    }
  });

  const statements = [];

  metaTables.forEach((table) => {
    statements.push(
      `update ${table} set meta = coalesce(meta, '{}'::jsonb) || '{"op": true}' where coalesce((meta->>'op')::boolean, false) is distinct from true;`
    );
  });

  opTagTables.forEach((table) => {
    statements.push(
      `update ${table} set op_tag = true where coalesce(op_tag, false) is distinct from true;`
    );
  });

  return statements;
}

async function main() {
  console.log("🔎 Discovering tables with meta/op_tag columns...");
  let columns = [];
  try {
    columns = await fetchCandidateColumns();
  } catch (err) {
    if (err.name !== "SchemaIntrospectionError") throw err;
    console.warn("⚠️  Could not introspect schema via Supabase REST. Falling back to template output.");
  }

  const statements = columns.length ? buildSqlStatements(columns) : [];

  if (!statements.length) {
    const templateSql = [
      "-- Schema introspection unavailable. Add your tables below:",
      "-- Example:",
      "-- update public.tenants set meta = coalesce(meta, '{}'::jsonb) || '{\"op\": true}' where coalesce((meta->>'op')::boolean, false) is distinct from true;",
      "-- update public.tenants set op_tag = true where coalesce(op_tag, false) is distinct from true;",
    ].join("\n");

    const outputPath = path.join(__dirname, "op-tag.sql");
    fs.writeFileSync(outputPath, `${templateSql}\n`, "utf8");
    console.warn(`Wrote template SQL to ${outputPath}. Populate with table names and run manually.`);
    process.exit(0);
  }

  const sql = [
    "-- Auto-generated op tagging backfill",
    "-- Run with psql or Supabase SQL editor",
    ...statements,
  ].join("\n");

  const outputPath = path.join(__dirname, "op-tag.sql");
  fs.writeFileSync(outputPath, `${sql}\n`, "utf8");

  console.log(`✅ Wrote ${statements.length} statements to ${outputPath}`);
  console.log("👉 Review and run in a privileged SQL console to apply the op flag backfill.");
  console.log("⚠️ Storage objects are not updated here; update R2 object metadata separately if needed.");
}

main().catch((err) => {
  console.error("❌ Failed to build op-tag backfill SQL:", err);
  process.exit(1);
});
