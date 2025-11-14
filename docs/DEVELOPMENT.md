# Development Guide

## Running the Application

### Standard Development (Frontend Only)

For normal development, just run the Next.js dev server:

```bash
pnpm dev
```

This starts the frontend at http://localhost:3000

### Development with MCP Server

If you need to run both the frontend and MCP server together (for testing MCP integration):

```bash
pnpm dev:with-mcp
```

This will:

- Start Next.js dev server on http://localhost:3000
- Start MCP server for Claude Desktop integration
- Keep both running in parallel
- Press Ctrl+C to stop both servers

## Important: MCP Server Usage

### For Claude Desktop (Recommended)

**You don't need to run the MCP server manually!**

Claude Desktop automatically starts the MCP server when you:

1. Configure it using `pnpm mcp:setup`
2. Add the configuration to Claude Desktop config
3. Restart Claude Desktop
4. Open a new chat

Claude Desktop will launch the MCP server as a child process when needed.

### For Local Testing/Development

Run the MCP server independently:

```bash
pnpm mcp:server
```

This is useful for:

- Testing MCP server functionality
- Debugging MCP tools
- Verifying database connections
- Checking MCP logs

## Development Workflow

### Typical Day-to-Day Development

```bash
# Start frontend only
pnpm dev
```

**Use this for:**

- UI development
- Feature implementation
- Testing the chat interface
- Database operations
- Authentication work

### When Testing Claude Desktop Integration

1. **Configure Claude Desktop** (one-time setup):

   ```bash
   pnpm mcp:setup
   ```

2. **Add configuration to Claude Desktop** (copy output to config file)

3. **Restart Claude Desktop** completely

4. **Open a chat in Claude** - MCP server starts automatically

5. **Frontend still needs to run separately**:
   ```bash
   pnpm dev
   ```

### When Running Both for Development

```bash
# Run both Next.js and MCP server together
pnpm dev:with-mcp
```

**Use this when:**

- Testing MCP integration end-to-end
- Debugging MCP server issues
- Need logs from both servers
- Developing MCP-related features

## Architecture Understanding

### Two Separate Services

1. **Next.js Frontend** (Port 3000)

   - Web UI for users
   - In-app chat interface
   - Knowledge base management
   - Document uploads
   - Authentication

2. **MCP Server** (stdio transport)
   - Exposes knowledge bases to Claude Desktop
   - Provides search tools for LLMs
   - Uses standard input/output (not HTTP)
   - Started by Claude Desktop automatically

### They Don't Depend on Each Other

- Frontend works without MCP server (in-app chat still works)
- MCP server works without frontend (Claude can search KBs)
- Both access the same PostgreSQL database
- Both use the same OpenAI API for embeddings

## Environment Setup

Both services need these environment variables:

```env
POSTGRES_URL=postgresql://user:pass@localhost:5432/fuzion_ai
OPENAI_API_KEY=sk-proj-...
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
```

Make sure these are in your `.env` or `.env.local` file.

## Common Scenarios

### "I just want to develop features"

```bash
pnpm dev
```

### "I want to test with Claude Desktop"

1. Configure Claude Desktop once: `pnpm mcp:setup`
2. Restart Claude Desktop
3. Run frontend: `pnpm dev`
4. Use Claude - MCP server starts automatically

### "I want to debug MCP server"

```bash
# Terminal 1
pnpm dev

# Terminal 2
pnpm mcp:server
```

### "I want both running together easily"

```bash
pnpm dev:with-mcp
```

## Testing the Chat Interface

The in-app chat interface **does not require the MCP server** to be running!

1. Start frontend: `pnpm dev`
2. Navigate to a knowledge base
3. Click "Test Chat"
4. Ask questions about your documents

This uses the same search service but through Next.js server actions, not MCP.

## Troubleshooting

### "Chat interface not working"

- Check browser console for errors
- Verify documents are uploaded and processed
- Make sure embeddings are generated (check "completed" status)
- Try with threshold=0.5 for more results

### "MCP server not connecting to Claude"

- Restart Claude Desktop completely
- Check Claude Desktop logs: `~/Library/Logs/Claude/mcp*.log`
- Verify configuration path is correct
- Test MCP server independently: `pnpm mcp:server`

### "Both servers crash when running dev:with-mcp"

- Check if ports are already in use
- Verify environment variables are set
- Try running them separately to isolate the issue

## Database

All database operations work the same regardless of which service you're running:

```bash
# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Drizzle Studio
pnpm db:studio

# Push schema changes
pnpm db:push
```

## Summary

| Command             | Use Case                 | MCP Server   | Frontend       |
| ------------------- | ------------------------ | ------------ | -------------- |
| `pnpm dev`          | **Normal development**   | ❌           | ✅             |
| `pnpm dev:with-mcp` | Testing MCP + Frontend   | ✅           | ✅             |
| `pnpm mcp:server`   | Debug MCP only           | ✅           | ❌             |
| Claude Desktop      | **Production MCP usage** | Auto-started | Run separately |

**Recommendation**: Use `pnpm dev` for 95% of your development work. The in-app chat interface is perfect for testing knowledge bases without needing Claude Desktop or the MCP server running.
