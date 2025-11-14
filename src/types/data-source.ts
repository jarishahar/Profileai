/**
 * Data Source Types and Enumerations
 * Defines all types, categories, and configurations for project-level data sources
 */

// Categories for grouping data sources
export type DataSourceCategory =
  | "database"
  | "knowledge_base"
  | "api"
  | "coming_soon";

// Database types
export type DatabaseType = "mongodb" | "postgresql" | "mysql";

// Knowledge base types
export type KnowledgeBaseType = "internal_kb";

export type ApiType = "rest";

// Union of all possible types
export type DataSourceType = DatabaseType | KnowledgeBaseType | ApiType;

// Connection status
export type ConnectionStatus = "connected" | "failed" | "unknown";

// Data source status
export type DataSourceStatus = "active" | "inactive";

/**
 * Database configuration for Mongo, PostgreSQL, MySQL
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  databaseName: string;
  queryParams?: string; // Optional query parameters for connection string (e.g., "authSource=admin&replicaSet=rs0")
}

/**
 * Knowledge Base configuration
 */
export interface KnowledgeBaseConfig {
  knowledgeBaseId: string;
}

/**
 * API configuration
 */
export type ApiAuth =
  | { type: "none" }
  | { type: "api_key"; headerName: string; value: string }
  | { type: "bearer"; token: string }
  | { type: "basic"; username: string; password: string }
  | { type: "custom_header"; headerName: string; value: string };

export interface ApiConfig {
  baseUrl: string; // e.g., https://api.example.com
  type?: ApiType; // default 'rest'
  auth?: ApiAuth; // auth strategy
  headers?: Record<string, string>; // extra headers
  timeoutMs?: number; // request timeout
}

// Union of all config types
export type DataSourceConfig = DatabaseConfig | KnowledgeBaseConfig | ApiConfig;

/**
 * Main Data Source entity
 */
export interface DataSource {
  id: string;
  projectId: string;
  name: string;
  category: DataSourceCategory;
  type: DataSourceType;
  config: DataSourceConfig; // Decrypted config object
  status: DataSourceStatus;
  connectionStatus: ConnectionStatus;
  lastConnectionTest: Date | null;
  connectionError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data Source with encrypted config (as stored in DB)
 */
export interface DataSourceDB {
  id: string;
  projectId: string;
  name: string;
  category: DataSourceCategory;
  type: DataSourceType;
  config: string; // Encrypted JSON string
  status: DataSourceStatus;
  connectionStatus: ConnectionStatus;
  lastConnectionTest: Date | null;
  connectionError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Form data for creating/updating data sources
 */
export interface DataSourceFormData {
  name: string;
  category: DataSourceCategory;
  type: DataSourceType;
  config: DataSourceConfig;
}

/**
 * Test connection result
 */
export interface TestConnectionResult {
  success: boolean;
  error?: string;
  lastTested?: Date;
}

/**
 * Type guards
 */
export const isDatabaseSource = (
  ds: DataSource,
): ds is DataSource & { type: DatabaseType } => {
  return ds.category === "database";
};

export const isKnowledgeBaseSource = (
  ds: DataSource,
): ds is DataSource & { type: KnowledgeBaseType } => {
  return ds.category === "knowledge_base";
};

export const isApiSource = (
  ds: DataSource,
): ds is DataSource & { type: ApiType } => {
  return ds.category === "api";
};

export const isDatabaseConfig = (
  config: DataSourceConfig,
): config is DatabaseConfig => {
  return (
    "host" in config &&
    "port" in config &&
    "username" in config &&
    "password" in config
  );
};

export const isKnowledgeBaseConfig = (
  config: DataSourceConfig,
): config is KnowledgeBaseConfig => {
  return "knowledgeBaseId" in config;
};

export const isApiConfig = (config: DataSourceConfig): config is ApiConfig => {
  return "baseUrl" in (config as any) && "auth" in (config as any);
};
