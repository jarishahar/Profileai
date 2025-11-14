# Smart Agents - Implementation Kickoff Document

## Overview

This document confirms the finalized requirements and provides immediate next steps for Phase 1 implementation.

---

## ✅ Requirements Confirmed

### 1. Architecture Model: **Chatbot-First**

- **MVP Phase**: User interacts with agents via chat interface
- **Future Phases**: Scheduled/event-driven execution added later
- **Key Point**: Agent is configured with tools, knowledge, escalations → User chats → AI-SDK handles orchestration

### 2. Tool System: **Definition-Only at Project Level**

```
Tool Creation:
  Define Schema (AI-SDK format)
    ↓
  Test Tool (isolated execution - testing only)
    ↓
  Register Tool (save definition)
    ↓
Available for agent assignment

Agent Runtime:
  User sends message
    ↓
  AI-SDK LLM decides tools to use
    ↓
  Tools called via MCP wrapper
    ↓
  Results returned to LLM
    ↓
  Response to user
```

### 3. Knowledge Bases: **Project-Level Asset**

- Already implemented ✅
- Agents reference (not copy) KBs
- Multiple KBs per agent allowed
- Access via MCP at runtime
- Users update manually → All agents see latest

### 4. Escalation System: **Independent Agents**

- Each agent has own escalation rules
- Escalations triggered on:
  - Tool failures
  - Confidence/deviation detection
  - Manual trigger
  - Rule conditions
- Targets specific users/teams

### 5. AI-SDK Integration: **CRITICAL**

- Tools must conform to AI-SDK tool definitions
- AI-SDK handles tool calling
- LLM decides which tools to use
- **Question to clarify: OpenAI or Anthropic Claude?**

---

## 🏗️ Database Schema - Final

### Core Tables

1. **smart_agent** - Agent definition and config
2. **tool** - Tool registry with AI-SDK schemas
3. **tool_execution_log** - Test executions + agent runtime calls
4. **agent_tool_assignment** - Links agents to tools
5. **agent_knowledge_assignment** - Links agents to KBs
6. **escalation_rule** - Escalation conditions and actions
7. **escalation_template** - Notification templates
8. **escalation_event** - Escalation history
9. **agent_execution_history** - Conversation history (multi-turn)

All tables fully detailed in `AGENTS_REQUIREMENTS_DETAILED.md`

---

## 📋 Phase 1: Foundation (Weeks 1-2)

### Goal

Establish tool registry system with AI-SDK compatibility and isolated testing.

### Tasks

#### Task 1.1: Database Migrations

- **Status**: Not started
- **Deliverable**: Migration files for all 9 new tables
- **Commands**:

  ```bash
  # Modify schema first
  src/lib/db/pg/schema.pg.ts (add tables)

  # Then generate and migrate
  pnpm drizzle-kit generate
  pnpm drizzle-kit migrate
  ```

#### Task 1.2: Tool Repository Layer

- **Status**: Not started
- **File**: `src/lib/db/pg/repositories/tool-repository.ts`
- **Methods**:
  - `createTool(input)` → Tool
  - `getTool(id)` → Tool
  - `listTools(projectId)` → Tool[]
  - `updateTool(id, input)` → Tool
  - `deleteTool(id)` → boolean
  - `getToolByVersion(id, version)` → Tool

#### Task 1.3: Tool Executor (Testing Only)

- **Status**: Not started
- **File**: `src/lib/tools/tool-executor.ts`
- **Responsibility**:
  - Execute tool test runs
  - Validate input against schema
  - Handle API calls, JavaScript execution, MCP calls
  - Log execution results
  - NOT for agent runtime (AI-SDK does that)

#### Task 1.4: AI-SDK Schema Validator

- **Status**: Not started
- **File**: `src/lib/tools/ai-sdk-formatter.ts`
- **Responsibility**:

  - Convert tool definition to AI-SDK compatible format
  - Validate against AI-SDK schema
  - Generate tool function definition
  - Example:

    ```typescript
    // Tool DB format
    {
      name: 'fetch_customer_data'
      input_schema: { type: 'object', properties: {...} }
      output_schema: { type: 'object', properties: {...} }
    }

    // Convert to AI-SDK format
    {
      name: 'fetch_customer_data'
      description: 'Fetches customer data...'
      inputSchema: { type: 'object', properties: {...} }
    }
    ```

#### Task 1.5: Tool Testing API Endpoint

- **Status**: Not started
- **File**: `src/app/api/projects/[projectId]/tools/test/route.ts`
- **Endpoint**: `POST /api/projects/:projectId/tools/test`
- **Input**:
  ```json
  {
    "toolId": "uuid",
    "inputParams": {
      /* test data */
    }
  }
  ```
- **Output**:
  ```json
  {
    "executionId": "uuid",
    "status": "success|failure|timeout",
    "result": {
      /* tool response */
    },
    "executionTimeMs": 1234,
    "error": "error message if failed"
  }
  ```

#### Task 1.6: Tool UI Components

- **Status**: Not started
- **Files**:
  - `src/components/tools/tool-form.tsx` - Create/edit tool
  - `src/components/tools/schema-builder.tsx` - AI-SDK schema builder
  - `src/components/tools/tool-tester.tsx` - Test interface
  - `src/components/tools/tool-card.tsx` - List display

#### Task 1.7: Tool Pages

- **Status**: Not started
- **Pages**:
  - `src/app/[projectId]/tools/page.tsx` - List tools
  - `src/app/[projectId]/tools/create/page.tsx` - Create tool
  - `src/app/[projectId]/tools/[toolId]/page.tsx` - Tool details
  - `src/app/[projectId]/tools/[toolId]/edit/page.tsx` - Edit tool
  - `src/app/[projectId]/tools/[toolId]/test/page.tsx` - Test interface

---

## 📊 Phase 1 Deliverables Checklist

```
Database:
  ☐ Schema file updated
  ☐ Migrations generated
  ☐ Migrations applied

Backend:
  ☐ Tool repository layer
  ☐ Tool executor (test only)
  ☐ AI-SDK schema formatter
  ☐ Testing API endpoint
  ☐ Type definitions

Frontend:
  ☐ Tool form component
  ☐ Schema builder component
  ☐ Tool tester component
  ☐ Tool pages
  ☐ Tool service/hooks

Testing:
  ☐ Tool CRUD operations
  ☐ Tool testing works
  ☐ Schema validation works
  ☐ No side effects from test execution
```

---

## ⚠️ Critical Implementation Notes

### 1. Tool Execution Isolation

**IMPORTANT**: Test execution must NOT have side effects

- For API tools: Dry-run if possible, else use test endpoints
- For JS tools: Run in sandbox with no external calls
- For Database tools: Use read-only queries only
- For MCP tools: Use isolated test context

### 2. Schema Validation

**CRITICAL**: Ensure AI-SDK compatibility

- Validate `input_schema` against JSON Schema
- Validate `properties` are properly defined
- Check `required` fields exist in properties
- Ensure `description` fields for all properties (LLM-friendly)

### 3. Tool Categories

Use these enums for tool_category:

```typescript
"data-source-api" |
  "data-source-database" |
  "processor-transform" |
  "processor-calculate" |
  "visualization-chart" |
  "visualization-table" |
  "visualization-map" |
  "visualization-custom" |
  "action-notification" |
  "action-webhook" |
  "action-database-write" |
  "integration-mcp" |
  "integration-javascript";
```

### 4. Encryption for Credentials

Use existing auth pattern:

- Store credentials encrypted in DB
- Use environment-based keys
- Never log credentials
- Implement credential rotation support

---

## 🔮 Questions Before Starting

### 1. AI-SDK Provider

**Current**: Unknown
**Impact**: Changes tool schema format and implementations
**Options**:

- Anthropic Claude (anthropic npm package)
- OpenAI (openai npm package)

**Action**: Confirm before Task 1.4

### 2. Tool Timeout Values

**Question**: How long to wait for tool test execution?
**Recommendation**:

- Default: 30 seconds
- Configurable per tool
- Hard limit: 60 seconds

### 3. Knowledge Base MCP Integration

**Current**: Already implemented
**Clarification**: What's the MCP tool definition for KB search?
**Need**: Copy the MCP schema for KB search to understand API format

### 4. Chat Interface

**Question**: Use existing chat component or create new?
**Location**: `src/components/knowledge/chat-interface.tsx` exists
**Decision**: Extend vs. replace?

---

## 🚀 Getting Started

### Immediate Actions (Today)

1. ✅ Review this document
2. ⏳ Answer the 4 clarification questions above
3. ⏳ Review `AGENTS_REQUIREMENTS_DETAILED.md` for additional context
4. ⏳ Confirm AI-SDK provider choice
5. ⏳ Assign team members to tasks

### Immediate Blockers

- Confirm AI-SDK provider (blocks Task 1.4)
- Get MCP KB search schema (for Phase 3)

### Day 1-2: Setup

- Create feature branch: `feature/agents-phase1`
- Update database schema file
- Generate migrations
- Apply migrations

### Day 2-5: Implementation

- Implement tool repository
- Implement tool executor
- Implement API endpoints
- Create UI components

---

## 📚 Documentation Files

1. **`AGENTS_ARCHITECTURE.md`** - Main architecture document (updated)
2. **`AGENTS_REQUIREMENTS_DETAILED.md`** - Detailed requirements with recommendations
3. **`AGENTS_IMPLEMENTATION_KICKOFF.md`** - This file

---

## 📞 Next Steps

### By EOD Today:

- [ ] Confirm AI-SDK provider
- [ ] Answer 4 clarification questions
- [ ] Assign Phase 1 team members

### By EOD Tomorrow:

- [ ] Create feature branch
- [ ] Design database migrations
- [ ] Schedule architecture review meeting

### By End of Week 1:

- [ ] Database migrations applied
- [ ] Tool repository layer complete
- [ ] Tool API endpoint working

---

## ✨ Success Criteria for Phase 1

**Definition**: Phase 1 is complete when:

- ✅ A tool can be created with AI-SDK compatible schema
- ✅ Tool schema passes validation
- ✅ Tool can be tested with sample data
- ✅ Test execution has no side effects
- ✅ Tool versions are tracked
- ✅ All data persists correctly
- ✅ Tool can be archived/deleted safely
- ✅ Tool usage metrics tracked

---

## 🎯 High-Level Flow After Phase 1

```
1. Admin creates Tool (Phase 1)
   name, schema, type, auth
   ↓
2. Admin tests Tool (Phase 1)
   execute with test data, verify output
   ↓
3. Admin creates Smart Agent (Phase 2)
   name, goal, metrics
   ↓
4. Admin assigns Tools to Agent (Phase 2)
   select tools from registry
   ↓
5. Admin assigns Knowledge Bases (Phase 2)
   select KBs from project
   ↓
6. Admin configures Escalations (Phase 4)
   define rules and targets
   ↓
7. User chats with Agent (Phase 3)
   AI-SDK orchestrates tools, KB, escalations
   ↓
8. Agent Response generated (Phase 3)
   LLM synthesizes tool results + KB + context
   ↓
9. If escalation needed (Phase 4)
   Rule triggers, notification sent
   ↓
10. Conversation logged (Phase 3)
    Tools, KB, escalations all tracked
```

---

Ready to begin Phase 1? 🚀
