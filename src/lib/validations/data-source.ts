/**
 * Zod Validation Schemas for Data Sources
 * Defines schemas for validation of all data source inputs and operations
 */

import { z } from "zod";

/**
 * Database configuration schema
 */
export const DatabaseConfigSchema = z.object({
  host: z
    .string()
    .min(1, "Host is required")
    .url()
    .optional()
    .or(z.string().min(1)),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  databaseName: z.string().min(1, "Database name is required"),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

/**
 * Knowledge Base configuration schema
 */
export const KnowledgeBaseConfigSchema = z.object({
  knowledgeBaseId: z.string().uuid("Invalid knowledge base ID"),
});

export type KnowledgeBaseConfig = z.infer<typeof KnowledgeBaseConfigSchema>;

/**
 * Union schema for all config types
 */
export const DataSourceConfigSchema = z.union([
  DatabaseConfigSchema,
  KnowledgeBaseConfigSchema,
]);

export type DataSourceConfig = z.infer<typeof DataSourceConfigSchema>;

/**
 * Create Data Source schema
 */
export const CreateDataSourceSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  name: z
    .string()
    .min(1, "Name is required")
    .min(3, "Name must be at least 3 characters")
    .max(255),
  category: z.enum(["database", "knowledge_base", "coming_soon"]),
  type: z.string().min(1, "Type is required"),
  config: DataSourceConfigSchema,
});

export type CreateDataSourceInput = z.infer<typeof CreateDataSourceSchema>;

/**
 * Update Data Source schema
 */
export const UpdateDataSourceSchema = CreateDataSourceSchema.partial().extend({
  id: z.string().uuid("Invalid data source ID"),
  projectId: z.string().uuid("Invalid project ID"),
});

export type UpdateDataSourceInput = z.infer<typeof UpdateDataSourceSchema>;

/**
 * Test Connection schema
 */
export const TestConnectionSchema = z.object({
  category: z.enum(["database", "knowledge_base"]),
  type: z.string().min(1, "Type is required"),
  config: DataSourceConfigSchema,
});

export type TestConnectionInput = z.infer<typeof TestConnectionSchema>;

/**
 * MongoDB connection schema
 */
export const MongoDBConnectionSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.number().int().min(1).max(65535).default(27017),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  databaseName: z.string().min(1, "Database name is required"),
});

export type MongoDBConnection = z.infer<typeof MongoDBConnectionSchema>;

/**
 * PostgreSQL connection schema
 */
export const PostgreSQLConnectionSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.number().int().min(1).max(65535).default(5432),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  databaseName: z.string().min(1, "Database name is required"),
});

export type PostgreSQLConnection = z.infer<typeof PostgreSQLConnectionSchema>;

/**
 * MySQL connection schema
 */
export const MySQLConnectionSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.number().int().min(1).max(65535).default(3306),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  databaseName: z.string().min(1, "Database name is required"),
});

export type MySQLConnection = z.infer<typeof MySQLConnectionSchema>;
