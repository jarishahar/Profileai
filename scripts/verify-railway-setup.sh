#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Fuzion AI - Railway Deployment Setup Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

# Check if files exist
echo -e "${YELLOW}Checking deployment files...${NC}"

files=(
    "Dockerfile"
    "railway.json"
    ".dockerignore"
    ".env.mcp.example"
    "docs/DEPLOYMENT_RAILWAY.md"
    "MCP_RAILWAY_README.md"
)

all_files_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (missing)"
        all_files_exist=false
    fi
done

echo ""

# Check package.json scripts
echo -e "${YELLOW}Checking npm scripts...${NC}"

scripts=(
    "dev"
    "mcp:dev"
    "mcp:server:http"
    "railway:login"
    "railway:deploy"
)

for script in "${scripts[@]}"; do
    if grep -q "\"$script\"" package.json; then
        echo -e "${GREEN}✓${NC} $script"
    else
        echo -e "${RED}✗${NC} $script (missing)"
    fi
done

echo ""

# Check dependencies
echo -e "${YELLOW}Checking key dependencies...${NC}"

deps=(
    "express"
    "@modelcontextprotocol/sdk"
    "drizzle-orm"
)

for dep in "${deps[@]}"; do
    if grep -q "\"$dep\"" package.json; then
        echo -e "${GREEN}✓${NC} $dep"
    else
        echo -e "${YELLOW}⚠${NC} $dep (optional)"
    fi
done

echo ""

# Check existing vercel config is intact
echo -e "${YELLOW}Verifying Vercel config is untouched...${NC}"

if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✓${NC} vercel.json exists"
    if grep -q "buildCommand" vercel.json; then
        echo -e "${GREEN}✓${NC} Vercel build command intact"
    fi
else
    echo -e "${YELLOW}⚠${NC} No vercel.json (optional)"
fi

echo ""

# Check src directory structure
echo -e "${YELLOW}Checking source code structure...${NC}"

dirs=(
    "src/app"
    "src/mcp"
    "src/lib"
    "src/types"
)

for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $dir"
    else
        echo -e "${RED}✗${NC} $dir (missing)"
    fi
done

echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

if [ "$all_files_exist" = true ]; then
    echo -e "${GREEN}✓ All deployment files are in place!${NC}\n"
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Review: docs/DEPLOYMENT_RAILWAY.md"
    echo "  2. Test locally: pnpm mcp:dev"
    echo "  3. Login to Railway: railway login"
    echo "  4. Deploy: railway up"
    echo "  5. Set env vars: railway variables set POSTGRES_URL ..."
else
    echo -e "${RED}✗ Some files are missing!${NC}"
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
