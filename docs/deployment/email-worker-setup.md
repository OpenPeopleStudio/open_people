# Email Worker Setup Guide

This guide covers setting up the Cloudflare Email Worker for automated email-to-vault ingestion.

## Prerequisites

- Cloudflare account with Workers enabled
- Domain configured in Cloudflare
- R2 bucket for file storage
- Database access for vault metadata

## 1. DNS Configuration

First, configure your domain's DNS records to route emails through Cloudflare:

### MX Records

Add these MX records to your DNS settings:

```
Type: MX
Name: @
Value: route1.mx.cloudflare.net
Priority: 10

Type: MX
Name: @
Value: route2.mx.cloudflare.net
Priority: 20

Type: MX
Name: @
Value: route3.mx.cloudflare.net
Priority: 30
```

### SPF Record

Add an SPF record to authorize Cloudflare's email servers:

```
Type: TXT
Name: @
Value: "v=spf1 include:_spf.mx.cloudflare.net ~all"
```

### DKIM (Optional but Recommended)

Enable DKIM in Cloudflare Dashboard:
1. Go to **Email Routing** > **DKIM**
2. Follow the setup wizard
3. Add the generated DKIM records to your DNS

## 2. Email Routing Configuration

### Create Email Routes

In Cloudflare Dashboard:

1. Navigate to **Email Routing** > **Routes**
2. Click **Create route**
3. Configure the route:

```
Route type: Email address
Email address: vault-ingest@yourdomain.com
Action: Send to Worker
Worker name: vault-email-worker
```

### Multiple Vault Support

You can create multiple routes for different vaults:

```
vault-ingest@yourdomain.com     → Default vault
vault-{vault-id}@yourdomain.com → Specific vault
vaultingest+{vault-id}@yourdomain.com → Alternative format
```

## 3. Worker Deployment

### Environment Setup

1. Copy the production configuration:

```bash
cp workers/vault-email-worker/wrangler.prod.toml workers/vault-email-worker/wrangler.toml
```

2. Fill in your actual values in `wrangler.toml`:

```toml
[vars]
VAULT_WEBHOOK_URL = "https://yourdomain.com/api/vault/webhook/email"
VAULT_WEBHOOK_SECRET = "your-secure-webhook-secret"
R2_ACCESS_KEY_ID = "your-r2-access-key"
R2_SECRET_ACCESS_KEY = "your-r2-secret-key"
R2_BUCKET_NAME = "vault-files"
CLOUDFLARE_ACCOUNT_ID = "your-cloudflare-account-id"
DATABASE_URL = "your-database-connection-string"

# Monitoring & Observability
SENTRY_DSN = "your-sentry-dsn"
NEXT_PUBLIC_SENTRY_DSN = "your-sentry-dsn"
LOG_LEVEL = "info"  # debug, info, warn, error
```

### Deploy

Use the deployment script:

```bash
# For production
./scripts/deploy-email-worker.sh production

# For staging/development
./scripts/deploy-email-worker.sh staging
```

Or deploy manually:

```bash
cd workers/vault-email-worker
npm install
wrangler deploy
```

## 4. Database Access

The worker needs read access to vault metadata. You have two options:

### Option A: Cloudflare D1

1. Create a D1 database in Cloudflare Dashboard
2. Bind it to your worker:

```toml
[[d1_databases]]
binding = "VAULT_DB"
database_name = "vault"
database_id = "your-d1-database-id"
```

3. Update the worker code to use D1 queries

### Option B: External Database

Configure a database connection string and update the worker to use external database queries.

## 5. Security Configuration

### Webhook Secret

Generate a secure webhook secret:

```bash
openssl rand -base64 32
```

This must match the `VAULT_WEBHOOK_SECRET` in your main application.

### Encryption Key Access

The worker needs access to vault encryption keys. Ensure:

1. Keys are stored encrypted in the database
2. Worker has decryption capability for vault DEKs
3. Audit logging captures all key access

## 6. Testing

### Manual Testing

Send a test email with attachments to `vault-ingest@yourdomain.com`:

```bash
# Using mail command
echo "Test email with attachment" | mail -s "Test Subject" -a attachment.pdf vault-ingest@yourdomain.com

# Or use an email client
```

### Verification

Check:
1. Worker logs in Cloudflare Dashboard
2. Files appear in R2 bucket
3. Webhook notifications in main app logs
4. Inbox items created in vault

## 7. Monitoring & Maintenance

### Logs

Monitor worker activity:

```bash
# View recent logs
wrangler tail vault-email-worker

# Or in Cloudflare Dashboard > Workers > vault-email-worker > Logs
```

### Alerts

Set up alerts for:
- Worker errors
- High email volume
- Storage quota approaching limits
- Database connection issues

### Updates

When deploying updates:

```bash
cd workers/vault-email-worker
npm update
npm run build
wrangler deploy
```

## Troubleshooting

### Common Issues

**Emails not received:**
- Check MX records are correct
- Verify Email Routing configuration
- Confirm domain is active in Cloudflare

**Worker errors:**
- Check environment variables
- Verify database connectivity
- Review worker logs

**Encryption failures:**
- Ensure vault keys are accessible
- Check encryption key format
- Verify R2 bucket permissions

**Webhook failures:**
- Confirm webhook URL is reachable
- Check webhook secret matches
- Verify main app is running

### Debug Mode

Enable debug logging by setting:

```toml
[vars]
DEBUG = "true"
```

## Advanced Configuration

### Rate Limiting

Add rate limiting to prevent abuse:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "your-rate-limit-kv-id"
```

### Custom Domains

Use custom domains for email addresses:

```
vault@yourdomain.com
ingest@yourdomain.com
```

### Bounce Handling

Configure bounce processing with SendGrid:

```toml
[vars]
SENDGRID_API_KEY = "your-sendgrid-api-key"
```

## Support

For issues:
1. Check worker logs
2. Review main application logs
3. Verify configuration matches documentation
4. Test with simple email first

Related documentation:
- [Vault Automation Rules](../vault-todo.md)
- [API Documentation](../api/features/vault.md)
