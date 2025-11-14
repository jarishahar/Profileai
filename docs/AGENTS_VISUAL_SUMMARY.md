# Smart Agents - Visual Architecture Summary

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FuzionAI Project                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PROJECT LEVEL CONFIGURATION                             │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                            │  │
│  │  📚 Knowledge Bases (Existing)                           │  │
│  │  ├─ KB 1 (Docs, Embeddings, Vector Search)              │  │
│  │  ├─ KB 2                                                 │  │
│  │  └─ KB N                                                 │  │
│  │                                                            │  │
│  │  🔧 Tools Registry (Phase 1)                            │  │
│  │  ├─ API Tools (REST, GraphQL, webhooks)                 │  │
│  │  ├─ MCP Tools (Model Context Protocol)                  │  │
│  │  ├─ JS Tools (Custom JavaScript)                        │  │
│  │  └─ Visualization Tools                                 │  │
│  │                                                            │  │
│  │  ⛔ Escalations Config (Phase 4)                         │  │
│  │  ├─ Rules (conditions, triggers)                        │  │
│  │  ├─ Templates (notifications)                           │  │
│  │  └─ Assignments (users, teams)                          │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SMART AGENTS (Multiple per Project)                    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                            │  │
│  │  Agent 1: Customer Support                              │  │
│  │  ├─ Goal: Resolve customer issues                       │  │
│  │  ├─ Tools: [KB Search, Email, Ticket System]           │  │
│  │  ├─ Knowledge: [Docs KB, FAQ KB]                        │  │
│  │  └─ Escalations: [VIP→Manager, Complex→CXO]            │  │
│  │                                                            │  │
│  │  Agent 2: Sales Assistant                               │  │
│  │  ├─ Goal: Qualify and pitch deals                       │  │
│  │  ├─ Tools: [CRM API, Pricing Tool, Email]              │  │
│  │  ├─ Knowledge: [Products KB, Pricing KB]               │  │
│  │  └─ Escalations: [Large Deal→VP Sales]                 │  │
│  │                                                            │  │
│  │  Agent N: Analytics Bot                                 │  │
│  │  └─ ...                                                  │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Agent Execution Flow (Chatbot)

```
USER CHAT INTERFACE
        │
        ▼
┌──────────────────────┐
│ User sends message   │
│ "Help with order"    │
└──────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│ Fetch Agent Context                      │
│ ├─ Assigned Tools (with schemas)         │
│ ├─ Assigned Knowledge Bases              │
│ └─ Escalation Rules                      │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│ Convert Tools to AI-SDK Format           │
│ (using AI-SDK compatible schema)         │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│ AI-SDK LLM Processing                    │
│ (Anthropic Claude or OpenAI)             │
│                                          │
│ Decides:                                 │
│ ├─ Should search knowledge base?         │
│ ├─ Which tools to call?                  │
│ ├─ How to format response?               │
└──────────────────────────────────────────┘
        │
        ├─────────────┬──────────────┐
        ▼             ▼              ▼
   SEARCH KB    CALL TOOLS    [ANALYZE]
        │             │              │
        ▼             ▼              ▼
  [Results]   ┌──────────────┐    [Result]
              │ Tool Handler │
              ├──────────────┤
              │ • API Tool   │ (MCP wrapper)
              │ • MCP Tool   │
              │ • JS Tool    │
              └──────────────┘
        │             │
        └─────────────┴─────────────┘
                │
                ▼
        ┌──────────────────┐
        │ Check Escalation │
        │ Rules            │
        │ ├─ Low conf?     │
        │ ├─ Tool fail?    │
        │ └─ Other rules?  │
        └──────────────────┘
                │
         ┌──────┴──────┐
         ▼             ▼
    [Escalate]   [No Escalation]
         │             │
         ▼             ▼
    NOTIFY    ┌──────────────────────┐
    TARGET    │ Generate Response    │
              │ (via AI-SDK LLM)     │
              │                      │
              │ Synthesizes:         │
              │ ├─ KB results        │
              │ ├─ Tool outputs      │
              │ ├─ Context           │
              │ └─ Conversation hist │
              └──────────────────────┘
                        │
                        ▼
                ┌──────────────────────┐
                │ Send to User         │
                │ (Chatbot Interface)  │
                └──────────────────────┘
                        │
                        ▼
                ┌──────────────────────┐
                │ Log Execution        │
                │ ├─ Message           │
                │ ├─ Tools called      │
                │ ├─ KB searched       │
                │ ├─ Escalation?       │
                │ └─ Response time     │
                └──────────────────────┘
```

---

## 🗂️ Database Relationships

```
                    PROJECT
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   SMART_AGENT      TOOL        KNOWLEDGE_BASE
        │              │              │
        ├─────────┬────┴────┬─────────┴──────┐
        │         │         │                 │
        ▼         ▼         ▼                 ▼
    AGENT      AGENT_TOOL  TOOL_       AGENT_KNOWLEDGE
    EXECUTION  ASSIGNMENT  EXECUTION   ASSIGNMENT
    HISTORY                LOG
        │
        └─────────────────┐
                          ▼
                   ESCALATION_RULE
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
      ESCALATION_  ESCALATION_    USER
       TEMPLATE      EVENT
```

---

## 📋 Tool Lifecycle

### 1. **Creation Phase** (Project Level)

```
Tool Definition
├─ Name: "Fetch Customer Data"
├─ Type: "API"
├─ Input Schema (AI-SDK format):
│  {
│    "type": "object",
│    "properties": {
│      "customerId": {"type": "string", "description": "UUID"}
│    },
│    "required": ["customerId"]
│  }
├─ Output Schema:
│  {
│    "type": "object",
│    "properties": {
│      "name": {"type": "string"},
│      "email": {"type": "string"}
│    }
│  }
├─ API Endpoint: "https://api.company.com/customers/{id}"
├─ Auth: API Key
└─ Status: Draft
```

### 2. **Testing Phase** (Project Level - ISOLATED)

```
POST /api/projects/[projectId]/tools/test
{
  "toolId": "uuid",
  "inputParams": { "customerId": "123" }
}

Response:
{
  "status": "success",
  "result": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "executionTimeMs": 234,
  "executionId": "log-uuid"
}

⚠️ NO SIDE EFFECTS - Read-only or test endpoints only
```

### 3. **Registration Phase** (Project Level)

```
Status: "active"
├─ Ready for agent assignment
├─ Version tracked
└─ Can be used in agents
```

### 4. **Assignment Phase** (Agent Level)

```
agent_tool_assignment
├─ agentId: "uuid"
├─ toolId: "uuid"
├─ accessLevel: "execute"
├─ rateLimit: 100 (per hour)
└─ toolConfigOverride: {} (optional)
```

### 5. **Runtime Phase** (Chatbot)

```
AI-SDK LLM decides to call tool
    ↓
MCP Wrapper invokes handler
    ↓
Tool executed (API/MCP/JS)
    ↓
Result captured
    ↓
Logged to tool_execution_log
    ↓
Result sent to LLM
    ↓
LLM synthesizes response
```

---

## 🔐 Security & Isolation

### Tool Testing - ISOLATED

```
┌─────────────────────────────────┐
│ Tool Test Execution             │
│ (Limited, Contained)            │
├─────────────────────────────────┤
│ ✓ Can call APIs                 │
│ ✓ Can execute JavaScript        │
│ ✓ Can query databases (read)    │
│ ✓ Time-limited (30s default)    │
│ ✓ No persistent side effects    │
│ ✗ Cannot write to databases     │
│ ✗ Cannot delete data            │
│ ✗ Cannot call external webhooks │
│ ✗ Cannot send emails            │
└─────────────────────────────────┘
```

### Tool Runtime - MCP Wrapper

```
┌─────────────────────────────────┐
│ Agent Runtime Execution         │
│ (Full Capability)               │
├─────────────────────────────────┤
│ ✓ All tool capabilities         │
│ ✓ Rate limiting applied         │
│ ✓ Audit logged                  │
│ ✓ Access control checked        │
│ ✓ Escalation rules applied      │
│ ✓ Results tracked in history    │
└─────────────────────────────────┘
```

---

## 📊 Data Flow: Complete Multi-Turn Conversation

```
CONVERSATION SESSION
│
├─ Message 1
│  ├─ User: "What's my order status?"
│  ├─ Agent searches KB: "order status"
│  ├─ Agent calls tool: "fetch_order"
│  ├─ Tool returns: { id: "123", status: "shipped" }
│  └─ Agent: "Your order is shipped!"
│     └─ Logged to agent_execution_history
│
├─ Message 2
│  ├─ User: "When will it arrive?"
│  ├─ Agent uses KB result from Message 1
│  ├─ Agent calls tool: "get_shipping_estimate"
│  ├─ Tool returns: { estimatedDate: "2025-10-20" }
│  └─ Agent: "Estimated delivery: Oct 20"
│     └─ Logged to agent_execution_history
│
├─ Message 3
│  ├─ User: "I need urgent help - order is missing"
│  ├─ Agent detects issue
│  ├─ Agent calls tool: "flag_order_issue"
│  ├─ Escalation rule triggered: confidence_low + customer_issue
│  ├─ Notification sent to support_team
│  ├─ Escalation logged to escalation_event
│  └─ Agent: "I'm escalating to our support team..."
│     └─ Logged with escalation_rule_id
│
└─ END CONVERSATION
   └─ Conversation logged as agent_execution_history
      with conversation_id = UUID
```

---

## 🎯 Phase 1 Focus Area

```
┌─────────────────────────────────┐
│  PROJECT LEVEL TOOLS ONLY       │
├─────────────────────────────────┤
│                                 │
│  ✅ Tool CRUD                   │
│  ✅ Schema Builder              │
│  ✅ Schema Validator            │
│  ✅ AI-SDK Format               │
│  ✅ Test Executor               │
│  ✅ Test UI                     │
│  ✅ Versioning                  │
│  ✅ Tool Registry               │
│                                 │
│  ❌ Agent Creation              │
│  ❌ Chatbot Integration         │
│  ❌ Escalations                 │
│  ❌ Knowledge Assignment        │
│  ❌ Runtime Execution           │
│                                 │
└─────────────────────────────────┘
```

---

## 🚦 Ready States Checklist

### Phase 1 Success = All ✅

```
Database:
  ☐ All 9 tables created
  ☐ All relationships defined
  ☐ All indexes created
  ☐ Migrations applied

Backend Services:
  ☐ Tool repository CRUD
  ☐ Tool executor (test)
  ☐ AI-SDK formatter
  ☐ Test endpoint working
  ☐ Schema validator

Frontend:
  ☐ Tool list page
  ☐ Tool create page
  ☐ Tool edit page
  ☐ Tool test page
  ☐ Schema builder UI

Testing:
  ☐ Create tool → saved ✓
  ☐ Test tool → executes ✓
  ☐ Schema valid → AI-SDK ✓
  ☐ Test isolated → no side effects ✓
  ☐ Version tracking → working ✓

Quality:
  ☐ No console errors
  ☐ Loading states working
  ☐ Error handling working
  ☐ Forms validating
  ☐ API error handling
```

---

## 🔗 Quick Links

- 📖 **Main Architecture**: `docs/AGENTS_ARCHITECTURE.md`
- 📋 **Detailed Requirements**: `docs/AGENTS_REQUIREMENTS_DETAILED.md`
- 🚀 **Implementation Plan**: `docs/AGENTS_IMPLEMENTATION_KICKOFF.md`
- 🎨 **Visual Summary**: This file

---

**Ready to build? Let's go! 🚀**
