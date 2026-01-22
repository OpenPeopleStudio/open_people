#!/bin/bash

# Deploy Vault Email Worker to Cloudflare
# Usage: ./scripts/deploy-email-worker.sh [environment]

set -e

ENVIRONMENT=${1:-"production"}
WORKER_DIR="workers/vault-email-worker"

echo "🚀 Deploying Vault Email Worker ($ENVIRONMENT)"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Install with: npm install -g wrangler"
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "$WORKER_DIR" ]; then
    echo "❌ Worker directory not found: $WORKER_DIR"
    exit 1
fi

cd "$WORKER_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Validate configuration
echo "🔍 Validating configuration..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Run: wrangler auth login"
    exit 1
fi

# Check required environment variables
REQUIRED_VARS=(
    "VAULT_WEBHOOK_URL"
    "VAULT_WEBHOOK_SECRET"
    "R2_ACCESS_KEY_ID"
    "R2_SECRET_ACCESS_KEY"
    "R2_BUCKET_NAME"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] && ! grep -Eq "^${var}[[:space:]]*=[[:space:]]*\"[^\"]+\"" wrangler.toml; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '  - %s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Set them in wrangler.toml or as environment variables."
    exit 1
fi

# Run tests if they exist
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    echo "🧪 Running tests..."
    npm test
fi

# Deploy
echo "🚀 Deploying to Cloudflare..."
if [ "$ENVIRONMENT" = "production" ]; then
    wrangler deploy
else
    echo "📝 Deploying to $ENVIRONMENT environment..."
    wrangler deploy --env "$ENVIRONMENT"
fi

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure Email Routing in Cloudflare Dashboard"
echo "2. Add DNS records for email routing"
echo "3. Test with a sample email"
echo ""
echo "📖 See workers/vault-email-worker/README.md for detailed setup instructions"
