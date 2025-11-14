This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
# Fuzion AI

A powerful AI-powered knowledge management and chat platform built with Next.js 15, Better Auth, and PostgreSQL. Features include document management, AI-powered search, role-based access control, and MCP (Model Context Protocol) server integration for Claude Desktop.

## Features

- 🤖 **AI-Powered Chat** - Interactive chat interface with knowledge base integration
- 📚 **Knowledge Management** - Upload and manage documents (PDF, DOCX, TXT, CSV, XLSX)
- 🔍 **Semantic Search** - Vector-based search using OpenAI embeddings
- 🎨 **Modern UI** - Built with Tailwind CSS v4 and shadcn/ui components

## Prerequisites

- Node.js 20+ (with pnpm)
- PostgreSQL database
- OpenAI API key (for embeddings)
- (Optional) Google/GitHub/Microsoft OAuth credentials

## Getting Started

First, run the development server:
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

#### AI Configuration

```env
OPENAI_API_KEY=sk-proj-your-openai-api-key
```


### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

Password = Hello@123

The first user to sign up will automatically become an admin.

## Development Workflow

### Standard Development

For normal frontend development:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed development guidelines.

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

To learn more about Next.js, take a look at the following resources:
To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Better Auth](https://www.better-auth.com/) - Authentication library
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [shadcn/ui](https://ui.shadcn.com/) - Re-usable components
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification

## Deployment

The application can be deployed in multiple ways:

- **Vercel** - Frontend & API routes

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
See [docs/DEPLOYMENT_RAILWAY.md](docs/DEPLOYMENT_RAILWAY.md) for complete deployment instructions.
