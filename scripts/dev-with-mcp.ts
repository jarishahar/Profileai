#!/usr/bin/env tsx

/**
 * Development Helper - Runs Next.js and MCP Server Together
 *
 * This script starts both the Next.js dev server and the MCP HTTP server
 * in parallel for local development and testing with AI SDK.
 */

import { spawn } from "child_process";

console.log(
  "\n╔════════════════════════════════════════════════════════════════╗",
);
console.log(
  "║         Fuzion AI - Development Mode with MCP Server           ║",
);
console.log(
  "╚════════════════════════════════════════════════════════════════╝\n",
);

// Start Next.js dev server
console.log("🚀 Starting Next.js development server...\n");
const nextDev = spawn("pnpm", ["dev"], {
  stdio: "inherit",
  shell: true,
});

// Start MCP HTTP server (not stdio - for AI SDK)
console.log("🔌 Starting MCP HTTP server for AI SDK...\n");
const mcpServer = spawn("pnpm", ["mcp:server:http"], {
  stdio: "inherit",
  shell: true,
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n\n⏹️  Shutting down servers...");
  nextDev.kill();
  mcpServer.kill();
  process.exit(0);
});

process.on("SIGTERM", () => {
  nextDev.kill();
  mcpServer.kill();
  process.exit(0);
});

nextDev.on("exit", (code) => {
  console.log(`\n❌ Next.js server exited with code ${code}`);
  mcpServer.kill();
  process.exit(code || 0);
});

mcpServer.on("exit", (code) => {
  console.log(`\n❌ MCP HTTP server exited with code ${code}`);
  nextDev.kill();
  process.exit(code || 0);
});

console.log("\n✅ Both servers are running!");
console.log("\n📌 Frontend: http://localhost:3000");
console.log("🔌 MCP HTTP Server: http://localhost:3001");
console.log("🤖 AI Chat: Uses AI SDK to call MCP tools");
console.log("\n💡 Press Ctrl+C to stop both servers\n");
