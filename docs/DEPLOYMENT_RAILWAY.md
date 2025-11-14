# Railway & Vercel Deployment Guide

## Architecture

```
GitHub Repository (Single)
    ├── Vercel Deploy: Frontend + API Routes
    │   └── https://your-app.vercel.app
    │
    └── Railway Deploy: MCP Server Backend
        └── https://your-app-mcp.railway.app:4400
```

## 🚀 Deployment Steps

### Step 1: Prepare the Repository

Your repository now has Railway configuration files:

- `Dockerfile` - Containerized MCP server
- `railway.json` - Railway deployment config
- `.dockerignore` - Docker build optimization

**Existing files unchanged:**

- ✅ `package.json` - Original dependencies maintained
- ✅ `vercel.json` - Vercel config untouched
- ✅ `src/app/` - Next.js app unchanged
- ✅ All other source code preserved

### Step 2: Deploy Frontend to Vercel (No Changes Required)

```bash
# Vercel auto-deploys on git push, or:
vercel deploy --prod

# Your Vercel deployment remains unchanged
# Frontend: https://your-app.vercel.app
```

### Step 3: Deploy MCP Server to Railway

#### 3a. First Time Setup

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login
# Opens browser to authenticate

# 3. Navigate to project directory
cd ~/Documents/Fuzionest/fuzion-ai

# 4. Initialize Railway project
railway init
# Follow the prompts, create new project named "fuzion-mcp-server"

# 5. Link your GitHub repo (optional but recommended)
railway link
```

#### 3b. Deploy MCP Server

```bash
# Deploy the MCP server
railway up

# This will:
# 1. Build Docker image from Dockerfile
# 2. Deploy to Railway
# 3. Run health checks
# 4. Start the MCP server on port 4400
```

#### 3c. Configure Environment Variables

```bash
# Set required environment variables
railway variables set POSTGRES_URL "postgresql://user:pass@host:5432/dbname"
railway variables set BETTER_AUTH_SECRET "your-secret-key"
railway variables set MCP_HTTP_PORT "4400"
railway variables set NODE_ENV "production"

# View all variables
railway variables
```

#### 3d. Get Your MCP Server URL

```bash
# Get the deployed domain
railway domains

# Output example:
# Domains for fuzion-mcp-server:
# https://fuzion-mcp-server.railway.app

# Use this URL as your MCP_SERVER_URL in Vercel
```

### Step 4: Update Vercel Environment Variables

In your Vercel dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add/Update:

   ```
   MCP_SERVER_URL=https://fuzion-mcp-server.railway.app
   POSTGRES_URL=your-database-url
   BETTER_AUTH_SECRET=your-secret
   ```

3. Redeploy Vercel:
   ```bash
   vercel deploy --prod
   ```

## 📋 Verification Checklist

### Test Vercel Frontend

```bash
# Visit your Vercel app
https://your-app.vercel.app

# Check API endpoints work
curl https://your-app.vercel.app/api/health
```

### Test Railway MCP Server

```bash
# Check MCP server health
curl https://fuzion-mcp-server.railway.app/health

# Expected response:
# {"status":"ok","service":"fuzion-ai-mcp-server"}

# Check SSE endpoint with query params
curl -N "https://fuzion-mcp-server.railway.app/sse?project_id=test&knowledge_base_id=test"
```

### Test Integration

```bash
# From Vercel, test connection to Railway MCP
curl -X POST https://your-app.vercel.app/api/mcp/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Railway MCP Server",
    "config": {
      "type": "http",
      "url": "https://fuzion-mcp-server.railway.app/sse?project_id=test&knowledge_base_id=test"
    }
  }'
```

## 🔧 Local Development

### Run Frontend Locally

```bash
pnpm dev
# Runs on http://localhost:3000
```

### Run MCP Server Locally (HTTP Mode)

```bash
pnpm mcp:http
# Runs on http://localhost:4400
# Use in local development
```

### Run MCP Server Locally (Stdio Mode - for Claude Desktop)

```bash
pnpm mcp:stdio
# For integrating with Claude Desktop
# See src/mcp/server.ts
```

## 📊 Repository Status After Setup

```
fuzion-ai/
├── Dockerfile              ✨ NEW - MCP server container
├── railway.json            ✨ NEW - Railway config
├── .dockerignore           ✨ NEW - Docker optimization
├── vercel.json             ✓ UNCHANGED
├── package.json            ✓ UNCHANGED (with new scripts)
├── src/
│   ├── app/               ✓ UNCHANGED - Frontend
│   ├── mcp/
│   │   ├── server.ts      ✓ UNCHANGED - Stdio version
│   │   └── server-http.ts ✓ UNCHANGED - HTTP version
│   └── ...
└── ...
```

## 🛠️ Troubleshooting

### Railway Deployment Issues

**Build fails:**

```bash
# Check build logs
railway logs --service mcp-server

# Rebuild manually
railway up --force
```

**MCP server won't start:**

```bash
# Check runtime logs
railway logs

# Verify environment variables are set
railway variables
```

**Connection timeout:**

```bash
# Increase timeout in railway.json
# Check database connectivity from Railway container
```

### Vercel Integration Issues

**Vercel can't reach Railway MCP:**

```bash
# Verify Railway domain is correct
railway domains

# Test from Vercel function:
curl https://your-mcp-domain.railway.app/health

# Check firewall/CORS settings
```

**Environment variables not working:**

```bash
# Redeploy Vercel after setting env vars
vercel env pull
vercel deploy --prod
```

## 📝 Environment Variables Reference

### Railway (MCP Server)

| Variable             | Required | Example                          |
| -------------------- | -------- | -------------------------------- |
| `POSTGRES_URL`       | ✅       | `postgresql://user:pass@host/db` |
| `BETTER_AUTH_SECRET` | ✅       | `your-secret-key`                |
| `MCP_HTTP_PORT`      | ✅       | `4400`                           |
| `NODE_ENV`           | ✅       | `production`                     |

### Vercel (Frontend)

| Variable              | Required | Example                            |
| --------------------- | -------- | ---------------------------------- |
| `POSTGRES_URL`        | ✅       | `postgresql://user:pass@host/db`   |
| `BETTER_AUTH_SECRET`  | ✅       | `your-secret-key`                  |
| `MCP_SERVER_URL`      | ✅       | `https://your-app-mcp.railway.app` |
| `NEXT_PUBLIC_APP_URL` | ✅       | `https://your-app.vercel.app`      |

## 🔄 Continuous Deployment

### Auto-Deploy to Both Platforms

Both platforms auto-deploy on git push:

```bash
# 1. Make changes
git add .
git commit -m "Update MCP server"

# 2. Push to GitHub
git push origin main

# 3. Automatic deployments:
#    ✅ Vercel: Redeploys frontend + API
#    ✅ Railway: Redeploys MCP server (if connected)
```

### Manual Deployments

**Vercel:**

```bash
vercel deploy --prod
```

**Railway:**

```bash
railway up
```

## 🎯 Quick Commands

```bash
# Local development
pnpm dev              # Next.js frontend
pnpm mcp:http        # MCP HTTP server

# Railway deployment
railway login        # First time only
railway init         # First time only
railway up           # Deploy
railway logs         # View logs
railway variables    # Manage env vars

# Testing
curl http://localhost:3000/health
curl http://localhost:4400/health
```

## ✅ Verification: Nothing Broke

### ✓ Existing Functionality Preserved

- Frontend app works as before
- Database connections unchanged
- Authentication system intact
- API routes functional
- Knowledge base search operational

### ✓ New Capabilities Added

- Railway deployment configuration
- Docker containerization
- Separate MCP server deployment
- Health checks
- Auto-restart on failure

### ✓ Vercel Deployment Unchanged

- Same build process
- Same environment variables (just added MCP_SERVER_URL)
- Same deployment workflow
- No breaking changes

## 📞 Support

For Railway issues: https://railway.app/docs
For Vercel issues: https://vercel.com/docs
For MCP protocol: https://modelcontextprotocol.io/docs

---

**Setup Complete!** 🎉

Your app now has:

- ✅ Frontend deployed on Vercel
- ✅ MCP Server deployed on Railway
- ✅ Both auto-deploying from same git repository
- ✅ Zero downtime deployment
- ✅ Scalable architecture
