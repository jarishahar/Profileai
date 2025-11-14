#!/usr/bin/env tsx

/**
 * MCP Server Configuration Helper
 *
 * Generates the Claude Desktop configuration for the Fuzion AI MCP server.
 * Run this script and copy the output to your Claude Desktop config file.
 */

import path from "path";
import os from "os";
import fs from "fs";

const projectPath = path.resolve(process.cwd());
const isMac = os.platform() === "darwin";
const isWindows = os.platform() === "win32";

console.log(
  "╔════════════════════════════════════════════════════════════════╗",
);
console.log(
  "║   Fuzion AI Knowledge Base MCP Server Configuration Helper    ║",
);
console.log(
  "╚════════════════════════════════════════════════════════════════╝\n",
);

console.log("📍 Project Path:", projectPath);
console.log("💻 Platform:", os.platform(), "\n");

// Read environment variables
const envLocalPath = path.join(projectPath, ".env.local");
const envPath = path.join(projectPath, ".env");
let postgresUrl = process.env.POSTGRES_URL || "";
let openaiKey = process.env.OPENAI_API_KEY || "";

// Try .env.local first, then .env
const envFile = fs.existsSync(envLocalPath)
  ? envLocalPath
  : fs.existsSync(envPath)
    ? envPath
    : null;

if (envFile) {
  console.log(`✅ Found ${path.basename(envFile)} file\n`);
  const envContent = fs.readFileSync(envFile, "utf-8");
  const postgresMatch = envContent.match(/POSTGRES_URL=(.+)/);
  const openaiMatch = envContent.match(/OPENAI_API_KEY=(.+)/);

  if (postgresMatch) postgresUrl = postgresMatch[1].trim().replace(/["']/g, "");
  if (openaiMatch) openaiKey = openaiMatch[1].trim().replace(/["']/g, "");
} else {
  console.log("⚠️  No .env or .env.local file found\n");
}

// Determine config file location
let configPath = "";
if (isMac) {
  configPath = path.join(
    os.homedir(),
    "Library/Application Support/Claude/claude_desktop_config.json",
  );
} else if (isWindows) {
  configPath = path.join(
    process.env.APPDATA || "",
    "Claude/claude_desktop_config.json",
  );
} else {
  console.log(
    "⚠️  Platform not fully supported. Manual configuration required.\n",
  );
}

if (configPath) {
  console.log("📝 Claude Desktop Config Location:");
  console.log("  ", configPath, "\n");
}

// Generate configuration
const config = {
  mcpServers: {
    "fuzion-ai-knowledge": {
      command: "pnpm",
      args: ["--prefix", projectPath, "mcp:server"],
      env: {
        POSTGRES_URL:
          postgresUrl || "postgresql://user:pass@localhost:5432/fuzionai",
        OPENAI_API_KEY: openaiKey || "sk-your-api-key-here",
      },
    },
  },
};

console.log(
  "═══════════════════════════════════════════════════════════════════",
);
console.log("📋 Copy this configuration to your Claude Desktop config file:");
console.log(
  "═══════════════════════════════════════════════════════════════════\n",
);

console.log(JSON.stringify(config, null, 2));

console.log(
  "\n═══════════════════════════════════════════════════════════════════",
);
console.log("� Scoped Access Configuration:");
console.log(
  "═══════════════════════════════════════════════════════════════════\n",
);

console.log("To limit MCP access to specific project/knowledge base:");
console.log("1. Edit mcp-config.json in your project root");
console.log("2. Set 'project_id' to limit to one project");
console.log("3. Set 'knowledge_base_id' to limit to one knowledge base");
console.log("4. Leave empty for full access to all projects/KBs\n");

console.log("Example (limit to one KB):");
console.log("{");
console.log('  "project_id": "",');
console.log('  "knowledge_base_id": "9GjoUakyiodNvA7TnEsUV"');
console.log("}\n");

console.log(
  "\n═══════════════════════════════════════════════════════════════════",
);
console.log("�📚 Next Steps:");
console.log(
  "═══════════════════════════════════════════════════════════════════\n",
);

console.log("1. Open your Claude Desktop config file:");
if (isMac) {
  console.log(
    "   $ open ~/Library/Application\\ Support/Claude/claude_desktop_config.json",
  );
} else if (isWindows) {
  console.log("   > notepad %APPDATA%\\Claude\\claude_desktop_config.json");
}

console.log(
  "\n2. Paste the configuration above (merge with existing config if needed)",
);
console.log("\n3. Restart Claude Desktop completely");
console.log("\n4. Start a new chat and look for the 🔌 or 🔨 icon");
console.log("\n5. Try asking Claude:");
console.log('   "What knowledge bases are available in my projects?"');

console.log(
  "\n═══════════════════════════════════════════════════════════════════",
);
console.log("🔍 Verify Installation:");
console.log(
  "═══════════════════════════════════════════════════════════════════\n",
);

console.log("Test the MCP server locally:");
console.log("  $ pnpm mcp:server\n");

console.log("Check Claude logs (if issues):");
if (isMac) {
  console.log("  $ tail -f ~/Library/Logs/Claude/mcp*.log");
} else if (isWindows) {
  console.log("  > type %LOCALAPPDATA%\\Claude\\Logs\\mcp*.log");
}

console.log(
  "\n═══════════════════════════════════════════════════════════════════",
);
console.log("📖 Documentation:");
console.log(
  "═══════════════════════════════════════════════════════════════════\n",
);

console.log("Full guide: docs/MCP_SERVER.md");
console.log("MCP Protocol: https://modelcontextprotocol.io/\n");

// Check for missing environment variables
const warnings: string[] = [];
if (
  !postgresUrl ||
  postgresUrl === "postgresql://user:pass@localhost:5432/fuzionai"
) {
  warnings.push("⚠️  POSTGRES_URL not found or using placeholder");
}
if (!openaiKey || openaiKey === "sk-your-api-key-here") {
  warnings.push("⚠️  OPENAI_API_KEY not found or using placeholder");
}

if (warnings.length > 0) {
  console.log(
    "═══════════════════════════════════════════════════════════════════",
  );
  console.log("⚠️  Warnings:");
  console.log(
    "═══════════════════════════════════════════════════════════════════\n",
  );
  warnings.forEach((w) => console.log(w));
  console.log("\nMake sure to update the environment variables in the config!");
  console.log(
    "Or add them to your .env.local file and run this script again.\n",
  );
}
