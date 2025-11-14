# Fuzion AI Codebase Instructions

## Architecture Overview

This is a **Next.js 15 + TypeScript** application with a robust authentication system using **Better Auth**, **Drizzle ORM** with PostgreSQL, and **Tailwind CSS**. The app follows a modular architecture with strict separation between client/server code and comprehensive type safety.

## Key Technical Stack

- **Framework**: Next.js 15 (App Router) with Turbopack
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Better Auth with social providers (GitHub, Google, Microsoft)
- **UI**: Tailwind CSS v4 + Radix UI components
- **Validation**: Zod schemas
- **Tooling**: Biome for linting/formatting (not ESLint/Prettier)

## Import Path Conventions

The project uses **custom path mappings** (not standard `@/` everywhere):

```typescript
// Type definitions
import { UserZodSchema } from "app-types/user"; // → src/types/*
import { USER_ROLES } from "app-types/roles";

// Library utilities
import { parseEnvBoolean } from "lib/utils"; // → src/lib/*
import { userRepository } from "lib/db/repository";
import { auth } from "auth/server"; // → src/lib/auth/*

// UI components (standard Next.js)
import { Button } from "@/components/ui/button"; // → src/*

// Special utilities
import logger from "logger"; // → src/lib/logger.ts
import "load-env"; // → src/lib/load-env.ts
```

**Critical**: Always use the correct path mapping. `app-types/*` for types, `lib/*` for utilities, `auth/*` for auth modules.

## Authentication Architecture

### Better Auth Integration

- **Auth Instance**: `src/lib/auth/auth-instance.ts` - core configuration
- **Server Utils**: `src/lib/auth/server.ts` - server-side session handling
- **Client Utils**: `src/lib/auth/client.ts` - client-side auth operations
- **Role System**: Built-in admin plugin with `admin`, `editor`, `user` roles

### Key Auth Patterns

```typescript
// Server-side session access
import { auth } from "auth/server";
const session = await auth();

// Database hooks set first user as admin automatically
// Social auth providers configured via environment variables
```

### Middleware Protection

The app uses Next.js middleware (`src/middleware.ts`) with Better Auth session cookies to protect routes. Excludes: auth routes, API auth endpoints, static assets.

## Database Architecture

### Drizzle ORM Setup

- **Schema**: `src/lib/db/pg/schema.pg.ts` - PostgreSQL tables
- **Database**: `src/lib/db/pg/db.pg.ts` - connection instance
- **Repository Pattern**: `src/lib/db/repository.ts` → specific repos in `pg/repositories/`
- **Migrations**: `src/lib/db/migrations/pg/`

### Key Schema Features

- UUID primary keys with `defaultRandom()`
- Built-in `created_at`/`updated_at` timestamps
- User roles stored as text field (not separate table)
- JSON fields for user preferences with type safety

## Development Workflow

### Essential Commands

```bash
# Development (uses Turbopack)
pnpm dev

# Database migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Code quality (uses Biome, not ESLint)
pnpm lint
pnpm format
```

### Database Migration Guidelines

- **NEVER** manually edit migration files in `src/lib/db/migrations/pg/`
- **ALWAYS** use the package.json scripts (`pnpm drizzle-kit generate` and `pnpm drizzle-kit migrate`) to manage migrations
- Modify the schema in `src/lib/db/pg/schema.pg.ts` first, then generate migrations automatically

### Environment Setup

- Uses custom `load-env` utility that loads `.env.local` → `.env.{NODE_ENV}` → `.env`
- Critical env vars: `POSTGRES_URL`, `BETTER_AUTH_SECRET`, social auth credentials
- First user registration automatically gets admin role

## Code Patterns & Conventions

### File Naming

- **Always use kebab-case** for all file names: `sign-up.tsx`, `user-repository.pg.ts`, `auth-instance.ts`
- Components, pages, utilities, and all other files follow kebab-case consistently
- Maintain this convention when creating new files or suggesting changes

### UI/UX Standards

- **shadcn/ui components** - Use established components from `src/components/ui/`
- **Tailwind CSS** - Follow Tailwind v4 utility-first approach for styling
- **Top-tier design standards** - Ensure all UI components meet modern design expectations
- **Accessibility** - Components should be accessible and follow ARIA standards
- **Responsive design** - Mobile-first approach with proper breakpoints

### Component Architecture

- **UI Components**: `src/components/ui/` - reusable shadcn/Radix-based components
- **Feature Components**: `src/components/auth/` - domain-specific components with kebab-case names
- **Custom Hooks**: `src/hooks/` - reusable React hooks like `use-object-state.ts`

### Type Safety Patterns

```typescript
// Zod schemas for validation + TypeScript types
export const UserZodSchema = z.object({...});
export type User = z.infer<typeof UserZodSchema>;

// Repository pattern with typed returns
const user = await userRepository.findByEmail(email);
```

### Error Handling

- Uses `ts-safe` library for promise safety
- Server actions return `ActionState<T>` type for consistent error handling
- Toast notifications via `sonner` for user feedback

## File Organization Logic

- **App Router**: `src/app/` - Next.js 15 app directory structure
- **Route Groups**: `src/app/(auth)/` - auth-related pages
- **API Routes**: `src/app/api/auth/` - Better Auth endpoints
- **Types**: `src/types/` - domain-specific type definitions
- **Library**: `src/lib/` - organized by domain (auth/, db/, validations/)

## Critical Notes

1. **File Naming**: Always use kebab-case for all files - components, pages, utilities, types
2. **Import Paths**: Never use relative imports for cross-domain code - use path mappings
3. **UI Standards**: Maintain top-tier UI/UX with shadcn components and Tailwind CSS best practices
4. **Auth State**: Server components use `auth()`, client components use Better Auth React hooks
5. **Database**: All queries go through repository pattern, never direct Drizzle calls in components
6. **Database Migrations**: Do NOT manually edit migration files. Always use package.json scripts to generate and apply migrations
7. **Styling**: Uses Tailwind v4 with new CSS syntax, responsive design, and accessibility focus
8. **Environment**: Custom env loading - don't use standard dotenv patterns
9. **Project Structure**: Respect existing domain organization and kebab-case conventions
10. **Page/Layout Component Pattern**:
    - **NEVER** use `'use client'` in `src/app/**/page.tsx` or `src/app/**/layout.tsx`
    - Server components (pages/layouts) should remain server-only
    - Extract client logic into separate component files (e.g., `data-sources-container.tsx`)
    - Import and use the client component in the page/layout file
    - This keeps the app router clean and leverages Next.js server-first architecture
11. **UI Component Library**:
    - **Always use shadcn/ui components** from `src/components/ui/` for consistent theming
    - Never build custom UI elements from scratch when shadcn equivalents exist
    - Ensures entire app maintains uniform look, feel, and accessibility standards
    - Check existing components before creating new ones
12. **Documentation**:
    - README files ONLY for: Architecture/Planning, Feature Documentation, Module Documentation
    - NO README files for: Simple tasks, bug fixes, routine implementation
    - Do NOT generate solutions as separate README files unless explicitly requested for planning/architecture
    - **Do NOT generate summary or completion README files** unless explicitly asked

When adding features, follow the existing repository pattern, maintain type safety with Zod schemas, use kebab-case file names, ensure UI components meet modern design standards, and respect the auth boundaries between client/server code.
