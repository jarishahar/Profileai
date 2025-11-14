# Smart Agents - Detailed Requirements & Strategic Plan

## 1. Execution Model - CHATBOT FIRST

### Current (MVP Phase)

- **Execution Trigger**: Chatbot-based interaction
- **User Flow**: User initiates agent through chat interface
- **Context**: Agent receives user query and conversation context
- **Tool Execution**: Happens in agent runtime (AI-SDK configured flow)

### Roadmap (Future Phases)

- **Phase 2**: Continuous polling/scheduled intervals
- **Phase 3**: Event-driven/webhook triggers
- **Hybrid**: Combination of all three

### Key Implication

- AI-SDK integration is PRIMARY architecture decision
- Tools must be compatible with AI-SDK tool definitions
- Agent state management needs conversation context

---

## 2. Tool System - Design vs Runtime Execution

### Design Principle

```
Tool Creation Flow:
┌─────────────────────────────────────────────┐
│ 1. Define Tool (UI)                         │
│    - Schema (Input/Output)                  │
│    - Endpoints                              │
│    - Auth config                            │
├─────────────────────────────────────────────┤
│ 2. Test Tool (UI - Execution)               │
│    - Test with sample data                  │
│    - Verify response format                 │
│    - Debug issues                           │
├─────────────────────────────────────────────┤
│ 3. Register Tool (Save)                     │
│    - Tool is ready for agent use            │
└─────────────────────────────────────────────┘

Agent Runtime Flow:
┌─────────────────────────────────────────────┐
│ 1. User Query                               │
│ 2. AI-SDK LLM Layer                         │
│    - Determines which tools to use          │
│    - Calls tool with parameters             │
│ 3. Tool Handler (MCP/API/JS)               │
│    - Executes on backend                    │
│    - Returns results to LLM                 │
│ 4. LLM Processing & Response                │
│    - Format response for user               │
└─────────────────────────────────────────────┘
```

### Critical Architecture Decision

**Tools are NOT executed in the project management UI - only tested.**

This means:

- Tool definitions are light-weight configurations
- Actual execution happens at agent runtime via MCP
- Testing UI calls backend execution endpoint (isolated)
- No persistent tool execution logs in project UI (optional)

---

## 3. Knowledge Base - PROJECT LEVEL ASSET

### Knowledge Base Hierarchy

```
Project Level
├── Knowledge Base 1 (Shared)
│   ├── Documents
│   ├── Embeddings
│   └── Vector Search Index
├── Knowledge Base 2 (Shared)
└── Knowledge Base N (Shared)

Smart Agent Level (References only)
├── Agent 1
│   ├── Access to KB 1 (via MCP)
│   ├── Access to KB 2 (via MCP)
│   └── Search Priority: KB1 > KB2
├── Agent 2
│   └── Access to KB 1 (via MCP)
└── Agent N
    └── Access to KB 1, KB 2, KB 3
```

### Agent Knowledge Access Pattern

```typescript
// At runtime (AI-SDK with MCP)
interface AgentKnowledgeContext {
  knowledgeBases: Array<{
    id: string
    name: string
    priority: number
    accessLevel: 'read' | 'search'
  }>

  // MCP function for agent
  async searchKnowledge(query: string): Promise<SearchResults[]>
    // Searches in priority order
    // Returns aggregated results
}
```

### Key Point

Users update knowledge manually at project level → All agents see latest version immediately through MCP

---

## 4. Escalation Urgency - INDEPENDENT AGENTS

### Clarification Confirmed

- Each agent operates independently
- No agent-to-agent dependencies initially
- Escalations are isolated per agent
- Future: Agent workflows, agent-as-tool (roadmap item)

### Implication for Escalation System

```typescript
interface EscalationRule {
  agentId: UUID; // Specific to one agent

  // Escalation triggered when:
  // - Agent execution fails
  // - Agent detects anomaly/deviation
  // - User triggers manual escalation
  // - Conditions in rule match

  actions: Array<{
    type: "notify" | "assign" | "pause_agent" | "webhook";
    target: UUID; // Specific user/team
  }>;
}
```

---

## 5. Strategic Recommendations & Suggestions

### Recommendation 1: Tool Design for AI-SDK Compatibility

**Current State**: Define tools with structured schemas

**Enhancement**: Build tools specifically for Anthropic/OpenAI AI-SDK format

```typescript
// Tool Definition (AI-SDK Compatible)
interface SmartAgentTool {
  id: string;
  name: string;
  description: string;

  // AI-SDK format
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };

  // Execution endpoint
  handler: {
    type: "api" | "mcp" | "webhook";
    config: ToolConfig;
  };

  // Display format (for UI results)
  responseFormat?: {
    type: "json" | "markdown" | "html";
    template?: string;
  };
}
```

**Action**: Pre-validate tool schemas against AI-SDK format during creation

---

### Recommendation 2: Implement MCP Tool Wrapping Layer

**Pattern**: All tools (API, custom, etc.) wrap through MCP

```
Tool Definition (DB)
    ↓
Tool Handler (Routes to API/JS/etc)
    ↓
MCP Wrapper
    ↓
Agent Runtime (AI-SDK)
    ↓
LLM Function Calling
```

**Benefit**: Unified interface for all tools regardless of backend

---

### Recommendation 3: Agent Execution Context Stack

**For chatbot-first approach**, maintain execution context:

```typescript
interface ChatbotAgentContext {
  conversationId: string;
  messageHistory: Array<{
    role: "user" | "assistant" | "tool";
    content: string;
    toolCalls?: ToolCall[];
  }>;

  agentState: {
    knowledgeBases: KBAccess[];
    tools: ToolAccess[];
    escalationRules: Rule[];
    goal: string;
    metrics: KPI[];
  };

  // For multi-turn conversations
  executionMemory: Map<string, any>;
}
```

**Benefit**: Enables coherent multi-turn conversations with tools & knowledge

---

### Recommendation 4: Tool Categories - Refined List

Based on your use case:

```typescript
enum ToolCategory {
  // Data Fetching
  "data-source-api" = "Fetch from external APIs",
  "data-source-database" = "Query project databases",

  // Data Processing
  "processor-transform" = "Transform/aggregate data",
  "processor-calculate" = "Perform calculations",

  // Data Visualization
  "visualization-chart" = "Charts, graphs",
  "visualization-table" = "Data tables",
  "visualization-map" = "Geographic data",
  "visualization-custom" = "Custom HTML/React component",

  // Actions
  "action-notification" = "Send notifications",
  "action-webhook" = "Call external webhooks",
  "action-database-write" = "Write to databases",

  // Integration
  "integration-mcp" = "MCP Server tool",
  "integration-javascript" = "Custom JavaScript",
}
```

---

### Recommendation 5: Tool Testing Interface

**Testing should include:**

1. **Schema Validation**

   - Validate input parameters
   - Check against AI-SDK format

2. **Dry Run**

   - Execute with sample data
   - No side effects (read-only or sandboxed)

3. **Response Format Validation**

   - Verify output matches schema
   - Check data types

4. **Performance Test**

   - Measure execution time
   - Test rate limiting
   - Timeout handling

5. **Error Scenarios**
   - Test with invalid inputs
   - Network timeout simulation
   - Auth failure handling

---

### Recommendation 6: Smart Agent Naming - Roles

Suggest adding optional `role` field for agents:

```typescript
interface SmartAgent {
  id: UUID;
  name: string;
  description: string;

  // New: Agent Role/Type
  agentType?: "customer-service" | "sales" | "analyst" | "support" | "custom";

  // Goal & Performance
  goal: string;
  kpis: KPI[];

  // Capabilities
  assignedTools: Tool[];
  assignedKnowledgeBases: KnowledgeBase[];
  escalationRules: EscalationRule[];
}
```

**Benefit**:

- Helps categorize agents
- Enables agent templates
- Better UI organization (filter by role)
- Future: Role-based tool recommendations

---

### Recommendation 7: Conversation Memory Strategy

**For multi-turn chatbot flows:**

```typescript
interface ConversationMemory {
  // Short-term (current conversation)
  recentToolResults: Map<string, ToolResult>;

  // Medium-term (session)
  sessionKnowledgeHits: KnowledgeSearchResult[];

  // Long-term (agent level)
  agentExecutionPattern: {
    frequentTools: ToolId[];
    commonKnowledgeSources: KBID[];
    escalationTriggers: Rule[];
  };
}

// Use case: If user asks follow-up question, agent already knows
// which tools were useful, which KB sections were relevant
```

---

### Recommendation 8: Implement Tool Chain/Workflow

**Future roadmap item** (Phase 4):

```typescript
// Agent can define tool execution sequences
interface ToolWorkflow {
  steps: Array<{
    toolId: string;
    inputMapping: {
      paramName: string;
      source: "user_input" | "previous_step" | "knowledge_base";
      sourceId?: string;
    };
    condition?: string; // e.g., "$.price > 1000"
  }>;
}

// Example:
// 1. Fetch customer data (from DB)
// 2. If VIP, search customer-specific KB
// 3. Fetch latest pricing (from API)
// 4. Generate recommendation
```

---

### Recommendation 9: Escalation - Smart Triggering

**Don't just escalate on failure, escalate on:**

```typescript
enum EscalationTrigger {
  // Technical
  "tool-timeout" = "Tool execution timeout",
  "tool-failure" = "Tool execution failure",
  "knowledge-not-found" = "No relevant knowledge found",

  // Business
  "high-value-transaction" = "Transaction exceeds threshold",
  "customer-sentiment-negative" = "Negative sentiment detected",
  "confidence-low" = "AI response confidence below threshold",

  // Rule-based
  "custom-condition" = "Custom rule condition matched",
  "manual-trigger" = "User manually triggered",
}
```

---

### Recommendation 10: Performance Metrics for Agents

**Track these KPIs:**

```typescript
interface AgentMetrics {
  // Usage
  totalChats: number;
  totalExecutions: number;

  // Quality
  userSatisfactionScore: number; // 1-5
  escalationRate: number; // %
  toolSuccessRate: number; // %

  // Performance
  avgResponseTime: number; // ms
  avgToolCalls: number;
  knowledgeHitRate: number; // % of queries with KB match

  // Reliability
  errorRate: number; // %
  timeoutRate: number; // %
}
```

---

## 6. Revised Architecture for Your Specific Needs

### New Database Considerations

#### Agent Execution History - Enhanced

```sql
CREATE TABLE agent_execution_history (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES smart_agent,
  conversation_id UUID, -- For chatbot sessions

  -- Execution flow
  user_input TEXT,
  agent_response TEXT,

  -- Tool usage
  tools_used: JSONB, -- [{toolId, status, duration, result}]

  -- Knowledge usage
  knowledge_sources: JSONB, -- [{kbId, query, results}]

  -- Escalation
  escalated: BOOLEAN,
  escalation_rule_id: UUID,
  escalation_target: UUID,

  -- Metrics
  response_time_ms: INTEGER,
  user_satisfied: BOOLEAN,
  feedback: TEXT,

  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
);
```

#### Tool Version History

```sql
CREATE TABLE tool_version (
  id UUID PRIMARY KEY,
  tool_id UUID REFERENCES tool,
  version: INTEGER,
  schema: JSONB,
  ai_sdk_format_valid: BOOLEAN,
  created_at: TIMESTAMP
);
```

---

## 7. Implementation Priority (Revised)

### Phase 1: Foundation (Weeks 1-2)

- **Database**: Add new tables (smart*agent, tool, escalation*\*)
- **Tool System**:
  - Tool CRUD with AI-SDK schema validation
  - Tool test execution endpoint
  - Tool handler base (API, MCP, JS support)
- **UI**: Basic tool creation/edit forms

### Phase 2: Agent Core (Weeks 3-4)

- **Smart Agent CRUD**
- **Tool Assignment** (agent → tools)
- **Knowledge Assignment** (agent → knowledge bases)
- **MCP Wrapper** for unified tool access

### Phase 3: Chatbot Integration (Weeks 5-6)

- **Chatbot UI** (use existing chat interface)
- **AI-SDK Integration**:
  - Agent context builder
  - Tool function definitions
  - Conversation memory management
- **Conversation History**

### Phase 4: Escalation System (Weeks 7-8)

- **Escalation Rules Engine**
- **Event Tracking**
- **Notifications**

### Phase 5: Analytics & Polish (Weeks 9+)

- **Agent Dashboards**
- **Performance Metrics**
- **Tool Usage Analytics**

---

## 8. File Structure - Aligned with Your Architecture

```
src/
├── app/
│   ├── chat/
│   │   └── [agentId]/
│   │       └── page.tsx (Chatbot interface)
│   │
│   └── [projectId]/
│       ├── agents/
│       │   ├── page.tsx
│       │   ├── create/page.tsx
│       │   └── [agentId]/
│       │       ├── page.tsx (Agent overview)
│       │       ├── settings/page.tsx
│       │       ├── tools/page.tsx (Assign tools)
│       │       ├── knowledge/page.tsx (Assign KB)
│       │       ├── escalations/page.tsx (Configure rules)
│       │       ├── executions/page.tsx (Chat history)
│       │       └── metrics/page.tsx (Analytics)
│       │
│       ├── tools/
│       │   ├── page.tsx (Tool registry)
│       │   ├── create/page.tsx
│       │   ├── [toolId]/
│       │   │   ├── page.tsx
│       │   │   ├── edit/page.tsx
│       │   │   ├── test/page.tsx (Test interface)
│       │   │   └── versions/page.tsx
│       │   └── api/
│       │       └── test/route.ts (Tool test execution)
│       │
│       └── escalations/
│           ├── rules/page.tsx
│           ├── templates/page.tsx
│           └── events/page.tsx
│
├── components/
│   ├── agents/
│   │   ├── agent-form.tsx
│   │   ├── tool-assignment-panel.tsx
│   │   ├── knowledge-assignment-panel.tsx
│   │   ├── escalation-config-panel.tsx
│   │   └── agent-metrics-dashboard.tsx
│   │
│   ├── tools/
│   │   ├── tool-form.tsx
│   │   ├── schema-builder.tsx
│   │   ├── ai-sdk-schema-validator.tsx
│   │   ├── tool-tester.tsx
│   │   └── tool-card.tsx
│   │
│   └── chat/
│       ├── agent-chatbot.tsx (Main chat UI)
│       ├── message-list.tsx
│       ├── tool-result-renderer.tsx
│       └── conversation-memory-display.tsx
│
├── lib/
│   ├── agents/
│   │   ├── agent-service.ts
│   │   ├── execution-context-builder.ts
│   │   ├── conversation-memory.ts
│   │   └── chat-handler.ts
│   │
│   ├── tools/
│   │   ├── tool-registry.ts
│   │   ├── tool-executor.ts
│   │   ├── tool-validator.ts
│   │   ├── ai-sdk-formatter.ts (Convert tool to AI-SDK format)
│   │   ├── handlers/
│   │   │   ├── api-handler.ts
│   │   │   ├── mcp-handler.ts
│   │   │   └── js-handler.ts
│   │   └── test-executor.ts (Testing only)
│   │
│   ├── escalations/
│   │   ├── rule-engine.ts
│   │   ├── event-tracker.ts
│   │   └── notification-service.ts
│   │
│   ├── ai-sdk/
│   │   ├── client.ts (AI-SDK client setup)
│   │   ├── tool-definitions.ts
│   │   └── agent-executor.ts
│   │
│   └── db/
│       └── pg/
│           ├── repositories/
│           │   ├── agent-repository.ts
│           │   ├── tool-repository.ts
│           │   └── escalation-repository.ts
│           └── schema.pg.ts (additions)
```

---

## 9. Questions Before We Start Phase 1

1. **AI-SDK Provider**: Using Anthropic Claude or OpenAI?

   - Affects tool function schema format
   - Different implementations for parallel tool calls

2. **Chatbot UI**: Use existing chat interface?

   - Any specific UI component library preference?
   - Real-time streaming responses needed?

3. **Tool Security**:

   - Should tools be sandboxed?
   - Any restrictions on JavaScript tools?

4. **Conversation Memory Retention**:

   - How long to keep chat history?
   - Should users start fresh each chat?

5. **Knowledge Base Access in Chat**:
   - Automatic KB search with every query?
   - Manual trigger only?
   - Both options available?

---

## 10. Success Criteria

✅ **Phase 1 Complete When:**

- Tools can be created with AI-SDK compatible schemas
- Tool testing works without side effects
- Schema validation works correctly
- Database migrations applied

✅ **Phase 2 Complete When:**

- Agents can be created and configured
- Tools can be assigned to agents
- Knowledge bases can be assigned to agents
- All data persists correctly

✅ **Phase 3 Complete When:**

- Chatbot can fetch agent config
- AI-SDK integration works
- Tools are callable via AI-SDK function calling
- Knowledge base is searchable from agent context
- Multi-turn conversations work

✅ **Phase 4 Complete When:**

- Escalation rules trigger correctly
- Notifications are sent
- Event history is tracked

---

## Summary

Your vision is **smart and pragmatic**:

- ✅ Start with chatbot (immediate value)
- ✅ Tools are definitions, not execution engines (clean separation)
- ✅ MCP layer provides unified access (elegant)
- ✅ Knowledge base is shared asset (efficient)
- ✅ Independent agents initially (simpler)

**Next Step**: Ready to start Phase 1 database schema design?
