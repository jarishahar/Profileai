# FuzionAI - Agents Architecture & Implementation Plan

## Executive Summary

This document outlines the comprehensive architecture for building an intelligent agent management system within FuzionAI. The system enables organizations to create, configure, and manage smart agents/employees that leverage AI capabilities, custom tools, knowledge bases, and escalation workflows to achieve business goals.

---

## 1. Core Concepts & Terminology

### 1.1 Naming Convention Recommendation

**Recommended: "Smart Agents"** (or "AI Agents" / "Workforce Agents")

- Professional and clear terminology
- Distinguishes from generic "automation"
- Implies intelligence and autonomy
- Commonly used in enterprise AI systems

**Alternative names:**

- AI Employees
- Autonomous Workers
- Intelligent Workflows
- Smart Bots
- AI Associates

### 1.2 Core Entities

#### Smart Agent

A configurable AI entity that operates within a project with:

- Defined goals and KPIs
- Assigned tools (APIs, data sources, visualizations)
- Access to knowledge bases
- Escalation paths and follow-up workflows
- Performance metrics and audit trails

#### Tool

Extends agent capabilities - can be:

1. **Data Sources**: APIs, databases, external services
2. **Processors**: Data transformation, analysis, aggregation
3. **Visualizations**: Charts, maps, tables, custom dashboards
4. **Actions**: External API calls, notifications, updates
5. **Integrations**: MCP (Model Context Protocol) servers, custom JavaScript

#### Knowledge Base

Pre-existing system (already implemented). Agents can access multiple knowledge bases for context and decision-making.

#### Escalation/Follow-up

Workflow mechanisms to:

- Route tasks to specific team members
- Alert CXOs about deviations/risks
- Trigger automated actions
- Create audit trails and accountability

---

## 2. System Architecture Overview

```
FuzionAI Project Level
├── Smart Agents (N)
│   ├── Agent Configuration
│   │   ├── Goal & KPIs
│   │   ├── Assigned Tools (N)
│   │   ├── Knowledge Bases (N)
│   │   └── Escalation Rules (N)
│   │
│   └── Agent Runtime
│       ├── Execution History
│       ├── Performance Metrics
│       └── Audit Trail
│
├── Tools Registry (N)
│   ├── Tool Definition
│   │ ├── API Endpoints
│   │ ├── Schemas & Parameters
│   │ ├── Authorization
│   │ └── Rate Limiting
│   │
│   └── Tool Execution Context
│       ├── Usage Logs
│       └── Performance Metrics
│
├── Escalation Workflows (N)
│   ├── Rules & Conditions
│   ├── Notification Templates
│   └── Action Executors
│
└── Knowledge Bases (existing)
```

---

## 3. Database Schema Design

### 3.1 New Tables Required

#### `smart_agent`

```typescript
{
  id: UUID (PK)
  project_id: UUID (FK) → project
  created_by: UUID (FK) → user

  // Identity & Configuration
  name: TEXT
  description: TEXT
  avatar_url: TEXT (optional)
  agent_type: ENUM ('customer-service', 'sales', 'analyst', 'support', 'custom') (optional)

  // Goal & Performance
  goal: TEXT (detailed goal statement)
  success_metrics: JSONB (KPIs, thresholds)

  // Capabilities
  status: ENUM ('active', 'inactive', 'archived')

  // System
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  archived_at: TIMESTAMP (soft delete)
}
```

#### `tool`

```typescript
{
  id: UUID (PK)
  project_id: UUID (FK) → project
  created_by: UUID (FK) → user

  // Identity
  name: TEXT (unique per project)
  description: TEXT
  category: ENUM ('data_source', 'processor', 'visualization', 'action', 'integration')

  // Definition (AI-SDK Compatible Format)
  tool_type: ENUM ('api', 'mcp', 'javascript', 'database', 'webhook')
  input_schema: JSONB (AI-SDK compatible inputSchema)
  output_schema: JSONB (expected output format)

  // Configuration
  config: JSONB (tool-specific configuration)
  response_format: JSONB (optional - display format: json, markdown, html)

  // Integration Details
  api_endpoint: TEXT (for API tools)
  auth_method: ENUM ('none', 'api_key', 'oauth2', 'basic')
  credentials_encrypted: BYTEA

  // Documentation
  documentation: TEXT
  example_usage: JSONB

  // Version & Status
  version: INTEGER (for versioning)
  status: ENUM ('draft', 'active', 'deprecated')
  ai_sdk_format_valid: BOOLEAN (schema passes AI-SDK validation)

  // System
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  archived_at: TIMESTAMP
}
```

#### `tool_execution_log`

```typescript
{
  id: UUID (PK)
  tool_id: UUID (FK) → tool
  agent_id: UUID (FK) → smart_agent (nullable - for tool testing)
  conversation_id: UUID (nullable - for agent chatbot flow)

  // Execution Details
  status: ENUM ('success', 'failure', 'timeout', 'error')
  input_params: JSONB
  output_result: JSONB
  error_message: TEXT
  execution_time_ms: INTEGER
  execution_context: JSONB (metadata about the execution)

  // System
  execution_type: ENUM ('test', 'agent_runtime', 'manual')
  created_at: TIMESTAMP
}
```

#### `agent_tool_assignment`

```typescript
{
  id: UUID (PK)
  agent_id: UUID (FK) → smart_agent
  tool_id: UUID (FK) → tool

  // Assignment Details
  access_level: ENUM ('read', 'write', 'execute')
  tool_config_override: JSONB (agent-specific config)
  rate_limit: INTEGER (calls per hour)

  // System
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

#### `agent_knowledge_assignment`

```typescript
{
  id: UUID (PK)
  agent_id: UUID (FK) → smart_agent
  knowledge_base_id: UUID (FK) → knowledge_base

  // Assignment Details
  access_level: ENUM ('read', 'search', 'full')
  priority: INTEGER (search priority order)

  // System
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

#### `escalation_rule`

```typescript
{
  id: UUID (PK)
  project_id: UUID (FK) → project
  agent_id: UUID (FK) → smart_agent (nullable - can apply to multiple agents)

  // Rule Definition
  name: TEXT
  description: TEXT
  rule_type: ENUM ('deviation', 'threshold', 'manual', 'scheduled')

  // Conditions
  trigger_condition: JSONB (complex condition logic)
  trigger_events: TEXT[] (array of event types)

  // Actions
  escalation_action: ENUM ('notify', 'assign', 'pause_agent', 'execute_workflow')
  escalation_target: UUID (FK) → user (CXO or team member)
  notification_template_id: UUID (FK) → escalation_template

  // Metadata
  priority: ENUM ('low', 'medium', 'high', 'critical')
  status: ENUM ('active', 'inactive')

  // System
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

#### `escalation_template`

```typescript
{
  id: UUID (PK)
  project_id: UUID (FK) → project

  // Template Definition
  name: TEXT
  description: TEXT

  // Content
  subject: TEXT (for email/notifications)
  body: TEXT (supports liquid template syntax)
  message_type: ENUM ('email', 'webhook', 'in_app', 'sms')

  // Metadata
  variables: JSONB (available template variables)

  // System
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

#### `escalation_event`

```typescript
{
  id: UUID (PK)
  escalation_rule_id: UUID (FK) → escalation_rule
  agent_id: UUID (FK) → smart_agent

  // Event Data
  event_type: TEXT
  trigger_data: JSONB (context that triggered escalation)

  // Resolution
  status: ENUM ('pending', 'acknowledged', 'resolved', 'ignored')
  assigned_to: UUID (FK) → user
  notes: TEXT
  resolved_at: TIMESTAMP

  // System
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

#### `agent_execution_history`

```typescript
{
  id: UUID (PK)
  agent_id: UUID (FK) → smart_agent
  conversation_id: UUID (unique per chat session)

  // Message/Interaction Details
  message_index: INTEGER (order in conversation)
  user_input: TEXT
  agent_response: TEXT

  // Tool Usage
  tools_used: JSONB [{
    tool_id: UUID
    tool_name: TEXT
    status: 'pending' | 'executing' | 'success' | 'failure'
    input_params: JSONB
    output_result: JSONB
    execution_time_ms: INTEGER
  }]

  // Knowledge Usage
  knowledge_sources: JSONB [{
    knowledge_base_id: UUID
    query: TEXT
    results_count: INTEGER
    used_in_response: BOOLEAN
  }]

  // Escalation
  escalated: BOOLEAN
  escalation_rule_id: UUID (FK) → escalation_rule (nullable)
  escalation_target: UUID (FK) → user (nullable)
  escalation_reason: TEXT

  // Metrics & Feedback
  response_time_ms: INTEGER
  user_satisfaction: INTEGER (1-5, nullable - feedback)
  feedback_text: TEXT (nullable)

  // System
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

---

## 4. Feature Breakdown: Project-Level Configuration

### 4.1 Knowledge Bases (Project Level - EXISTING)

**Status**: Already implemented with:

- Document upload and processing
- Vector embeddings
- Tag-based filtering
- Full-text search

**Agents Integration**:

- Agents reference knowledge bases (not copy)
- Multiple knowledge bases per agent
- Access control per agent
- Search via MCP interface
- Real-time access to latest knowledge

### 4.2 Tools Management (Project Level)

**Scope**:

- Register and maintain a tool registry for the project
- Define tool schemas in AI-SDK compatible format
- Tool testing (NOT production execution)
- Version control for tools
- Usage monitoring and analytics

**Pages/Routes:**

```
/[projectId]/tools
├── /list (Tool Registry)
├── /[toolId] (Tool Details)
├── /create (Create Tool)
├── /[toolId]/edit (Edit Tool)
├── /[toolId]/test (Test Tool Execution - ISOLATED)
└── /[toolId]/executions (Test Execution Logs)
```

**Key Features**:

- Tool CRUD operations (definition only)
- AI-SDK schema builder and validator
- Tool tester (dry-run, no side effects)
- Authentication setup (API key, OAuth2)
- Documentation/examples
- Versioning
- Tool usage analytics (from agent executions)

### 4.3 Escalation Workflows (Project Level)

**Scope:**

- Define escalation rules
- Create notification templates
- Set up routing logic
- Configure CXO alerts and team assignments

**Pages/Routes:**

```
/[projectId]/escalations
├── /rules (Escalation Rules)
├── /rules/create (Create Rule)
├── /rules/[ruleId]/edit (Edit Rule)
├── /templates (Notification Templates)
├── /templates/create (Create Template)
├── /events (Escalation Events History)
└── /events/[eventId] (Event Details)
```

**Key Features:**

- Rule builder with condition logic
- Template creation with variable substitution
- Team and user assignment
- Notification channels (email, webhook, in-app)
- Rule testing and preview
- Event history and analytics

---

## 5. Feature Breakdown: Agent-Level Configuration

### 5.1 Smart Agent Creation & Setup

**Pages/Routes:**

```
/[projectId]/agents
├── /list (Agent Directory)
├── /[agentId] (Agent Overview/Dashboard)
├── /create (Create New Agent)
├── /[agentId]/settings (Agent Settings)
├── /[agentId]/tools (Assign Project Tools)
├── /[agentId]/knowledge (Assign Project Knowledge Bases)
├── /[agentId]/escalations (Configure Escalations)
├── /[agentId]/chat (Chatbot Interface)
├── /[agentId]/executions (Conversation History)
└── /[agentId]/metrics (Performance Analytics)
```

### 5.2 Agent Configuration Components

#### 5.2.1 Basic Agent Setup

- Name, description, avatar
- Agent type/role (customer-service, sales, analyst, support, custom)
- Goal statement
- Success metrics/KPIs
- Status (active/inactive)

#### 5.2.2 Tool Assignment Interface

- Browse and select from project's available tools
- Assign tools to agent
- Set access levels (read/write/execute)
- Configure tool-specific overrides
- Set rate limits per tool
- _Tool execution NOT here - happens in chatbot_

#### 5.2.3 Knowledge Base Assignment

- Select from project's knowledge bases
- Set access levels (read/search/full)
- Define search priority (order)
- Knowledge accessed via MCP at runtime

#### 5.2.4 Escalation Configuration

- Attach escalation rules to agent
- Configure rule conditions (deviation detection)
- Set escalation targets (team/CXO)
- Preview notifications
- Test escalation triggers

### 5.3 Agent Chatbot Interface

**Pages/Routes:**

```
/chat/[agentId]
├── Messages display
├── Input interface
├── Tool execution display
├── Knowledge citations
└── Escalation indicators
```

**Flow**:

1. User sends message
2. Agent fetches context (tools, knowledge bases, escalation rules)
3. AI-SDK LLM determines tool calls
4. Tools executed via MCP
5. Response generated and displayed
6. Multi-turn conversation maintained

### 5.4 Agent Execution & Monitoring

**Pages/Routes:**

```
/[projectId]/agents/[agentId]/
├── executions (Conversation History)
├── metrics (Performance Dashboard)
└── audit (Audit Trail)
```

**Key Features**:

- Conversation history (multi-turn)
- Tool call traces and performance
- Knowledge base search results
- Error tracking and debugging
- Escalation events
- User feedback/satisfaction
- Performance metrics (success rate, response time, etc.)
- Audit trail for compliance

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

- Database schema design & migration
- Tool Registry system
  - Tool CRUD operations (definition only)
  - AI-SDK schema validation
  - Tool test execution endpoint (isolated)
- Basic UI components for tool management
- Tool input/output schema builder

### Phase 2: Agent Core (Weeks 3-4)

- Smart Agent entity and CRUD
- Agent configuration interface
- Tool assignment system
- Knowledge base assignment
- MCP wrapper layer for unified tool access

### Phase 3: Chatbot Integration (Weeks 5-6)

- AI-SDK integration
- Chatbot UI (agent interaction interface)
- Tool function calling via MCP
- Knowledge base search via MCP
- Conversation memory and history

### Phase 4: Escalation System (Weeks 7-8)

- Escalation rules engine
- Rule builder UI
- Notification template system
- Event tracking and history
- Smart escalation triggering

### Phase 5: Analytics & Polish (Weeks 9+)

- Agent execution analytics
- Performance dashboards
- Tool usage analytics
- Conversation analytics
- Performance optimization
- [ ] Documentation
- [ ] Security audit
- [ ] Production deployment

---

## 7. Technical Implementation Details

### 7.1 Tools System Architecture

```typescript
// Tool Interface (Base)
interface BaseTool {
  id: string;
  name: string;
  description: string;
  category: "data_source" | "processor" | "visualization" | "action";
  toolType: "api" | "mcp" | "javascript" | "database";
}

// API Tool Execution
interface APITool extends BaseTool {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  auth: AuthConfig;
  schema: {
    input: JSONSchema;
    output: JSONSchema;
  };
}

// MCP Tool Execution
interface MCPTool extends BaseTool {
  serverUri: string;
  toolName: string;
  schema: MCPToolSchema;
}

// JavaScript Custom Tool
interface JSCustomTool extends BaseTool {
  code: string;
  sandboxed: boolean;
}
```

### 7.2 Execution Context

```typescript
interface AgentExecutionContext {
  agentId: string;
  executionId: string;
  tools: Map<string, ToolInstance>;
  knowledgeBases: KnowledgeBase[];
  escalationRules: EscalationRule[];

  // Helper methods
  callTool(toolId: string, params: any): Promise<any>;
  searchKnowledge(query: string): Promise<Result[]>;
  triggerEscalation(ruleId: string): Promise<void>;
  log(level: "info" | "warn" | "error", message: string): void;
}
```

### 7.3 File Structure

```
src/
├── app/
│   └── [projectId]/
│       ├── agents/
│       │   ├── page.tsx (Agent list)
│       │   ├── create/
│       │   │   └── page.tsx
│       │   └── [agentId]/
│       │       ├── page.tsx (Dashboard)
│       │       ├── settings/page.tsx
│       │       ├── tools/page.tsx
│       │       ├── knowledge/page.tsx
│       │       ├── escalations/page.tsx
│       │       ├── executions/page.tsx
│       │       └── performance/page.tsx
│       │
│       ├── tools/
│       │   ├── page.tsx (Tool registry)
│       │   ├── create/page.tsx
│       │   └── [toolId]/
│       │       ├── page.tsx
│       │       ├── edit/page.tsx
│       │       └── executions/page.tsx
│       │
│       └── escalations/
│           ├── page.tsx
│           ├── rules/page.tsx
│           ├── rules/create/page.tsx
│           ├── templates/page.tsx
│           └── events/page.tsx
│
├── components/
│   ├── agents/
│   │   ├── agent-card.tsx
│   │   ├── agent-form.tsx
│   │   ├── tool-assignment.tsx
│   │   ├── knowledge-assignment.tsx
│   │   └── escalation-config.tsx
│   │
│   ├── tools/
│   │   ├── tool-card.tsx
│   │   ├── tool-form.tsx
│   │   ├── api-tester.tsx
│   │   ├── schema-builder.tsx
│   │   └── execution-logs.tsx
│   │
│   └── escalations/
│       ├── rule-builder.tsx
│       ├── template-editor.tsx
│       ├── event-list.tsx
│       └── notification-preview.tsx
│
├── lib/
│   ├── agents/
│   │   ├── agent-service.ts
│   │   ├── execution-engine.ts
│   │   └── context-builder.ts
│   │
│   ├── tools/
│   │   ├── tool-registry.ts
│   │   ├── tool-executor.ts
│   │   ├── api-tool-handler.ts
│   │   ├── mcp-tool-handler.ts
│   │   └── validation.ts
│   │
│   ├── escalations/
│   │   ├── rule-engine.ts
│   │   ├── notification-service.ts
│   │   └── event-tracker.ts
│   │
│   └── db/
│       └── pg/
│           ├── repositories/
│           │   ├── agent-repository.ts
│           │   ├── tool-repository.ts
│           │   └── escalation-repository.ts
│           └── (schema additions)
```

---

## 8. Scalability & Performance Considerations

### 8.1 Tool Execution

- Async execution queue for long-running tools
- Tool result caching (configurable TTL)
- Rate limiting per tool and per agent
- Timeout handling and circuit breakers

### 8.2 Escalation Processing

- Event deduplication to prevent alert storms
- Batch notification processing
- Escalation history pruning (retention policy)
- Rule caching and warm loading

### 8.3 Agent Execution

- Distributed execution across worker nodes (future)
- Streaming results for long operations
- Graceful degradation if tools unavailable
- Performance metrics aggregation

---

## 9. Security Considerations

### 9.1 Tool Authentication

- Encrypted credential storage
- Credential rotation support
- Scope-based access control per agent
- Audit logging for credential access

### 9.2 Data Access

- Knowledge base access control per agent
- Tool input/output sanitization
- SQL injection prevention in tool queries
- Rate limiting and DDoS protection

### 9.3 Escalation Safety

- Prevent unauthorized escalations
- Audit trail for all escalations
- Manual approval for critical escalations
- Role-based access to sensitive escalation rules

---

## 10. Success Metrics

### 10.1 Functional KPIs

- Tool execution success rate (target: >98%)
- Escalation response time (target: <5min)
- Agent task completion rate
- Average execution time per agent

### 10.2 User Experience KPIs

- Agent creation time (target: <10min)
- Tool assignment ease (score: 4.5+/5)
- Dashboard loading time (target: <2s)

### 10.3 System KPIs

- Tool execution latency (p95: <2s)
- Escalation processing latency (p95: <500ms)
- System uptime (target: 99.9%)

---

## 11. Future Enhancements

1. **AI-Powered Anomaly Detection**: Automatically detect deviations
2. **Agent Learning**: ML-based optimization of agent behavior
3. **Multi-Agent Collaboration**: Agents working together on complex tasks
4. **Advanced Workflow Builder**: Visual workflow designer
5. **Custom Metrics**: User-defined KPIs and tracking
6. **API Rate Cards**: Dynamic pricing based on tool usage
7. **Agent Marketplace**: Share agents across organizations
8. **Compliance & Audit**: SOC 2, GDPR, HIPAA compliance tracking

---

## 12. Questions for Clarification (Team Discussion)

Before we proceed with implementation, please clarify:

1. **Execution Model**: How should agents execute?

   - Continuous polling/scheduled?
   - Event-driven?
   - Manual trigger only?
   - Combination?

2. **Tool Complexity**: What's the expected tool complexity?

   - Simple API calls?
   - Complex data processing?
   - Real-time interactions?
   - Batch operations?

3. **Escalation Urgency**: How critical are escalations?

   - Business hours only?
   - 24/7 coverage?
   - Specific SLAs?

4. **Multi-Agent**: Will agents work independently or collaboratively?

   - Independent execution?
   - Sequential handoffs?
   - Parallel processing?

5. **Knowledge Base**: How critical is real-time knowledge updates?
   - Static/periodic updates?
   - Real-time indexing?
   - Streaming embeddings?

---

## Conclusion

This architecture provides a robust, scalable foundation for building an intelligent agent management system. The phased implementation approach allows for iterative development and early validation of core concepts.

**Next Steps:**

1. Review and approve this architecture
2. Prioritize features for Phase 1
3. Assign team members to work streams
4. Set up development environment and database migrations
5. Begin implementation
