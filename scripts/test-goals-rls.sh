#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must point to an isolated disposable PostgreSQL database}"

psql "$DATABASE_URL" --set ON_ERROR_STOP=1 --file scripts/goals-rls-test-setup.sql
psql "$DATABASE_URL" --set ON_ERROR_STOP=1 --file supabase/migrations/20261122183800_goals_owner_rls.sql
psql "$DATABASE_URL" --set ON_ERROR_STOP=1 --file supabase/tests/goals_rls_test.sql
