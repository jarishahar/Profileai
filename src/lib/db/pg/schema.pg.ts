import { type SQL, sql } from "drizzle-orm";
import {
  customType,
  jsonb,
  vector,
  pgTable,
  text,
  timestamp,
  json,
  uuid,
  boolean,
  check,
  index,
  integer,
  uniqueIndex,
  pgEnum,
  varchar,
  primaryKey,
} from "drizzle-orm/pg-core";
import { TAG_SLOTS } from "./consts";

import { UserPreferences } from "app-types/user";

// Custom tsvector type for full-text search
export const tsvector = customType<{
  data: string;
}>({
  dataType() {
    return `tsvector`;
  },
});

export const UserTable = pgTable("user", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  password: text("password"),
  image: text("image"),
  preferences: json("preferences").default({}).$type<UserPreferences>(),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  role: text("role").notNull().default("user"),
  // Tenant relationship: references the admin user who owns this tenant
  // NULL for superadmin and admin users (they ARE the tenant owners)
  // Set for regular users (editor, user roles) - they belong to an admin's tenant
  tenantId: uuid("tenant_id").references((): any => UserTable.id, {
    onDelete: "cascade",
  }),
});

// Role tables removed - using Better Auth's built-in role system
// Roles are now managed via the 'role' field on UserTable

export const SessionTable = pgTable("session", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  // Admin plugin field (from better-auth generated schema)
  impersonatedBy: text("impersonated_by"),
});

export const AccountTable = pgTable("account", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const VerificationTable = pgTable("verification", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$default(() => /* @__PURE__ */ new Date()),
  updatedAt: timestamp("updated_at").$default(() => /* @__PURE__ */ new Date()),
});

export type UserEntity = typeof UserTable.$inferSelect;

export const permissionTypeEnum = pgEnum("permission_type", [
  "admin",
  "write",
  "read",
]);

export const project = pgTable(
  "project",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    // Tenant reference: points to the admin user who owns this tenant
    // Projects belong to tenants, not individual users
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    databaseUrl: text("database_url").default(""),
    subdomain: text("subdomain").unique(), // e.g., 'salesperson-project-123' for {agentname}-{projectid}
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("project_tenant_id_idx").on(table.tenantId),
    subdomainIdx: index("project_subdomain_idx").on(table.subdomain),
  })
);

export const projectConfig = pgTable(
  "project_config",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),

    // Provider identification
    provider: text("provider").notNull(), // e.g., 'openai', 'google', 'anthropic', 'xai', 'mistral', 'deepseek'

    // For Google provider: 'generative' or 'vertex'
    // For others: null (defaulting to standard behavior)
    type: text("type"), // e.g., 'generative', 'vertex'

    // API Key (encrypted at rest in production)
    // For generative: API key string
    // For vertex: JSON stringified service account
    apiKey: text("api_key").notNull(),

    // Enable/disable this provider for this project
    enabled: boolean("enabled").notNull().default(true),

    // Metadata
    name: text("name"), // e.g., "Production OpenAI Key"
    description: text("description"),

    // Usage tracking
    lastUsedAt: timestamp("last_used_at"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    projectIdIdx: index("project_config_project_id_idx").on(table.projectId),
    providerIdx: index("project_config_provider_idx").on(table.provider),
    // Ensure one config per project per provider
    projectProviderIdx: uniqueIndex("project_config_project_provider_idx").on(
      table.projectId,
      table.provider
    ),
  })
);

export const knowledgeBase = pgTable(
  "knowledge_base",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),

    // Token tracking for usage
    tokenCount: integer("token_count").notNull().default(0),

    // Embedding configuration
    embeddingModel: text("embedding_model")
      .notNull()
      .default("text-embedding-3-small"),
    embeddingDimension: integer("embedding_dimension").notNull().default(256),

    // Chunking configuration stored as JSON for flexibility
    chunkingConfig: json("chunking_config")
      .notNull()
      .default('{"maxSize": 1024, "minSize": 1, "overlap": 200}'),

    // Soft delete support
    deletedAt: timestamp("deleted_at"),

    // Metadata and timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Primary access patterns
    userIdIdx: index("kb_user_id_idx").on(table.userId),

    // Composite index for user's projects
    userProjectIdx: index("kb_user_project_idx").on(table.userId),
    // Index for soft delete filtering
    deletedAtIdx: index("kb_deleted_at_idx").on(table.deletedAt),
  })
);

export const document = pgTable(
  "document",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    knowledgeBaseId: uuid("knowledge_base_id")
      .notNull()
      .references(() => knowledgeBase.id, { onDelete: "cascade" }),

    // File information
    filename: text("filename").notNull(),
    fileUrl: text("file_url").notNull(),
    fileSize: integer("file_size").notNull(), // Size in bytes
    mimeType: text("mime_type").notNull(), // e.g., 'application/pdf', 'text/plain'

    // Content statistics
    chunkCount: integer("chunk_count").notNull().default(0),
    tokenCount: integer("token_count").notNull().default(0),
    characterCount: integer("character_count").notNull().default(0),

    // Processing status
    processingStatus: text("processing_status").notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
    processingStartedAt: timestamp("processing_started_at"),
    processingCompletedAt: timestamp("processing_completed_at"),
    processingError: text("processing_error"),

    // Document state
    enabled: boolean("enabled").notNull().default(true), // Enable/disable from knowledge base
    deletedAt: timestamp("deleted_at"), // Soft delete

    // Document tags for filtering (inherited by all chunks)
    tag1: text("tag1"),
    tag2: text("tag2"),
    tag3: text("tag3"),
    tag4: text("tag4"),
    tag5: text("tag5"),
    tag6: text("tag6"),
    tag7: text("tag7"),

    // Timestamps
    uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  },
  (table) => ({
    // Primary access pattern - documents by knowledge base
    knowledgeBaseIdIdx: index("doc_kb_id_idx").on(table.knowledgeBaseId),
    // Search by filename (for search functionality)
    filenameIdx: index("doc_filename_idx").on(table.filename),
    // Order by upload date (for listing documents)
    kbUploadedAtIdx: index("doc_kb_uploaded_at_idx").on(
      table.knowledgeBaseId,
      table.uploadedAt
    ),
    // Processing status filtering
    processingStatusIdx: index("doc_processing_status_idx").on(
      table.knowledgeBaseId,
      table.processingStatus
    ),
    // Tag indexes for filtering
    tag1Idx: index("doc_tag1_idx").on(table.tag1),
    tag2Idx: index("doc_tag2_idx").on(table.tag2),
    tag3Idx: index("doc_tag3_idx").on(table.tag3),
    tag4Idx: index("doc_tag4_idx").on(table.tag4),
    tag5Idx: index("doc_tag5_idx").on(table.tag5),
    tag6Idx: index("doc_tag6_idx").on(table.tag6),
    tag7Idx: index("doc_tag7_idx").on(table.tag7),
  })
);

export const knowledgeBaseTagDefinitions = pgTable(
  "knowledge_base_tag_definitions",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    knowledgeBaseId: uuid("knowledge_base_id")
      .notNull()
      .references(() => knowledgeBase.id, { onDelete: "cascade" }),
    tagSlot: text("tag_slot", {
      enum: TAG_SLOTS,
    }).notNull(),
    displayName: text("display_name").notNull(),
    fieldType: text("field_type").notNull().default("text"), // 'text', future: 'date', 'number', 'range'
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Ensure unique tag slot per knowledge base
    kbTagSlotIdx: uniqueIndex("kb_tag_definitions_kb_slot_idx").on(
      table.knowledgeBaseId,
      table.tagSlot
    ),
    // Ensure unique display name per knowledge base
    kbDisplayNameIdx: uniqueIndex("kb_tag_definitions_kb_display_name_idx").on(
      table.knowledgeBaseId,
      table.displayName
    ),
    // Index for querying by knowledge base
    kbIdIdx: index("kb_tag_definitions_kb_id_idx").on(table.knowledgeBaseId),
  })
);

export const embedding = pgTable(
  "embedding",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    knowledgeBaseId: uuid("knowledge_base_id")
      .notNull()
      .references(() => knowledgeBase.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => document.id, { onDelete: "cascade" }),

    // Chunk information
    chunkIndex: integer("chunk_index").notNull(),
    chunkHash: text("chunk_hash").notNull(),
    content: text("content").notNull(),
    contentLength: integer("content_length").notNull(),
    tokenCount: integer("token_count").notNull(),

    // Vector embeddings - optimized for text-embedding-3-small with HNSW support
    embedding: vector("embedding", { dimensions: 256 }), // For text-embedding-3-small
    embeddingModel: text("embedding_model")
      .notNull()
      .default("text-embedding-3-small"),

    // Chunk boundaries and overlap
    startOffset: integer("start_offset").notNull(),
    endOffset: integer("end_offset").notNull(),

    // Tag columns inherited from document for efficient filtering
    tag1: text("tag1"),
    tag2: text("tag2"),
    tag3: text("tag3"),
    tag4: text("tag4"),
    tag5: text("tag5"),
    tag6: text("tag6"),
    tag7: text("tag7"),

    // Chunk state - enable/disable from knowledge base
    enabled: boolean("enabled").notNull().default(true),

    // Full-text search support - generated tsvector column
    contentTsv: tsvector("content_tsv").generatedAlwaysAs(
      (): SQL => sql`to_tsvector('english', ${embedding.content})`
    ),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Primary vector search pattern
    kbIdIdx: index("emb_kb_id_idx").on(table.knowledgeBaseId),

    // Document-level access
    docIdIdx: index("emb_doc_id_idx").on(table.documentId),

    // Chunk ordering within documents
    docChunkIdx: uniqueIndex("emb_doc_chunk_idx").on(
      table.documentId,
      table.chunkIndex
    ),

    // Model-specific queries for A/B testing or migrations
    kbModelIdx: index("emb_kb_model_idx").on(
      table.knowledgeBaseId,
      table.embeddingModel
    ),

    // Enabled state filtering indexes (for chunk enable/disable functionality)
    kbEnabledIdx: index("emb_kb_enabled_idx").on(
      table.knowledgeBaseId,
      table.enabled
    ),
    docEnabledIdx: index("emb_doc_enabled_idx").on(
      table.documentId,
      table.enabled
    ),

    // Vector similarity search indexes (HNSW) - optimized for small embeddings
    embeddingVectorHnswIdx: index("embedding_vector_hnsw_idx")
      .using("hnsw", table.embedding.op("vector_cosine_ops"))
      .with({
        m: 16,
        ef_construction: 64,
      }),

    // Tag indexes for efficient filtering
    tag1Idx: index("emb_tag1_idx").on(table.tag1),
    tag2Idx: index("emb_tag2_idx").on(table.tag2),
    tag3Idx: index("emb_tag3_idx").on(table.tag3),
    tag4Idx: index("emb_tag4_idx").on(table.tag4),
    tag5Idx: index("emb_tag5_idx").on(table.tag5),
    tag6Idx: index("emb_tag6_idx").on(table.tag6),
    tag7Idx: index("emb_tag7_idx").on(table.tag7),

    // Full-text search index
    contentFtsIdx: index("emb_content_fts_idx").using("gin", table.contentTsv),

    // Ensure embedding exists (simplified since we only support one model)
    embeddingNotNullCheck: check(
      "embedding_not_null_check",
      sql`"embedding" IS NOT NULL`
    ),
  })
);

export const docsEmbeddings = pgTable(
  "docs_embeddings",
  {
    chunkId: uuid("chunk_id").primaryKey().defaultRandom(),
    chunkText: text("chunk_text").notNull(),
    sourceDocument: text("source_document").notNull(),
    sourceLink: text("source_link").notNull(),
    headerText: text("header_text").notNull(),
    headerLevel: integer("header_level").notNull(),
    tokenCount: integer("token_count").notNull(),

    // Vector embedding - optimized for text-embedding-3-small with HNSW support
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    embeddingModel: text("embedding_model")
      .notNull()
      .default("text-embedding-3-small"),

    // Metadata for flexible filtering
    metadata: jsonb("metadata").notNull().default("{}"),

    // Full-text search support - generated tsvector column
    chunkTextTsv: tsvector("chunk_text_tsv").generatedAlwaysAs(
      (): SQL => sql`to_tsvector('english', ${docsEmbeddings.chunkText})`
    ),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Source document queries
    sourceDocumentIdx: index("docs_emb_source_document_idx").on(
      table.sourceDocument
    ),

    // Header level filtering
    headerLevelIdx: index("docs_emb_header_level_idx").on(table.headerLevel),

    // Combined source and header queries
    sourceHeaderIdx: index("docs_emb_source_header_idx").on(
      table.sourceDocument,
      table.headerLevel
    ),

    // Model-specific queries
    modelIdx: index("docs_emb_model_idx").on(table.embeddingModel),

    // Timestamp queries
    createdAtIdx: index("docs_emb_created_at_idx").on(table.createdAt),

    // Vector similarity search indexes (HNSW) - optimized for documentation embeddings
    embeddingVectorHnswIdx: index("docs_embedding_vector_hnsw_idx")
      .using("hnsw", table.embedding.op("vector_cosine_ops"))
      .with({
        m: 16,
        ef_construction: 64,
      }),

    // GIN index for JSONB metadata queries
    metadataGinIdx: index("docs_emb_metadata_gin_idx").using(
      "gin",
      table.metadata
    ),

    // Full-text search index
    chunkTextFtsIdx: index("docs_emb_chunk_text_fts_idx").using(
      "gin",
      table.chunkTextTsv
    ),

    // Constraints
    embeddingNotNullCheck: check(
      "docs_embedding_not_null_check",
      sql`"embedding" IS NOT NULL`
    ),
    headerLevelCheck: check(
      "docs_header_level_check",
      sql`"header_level" >= 1 AND "header_level" <= 6`
    ),
  })
);

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
    llmModel: text("llm_model").notNull().default("openai/gpt-4o"), // LLM model to use

    // Goal & Performance
    goal: text("goal").notNull(),
    instructions: text("instructions"), // Additional instructions for the agent
    successMetrics: json("success_metrics")
      .$type<Record<string, any>>()
      .default({}),

    context: json("context").$type<Record<string, any>>().default({}),
    // Status
    status: text("status").notNull().default("active"), // 'active', 'inactive', 'archived'

    // Subdomain for public access (unique per agent)
    subdomain: text("subdomain").unique(),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    archivedAt: timestamp("archived_at"),
  },
  (table) => ({
    projectIdIdx: index("smart_agent_project_id_idx").on(table.projectId),
    createdByIdx: index("smart_agent_created_by_idx").on(table.createdBy),
    statusIdx: index("smart_agent_status_idx").on(table.status),
  })
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

    // Configuration - stores all tool-specific settings: endpoint, auth, credentials, response format, etc.
    config: json("config").$type<Record<string, any>>().notNull().default({}),

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
      table.name
    ),
  })
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
      table.conversationId
    ),
    statusIdx: index("tool_execution_log_status_idx").on(table.status),
    executionTypeIdx: index("tool_execution_log_execution_type_idx").on(
      table.executionType
    ),
  })
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
      table.toolId
    ),
  })
);

// ============================================================================
// Agent-MCP Server Assignment Table
// ============================================================================
export const agentMcpServerAssignment = pgTable(
  "agent_mcp_server_assignment",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => smartAgent.id, { onDelete: "cascade" }),
    mcpServerId: uuid("mcp_server_id")
      .notNull()
      .references(() => mcpServer.id, { onDelete: "cascade" }),

    // Selected Tools - array of tool names from this MCP server
    selectedTools: json("selected_tools")
      .$type<string[]>()
      .notNull()
      .default([]),

    // Assignment Details
    configOverride: json("config_override").$type<Record<string, any>>(), // optional per-assignment config overrides
    enabled: boolean("enabled").notNull().default(true),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    agentIdIdx: index("agent_mcp_assignment_agent_id_idx").on(table.agentId),
    mcpServerIdIdx: index("agent_mcp_assignment_mcp_server_id_idx").on(
      table.mcpServerId
    ),
    agentMcpIdx: uniqueIndex("agent_mcp_assignment_agent_mcp_idx").on(
      table.agentId,
      table.mcpServerId
    ),
  })
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
      }
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
  })
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
      table.projectId
    ),
  })
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
      table.assignedTo
    ),
  })
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
      }
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
      table.conversationId
    ),
    escalatedIdx: index("agent_execution_history_escalated_idx").on(
      table.escalated
    ),
    createdAtIdx: index("agent_execution_history_created_at_idx").on(
      table.createdAt
    ),
  })
);

// ============================================================================
// MCP SERVER SCHEMA
// ============================================================================

// ============================================================================
// MCP Server Table
// ============================================================================
export const mcpServer = pgTable(
  "mcp_server",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    name: text("name").notNull(),
    config: json("config").notNull().$type<Record<string, any>>(),
    enabled: boolean("enabled").notNull().default(true),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => project.id, {
      onDelete: "cascade",
    }),
    agentId: uuid("agent_id").references(() => smartAgent.id, {
      onDelete: "cascade",
    }),
    visibility: text("visibility", {
      enum: ["public", "private"],
    })
      .notNull()
      .default("private"),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdIdx: index("mcp_server_user_id_idx").on(table.userId),
    projectIdIdx: index("mcp_server_project_id_idx").on(table.projectId),
    agentIdIdx: index("mcp_server_agent_id_idx").on(table.agentId),
    nameIdx: index("mcp_server_name_idx").on(table.name),
    enabledIdx: index("mcp_server_enabled_idx").on(table.enabled),
    projectAgentIdx: index("mcp_server_project_agent_idx").on(
      table.projectId,
      table.agentId
    ),
  })
);

// ============================================================================
// MCP Server Tool Customization Table
// ============================================================================
export const mcpToolCustomization = pgTable(
  "mcp_server_tool_custom_instructions",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    toolName: text("tool_name").notNull(),
    mcpServerId: uuid("mcp_server_id")
      .notNull()
      .references(() => mcpServer.id, { onDelete: "cascade" }),
    prompt: text("prompt"),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdIdx: index("mcp_tool_custom_user_id_idx").on(table.userId),
    mcpServerIdIdx: index("mcp_tool_custom_server_id_idx").on(
      table.mcpServerId
    ),
    toolNameIdx: index("mcp_tool_custom_tool_name_idx").on(table.toolName),
    uniqueUserToolServer: uniqueIndex("mcp_tool_custom_unique_idx").on(
      table.userId,
      table.toolName,
      table.mcpServerId
    ),
  })
);

// ============================================================================
// MCP Server Customization Table
// ============================================================================
export const mcpServerCustomization = pgTable(
  "mcp_server_custom_instructions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    mcpServerId: uuid("mcp_server_id")
      .notNull()
      .references(() => mcpServer.id, { onDelete: "cascade" }),
    prompt: text("prompt"),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("mcp_server_custom_user_id_idx").on(table.userId),
    mcpServerIdIdx: index("mcp_server_custom_server_id_idx").on(
      table.mcpServerId
    ),
    uniqueUserServer: uniqueIndex("mcp_server_custom_unique_idx").on(
      table.userId,
      table.mcpServerId
    ),
  })
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

export type AgentMcpServerAssignment =
  typeof agentMcpServerAssignment.$inferSelect;
export type AgentMcpServerAssignmentInsert =
  typeof agentMcpServerAssignment.$inferInsert;

export type EscalationRule = typeof escalationRule.$inferSelect;
export type EscalationRuleInsert = typeof escalationRule.$inferInsert;

export type EscalationTemplate = typeof escalationTemplate.$inferSelect;
export type EscalationTemplateInsert = typeof escalationTemplate.$inferInsert;

export type EscalationEvent = typeof escalationEvent.$inferSelect;
export type EscalationEventInsert = typeof escalationEvent.$inferInsert;

export type AgentExecutionHistory = typeof agentExecutionHistory.$inferSelect;
export type AgentExecutionHistoryInsert =
  typeof agentExecutionHistory.$inferInsert;

export type McpServer = typeof mcpServer.$inferSelect;
export type McpServerInsert = typeof mcpServer.$inferInsert;

export type McpToolCustomization = typeof mcpToolCustomization.$inferSelect;
export type McpToolCustomizationInsert =
  typeof mcpToolCustomization.$inferInsert;

export type McpServerCustomization = typeof mcpServerCustomization.$inferSelect;
export type McpServerCustomizationInsert =
  typeof mcpServerCustomization.$inferInsert;

// Data Sources table for project-level data connections
export const dataSource = pgTable(
  "data_source",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => UserTable.id, {
      onDelete: "set null",
    }), // For KB assignments tracking

    // Data source identification
    name: text("name").notNull(),
    description: text("description"), // Optional description

    // Category and type for filtering
    category: text("category", {
      enum: ["database", "knowledge_base", "api", "coming_soon"],
    }).notNull(),
    type: text("type").notNull(), // 'mongodb', 'postgresql', 'mysql', 'internal_kb', etc.

    // Encrypted configuration (JSON with host, port, username, password, database name, etc.)
    config: text("config").notNull(), // Encrypted JSON string

    // Knowledge Base specific fields (optional, only used when category = 'knowledge_base')
    embeddingModel: text("embedding_model").default("text-embedding-3-small"),
    embeddingDimension: integer("embedding_dimension").default(1536),
    chunkingConfig: json("chunking_config")
      .default('{"maxSize": 1024, "minSize": 1, "overlap": 200}')
      .$type<Record<string, any>>(),
    tokenCount: integer("token_count").default(0),

    // Status tracking
    status: text("status", {
      enum: ["active", "inactive"],
    })
      .notNull()
      .default("active"),

    // Connection status and testing
    connectionStatus: text("connection_status", {
      enum: ["connected", "failed", "unknown"],
    })
      .notNull()
      .default("unknown"),
    lastConnectionTest: timestamp("last_connection_test"),
    connectionError: text("connection_error"), // Store last error message for debugging

    // Soft delete support (for KBs)
    deletedAt: timestamp("deleted_at"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Index for filtering by project
    projectIdIdx: index("data_source_project_id_idx").on(table.projectId),
    // Index for filtering by user (KB creator)
    userIdIdx: index("data_source_user_id_idx").on(table.userId),
    // Index for filtering by category
    categoryIdx: index("data_source_category_idx").on(table.category),
    // Index for filtering by type
    typeIdx: index("data_source_type_idx").on(table.type),
    // Composite index for category + type filtering
    categoryTypeIdx: index("data_source_category_type_idx").on(
      table.category,
      table.type
    ),
    // Composite index for project + category filtering
    projectCategoryIdx: index("data_source_project_category_idx").on(
      table.projectId,
      table.category
    ),
    // Index for soft delete filtering
    deletedAtIdx: index("data_source_deleted_at_idx").on(table.deletedAt),
  })
);

export type DataSource = typeof dataSource.$inferSelect;
export type DataSourceInsert = typeof dataSource.$inferInsert;

// ============================================================================
// RBAC (Role-Based Access Control) - Project-Level Roles, Users, and Agents
// ============================================================================

// Global role templates to prevent role duplication across projects
export const roleTemplate = pgTable(
  "role_template",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),

    // Globally unique role template name (e.g., "CEO", "Manager", "Sales Person")
    name: text("name").notNull().unique(),

    // Description of the template role
    description: text("description"),

    // Default permissions for this role template (JSON format)
    permissionsTemplate: json("permissions_template")
      .notNull()
      .default("{}")
      .$type<Record<string, boolean>>(),

    // Hierarchy level (0=Top/CEO, 1=Middle/Manager, 2=Bottom/User)
    hierarchy: integer("hierarchy").notNull().default(0),

    // Track how many projects use this template
    usageCount: integer("usage_count").notNull().default(0),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Index for finding templates by hierarchy
    hierarchyIdx: index("role_template_hierarchy_idx").on(table.hierarchy),
    // Index for finding templates by name (for suggestions)
    nameIdx: index("role_template_name_idx").on(table.name),
  })
);

// Project-level roles with hierarchical structure
export const projectRole = pgTable(
  "project_role",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),

    // Project this role belongs to
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),

    // Reference to global role template (for deduplication and tracking)
    templateId: uuid("template_id").references(() => roleTemplate.id, {
      onDelete: "set null",
    }),

    // Role name within the project (e.g., "CEO", "Manager", "Sales Person")
    name: text("name").notNull(),

    // Role description
    description: text("description"),

    // Reporting hierarchy: which role does this role report to?
    // NULL = top-level role (e.g., CEO)
    reportingToRoleId: uuid("reporting_to_role_id").references(
      () => projectRole.id,
      { onDelete: "set null" }
    ),

    // Role-specific permissions (can override template defaults)
    permissions: json("permissions")
      .notNull()
      .default("{}")
      .$type<Record<string, boolean>>(),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Unique constraint: role names must be unique per project
    projectRoleNameIdx: uniqueIndex("project_role_project_name_idx").on(
      table.projectId,
      table.name
    ),
    // Index for querying roles by project
    projectIdIdx: index("project_role_project_id_idx").on(table.projectId),
    // Index for finding roles that report to a specific role
    reportingToRoleIdx: index("project_role_reporting_to_idx").on(
      table.reportingToRoleId
    ),
    // Index for tracking template usage
    templateIdIdx: index("project_role_template_id_idx").on(table.templateId),
    // Index for hierarchy queries (find top-level roles)
    projectReportingToIdx: index("project_role_project_reporting_idx").on(
      table.projectId,
      table.reportingToRoleId
    ),
  })
);

// Project-level users (independent from global Fuzion users)
export const projectUser = pgTable(
  "project_user",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),

    // Project this user belongs to
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),

    // User email (used for Smart Agent Portal login)
    email: text("email").notNull(),

    // User display name
    name: text("name").notNull(),

    // Role assigned to this user (each user has exactly ONE role per project)
    roleId: uuid("role_id")
      .notNull()
      .references(() => projectRole.id, { onDelete: "restrict" }), // Cannot delete role with users

    // Unique identifier for RBAC field matching (e.g., employee ID, driver ID)
    // Used for guardrails to match user attributes to database fields
    uniqueId: text("unique_id"),
    password: text("password"),
    // Track who created this project user (global Fuzion user)
    createdByUserId: uuid("created_by_user_id").references(() => UserTable.id, {
      onDelete: "set null",
    }),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Unique constraint: email must be unique per project
    projectUserEmailIdx: uniqueIndex("project_user_project_email_idx").on(
      table.projectId,
      table.email
    ),
    // Index for querying users by project
    projectIdIdx: index("project_user_project_id_idx").on(table.projectId),
    // Index for querying users by role
    roleIdIdx: index("project_user_role_id_idx").on(table.roleId),
    // Index for querying by email (for login)
    emailIdx: index("project_user_email_idx").on(table.email),
  })
);

// Agent access control: which agents can be accessed by which project users
export const projectUserAgent = pgTable(
  "project_user_agent",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),

    // Project user who has access to the agent
    projectUserId: uuid("project_user_id")
      .notNull()
      .references(() => projectUser.id, { onDelete: "cascade" }),

    // Agent the user can access
    agentId: uuid("agent_id")
      .notNull()
      .references(() => smartAgent.id, { onDelete: "cascade" }),

    // Timestamp when access was granted
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Unique constraint: prevent duplicate agent assignments to same user
    projectUserAgentIdx: uniqueIndex("project_user_agent_idx").on(
      table.projectUserId,
      table.agentId
    ),
    // Index for finding agents accessible by a user
    projectUserIdIdx: index("project_user_agent_user_id_idx").on(
      table.projectUserId
    ),
    // Index for finding users who can access an agent (for user count queries)
    agentIdIdx: index("project_user_agent_agent_id_idx").on(table.agentId),
  })
);

// Agent Role Access Control: which roles can use which agents
export const agentRoleAccess = pgTable(
  "agent_role_access",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),

    // Agent that has role-based access control
    agentId: uuid("agent_id")
      .notNull()
      .references(() => smartAgent.id, { onDelete: "cascade" }),

    // Project the agent belongs to
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),

    // Role that can access this agent
    roleId: uuid("role_id")
      .notNull()
      .references(() => projectRole.id, { onDelete: "cascade" }),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Unique constraint: prevent duplicate role assignments to same agent
    agentRoleAccessIdx: uniqueIndex("agent_role_access_idx").on(
      table.agentId,
      table.roleId
    ),
    // Index for finding roles that can access an agent
    agentIdIdx: index("agent_role_access_agent_id_idx").on(table.agentId),
    // Index for finding agents accessible by a role
    roleIdIdx: index("agent_role_access_role_id_idx").on(table.roleId),
    // Index for finding by project
    projectIdIdx: index("agent_role_access_project_id_idx").on(table.projectId),
  })
);

// Agent Guardrails Configuration: data access control based on roles
export const agentGuardrailsConfig = pgTable(
  "agent_guardrails_config",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),

    // Agent this guardrails config belongs to
    agentId: uuid("agent_id")
      .notNull()
      .references(() => smartAgent.id, { onDelete: "cascade" }),

    // Data source this guardrails config applies to
    dataSourceId: uuid("data_source_id")
      .notNull()
      .references(() => dataSource.id, { onDelete: "cascade" }),

    // Guardrails configuration stored as JSON
    // Structure: {
    //   "tableName": {
    //     "enabled": boolean,
    //     "roleFieldMappings": {
    //       "roleId": {
    //         "userFieldName": "uniqueId",
    //         "tableFieldName": "driver_id"
    //       }
    //     }
    //   }
    // }
    guardrailsConfig: jsonb("guardrails_config").notNull().default({}),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Unique constraint: one config per agent-datasource pair
    agentGuardrailsConfigIdx: uniqueIndex("agent_guardrails_config_idx").on(
      table.agentId,
      table.dataSourceId
    ),
    // Index for finding configs by agent
    agentIdIdx: index("agent_guardrails_config_agent_id_idx").on(table.agentId),
    // Index for finding configs by data source
    dataSourceIdIdx: index("agent_guardrails_config_data_source_id_idx").on(
      table.dataSourceId
    ),
  })
);

export type RoleTemplate = typeof roleTemplate.$inferSelect;
export type RoleTemplateInsert = typeof roleTemplate.$inferInsert;

export type ProjectRole = typeof projectRole.$inferSelect;
export type ProjectRoleInsert = typeof projectRole.$inferInsert;

export type ProjectUser = typeof projectUser.$inferSelect;
export type ProjectUserInsert = typeof projectUser.$inferInsert;

export type ProjectUserAgent = typeof projectUserAgent.$inferSelect;
export type ProjectUserAgentInsert = typeof projectUserAgent.$inferInsert;

// Agent-Data Source Assignments: which data sources are assigned to which agents with tool selections
export const agentDataSource = pgTable(
  "agent_data_source",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),

    // Agent that has access to the data source
    agentId: uuid("agent_id")
      .notNull()
      .references(() => smartAgent.id, { onDelete: "cascade" }),

    // Data source assigned to the agent
    dataSourceId: uuid("data_source_id")
      .notNull()
      .references(() => dataSource.id, { onDelete: "cascade" }),

    // Selected tools/functions from this data source (for database sources, these are table names or specific functions)
    selectedTools: json("selected_tools")
      .notNull()
      .default("[]")
      .$type<string[]>(),

    // Stored TOON formatted schema (compact representation) - user-edited or auto-generated
    toonSchema: text("toon_schema"),

    // Timestamp when assignment was created
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Unique constraint: prevent duplicate data source assignments to same agent
    agentDataSourceIdx: uniqueIndex("agent_data_source_idx").on(
      table.agentId,
      table.dataSourceId
    ),
    // Index for finding data sources assigned to an agent
    agentIdIdx: index("agent_data_source_agent_id_idx").on(table.agentId),
    // Index for finding agents using a data source
    dataSourceIdIdx: index("agent_data_source_data_source_id_idx").on(
      table.dataSourceId
    ),
  })
);

export const userToken = pgTable(
  "user_token",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => projectUser.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // 'INVITE' | 'RESET_PASSWORD'
    tokenHash: text("token_hash").notNull(), // store only hash
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    tokenHashUniq: uniqueIndex("user_token_hash_idx").on(t.tokenHash),
  })
);

export const kbLinkManifest = pgTable(
  "kb_link_manifest",
  {
    // If knowledgeBase.id is uuid, change to: uuid("knowledge_base_id")
    knowledgeBaseId: varchar("knowledge_base_id", { length: 128 }).notNull(),
    // .references(() => knowledgeBase.id, { onDelete: "cascade" }) // enable if types match
    url: text("url").notNull(),
    canonicalUrl: text("canonical_url"),
    etag: text("etag"),
    lastModified: text("last_modified"),
    contentHash: text("content_hash"),
    contentType: text("content_type"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow(),
    nextRecrawlAt: timestamp("next_recrawl_at", { withTimezone: true }),
    depth: integer("depth").notNull().default(0),
  },
  (t) => ({
    // One row per (KB, URL)
    pk: primaryKey({ columns: [t.knowledgeBaseId, t.url] }),

    // Fast lookups by KB
    kbIdx: index("kb_link_manifest_kb_idx").on(t.knowledgeBaseId),

    // For schedulers: "what's due to recrawl now/soon?"
    dueIdx: index("kb_link_manifest_due_idx").on(t.nextRecrawlAt),

    // Prevent duplicate canonicalized pages per KB (NULLs allowed)
    canonicalUniq: uniqueIndex("kb_link_manifest_canonical_uniq").on(
      t.knowledgeBaseId,
      t.canonicalUrl
    ),

    // Helpful when checking if new content differs
    hashIdx: index("kb_link_manifest_hash_idx").on(
      t.knowledgeBaseId,
      t.contentHash
    ),
  })
);

export type AgentDataSource = typeof agentDataSource.$inferSelect;
export type AgentDataSourceInsert = typeof agentDataSource.$inferInsert;

export type AgentRoleAccess = typeof agentRoleAccess.$inferSelect;
export type AgentRoleAccessInsert = typeof agentRoleAccess.$inferInsert;

export type AgentGuardrailsConfig = typeof agentGuardrailsConfig.$inferSelect;
export type AgentGuardrailsConfigInsert =
  typeof agentGuardrailsConfig.$inferInsert;
