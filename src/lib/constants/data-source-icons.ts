/**
 * Data Source Icon Configuration
 * Centralizes icon mappings for all data source types with colors and labels
 */

import {
  Leaf,
  Server,
  Grid3x3,
  BookOpen,
  Loader,
  Plug,
  type LucideIcon,
} from "lucide-react";

export interface IconConfig {
  icon: LucideIcon;
  color: string; // Hex color code
  label: string;
  description?: string;
}

export const DATA_SOURCE_ICONS = {
  database: {
    mongodb: {
      icon: Leaf,
      color: "#13AA52",
      label: "MongoDB",
      description: "NoSQL document database",
    } as IconConfig,
    postgresql: {
      icon: Server,
      color: "#336791",
      label: "PostgreSQL",
      description: "Open source relational database",
    } as IconConfig,
    mysql: {
      icon: Grid3x3,
      color: "#00758F",
      label: "MySQL",
      description: "Open source relational database",
    } as IconConfig,
    mariadb: {
      icon: Grid3x3,
      color: "#003545",
      label: "MariaDB",
      description: "Open source relational database",
    } as IconConfig,
  },
  knowledge_base: {
    internal_kb: {
      icon: BookOpen,
      color: "#7C3AED",
      label: "Knowledge Base",
      description: "Internal knowledge base",
    } as IconConfig,
    knowledge_base: {
      icon: BookOpen,
      color: "#7C3AED",
      label: "Knowledge Base",
      description: "Internal knowledge base",
    } as IconConfig,
  },
  api: {
    rest: {
      icon: Plug,
      color: "#0EA5E9",
      label: "REST API",
      description: "HTTP/JSON API endpoint",
    } as IconConfig,
  },
  coming_soon: {
    default: {
      icon: Loader,
      color: "#9CA3AF",
      label: "Coming Soon",
      description: "More data sources coming soon",
    } as IconConfig,
    graphql: {
      icon: Loader,
      color: "#9CA3AF",
      label: "GraphQL API",
      description: "GraphQL API support",
    } as IconConfig,
  },
} as const;

/**
 * Get icon configuration for a data source type
 * @param category - Data source category
 * @param type - Data source type
 * @returns Icon configuration or default coming soon config
 */
export function getDataSourceIcon(category: string, type: string): IconConfig {
  const categoryConfig =
    DATA_SOURCE_ICONS[category as keyof typeof DATA_SOURCE_ICONS];

  if (!categoryConfig) {
    return DATA_SOURCE_ICONS.coming_soon.default;
  }

  const typeConfig = categoryConfig[type as keyof typeof categoryConfig];

  if (!typeConfig) {
    return DATA_SOURCE_ICONS.coming_soon.default;
  }

  return typeConfig;
}

/**
 * Get all database type icons
 */
export function getDatabaseIcons() {
  return DATA_SOURCE_ICONS.database;
}

/**
 * Get all knowledge base type icons
 */
export function getKnowledgeBaseIcons() {
  return DATA_SOURCE_ICONS.knowledge_base;
}

export function getAPIIcons() {
  return DATA_SOURCE_ICONS.api;
}

/**
 * Get all coming soon type icons
 */
export function getComingSoonIcons() {
  return DATA_SOURCE_ICONS.coming_soon;
}

/**
 * Check if a type is supported (not coming soon)
 */
export function isSupportedType(category: string, type: string): boolean {
  if (category === "database") {
    return ["mongodb", "postgresql", "mysql", "mariadb"].includes(type);
  }
  if (category === "knowledge_base") {
    return ["internal_kb", "knowledge_base"].includes(type);
  }
  if (category === "api") {
    return ["rest"].includes(type);
  }
  return false;
}

/**
 * Available database types
 */
export const AVAILABLE_DATABASE_TYPES = [
  "mongodb",
  "postgresql",
  "mysql",
] as const;

/**
 * Available knowledge base types
 */
export const AVAILABLE_KB_TYPES = ["internal_kb"] as const;

export const AVAILABLE_API_TYPE = ["api"] as const;

/**
 * Coming soon types
 */
export const COMING_SOON_TYPES = ["graphql"] as const;
