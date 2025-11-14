import logger from "logger";
import { Tool } from "./db/pg/schema.pg";

/**
 * Anthropic Claude Tool Definition (AI-SDK compatible)
 * https://sdk.vercel.ai/docs/foundations/tools
 */
export interface AiSdkToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

/**
 * AI-SDK Schema Formatter & Validator
 * Converts tool definitions to AI-SDK compatible format and validates schemas
 */
export class AiSdkFormatter {
  /**
   * Format a tool for AI-SDK (Claude, OpenAI, etc.)
   * Returns AI-SDK compatible tool definition or null if invalid
   */
  static formatForAiSdk(tool: Tool): AiSdkToolDefinition | null {
    try {
      // Validate basic requirements
      if (!tool.name || !tool.description) {
        logger.warn(`Tool ${tool.id} missing name or description`);
        return null;
      }

      if (!tool.inputSchema || typeof tool.inputSchema !== "object") {
        logger.warn(`Tool ${tool.id} has invalid inputSchema`);
        return null;
      }

      // Build AI-SDK tool definition
      const aiSdkTool: AiSdkToolDefinition = {
        name: this.formatToolName(tool.name),
        description: tool.description,
        parameters: this.formatInputSchema(
          tool.inputSchema as Record<string, any>,
        ),
      };

      return aiSdkTool;
    } catch (error) {
      logger.error(`Failed to format tool ${tool.id} for AI-SDK:`, error);
      return null;
    }
  }

  /**
   * Validate that a tool schema is compatible with AI-SDK
   * Returns validation result with details
   */
  static validateAiSdkCompatibility(tool: Tool): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check name
    if (!tool.name) {
      errors.push("Tool name is required");
    } else if (!this.isValidToolName(tool.name)) {
      errors.push(
        `Tool name "${tool.name}" is invalid. Must be snake_case, alphanumeric and underscores only`,
      );
    }

    // Check description
    if (!tool.description) {
      errors.push("Tool description is required");
    }

    // Check input schema
    if (!tool.inputSchema) {
      errors.push("Input schema is required");
    } else if (typeof tool.inputSchema !== "object") {
      errors.push("Input schema must be a JSON object");
    } else {
      const schema = tool.inputSchema as Record<string, any>;

      // Validate schema structure
      if (!schema.type || schema.type !== "object") {
        errors.push('Input schema type must be "object"');
      }

      if (!schema.properties || typeof schema.properties !== "object") {
        errors.push('Input schema must have "properties" object');
      } else {
        // Validate each property
        for (const [propName, propSchema] of Object.entries(
          schema.properties,
        )) {
          const prop = propSchema as Record<string, any>;

          if (!prop.type) {
            errors.push(`Property "${propName}" missing required "type" field`);
          }

          if (!prop.description) {
            warnings.push(`Property "${propName}" should have a description`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Format tool name to AI-SDK compatible format
   * Converts to snake_case, max 64 characters
   */
  private static formatToolName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, "_") // spaces to underscores
      .replace(/[^a-z0-9_]/g, "") // remove invalid characters
      .substring(0, 64); // max 64 characters
  }

  /**
   * Check if tool name is valid for AI-SDK
   */
  private static isValidToolName(name: string): boolean {
    // Must be snake_case, alphanumeric and underscores
    const validPattern = /^[a-z0-9_]+$/;
    return (
      validPattern.test(name) && name.length <= 64 && !name.startsWith("_")
    );
  }

  /**
   * Format input schema to AI-SDK compatible JSON schema
   */
  private static formatInputSchema(
    schema: Record<string, any>,
  ): Record<string, any> {
    // If already properly formatted, return as is
    if (schema.type === "object" && schema.properties) {
      return schema;
    }

    // Otherwise, wrap in object structure
    return {
      type: "object",
      properties: schema.properties || schema,
      required: schema.required || [],
    };
  }

  /**
   * Convert Zod schema to AI-SDK format
   * This helps if you want to build schemas programmatically
   */
  static zodToAiSdk(zodSchema: Record<string, any>): Record<string, any> {
    try {
      // Extract JSON schema from Zod
      const jsonSchema = zodSchema._def || zodSchema;

      return {
        type: "object",
        properties: jsonSchema.shape || jsonSchema.properties || {},
        required: jsonSchema.required || [],
      };
    } catch (error) {
      logger.error("Failed to convert Zod schema to AI-SDK format:", error);
      return { type: "object", properties: {}, required: [] };
    }
  }

  /**
   * Build a complete AI-SDK tool with error handling
   * Suitable for use with `tool()` from Anthropic SDK
   */
  static buildAiSdkTool(
    tool: Tool,
    handler: (
      input: Record<string, any>,
    ) => Promise<string | Record<string, any>>,
  ): any {
    const formatted = this.formatForAiSdk(tool);
    if (!formatted) {
      throw new Error(`Failed to format tool ${tool.name} for AI-SDK`);
    }

    return {
      ...formatted,
      execute: handler,
      // Metadata for tracking
      toolId: tool.id,
      toolVersion: tool.version,
    };
  }

  /**
   * Validate AI-SDK tool response format
   */
  static validateToolResponse(
    response: any,
    expectedOutputSchema?: Record<string, any>,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check response is not null/undefined
    if (response === null || response === undefined) {
      errors.push("Tool response cannot be null or undefined");
      return { valid: false, errors };
    }

    // Convert to string if needed
    const responseStr =
      typeof response === "string" ? response : JSON.stringify(response);

    if (!responseStr) {
      errors.push("Tool response is empty");
      return { valid: false, errors };
    }

    // Validate against output schema if provided
    if (expectedOutputSchema) {
      try {
        const responseObj =
          typeof response === "string" ? JSON.parse(responseStr) : response;

        // Basic type checking
        if (
          expectedOutputSchema.type === "object" &&
          typeof responseObj !== "object"
        ) {
          errors.push(
            `Expected object response, got ${typeof responseObj}: ${responseStr.substring(0, 50)}`,
          );
        }
      } catch (error) {
        // String responses are valid
        if (expectedOutputSchema.type !== "string") {
          errors.push(
            `Invalid JSON response: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate example AI-SDK format for documentation
   */
  static generateExample(): AiSdkToolDefinition {
    return {
      name: "example_tool",
      description: "Example tool definition for AI-SDK",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query",
          },
          limit: {
            type: "number",
            description: "Maximum number of results",
          },
        },
        required: ["query"],
      },
    };
  }
}

export default AiSdkFormatter;
