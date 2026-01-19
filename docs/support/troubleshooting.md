# Troubleshooting Guide

This guide covers common issues, debugging strategies, and solutions for the OpenPeople.ai platform.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Authentication Issues](#authentication-issues)
- [Database Issues](#database-issues)
- [API Issues](#api-issues)
- [Deployment Issues](#deployment-issues)
- [Performance Issues](#performance-issues)
- [Multi-Tenancy Issues](#multi-tenancy-issues)
- [Add-On Issues](#add-on-issues)
- [Development Issues](#development-issues)

---

## Quick Diagnostics

### Health Check Endpoints

```bash
# Application health
curl https://openpeople.ai/api/health

# Expected response
{
  "status": "ok",
  "timestamp": "2026-01-18T12:00:00Z",
  "version": "0.1.0"
}
```

### Common Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | - |
| 400 | Bad Request | Invalid input, missing fields |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Wrong URL, deleted resource |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Bug, database issue |
| 503 | Service Unavailable | Deployment, maintenance |

### Diagnostic Checklist

```markdown
□ Is the service reachable? (ping, curl)
□ Is authentication working? (check token)
□ Is the database connected? (check Supabase)
□ Are environment variables set? (check Vercel)
□ Are there recent deployments? (check Vercel logs)
□ Is there an ongoing incident? (check status pages)
```

---

## Authentication Issues

### Issue: "Invalid login credentials"

**Symptoms**: User cannot log in despite correct credentials.

**Causes & Solutions**:

1. **Email not confirmed**
   ```typescript
   // Check if email is confirmed
   const { data } = await supabase.auth.admin.getUserById(userId);
   console.log(data.user.email_confirmed_at);
   
   // Solution: Resend confirmation
   await supabase.auth.resend({ type: 'signup', email: userEmail });
   ```

2. **Account suspended**
   ```sql
   -- Check account status
   SELECT id, banned_until FROM auth.users WHERE email = 'user@example.com';
   
   -- Unban if needed
   UPDATE auth.users SET banned_until = NULL WHERE email = 'user@example.com';
   ```

3. **Wrong tenant domain**
   - Verify user is accessing correct tenant URL
   - Check `profiles.tenant_id` matches expected tenant

### Issue: "Session expired" errors

**Symptoms**: User gets logged out unexpectedly.

**Solutions**:

```typescript
// Ensure session refresh is configured
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Check middleware is refreshing sessions
// lib/supabase/middleware.ts
export async function updateSession(request: NextRequest) {
  const supabase = createServerClient(/* ... */);
  await supabase.auth.getSession(); // This refreshes the session
}
```

### Issue: User stuck in redirect loop

**Symptoms**: Page keeps redirecting between login and dashboard.

**Solutions**:

1. Clear browser cookies and cache
2. Check redirect URLs in Supabase Auth settings:
   ```
   Settings → Authentication → URL Configuration
   Site URL: https://openpeople.ai
   Redirect URLs: https://openpeople.ai/**, https://*.openpeople.ai/**
   ```
3. Verify middleware isn't blocking authenticated routes:
   ```typescript
   // middleware.ts - Check matcher configuration
   export const config = {
     matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
   };
   ```

---

## Database Issues

### Issue: "Could not find relation" error

**Symptoms**: Queries fail with table not found errors.

**Solutions**:

1. **Run pending migrations**
   ```bash
   supabase db push
   # or
   supabase migration up
   ```

2. **Check schema**
   ```sql
   -- List all tables
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   
   -- Check if specific table exists
   SELECT EXISTS (
     SELECT FROM pg_tables 
     WHERE schemaname = 'public' AND tablename = 'your_table'
   );
   ```

### Issue: RLS policy blocking queries

**Symptoms**: Queries return empty results when data exists.

**Debugging**:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'your_table';

-- List policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test query as service role (bypasses RLS)
-- Use Supabase Dashboard → SQL Editor with "Run as service_role"
SELECT * FROM your_table WHERE id = 'some-id';
```

**Common fixes**:

```sql
-- Ensure user has profile with tenant_id
SELECT * FROM profiles WHERE id = auth.uid();

-- If profile missing, create it
INSERT INTO profiles (id, tenant_id, role)
VALUES (auth.uid(), 'tenant-uuid', 'member');
```

### Issue: Connection timeout

**Symptoms**: Database queries hang or timeout.

**Solutions**:

1. **Check connection pooling**
   ```typescript
   // Use transaction pooler for serverless
   const supabaseUrl = process.env.SUPABASE_URL;
   // Ensure using port 6543 for transaction mode
   ```

2. **Check connection limits**
   - Supabase Dashboard → Database → Settings
   - Monitor active connections

3. **Optimize slow queries**
   ```sql
   -- Find slow queries
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   
   -- Add missing indexes
   CREATE INDEX CONCURRENTLY idx_table_column ON table(column);
   ```

---

## API Issues

### Issue: 401 Unauthorized on all requests

**Symptoms**: Every API call returns 401.

**Debugging**:

```typescript
// Check if token is being sent
console.log('Authorization header:', request.headers.get('Authorization'));

// Verify token is valid
const { data: { user }, error } = await supabase.auth.getUser();
console.log('User:', user, 'Error:', error);
```

**Solutions**:

1. **Token expired** - Refresh the session
2. **Wrong environment** - Check SUPABASE_URL matches
3. **Missing cookie** - Check cookie settings in middleware

### Issue: 403 Forbidden for tenant resources

**Symptoms**: User authenticated but can't access tenant data.

**Debugging**:

```typescript
// Check user's tenant
const { data: profile } = await supabase
  .from('profiles')
  .select('tenant_id, role')
  .single();

console.log('User tenant:', profile.tenant_id);
console.log('User role:', profile.role);

// Check resource tenant
console.log('Resource tenant:', resourceTenantId);
```

**Solutions**:

1. User's `tenant_id` doesn't match resource
2. User role doesn't have permission
3. Super admin flag not set correctly

### Issue: 500 Internal Server Error

**Symptoms**: API returns 500 error.

**Debugging**:

```bash
# Check Vercel function logs
vercel logs [deployment-url] --follow

# Or in Vercel Dashboard
# Project → Deployments → [deployment] → Functions → [function] → Logs
```

**Common causes**:

1. **Missing environment variable**
   ```typescript
   // Add validation at startup
   if (!process.env.REQUIRED_VAR) {
     throw new Error('REQUIRED_VAR is not set');
   }
   ```

2. **Unhandled promise rejection**
   ```typescript
   // Always wrap async code in try-catch
   export async function GET(request: Request) {
     try {
       const data = await fetchData();
       return Response.json(data);
     } catch (error) {
       console.error('Error:', error);
       return Response.json({ error: 'Internal error' }, { status: 500 });
     }
   }
   ```

---

## Deployment Issues

### Issue: Build failure on Vercel

**Symptoms**: Deployment fails during build.

**Common errors and solutions**:

1. **TypeScript errors**
   ```bash
   # Run locally to see errors
   npm run build
   
   # Fix type errors or add to tsconfig
   // tsconfig.json
   {
     "compilerOptions": {
       "skipLibCheck": true  // Temporary fix
     }
   }
   ```

2. **Missing dependencies**
   ```bash
   # Ensure all deps are in package.json
   npm install missing-package
   
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Environment variable missing during build**
   ```bash
   # Check Vercel environment variables
   vercel env ls
   
   # Add missing variable
   vercel env add VARIABLE_NAME production
   ```

### Issue: Deployment succeeds but site shows errors

**Symptoms**: Build passes but site doesn't work.

**Debugging**:

1. **Check runtime environment variables**
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Ensure variables are set for correct environment (Production/Preview)

2. **Check function logs**
   ```bash
   vercel logs --follow
   ```

3. **Compare with previous deployment**
   ```bash
   # Rollback if needed
   vercel rollback
   ```

### Issue: Custom domain not working

**Symptoms**: Domain shows SSL error or doesn't resolve.

**Solutions**:

1. **Check DNS propagation**
   ```bash
   dig yourdomain.com
   nslookup yourdomain.com
   ```

2. **Verify DNS records**
   ```
   A     @     76.76.21.21
   CNAME www   cname.vercel-dns.com
   ```

3. **Wait for SSL provisioning** (can take up to 24 hours)

---

## Performance Issues

### Issue: Slow page loads

**Symptoms**: Pages take >3 seconds to load.

**Debugging**:

1. **Check Web Vitals**
   - Vercel Dashboard → Analytics → Web Vitals
   - Look for LCP, FID, CLS issues

2. **Profile server-side rendering**
   ```typescript
   // Add timing logs
   export default async function Page() {
     const start = Date.now();
     const data = await fetchData();
     console.log(`Data fetch took ${Date.now() - start}ms`);
     return <Component data={data} />;
   }
   ```

**Solutions**:

1. **Add caching**
   ```typescript
   // Cache page for 1 hour
   export const revalidate = 3600;
   
   // Or use fetch cache
   const data = await fetch(url, { next: { revalidate: 3600 } });
   ```

2. **Optimize database queries**
   ```sql
   -- Add indexes
   CREATE INDEX idx_table_column ON table(column);
   
   -- Select only needed columns
   SELECT id, name FROM table;  -- Not SELECT *
   ```

3. **Lazy load components**
   ```typescript
   import dynamic from 'next/dynamic';
   const HeavyComponent = dynamic(() => import('./HeavyComponent'));
   ```

### Issue: High database CPU usage

**Symptoms**: Supabase dashboard shows high CPU.

**Solutions**:

1. **Identify expensive queries**
   ```sql
   SELECT query, calls, mean_time, total_time
   FROM pg_stat_statements
   ORDER BY total_time DESC
   LIMIT 10;
   ```

2. **Add missing indexes**
3. **Optimize N+1 queries** - Use joins or batch fetching
4. **Scale up database** - Supabase Dashboard → Project → Database

---

## Multi-Tenancy Issues

### Issue: User sees wrong tenant's data

**Symptoms**: Data from other tenants appears.

**CRITICAL**: This is a security issue. Investigate immediately.

**Debugging**:

1. **Check RLS policies**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'affected_table';
   ```

2. **Verify tenant context**
   ```typescript
   const tenant = await getTenantFromRequest(request);
   console.log('Resolved tenant:', tenant);
   ```

3. **Check user's profile**
   ```sql
   SELECT * FROM profiles WHERE id = 'user-uuid';
   ```

**Solutions**:

1. Ensure all tenant tables have RLS enabled
2. Verify RLS policies use `current_user_tenant_id()`
3. Check for queries bypassing RLS (service role misuse)

### Issue: Tenant domain not resolving

**Symptoms**: Custom domain shows wrong tenant or 404.

**Debugging**:

```typescript
// Check domain resolution
const tenant = await fetchTenantByDomain('custom.domain.com');
console.log('Resolved:', tenant);

// Check database
const { data } = await supabase
  .from('tenant_domains')
  .select('*, tenants(*)')
  .eq('domain', 'custom.domain.com');
console.log('Domain record:', data);
```

**Solutions**:

1. **Domain not verified**
   - Check `verified_at` is not null
   - Re-run domain verification

2. **DNS not configured**
   - Verify CNAME points to Vercel
   - Check TXT verification record

---

## Add-On Issues

### Storage (R2) Issues

**Issue**: File upload fails

```typescript
// Check R2 credentials
console.log('R2 Account:', process.env.R2_ACCOUNT_ID ? 'Set' : 'Missing');
console.log('R2 Key:', process.env.R2_ACCESS_KEY_ID ? 'Set' : 'Missing');

// Test connection
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
const client = new S3Client({ /* config */ });
await client.send(new ListBucketsCommand({}));
```

### Email (Resend) Issues

**Issue**: Emails not sending

```typescript
// Check Resend API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Test send
const { data, error } = await resend.emails.send({
  from: 'test@openpeople.ai',
  to: 'test@example.com',
  subject: 'Test',
  html: '<p>Test</p>',
});

console.log('Result:', data, error);
```

**Common fixes**:
- Verify sending domain in Resend dashboard
- Check domain DNS records
- Ensure from address uses verified domain

### Notifications (Twilio) Issues

**Issue**: SMS not sending

```typescript
// Check Twilio credentials
const client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Test send
const message = await client.messages.create({
  body: 'Test',
  from: process.env.TWILIO_FROM_NUMBER,
  to: '+1234567890',
});

console.log('Message SID:', message.sid);
```

---

## Development Issues

### Issue: Local development not connecting to Supabase

**Symptoms**: Database errors in development.

**Solutions**:

1. **Check .env.local**
   ```bash
   # Ensure these are set
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

2. **Use local Supabase**
   ```bash
   supabase start
   # Use local URLs from output
   ```

### Issue: TypeScript errors after pulling changes

**Solutions**:

```bash
# Clear TypeScript cache
rm -rf .next
rm -rf node_modules/.cache

# Reinstall dependencies
npm ci

# Regenerate types
npm run generate-types  # If you have this script
```

### Issue: Hot reload not working

**Solutions**:

1. **Check for file watching limits (Linux)**
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **Restart dev server**
   ```bash
   # Kill any hanging processes
   pkill -f "next dev"
   npm run dev
   ```

---

## Getting Help

### Information to Collect

When reporting issues, include:

```markdown
## Environment
- Node version: `node --version`
- npm version: `npm --version`
- OS: macOS/Windows/Linux
- Browser: Chrome/Firefox/Safari

## Issue Description
[Clear description of the problem]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Error Messages
```
[Paste full error message]
```

## Relevant Logs
```
[Paste relevant logs]
```
```

### Support Channels

- **Documentation Issues**: GitHub Issues with `documentation` label
- **Bug Reports**: GitHub Issues with `bug` label
- **Feature Requests**: GitHub Discussions
- **Security Issues**: security@openpeople.ai (do not post publicly)
- **Urgent Support**: support@openpeople.ai

---

## Related Documentation

- [FAQ](./faq.md)
- [Development Setup](../development/setup.md)
- [Deployment Guide](../deployment/overview.md)
- [Monitoring](../deployment/monitoring.md)

---

**Last Updated**: January 18, 2026
**Platform Version**: v0.1.0
