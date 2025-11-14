# Smart Agents - Database Schema (TypeScript/Drizzle)

This document contains the exact TypeScript code for adding to `src/lib/db/pg/schema.pg.ts`

## Complete Schema Addition

Copy this code and add it to the end of `src/lib/db/pg/schema.pg.ts`:

```typescript
// ============================================================================
// SMART AGENTS SCHEMA
// ============================================================================

// ============================================================================
// Smart Agent Table
// ============================================================================
export const smartAgent = pgTable(
  "smart_agent",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => UserTable.id, { onDelete: "restrict" }),

    // Identity & Configuration
    name: text("name").notNull(),
    description: text("description"),
    avatarUrl: text("avatar_url"),
    agentType: text("agent_type").default("custom"), // 'customer-service', 'sales', 'analyst', 'support', 'custom'

    // Goal & Performance
    goal: text("goal").notNull(),
    successMetrics: json("success_metrics")
      .$type<Record<string, any>>()
      .default({}),

    // Status
    status: text("status").notNull().default("active"), // 'active', 'inactive', 'archived'

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    archivedAt: timestamp("archived_at"),
  },
  (table) => ({
    projectIdIdx: index("smart_agent_project_id_idx").on(table.projectId),
    createdByIdx: index("smart_agent_created_by_idx").on(table.createdBy),
    statusIdx: index("smart_agent_status_idx").on(table.status),
  }),
);

// ============================================================================
// Tool Table
// ============================================================================
export const tool = pgTable(
  "tool",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => UserTable.id, { onDelete: "restrict" }),

    // Identity
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").notNull(), // 'data_source', 'processor', 'visualization', 'action', 'integration'

    // Definition (AI-SDK Compatible)
    toolType: text("tool_type").notNull(), // 'api', 'mcp', 'javascript', 'database', 'webhook'
    inputSchema: json("input_schema").$type<Record<string, any>>().notNull(),
    outputSchema: json("output_schema").$type<Record<string, any>>(),

    // Configuration
    config: json("config").$type<Record<string, any>>().default({}),
    responseFormat: json("response_format").$type<Record<string, any>>(),

    // Integration Details
    apiEndpoint: text("api_endpoint"),
    authMethod: text("auth_method").default("none"), // 'none', 'api_key', 'oauth2', 'basic'
    credentialsEncrypted: text("credentials_encrypted"),

    // Documentation
    documentation: text("documentation"),
    exampleUsage: json("example_usage").$type<Record<string, any>>(),

    // Version & Status
    version: integer("version").default(1),
    status: text("status").notNull().default("draft"), // 'draft', 'active', 'deprecated'
    aiSdkFormatValid: boolean("ai_sdk_format_valid").default(false),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    archivedAt: timestamp("archived_at"),
  },
  (table) => ({
    projectIdIdx: index("tool_project_id_idx").on(table.projectId),
    createdByIdx: index("tool_created_by_idx").on(table.createdBy),
    statusIdx: index("tool_status_idx").on(table.status),
    categoryIdx: index("tool_category_idx").on(table.category),
    nameProjectIdx: index("tool_name_project_idx").on(
      table.projectId,
      table.name,
    ),
  }),
);

// ============================================================================
// Tool Execution Log Table
// ============================================================================
export const toolExecutionLog = pgTable(
  "tool_execution_log",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tool.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id").references(() => smartAgent.id, {
      onDelete: "cascade",
    }), // nullable for tool testing
    conversationId: uuid("conversation_id"), // nullable - only for agent runtime

    // Execution Details
    status: text("status").notNull(), // 'success', 'failure', 'timeout', 'error'
    inputParams: json("input_params").$type<Record<string, any>>(),
    outputResult: json("output_result").$type<Record<string, any>>(),
    errorMessage: text("error_message"),
    executionTimeMs: integer("execution_time_ms"),
    executionContext: json("execution_context").$type<Record<string, any>>(),

    // Execution Type
    executionType: text("execution_type").notNull().default("test"), // 'test', 'agent_runtime', 'manual'

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    toolIdIdx: index("tool_execution_log_tool_id_idx").on(table.toolId),
    agentIdIdx: index("tool_execution_log_agent_id_idx").on(table.agentId),
    conversationIdIdx: index("tool_execution_log_conversation_id_idx").on(
      table.conversationId,
    ),
    statusIdx: index("tool_execution_log_status_idx").on(table.status),
    executionTypeIdx: index("tool_execution_log_execution_type_idx").on(
      table.executionType,
    ),
  }),
);

// ============================================================================
// Agent-Tool Assignment Table
// ============================================================================
export const agentToolAssignment = pgTable(
  "agent_tool_assignment",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => smartAgent.id, { onDelete: "cascade" }),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tool.id, { onDelete: "cascade" }),

    // Assignment Details
    accessLevel: text("access_level").notNull().default("execute"), // 'read', 'write', 'execute'
    toolConfigOverride: json("tool_config_override").$type<
      Record<string, any>
    >(),
    rateLimit: integer("rate_limit").default(100), // calls per hour

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    agentIdIdx: index("agent_tool_assignment_agent_id_idx").on(table.agentId),
    toolIdIdx: index("agent_tool_assignment_tool_id_idx").on(table.toolId),
    agentToolIdx: index("agent_tool_assignment_agent_tool_idx").on(
      table.agentId,
      table.toolId,
    ),
  }),
);

// ============================================================================
// Agent-Knowledge Base Assignment Table
// ============================================================================
export const agentKnowledgeAssignment = pgTable(
  "agent_knowledge_assignment",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => smartAgent.id, { onDelete: "cascade" }),
    knowledgeBaseId: uuid("knowledge_base_id")
      .notNull()
      .references(() => knowledgeBase.id, { onDelete: "cascade" }),

    // Assignment Details
    accessLevel: text("access_level").notNull().default("search"), // 'read', 'search', 'full'
    priority: integer("priority").default(0), // lower number = higher priority in search

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    agentIdIdx: index("agent_knowledge_assignment_agent_id_idx").on(
      table.agentId,
    ),
    kbIdIdx: index("agent_knowledge_assignment_kb_id_idx").on(
      table.knowledgeBaseId,
    ),
    agentKbIdx: index("agent_knowledge_assignment_agent_kb_idx").on(
      table.agentId,
      table.knowledgeBaseId,
    ),
    priorityIdx: index("agent_knowledge_assignment_priority_idx").on(
      table.priority,
    ),
  }),
);

// ============================================================================
// Escalation Rule Table
// ============================================================================
export const escalationRule = pgTable(
  "escalation_rule",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => smartAgent.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => UserTable.id, { onDelete: "restrict" }),

    // Rule Definition
    name: text("name").notNull(),
    description: text("description"),
    ruleType: text("rule_type").notNull(), // 'deviation', 'threshold', 'manual', 'scheduled'

    // Conditions
    triggerCondition: json("trigger_condition").$type<Record<string, any>>(),
    triggerEvents: text("trigger_events").array().default([]), // array of event types

    // Actions
    escalationAction: text("escalation_action").notNull(), // 'notify', 'assign', 'pause_agent', 'execute_workflow'
    escalationTarget: uuid("escalation_target")
      .notNull()
      .references(() => UserTable.id, { onDelete: "restrict" }),
    escalationTemplateId: uuid("escalation_template_id").references(
      () => escalationTemplate.id,
      {
        onDelete: "set null",
      },
    ),

    // Metadata
    priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high', 'critical'
    status: text("status").notNull().default("active"), // 'active', 'inactive'

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    projectIdIdx: index("escalation_rule_project_id_idx").on(table.projectId),
    agentIdIdx: index("escalation_rule_agent_id_idx").on(table.agentId),
    statusIdx: index("escalation_rule_status_idx").on(table.status),
    priorityIdx: index("escalation_rule_priority_idx").on(table.priority),
  }),
);

// ============================================================================
// Escalation Template Table
// ============================================================================
export const escalationTemplate = pgTable(
  "escalation_template",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => UserTable.id, { onDelete: "restrict" }),

    // Template Definition
    name: text("name").notNull(),
    description: text("description"),

    // Content
    subject: text("subject"),
    body: text("body").notNull(), // supports liquid template syntax
    messageType: text("message_type").notNull().default("email"), // 'email', 'webhook', 'in_app', 'sms'

    // Metadata
    variables: json("variables").$type<Record<string, any>>().default({}), // available template variables

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    projectIdIdx: index("escalation_template_project_id_idx").on(
      table.projectId,
    ),
  }),
);

// ============================================================================
// Escalation Event Table
// ============================================================================
export const escalationEvent = pgTable(
  "escalation_event",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    escalationRuleId: uuid("escalation_rule_id")
      .notNull()
      .references(() => escalationRule.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => smartAgent.id, { onDelete: "cascade" }),

    // Event Data
    eventType: text("event_type").notNull(),
    triggerData: json("trigger_data").$type<Record<string, any>>(),

    // Resolution
    status: text("status").notNull().default("pending"), // 'pending', 'acknowledged', 'resolved', 'ignored'
    assignedTo: uuid("assigned_to").references(() => UserTable.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    resolvedAt: timestamp("resolved_at"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    ruleIdIdx: index("escalation_event_rule_id_idx").on(table.escalationRuleId),
    agentIdIdx: index("escalation_event_agent_id_idx").on(table.agentId),
    statusIdx: index("escalation_event_status_idx").on(table.status),
    assignedToIdx: index("escalation_event_assigned_to_idx").on(
      table.assignedTo,
    ),
  }),
);

// ============================================================================
// Agent Execution History Table (Chatbot Conversations)
// ============================================================================
export const agentExecutionHistory = pgTable(
  "agent_execution_history",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => smartAgent.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").notNull(), // unique per chat session

    // Message/Interaction Details
    messageIndex: integer("message_index").notNull(), // order in conversation
    userInput: text("user_input").notNull(),
    agentResponse: text("agent_response").notNull(),

    // Tool Usage
    toolsUsed: json("tools_used")
      .$type<
        Array<{
          toolId: string;
          toolName: string;
          status: "pending" | "executing" | "success" | "failure";
          inputParams?: Record<string, any>;
          outputResult?: Record<string, any>;
          executionTimeMs?: number;
        }>
      >()
      .default([]),

    // Knowledge Usage
    knowledgeSources: json("knowledge_sources")
      .$type<
        Array<{
          knowledgeBaseId: string;
          query: string;
          resultsCount: number;
          usedInResponse: boolean;
        }>
      >()
      .default([]),

    // Escalation
    escalated: boolean("escalated").default(false),
    escalationRuleId: uuid("escalation_rule_id").references(
      () => escalationRule.id,
      {
        onDelete: "set null",
      },
    ),
    escalationTarget: uuid("escalation_target").references(() => UserTable.id, {
      onDelete: "set null",
    }),
    escalationReason: text("escalation_reason"),

    // Metrics & Feedback
    responseTimeMs: integer("response_time_ms"),
    userSatisfaction: integer("user_satisfaction"), // 1-5, nullable
    feedbackText: text("feedback_text"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    agentIdIdx: index("agent_execution_history_agent_id_idx").on(table.agentId),
    conversationIdIdx: index("agent_execution_history_conversation_id_idx").on(
      table.conversationId,
    ),
    escalatedIdx: index("agent_execution_history_escalated_idx").on(
      table.escalated,
    ),
    createdAtIdx: index("agent_execution_history_created_at_idx").on(
      table.createdAt,
    ),
  }),
);

// ============================================================================
// Export Types
// ============================================================================
export type SmartAgent = typeof smartAgent.$inferSelect;
export type SmartAgentInsert = typeof smartAgent.$inferInsert;

export type Tool = typeof tool.$inferSelect;
export type ToolInsert = typeof tool.$inferInsert;

export type ToolExecutionLog = typeof toolExecutionLog.$inferSelect;
export type ToolExecutionLogInsert = typeof toolExecutionLog.$inferInsert;

export type AgentToolAssignment = typeof agentToolAssignment.$inferSelect;
export type AgentToolAssignmentInsert = typeof agentToolAssignment.$inferInsert;

export type AgentKnowledgeAssignment =
  typeof agentKnowledgeAssignment.$inferSelect;
export type AgentKnowledgeAssignmentInsert =
  typeof agentKnowledgeAssignment.$inferInsert;

export type EscalationRule = typeof escalationRule.$inferSelect;
export type EscalationRuleInsert = typeof escalationRule.$inferInsert;

export type EscalationTemplate = typeof escalationTemplate.$inferSelect;
export type EscalationTemplateInsert = typeof escalationTemplate.$inferInsert;

export type EscalationEvent = typeof escalationEvent.$inferSelect;
export type EscalationEventInsert = typeof escalationEvent.$inferInsert;

export type AgentExecutionHistory = typeof agentExecutionHistory.$inferSelect;
export type AgentExecutionHistoryInsert =
  typeof agentExecutionHistory.$inferInsert;
```

---

## ✅ Checklist Before Running Migrations

Before you run the migrations, ensure:

1. **Copy the schema code above to `src/lib/db/pg/schema.pg.ts`** (at the end of file)
2. **Verify all imports are present** at the top of the schema file:

   - All `pgTable`, `uuid`, `text`, etc. from drizzle-orm are imported
   - `UserTable`, `project`, `knowledgeBase` are already defined in the file

3. **Run migrations**:

   ```bash
   pnpm drizzle-kit generate
   pnpm drizzle-kit migrate
   ```

4. **Verify in database**:
   ```bash
   # Connect to your PostgreSQL database and verify tables exist:
   \dt smart_agent
   \dt tool
   \dt tool_execution_log
   # ... etc
   ```

---

## 📝 Notes

- All tables use `defaultRandom()` for UUID generation (PostgreSQL)
- All tables have proper `createdAt` and `updatedAt` timestamps
- All foreign keys use `onDelete: 'cascade'` except for user references (which use `'restrict'`)
- Comprehensive indexes are created for query performance
- JSONB fields are used for flexible configuration storage
- Types are exported for TypeScript usage throughout the codebase

---

**Ready to generate migrations? 🚀**
