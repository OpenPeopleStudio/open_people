# Development Setup Guide

This guide will help you set up a local development environment for OpenPeople.ai.

## 🎯 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js**: Version 18 or higher ([Download](https://nodejs.org/))
- **npm** or **pnpm**: Package manager (npm comes with Node.js)
- **Git**: Version control system ([Download](https://git-scm.com/))

### Recommended Tools
- **VS Code (standardized)**: Primary IDE for this repo ([Download](https://code.visualstudio.com/))
- **Docker**: For running local services ([Download](https://docker.com/))
- **Supabase CLI**: For database management ([Install](https://supabase.com/docs/guides/cli))

### System Requirements
- **OS**: macOS, Linux, or Windows (WSL2 recommended)
- **RAM**: Minimum 8GB, recommended 16GB+
- **Storage**: 5GB+ free space
- **Network**: Stable internet connection

## 🚀 Quick Start

> IDE: We standardize on VS Code. Open the repo root; the workspace picks up `.vscode/settings.json` and recommended extensions.

### 1. Clone the Repository
```bash
git clone https://github.com/OpenPeopleStudio/open_people.git
cd open_people
```

### 2. Install Dependencies
```bash
# Using npm
npm install

# Or using pnpm
pnpm install
```

### 3. Set Up Environment Variables
```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit the file with your configuration
# See Environment Variables section below
```

### 4. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 5. Access Different Contexts

| URL | Context | Purpose |
|-----|---------|---------|
| `localhost:3000` | Marketing | Public marketing site |
| `app.localhost:3000` | Super Admin | Platform administration |
| `mars.localhost:3000` | Internal Tenant | Open People workspace |
| `demo.localhost:3000` | Demo Tenant | Customer demo environment |

**Demo-ready dashboards**

- Tenant dashboard: `http://demo.localhost:3000/admin?demo=1`
- Super-admin dashboard: `http://app.localhost:3000/super-admin?demo=1`

## ⚙️ Environment Configuration

### Required Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudflare R2 Storage (for file uploads)
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=openpeople-storage

# Resend (for email sending)
RESEND_API_KEY=re_your_resend_api_key
RESEND_WEBHOOK_SECRET=whsec_your_webhook_secret
DEFAULT_FROM_NAME=OpenPeople

# Twilio (for SMS notifications)
TWILIO_ACCOUNT_SID=AC_your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890

# Monitoring & Observability (Optional - for local development)
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=debug

# Deployment Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com
NEXT_PUBLIC_DEFAULT_TENANT_SLUG=default
NEXT_PUBLIC_SUPER_ADMIN_DOMAIN=app.yourdomain.com
SUPER_ADMIN_DOMAIN=app.yourdomain.com
```

### Development vs Production

| Variable | Development | Production |
|----------|-------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Local Supabase | Production Supabase |
| Database | Local PostgreSQL | Supabase Cloud |
| Email | Console logging | Resend |
| Storage | Local filesystem | Cloudflare R2 |

## 🗄️ Database Setup

### Using Supabase (Recommended)

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and API keys

2. **Link Your Project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Apply Migrations**
   ```bash
   supabase db push
   ```

4. **Seed the Database** (optional)
   ```bash
   supabase db reset
   ```

5. **Seed the Mars Tenant** (for internal workspace)
   ```bash
   node scripts/seed-mars-tenant.js
   ```
   This creates the `mars` tenant with all features enabled and a tenant owner user.

### Local PostgreSQL (Alternative)

If you prefer running PostgreSQL locally:

```bash
# Using Docker
docker run --name openpeople-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=openpeople \
  -p 5432:5432 \
  -d postgres:15

# Set DATABASE_URL in .env.local
DATABASE_URL=postgresql://postgres:password@localhost:5432/openpeople
```

## 🔧 Development Scripts

### Available Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run preview      # Preview production build

# Database
npm run db:generate  # Generate database types
npm run db:push      # Push schema changes
npm run db:studio    # Open database studio

# Testing
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Run tests with UI

# Linting & Formatting
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript checks

# Other
npm run clean        # Clean build artifacts
npm run storybook    # Start Storybook
```

### Custom Scripts

Add custom scripts to `package.json`:

```json
{
  "scripts": {
    "db:migrate": "supabase db push",
    "db:seed": "tsx scripts/seed.ts",
    "test:e2e": "playwright test"
  }
}
```

## 🏗️ Project Structure

```
open_people/
├── app/                    # Next.js app directory
│   ├── (marketing)/       # Public marketing pages
│   ├── (platform)/        # Tenant application
│   │   └── admin/         # Tenant admin workspace
│   │       ├── layout.tsx # Sidebar navigation
│   │       ├── page.tsx   # Dashboard
│   │       ├── vault/     # Encrypted vault
│   │       ├── keys/      # API key management
│   │       ├── notes/     # Notes & templates
│   │       ├── chat/      # AI chat & settings
│   │       ├── knowledge/ # Facts & documents
│   │       └── workflows/ # Projects & tasks
│   ├── super-admin/       # Platform admin
│   └── api/               # API routes
├── components/            # Shared React components
│   └── workspace/         # Reusable workspace components
│       ├── notes/         # NotesListView
│       └── chat/          # ChatView
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase client
│   ├── storage/          # R2 storage client
│   └── tenant.ts         # Tenant resolution
├── scripts/              # Setup and maintenance scripts
│   └── seed-mars-tenant.js # Mars tenant seeding
├── supabase/             # Database migrations
├── types/                # TypeScript definitions
├── docs/                 # Documentation
├── public/               # Static assets
└── templates/            # Code templates
```

## 🔄 Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Follow the repository ESLint/TypeScript conventions
- Write tests for new functionality
- Update documentation as needed

### 3. Test Your Changes
```bash
npm run test
npm run lint
npm run type-check
```

### 4. Commit and Push
```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

### 5. Create a Pull Request
- Go to GitHub and create a PR
- Fill out the PR template
- Request reviews from maintainers

## 🐛 Debugging

### Development Server Issues
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall (keep lockfile)
rm -rf node_modules
npm install

# Check environment variables
npm run dev -- --inspect
```

### Database Connection Issues
```bash
# Test Supabase connection
supabase status

# Reset database
supabase db reset

# Check migration status
supabase migration list
```

### Common Errors

| Error | Solution |
|-------|----------|
| `Module not found` | Run `npm install` |
| `Type errors` | Run `npm run type-check` |
| `Database connection failed` | Check `.env.local` and Supabase status |
| `Port already in use` | Kill process on port 3000 or change port |

## 🧪 Testing Setup

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Test Configuration

Tests use Jest and Playwright. Configuration in:
- `jest.config.js` - Unit and integration tests
- `playwright.config.ts` - E2E tests

## 🚀 Deployment

### Local Deployment
```bash
npm run build
npm run start
```

### Production Deployment
See the [deployment guide](../deployment/overview.md) for Vercel deployment instructions.

## 📞 Getting Help

### Development Support
- **📖 Documentation**: This guide and [API docs](../api/)
- **💬 Discussions**: [GitHub Discussions](../../discussions)
- **🐛 Issues**: [GitHub Issues](../../issues) with `development` label
- **📧 Direct Help**: [dev-support@openpeople.ai](mailto:dev-support@openpeople.ai)

### Community Resources
- **Discord**: Join our [developer community](https://discord.gg/openpeople)
- **Stack Overflow**: Tag questions with `openpeople-ai`
- **Blog**: [OpenPeople Developer Blog](https://blog.openpeople.ai)

## 🔄 Staying Updated

### Keeping Dependencies Current
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Update Next.js specifically
npm install next@latest react@latest react-dom@latest
```

### Following Platform Changes
- Watch the [GitHub repository](../../) for updates
- Subscribe to [GitHub releases](../../releases)

## 🏢 Tenant Admin Development

### Accessing the Tenant Admin

The tenant admin interface is available at `/admin` on any tenant subdomain:

```bash
# Local development
http://mars.localhost:3000/admin

# Production
https://mars.openpeople.ai/admin
```

### Feature Gating

Tenant features are controlled via `tenant.settings.features`:

```typescript
interface TenantFeatures {
  admin: boolean;       // Dashboard access
  storage: boolean;     // Cloud storage
  notifications: boolean;
  email: boolean;
  vault: boolean;       // Encrypted vault
  notes: boolean;       // Notes & templates
  ai_chat: boolean;     // AI assistant
  knowledge: boolean;   // Knowledge base
  api_keys: boolean;    // API key management
  workflows: boolean;   // Projects & tasks
  experiments: boolean;
  ai_inventory: boolean;
  ai_analytics: boolean;
}
```

### Shared Components

When building tenant UI that should also work for super-admin, use the shared components pattern:

```typescript
// components/workspace/notes/NotesListView.tsx
interface NotesListViewProps {
  basePath: string; // "/super-admin" or "/admin"
}

// Tenant page
import { NotesListView } from "@/components/workspace/notes/NotesListView";
export default function TenantNotesPage() {
  return <NotesListView basePath="/admin" />;
}

// Super-admin page  
export default function SuperAdminNotesPage() {
  return <NotesListView basePath="/super-admin" />;
}
```

### API Route Access Control

API routes that should be accessible to tenant users must check for allowed roles:

```typescript
// Before (super-admin only)
if (profile.role !== "super_admin") {
  return NextResponse.json({ error: "Access denied" }, { status: 403 });
}

// After (tenant users allowed)
const allowedRoles = ["super_admin", "owner", "admin"];
if (!profile || !allowedRoles.includes(profile.role)) {
  return NextResponse.json({ error: "Access denied" }, { status: 403 });
}
```

---

**Last Updated**: January 20, 2026
**Environment**: Development
