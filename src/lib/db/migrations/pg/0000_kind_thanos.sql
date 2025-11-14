CREATE TYPE "public"."permission_type" AS ENUM('admin', 'write', 'read');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"password" text,
	"image" text,
	"preferences" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp,
	"role" text DEFAULT 'user' NOT NULL,
	"tenant_id" uuid,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "agent_data_source" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"data_source_id" uuid NOT NULL,
	"selected_tools" json DEFAULT '[]' NOT NULL,
	"toon_schema" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_execution_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"message_index" integer NOT NULL,
	"user_input" text NOT NULL,
	"agent_response" text NOT NULL,
	"tools_used" json DEFAULT '[]'::json,
	"knowledge_sources" json DEFAULT '[]'::json,
	"escalated" boolean DEFAULT false,
	"escalation_rule_id" uuid,
	"escalation_target" uuid,
	"escalation_reason" text,
	"response_time_ms" integer,
	"user_satisfaction" integer,
	"feedback_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_guardrails_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"data_source_id" uuid NOT NULL,
	"guardrails_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_mcp_server_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"mcp_server_id" uuid NOT NULL,
	"selected_tools" json DEFAULT '[]'::json NOT NULL,
	"config_override" json,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_role_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_tool_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"access_level" text DEFAULT 'execute' NOT NULL,
	"tool_config_override" json,
	"rate_limit" integer DEFAULT 100,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_source" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"type" text NOT NULL,
	"config" text NOT NULL,
	"embedding_model" text DEFAULT 'text-embedding-3-small',
	"embedding_dimension" integer DEFAULT 1536,
	"chunking_config" json DEFAULT '{"maxSize": 1024, "minSize": 1, "overlap": 200}',
	"token_count" integer DEFAULT 0,
	"status" text DEFAULT 'active' NOT NULL,
	"connection_status" text DEFAULT 'unknown' NOT NULL,
	"last_connection_test" timestamp,
	"connection_error" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "docs_embeddings" (
	"chunk_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chunk_text" text NOT NULL,
	"source_document" text NOT NULL,
	"source_link" text NOT NULL,
	"header_text" text NOT NULL,
	"header_level" integer NOT NULL,
	"token_count" integer NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"embedding_model" text DEFAULT 'text-embedding-3-small' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"chunk_text_tsv" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "docs_embeddings"."chunk_text")) STORED,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "docs_embedding_not_null_check" CHECK ("embedding" IS NOT NULL),
	CONSTRAINT "docs_header_level_check" CHECK ("header_level" >= 1 AND "header_level" <= 6)
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"knowledge_base_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"character_count" integer DEFAULT 0 NOT NULL,
	"processing_status" text DEFAULT 'pending' NOT NULL,
	"processing_started_at" timestamp,
	"processing_completed_at" timestamp,
	"processing_error" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"tag1" text,
	"tag2" text,
	"tag3" text,
	"tag4" text,
	"tag5" text,
	"tag6" text,
	"tag7" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "embedding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"knowledge_base_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"chunk_hash" text NOT NULL,
	"content" text NOT NULL,
	"content_length" integer NOT NULL,
	"token_count" integer NOT NULL,
	"embedding" vector(1536),
	"embedding_model" text DEFAULT 'text-embedding-3-small' NOT NULL,
	"start_offset" integer NOT NULL,
	"end_offset" integer NOT NULL,
	"tag1" text,
	"tag2" text,
	"tag3" text,
	"tag4" text,
	"tag5" text,
	"tag6" text,
	"tag7" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"content_tsv" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "embedding"."content")) STORED,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "embedding_not_null_check" CHECK ("embedding" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "escalation_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escalation_rule_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"trigger_data" json,
	"status" text DEFAULT 'pending' NOT NULL,
	"assigned_to" uuid,
	"notes" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escalation_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"rule_type" text NOT NULL,
	"trigger_condition" json,
	"trigger_events" text[] DEFAULT '{}',
	"escalation_action" text NOT NULL,
	"escalation_target" uuid NOT NULL,
	"escalation_template_id" uuid,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escalation_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"subject" text,
	"body" text NOT NULL,
	"message_type" text DEFAULT 'email' NOT NULL,
	"variables" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_link_manifest" (
	"knowledge_base_id" varchar(128) NOT NULL,
	"url" text NOT NULL,
	"canonical_url" text,
	"etag" text,
	"last_modified" text,
	"content_hash" text,
	"content_type" text,
	"fetched_at" timestamp with time zone DEFAULT now(),
	"next_recrawl_at" timestamp with time zone,
	"depth" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "kb_link_manifest_knowledge_base_id_url_pk" PRIMARY KEY("knowledge_base_id","url")
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"token_count" integer DEFAULT 0 NOT NULL,
	"embedding_model" text DEFAULT 'text-embedding-3-small' NOT NULL,
	"embedding_dimension" integer DEFAULT 1536 NOT NULL,
	"chunking_config" json DEFAULT '{"maxSize": 1024, "minSize": 1, "overlap": 200}' NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_tag_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"knowledge_base_id" uuid NOT NULL,
	"tag_slot" text NOT NULL,
	"display_name" text NOT NULL,
	"field_type" text DEFAULT 'text' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_server" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"config" json NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid,
	"agent_id" uuid,
	"visibility" text DEFAULT 'private' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_server_custom_instructions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mcp_server_id" uuid NOT NULL,
	"prompt" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_server_tool_custom_instructions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tool_name" text NOT NULL,
	"mcp_server_id" uuid NOT NULL,
	"prompt" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"database_url" text DEFAULT '',
	"subdomain" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE TABLE "project_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"type" text,
	"api_key" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"name" text,
	"description" text,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_role" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"template_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"reporting_to_role_id" uuid,
	"permissions" json DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role_id" uuid NOT NULL,
	"unique_id" text,
	"password" text,
	"created_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_user_agent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_user_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions_template" json DEFAULT '{}' NOT NULL,
	"hierarchy" integer DEFAULT 0 NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "role_template_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "smart_agent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"avatar_url" text,
	"agent_type" text DEFAULT 'custom',
	"llm_model" text DEFAULT 'openai/gpt-4o' NOT NULL,
	"goal" text NOT NULL,
	"instructions" text,
	"success_metrics" json DEFAULT '{}'::json,
	"context" json DEFAULT '{}'::json,
	"status" text DEFAULT 'active' NOT NULL,
	"subdomain" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp,
	CONSTRAINT "smart_agent_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE TABLE "tool" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"tool_type" text NOT NULL,
	"input_schema" json NOT NULL,
	"output_schema" json,
	"config" json DEFAULT '{}'::json NOT NULL,
	"documentation" text,
	"example_usage" json,
	"version" integer DEFAULT 1,
	"status" text DEFAULT 'draft' NOT NULL,
	"ai_sdk_format_valid" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tool_execution_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_id" uuid NOT NULL,
	"agent_id" uuid,
	"conversation_id" uuid,
	"status" text NOT NULL,
	"input_params" json,
	"output_result" json,
	"error_message" text,
	"execution_time_ms" integer,
	"execution_context" json,
	"execution_type" text DEFAULT 'test' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_tenant_id_user_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_data_source" ADD CONSTRAINT "agent_data_source_agent_id_smart_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."smart_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_data_source" ADD CONSTRAINT "agent_data_source_data_source_id_data_source_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_execution_history" ADD CONSTRAINT "agent_execution_history_agent_id_smart_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."smart_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_execution_history" ADD CONSTRAINT "agent_execution_history_escalation_rule_id_escalation_rule_id_fk" FOREIGN KEY ("escalation_rule_id") REFERENCES "public"."escalation_rule"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_execution_history" ADD CONSTRAINT "agent_execution_history_escalation_target_user_id_fk" FOREIGN KEY ("escalation_target") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_guardrails_config" ADD CONSTRAINT "agent_guardrails_config_agent_id_smart_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."smart_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_guardrails_config" ADD CONSTRAINT "agent_guardrails_config_data_source_id_data_source_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_mcp_server_assignment" ADD CONSTRAINT "agent_mcp_server_assignment_agent_id_smart_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."smart_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_mcp_server_assignment" ADD CONSTRAINT "agent_mcp_server_assignment_mcp_server_id_mcp_server_id_fk" FOREIGN KEY ("mcp_server_id") REFERENCES "public"."mcp_server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_role_access" ADD CONSTRAINT "agent_role_access_agent_id_smart_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."smart_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_role_access" ADD CONSTRAINT "agent_role_access_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_role_access" ADD CONSTRAINT "agent_role_access_role_id_project_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."project_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tool_assignment" ADD CONSTRAINT "agent_tool_assignment_agent_id_smart_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."smart_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tool_assignment" ADD CONSTRAINT "agent_tool_assignment_tool_id_tool_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_source" ADD CONSTRAINT "data_source_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_source" ADD CONSTRAINT "data_source_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_knowledge_base_id_knowledge_base_id_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embedding" ADD CONSTRAINT "embedding_knowledge_base_id_knowledge_base_id_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embedding" ADD CONSTRAINT "embedding_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_event" ADD CONSTRAINT "escalation_event_escalation_rule_id_escalation_rule_id_fk" FOREIGN KEY ("escalation_rule_id") REFERENCES "public"."escalation_rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_event" ADD CONSTRAINT "escalation_event_agent_id_smart_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."smart_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_event" ADD CONSTRAINT "escalation_event_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_rule" ADD CONSTRAINT "escalation_rule_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_rule" ADD CONSTRAINT "escalation_rule_agent_id_smart_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."smart_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_rule" ADD CONSTRAINT "escalation_rule_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_rule" ADD CONSTRAINT "escalation_rule_escalation_target_user_id_fk" FOREIGN KEY ("escalation_target") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_rule" ADD CONSTRAINT "escalation_rule_escalation_template_id_escalation_template_id_fk" FOREIGN KEY ("escalation_template_id") REFERENCES "public"."escalation_template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_template" ADD CONSTRAINT "escalation_template_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_template" ADD CONSTRAINT "escalation_template_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_tag_definitions" ADD CONSTRAINT "knowledge_base_tag_definitions_knowledge_base_id_knowledge_base_id_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_base"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_server" ADD CONSTRAINT "mcp_server_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_server" ADD CONSTRAINT "mcp_server_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_server" ADD CONSTRAINT "mcp_server_agent_id_smart_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."smart_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_server_custom_instructions" ADD CONSTRAINT "mcp_server_custom_instructions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_server_custom_instructions" ADD CONSTRAINT "mcp_server_custom_instructions_mcp_server_id_mcp_server_id_fk" FOREIGN KEY ("mcp_server_id") REFERENCES "public"."mcp_server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_server_tool_custom_instructions" ADD CONSTRAINT "mcp_server_tool_custom_instructions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_server_tool_custom_instructions" ADD CONSTRAINT "mcp_server_tool_custom_instructions_mcp_server_id_mcp_server_id_fk" FOREIGN KEY ("mcp_server_id") REFERENCES "public"."mcp_server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_tenant_id_user_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_config" ADD CONSTRAINT "project_config_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_role" ADD CONSTRAINT "project_role_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_role" ADD CONSTRAINT "project_role_template_id_role_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."role_template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_role" ADD CONSTRAINT "project_role_reporting_to_role_id_project_role_id_fk" FOREIGN KEY ("reporting_to_role_id") REFERENCES "public"."project_role"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_user" ADD CONSTRAINT "project_user_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_user" ADD CONSTRAINT "project_user_role_id_project_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."project_role"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_user" ADD CONSTRAINT "project_user_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_user_agent" ADD CONSTRAINT "project_user_agent_project_user_id_project_user_id_fk" FOREIGN KEY ("project_user_id") REFERENCES "public"."project_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_user_agent" ADD CONSTRAINT "project_user_agent_agent_id_smart_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."smart_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_agent" ADD CONSTRAINT "smart_agent_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_agent" ADD CONSTRAINT "smart_agent_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool" ADD CONSTRAINT "tool_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool" ADD CONSTRAINT "tool_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_execution_log" ADD CONSTRAINT "tool_execution_log_tool_id_tool_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_execution_log" ADD CONSTRAINT "tool_execution_log_agent_id_smart_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."smart_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_token" ADD CONSTRAINT "user_token_user_id_project_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."project_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_data_source_idx" ON "agent_data_source" USING btree ("agent_id","data_source_id");--> statement-breakpoint
CREATE INDEX "agent_data_source_agent_id_idx" ON "agent_data_source" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_data_source_data_source_id_idx" ON "agent_data_source" USING btree ("data_source_id");--> statement-breakpoint
CREATE INDEX "agent_execution_history_agent_id_idx" ON "agent_execution_history" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_execution_history_conversation_id_idx" ON "agent_execution_history" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "agent_execution_history_escalated_idx" ON "agent_execution_history" USING btree ("escalated");--> statement-breakpoint
CREATE INDEX "agent_execution_history_created_at_idx" ON "agent_execution_history" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_guardrails_config_idx" ON "agent_guardrails_config" USING btree ("agent_id","data_source_id");--> statement-breakpoint
CREATE INDEX "agent_guardrails_config_agent_id_idx" ON "agent_guardrails_config" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_guardrails_config_data_source_id_idx" ON "agent_guardrails_config" USING btree ("data_source_id");--> statement-breakpoint
CREATE INDEX "agent_mcp_assignment_agent_id_idx" ON "agent_mcp_server_assignment" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_mcp_assignment_mcp_server_id_idx" ON "agent_mcp_server_assignment" USING btree ("mcp_server_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_mcp_assignment_agent_mcp_idx" ON "agent_mcp_server_assignment" USING btree ("agent_id","mcp_server_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_role_access_idx" ON "agent_role_access" USING btree ("agent_id","role_id");--> statement-breakpoint
CREATE INDEX "agent_role_access_agent_id_idx" ON "agent_role_access" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_role_access_role_id_idx" ON "agent_role_access" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "agent_role_access_project_id_idx" ON "agent_role_access" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "agent_tool_assignment_agent_id_idx" ON "agent_tool_assignment" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_tool_assignment_tool_id_idx" ON "agent_tool_assignment" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "agent_tool_assignment_agent_tool_idx" ON "agent_tool_assignment" USING btree ("agent_id","tool_id");--> statement-breakpoint
CREATE INDEX "data_source_project_id_idx" ON "data_source" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "data_source_user_id_idx" ON "data_source" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "data_source_category_idx" ON "data_source" USING btree ("category");--> statement-breakpoint
CREATE INDEX "data_source_type_idx" ON "data_source" USING btree ("type");--> statement-breakpoint
CREATE INDEX "data_source_category_type_idx" ON "data_source" USING btree ("category","type");--> statement-breakpoint
CREATE INDEX "data_source_project_category_idx" ON "data_source" USING btree ("project_id","category");--> statement-breakpoint
CREATE INDEX "data_source_deleted_at_idx" ON "data_source" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "docs_emb_source_document_idx" ON "docs_embeddings" USING btree ("source_document");--> statement-breakpoint
CREATE INDEX "docs_emb_header_level_idx" ON "docs_embeddings" USING btree ("header_level");--> statement-breakpoint
CREATE INDEX "docs_emb_source_header_idx" ON "docs_embeddings" USING btree ("source_document","header_level");--> statement-breakpoint
CREATE INDEX "docs_emb_model_idx" ON "docs_embeddings" USING btree ("embedding_model");--> statement-breakpoint
CREATE INDEX "docs_emb_created_at_idx" ON "docs_embeddings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "docs_embedding_vector_hnsw_idx" ON "docs_embeddings" USING hnsw ("embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);--> statement-breakpoint
CREATE INDEX "docs_emb_metadata_gin_idx" ON "docs_embeddings" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX "docs_emb_chunk_text_fts_idx" ON "docs_embeddings" USING gin ("chunk_text_tsv");--> statement-breakpoint
CREATE INDEX "doc_kb_id_idx" ON "document" USING btree ("knowledge_base_id");--> statement-breakpoint
CREATE INDEX "doc_filename_idx" ON "document" USING btree ("filename");--> statement-breakpoint
CREATE INDEX "doc_kb_uploaded_at_idx" ON "document" USING btree ("knowledge_base_id","uploaded_at");--> statement-breakpoint
CREATE INDEX "doc_processing_status_idx" ON "document" USING btree ("knowledge_base_id","processing_status");--> statement-breakpoint
CREATE INDEX "doc_tag1_idx" ON "document" USING btree ("tag1");--> statement-breakpoint
CREATE INDEX "doc_tag2_idx" ON "document" USING btree ("tag2");--> statement-breakpoint
CREATE INDEX "doc_tag3_idx" ON "document" USING btree ("tag3");--> statement-breakpoint
CREATE INDEX "doc_tag4_idx" ON "document" USING btree ("tag4");--> statement-breakpoint
CREATE INDEX "doc_tag5_idx" ON "document" USING btree ("tag5");--> statement-breakpoint
CREATE INDEX "doc_tag6_idx" ON "document" USING btree ("tag6");--> statement-breakpoint
CREATE INDEX "doc_tag7_idx" ON "document" USING btree ("tag7");--> statement-breakpoint
CREATE INDEX "emb_kb_id_idx" ON "embedding" USING btree ("knowledge_base_id");--> statement-breakpoint
CREATE INDEX "emb_doc_id_idx" ON "embedding" USING btree ("document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "emb_doc_chunk_idx" ON "embedding" USING btree ("document_id","chunk_index");--> statement-breakpoint
CREATE INDEX "emb_kb_model_idx" ON "embedding" USING btree ("knowledge_base_id","embedding_model");--> statement-breakpoint
CREATE INDEX "emb_kb_enabled_idx" ON "embedding" USING btree ("knowledge_base_id","enabled");--> statement-breakpoint
CREATE INDEX "emb_doc_enabled_idx" ON "embedding" USING btree ("document_id","enabled");--> statement-breakpoint
CREATE INDEX "embedding_vector_hnsw_idx" ON "embedding" USING hnsw ("embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);--> statement-breakpoint
CREATE INDEX "emb_tag1_idx" ON "embedding" USING btree ("tag1");--> statement-breakpoint
CREATE INDEX "emb_tag2_idx" ON "embedding" USING btree ("tag2");--> statement-breakpoint
CREATE INDEX "emb_tag3_idx" ON "embedding" USING btree ("tag3");--> statement-breakpoint
CREATE INDEX "emb_tag4_idx" ON "embedding" USING btree ("tag4");--> statement-breakpoint
CREATE INDEX "emb_tag5_idx" ON "embedding" USING btree ("tag5");--> statement-breakpoint
CREATE INDEX "emb_tag6_idx" ON "embedding" USING btree ("tag6");--> statement-breakpoint
CREATE INDEX "emb_tag7_idx" ON "embedding" USING btree ("tag7");--> statement-breakpoint
CREATE INDEX "emb_content_fts_idx" ON "embedding" USING gin ("content_tsv");--> statement-breakpoint
CREATE INDEX "escalation_event_rule_id_idx" ON "escalation_event" USING btree ("escalation_rule_id");--> statement-breakpoint
CREATE INDEX "escalation_event_agent_id_idx" ON "escalation_event" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "escalation_event_status_idx" ON "escalation_event" USING btree ("status");--> statement-breakpoint
CREATE INDEX "escalation_event_assigned_to_idx" ON "escalation_event" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "escalation_rule_project_id_idx" ON "escalation_rule" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "escalation_rule_agent_id_idx" ON "escalation_rule" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "escalation_rule_status_idx" ON "escalation_rule" USING btree ("status");--> statement-breakpoint
CREATE INDEX "escalation_rule_priority_idx" ON "escalation_rule" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "escalation_template_project_id_idx" ON "escalation_template" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "kb_link_manifest_kb_idx" ON "kb_link_manifest" USING btree ("knowledge_base_id");--> statement-breakpoint
CREATE INDEX "kb_link_manifest_due_idx" ON "kb_link_manifest" USING btree ("next_recrawl_at");--> statement-breakpoint
CREATE UNIQUE INDEX "kb_link_manifest_canonical_uniq" ON "kb_link_manifest" USING btree ("knowledge_base_id","canonical_url");--> statement-breakpoint
CREATE INDEX "kb_link_manifest_hash_idx" ON "kb_link_manifest" USING btree ("knowledge_base_id","content_hash");--> statement-breakpoint
CREATE INDEX "kb_user_id_idx" ON "knowledge_base" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "kb_project_id_idx" ON "knowledge_base" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "kb_user_project_idx" ON "knowledge_base" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "kb_deleted_at_idx" ON "knowledge_base" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "kb_tag_definitions_kb_slot_idx" ON "knowledge_base_tag_definitions" USING btree ("knowledge_base_id","tag_slot");--> statement-breakpoint
CREATE UNIQUE INDEX "kb_tag_definitions_kb_display_name_idx" ON "knowledge_base_tag_definitions" USING btree ("knowledge_base_id","display_name");--> statement-breakpoint
CREATE INDEX "kb_tag_definitions_kb_id_idx" ON "knowledge_base_tag_definitions" USING btree ("knowledge_base_id");--> statement-breakpoint
CREATE INDEX "mcp_server_user_id_idx" ON "mcp_server" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mcp_server_project_id_idx" ON "mcp_server" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "mcp_server_agent_id_idx" ON "mcp_server" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "mcp_server_name_idx" ON "mcp_server" USING btree ("name");--> statement-breakpoint
CREATE INDEX "mcp_server_enabled_idx" ON "mcp_server" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "mcp_server_project_agent_idx" ON "mcp_server" USING btree ("project_id","agent_id");--> statement-breakpoint
CREATE INDEX "mcp_server_custom_user_id_idx" ON "mcp_server_custom_instructions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mcp_server_custom_server_id_idx" ON "mcp_server_custom_instructions" USING btree ("mcp_server_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_server_custom_unique_idx" ON "mcp_server_custom_instructions" USING btree ("user_id","mcp_server_id");--> statement-breakpoint
CREATE INDEX "mcp_tool_custom_user_id_idx" ON "mcp_server_tool_custom_instructions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mcp_tool_custom_server_id_idx" ON "mcp_server_tool_custom_instructions" USING btree ("mcp_server_id");--> statement-breakpoint
CREATE INDEX "mcp_tool_custom_tool_name_idx" ON "mcp_server_tool_custom_instructions" USING btree ("tool_name");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_tool_custom_unique_idx" ON "mcp_server_tool_custom_instructions" USING btree ("user_id","tool_name","mcp_server_id");--> statement-breakpoint
CREATE INDEX "project_tenant_id_idx" ON "project" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "project_subdomain_idx" ON "project" USING btree ("subdomain");--> statement-breakpoint
CREATE INDEX "project_config_project_id_idx" ON "project_config" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_config_provider_idx" ON "project_config" USING btree ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX "project_config_project_provider_idx" ON "project_config" USING btree ("project_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "project_role_project_name_idx" ON "project_role" USING btree ("project_id","name");--> statement-breakpoint
CREATE INDEX "project_role_project_id_idx" ON "project_role" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_role_reporting_to_idx" ON "project_role" USING btree ("reporting_to_role_id");--> statement-breakpoint
CREATE INDEX "project_role_template_id_idx" ON "project_role" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "project_role_project_reporting_idx" ON "project_role" USING btree ("project_id","reporting_to_role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_user_project_email_idx" ON "project_user" USING btree ("project_id","email");--> statement-breakpoint
CREATE INDEX "project_user_project_id_idx" ON "project_user" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_user_role_id_idx" ON "project_user" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "project_user_email_idx" ON "project_user" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "project_user_agent_idx" ON "project_user_agent" USING btree ("project_user_id","agent_id");--> statement-breakpoint
CREATE INDEX "project_user_agent_user_id_idx" ON "project_user_agent" USING btree ("project_user_id");--> statement-breakpoint
CREATE INDEX "project_user_agent_agent_id_idx" ON "project_user_agent" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "role_template_hierarchy_idx" ON "role_template" USING btree ("hierarchy");--> statement-breakpoint
CREATE INDEX "role_template_name_idx" ON "role_template" USING btree ("name");--> statement-breakpoint
CREATE INDEX "smart_agent_project_id_idx" ON "smart_agent" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "smart_agent_created_by_idx" ON "smart_agent" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "smart_agent_status_idx" ON "smart_agent" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tool_project_id_idx" ON "tool" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tool_created_by_idx" ON "tool" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "tool_status_idx" ON "tool" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tool_category_idx" ON "tool" USING btree ("category");--> statement-breakpoint
CREATE INDEX "tool_name_project_idx" ON "tool" USING btree ("project_id","name");--> statement-breakpoint
CREATE INDEX "tool_execution_log_tool_id_idx" ON "tool_execution_log" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "tool_execution_log_agent_id_idx" ON "tool_execution_log" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "tool_execution_log_conversation_id_idx" ON "tool_execution_log" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "tool_execution_log_status_idx" ON "tool_execution_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tool_execution_log_execution_type_idx" ON "tool_execution_log" USING btree ("execution_type");--> statement-breakpoint
CREATE UNIQUE INDEX "user_token_hash_idx" ON "user_token" USING btree ("token_hash");