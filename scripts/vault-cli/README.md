# Vault CLI

Command-line tool for uploading files to your encrypted vault.

## Installation

```bash
# Install globally
npm install -g @openpeople/vault-cli

# Or use npx
npx @openpeople/vault-cli upload file.pdf
```

## Configuration

Create a config file at `~/.vault-cli/config.json`:

```json
{
  "endpoint": "https://your-domain.com/api/vault/quick-upload",
  "token": "qs_your-token-here"
}
```

Or use environment variables:

```bash
export VAULT_ENDPOINT="https://your-domain.com/api/vault/quick-upload"
export VAULT_TOKEN="qs_your-token-here"
```

## Usage

### Upload a file

```bash
vault-upload file.pdf
vault-upload invoice.pdf receipt.jpg report.docx
```

### Upload with options

```bash
# Upload to specific folder
vault-upload --folder invoices file.pdf

# Upload all files in directory
vault-upload --dir ./documents

# Watch directory for new files
vault-upload --watch ./inbox

# Verbose output
vault-upload -v file.pdf
```

### Check status

```bash
vault-upload --status
```

## Output

```
$ vault-upload invoice.pdf

✓ Uploaded: invoice.pdf (1.2 MB)
  Category: Financial > Invoice
  Tags: invoice, 2026, business
  Suggested folder: /Invoices/2026/January
  Status: Pending review

Upload complete! 1 file uploaded successfully.
```

## Shell Integration

### macOS Quick Action

Create a Quick Action in Automator:
1. Open Automator
2. Create new Quick Action
3. Add "Run Shell Script"
4. Paste: `/usr/local/bin/vault-upload "$@"`
5. Save as "Upload to Vault"

Now right-click any file → Quick Actions → Upload to Vault

### Alias

Add to `~/.zshrc` or `~/.bashrc`:

```bash
alias vu='vault-upload'
alias vuv='vault-upload -v'
```

## API

The CLI uses the Quick Upload API:

```bash
curl -X POST "https://your-domain.com/api/vault/quick-upload" \
  -H "x-vault-token: qs_your-token" \
  -F "file=@document.pdf"
```

Response:

```json
{
  "success": true,
  "file_id": "uuid",
  "filename": "document.pdf",
  "ai_summary": "Invoice from Acme Corp for $500",
  "ai_category": "Financial",
  "ai_tags": ["invoice", "acme"],
  "suggested_folder": "/Invoices/2026"
}
```
