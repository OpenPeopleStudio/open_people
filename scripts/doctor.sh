#!/usr/bin/env bash
set -euo pipefail

echo "Node: $(node -v)"
echo "Supabase CLI: $(supabase --version || echo 'missing')"

REQUIRED_ENV=(SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY RESEND_API_KEY)
missing=false
for v in "${REQUIRED_ENV[@]}"; do
  if [ -z "${!v:-}" ]; then
    echo "Missing env: $v"
    missing=true
  fi
done
if [ "$missing" = true ]; then exit 1; fi

echo "Linting migrations..."
supabase db lint

echo "Checking DB connectivity (dry-run push)..."
supabase db push --dry-run > /dev/null

echo "Doctor checks passed"
