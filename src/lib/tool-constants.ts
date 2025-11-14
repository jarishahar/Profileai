/**
 * Tool Configuration Constants
 */

export const TOOL_CATEGORIES = {
  data_source: { value: "data_source", label: "Data Source", icon: "📊" },
  processor: { value: "processor", label: "Processor", icon: "⚙️" },
  visualization: { value: "visualization", label: "Visualization", icon: "📈" },
  action: { value: "action", label: "Action", icon: "✨" },
  integration: { value: "integration", label: "Integration", icon: "🔗" },
} as const;

export const TOOL_TYPES = {
  mcp: {
    value: "mcp",
    label: "MCP (Model Context Protocol)",
    icon: "🔄",
    disabled: false,
  },
  api: { value: "api", label: "API (Coming Soon)", icon: "🌐", disabled: true },
  javascript: {
    value: "javascript",
    label: "JavaScript (Coming Soon)",
    icon: "✨",
    disabled: true,
  },
  database: {
    value: "database",
    label: "Database (Coming Soon)",
    icon: "🗄️",
    disabled: true,
  },
  webhook: {
    value: "webhook",
    label: "Webhook (Coming Soon)",
    icon: "🪝",
    disabled: true,
  },
} as const;

export const TOOL_STATUSES = {
  draft: { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  active: {
    value: "active",
    label: "Active",
    color: "bg-green-100 text-green-800",
  },
  deprecated: {
    value: "deprecated",
    label: "Deprecated",
    color: "bg-red-100 text-red-800",
  },
} as const;
