#!/usr/bin/env bash
# Runs the database migrations and their tests on a throwaway local PostgreSQL.
# Needs PostgreSQL 15+ server binaries (initdb, pg_ctl) on PATH or in /usr/lib/postgresql/<n>/bin.
set -euo pipefail
cd "$(dirname "$0")/.."

BIN=$(dirname "$(command -v initdb 2>/dev/null || ls -d /usr/lib/postgresql/*/bin/initdb | tail -1)")
DIR=$(mktemp -d)
PORT=${PGTEST_PORT:-54329}
# PostgreSQL refuses to run as root, so containers that run as root hand it to the postgres user.
AS=()
if [ "$(id -u)" = 0 ]; then AS=(runuser -u postgres --); chown postgres "$DIR"; fi
trap '"${AS[@]}" "$BIN/pg_ctl" -D "$DIR/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$DIR"' EXIT

"${AS[@]}" "$BIN/initdb" -D "$DIR/data" -U postgres --auth=trust >/dev/null
"${AS[@]}" "$BIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k $DIR -c listen_addresses=''" -l "$DIR/log" start >/dev/null

PSQL=(psql -h "$DIR" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -f supabase/tests/stubs.sql
for f in supabase/migrations/*.sql; do "${PSQL[@]}" -f "$f"; done
for t in supabase/tests/*.test.sql; do "${PSQL[@]}" -f "$t"; done
