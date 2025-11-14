# Fuzion AI

A powerful AI-powered knowledge management and chat platform built with Next.js 15, Better Auth, and PostgreSQL. Features include document management, AI-powered search, role-based access control, and MCP (Model Context Protocol) server integration for Claude Desktop.

## Features

- 🤖 **AI-Powered Chat** - Interactive chat interface with knowledge base integration
- 📚 **Knowledge Management** - Upload and manage documents (PDF, DOCX, TXT, CSV, XLSX)
- 🔍 **Semantic Search** - Vector-based search using OpenAI embeddings
- 🔐 **Authentication** - Email/password and social auth (GitHub, Google, Microsoft) via Better Auth
- 👥 **RBAC** - Role-based access control with admin, editor, and user roles
- 🌐 **MCP Integration** - Connect with Claude Desktop via Model Context Protocol
- 🎨 **Modern UI** - Built with Tailwind CSS v4 and shadcn/ui components

## Prerequisites

- Node.js 20+ (with pnpm)
- PostgreSQL database
- OpenAI API key (for embeddings)
- (Optional) Google/GitHub/Microsoft OAuth credentials

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/jarishahar/Profileai.git
cd Profileai
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Copy the example environment file and configure your environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and configure the following required variables:

#### Database Configuration

```env
POSTGRES_URL=postgresql://user:password@localhost:5432/fuzion_ai
```

#### Authentication

Generate a secret for Better Auth:

```bash
pnpm generate:secret
```

Then add it to your `.env.local`:

```env
BETTER_AUTH_SECRET=your-generated-secret-here
BETTER_AUTH_URL=http://localhost:3000
```

#### AI Configuration

```env
OPENAI_API_KEY=sk-proj-your-openai-api-key
```

#### Optional: Social Authentication

For GitHub OAuth:

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

For Google OAuth:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

For Microsoft OAuth:

```env
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

#### Optional: Security & Features

```env
# Encryption for sensitive data
ENCRYPTION_SECRET=your-encryption-secret

# Disable sign-ups (set to 1 to disable)
DISABLE_SIGN_UP=0

# Disable email sign-in (set to 1 to disable)
DISABLE_EMAIL_SIGN_IN=0
```

For a complete list of environment variables, see `.env.example`.

### 4. Database Setup

Run database migrations:

```bash
pnpm db:migrate
```

(Optional) Seed a superadmin user:

```bash
pnpm db:seed:superadmin
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

The first user to sign up will automatically become an admin.

## Development Workflow

### Standard Development

For normal frontend development:

```bash
pnpm dev
```

### With MCP Server

To run both the Next.js app and MCP server together:

```bash
pnpm dev:with-mcp
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed development guidelines.

## Database Commands

```bash
# Generate migrations from schema changes
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Drizzle Studio
pnpm db:studio

# Push schema changes (development)
pnpm db:push

# Reset database (WARNING: deletes all data)
pnpm db:reset
```

## MCP Server Integration

Fuzion AI includes an MCP server for Claude Desktop integration:

### Setup MCP for Claude Desktop

```bash
pnpm mcp:setup
```

For Railway/HTTP deployment:

```bash
cp .env.mcp.example .env.local
# Configure variables
pnpm mcp:http
```

See [docs/DEPLOYMENT_RAILWAY.md](docs/DEPLOYMENT_RAILWAY.md) for production deployment.

## Code Quality

```bash
# Lint code
pnpm lint

# Format code
pnpm format
```

## Project Structure

```
src/
├── app/              # Next.js 15 App Router
├── components/       # React components (shadcn/ui)
├── lib/
│   ├── auth/        # Better Auth configuration
│   ├── db/          # Drizzle ORM & repositories
│   └── validations/ # Zod schemas
├── mcp/             # Model Context Protocol server
└── types/           # TypeScript type definitions
```

## Technology Stack

- **Framework**: Next.js 15 with App Router & Turbopack
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **UI**: Tailwind CSS v4 + Radix UI (shadcn/ui)
- **AI**: OpenAI API, AI SDK
- **Validation**: Zod
- **Type Safety**: TypeScript

## Documentation

- [Development Guide](docs/DEVELOPMENT.md) - Detailed development workflow
- [Railway Deployment](docs/DEPLOYMENT_RAILWAY.md) - Deploy to Railway & Vercel
- [RBAC Feature](docs/RBAC_FEATURE_SUMMARY.md) - Role-based access control
- [Architecture](docs/AGENTS_ARCHITECTURE.md) - System architecture details

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Better Auth](https://www.better-auth.com/) - Authentication library
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [shadcn/ui](https://ui.shadcn.com/) - Re-usable components
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification

## Deployment

The application can be deployed in multiple ways:

- **Vercel** - Frontend & API routes
- **Railway** - MCP server backend
- **Docker** - Containerized deployment

See [docs/DEPLOYMENT_RAILWAY.md](docs/DEPLOYMENT_RAILWAY.md) for complete deployment instructions.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
