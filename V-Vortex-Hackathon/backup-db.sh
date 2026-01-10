#!/usr/bin/env bash
set -euo pipefail

# CHANGE ONLY THIS
PASSWORD="YOUR_PASSWORD_HERE" # MUST Change

# ───────────────────────────────────────────────

DATABASE_URL="postgresql://postgres:${PASSWORD}@db.zmcrdozxxclgzpltwpme.supabase.co:5432/postgres"

TS="$(date +%Y%m%d_%H%M%S)"
OUT_DIR="./backups"
mkdir -p "$OUT_DIR"

SQL_OUT="$OUT_DIR/backup_${TS}.sql"
SQLITE_OUT="$OUT_DIR/backup_${TS}.db"

# 1) FULL POSTGRES SQL BACKUP (schema + data, directly restorable)
pg_dump "$DATABASE_URL" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --file "$SQL_OUT"

# 2) SQLITE .db SNAPSHOT (data-only, portable)
python3 - <<PY
import os, subprocess, pathlib

db_url = "${DATABASE_URL}"
out_dir = "${OUT_DIR}"
sqlite_out = "${SQLITE_OUT}"

pathlib.Path(sqlite_out).unlink(missing_ok=True)
subprocess.run(["sqlite3", sqlite_out, "PRAGMA foreign_keys=OFF;"], check=True)

def psql(cmd):
    return subprocess.check_output(cmd, text=True)

tables = psql([
    "psql", db_url, "-At",
    "-c",
    """
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type='BASE TABLE'
      AND table_schema NOT IN ('pg_catalog','information_schema')
    ORDER BY table_schema, table_name;
    """
]).splitlines()

for t in tables:
    schema, table = t.split("|")
    sqlite_table = f"{schema}__{table}"

    cols = psql([
        "psql", db_url, "-At",
        "-c",
        f"""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema='{schema}'
          AND table_name='{table}'
        ORDER BY ordinal_position;
        """
    ]).splitlines()

    if not cols:
        continue

    col_defs = ", ".join(f'"{c}" TEXT' for c in cols)
    subprocess.run(
        ["sqlite3", sqlite_out, f'CREATE TABLE "{sqlite_table}" ({col_defs});'],
        check=True
    )

    csv_path = f"{out_dir}/{sqlite_table}.csv"
    col_list = ", ".join(f'"{c}"' for c in cols)

    subprocess.run(
        ["psql", db_url, "-c",
         f"""\\copy (SELECT {col_list} FROM "{schema}"."{table}") TO '{csv_path}' WITH CSV HEADER"""],
        check=True
    )

    subprocess.run(
        ["sqlite3", sqlite_out],
        input=f""".mode csv
.import '{csv_path}' "{sqlite_table}"
""",
        text=True,
        check=True
    )

print(sqlite_out)
PY
