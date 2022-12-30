#!/bin/bash

set -e

echo "[SCRIPT] Before Script :: Setup PG Promise Test DB for Postgres"

PGPASSWORD=postgres psql -v ON_ERROR_STOP=1 -h localhost -U postgres <<-EOSQL
    CREATE DATABASE pg_promise_test;
    \c pg_promise_test;
EOSQL
