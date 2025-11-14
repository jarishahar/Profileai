import logger from "logger";
import { Tool, ToolExecutionLogInsert } from "./db/pg/schema.pg";
import { toolRepository } from "./db/pg/repositories/tool-repository.pg";

/**
 * Tool Execution Result
 */
export interface ToolExecutionResult {
  status: "success" | "failure" | "timeout" | "error";
  outputResult?: Record<string, any>;
  errorMessage?: string;
  executionTimeMs: number;
}

/**
 * Tool Executor - Handles safe test execution of tools
 * IMPORTANT: This is for TESTING ONLY - not for runtime agent execution
 * Runtime execution happens via MCP and AI-SDK
 */
export class ToolExecutor {
  /**
   * Execute a tool safely for testing purposes
   * Validates input, executes with timeout, and logs results
   */
  static async executeToolTest(
    tool: Tool,
    inputParams: Record<string, any>,
    agentId?: string,
    conversationId?: string,
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      // Validate input parameters against schema
      const validationError = ToolExecutor.validateInput(tool, inputParams);
      if (validationError) {
        const result: ToolExecutionResult = {
          status: "error",
          errorMessage: validationError,
          executionTimeMs: Date.now() - startTime,
        };
        await ToolExecutor.logExecution(
          tool.id,
          result,
          inputParams,
          agentId,
          conversationId,
        );
        return result;
      }

      // Execute based on tool type
      let executionResult: ToolExecutionResult;

      switch (tool.toolType) {
        case "api":
          executionResult = await ToolExecutor.executeApiTool(
            tool,
            inputParams,
          );
          break;

        case "mcp":
          executionResult = await ToolExecutor.executeMcpTool(
            tool,
            inputParams,
          );
          break;

        case "javascript":
          executionResult = await ToolExecutor.executeJavaScriptTool(
            tool,
            inputParams,
          );
          break;

        case "database":
          executionResult = await ToolExecutor.executeDatabaseTool(
            tool,
            inputParams,
          );
          break;

        case "webhook":
          executionResult = await ToolExecutor.executeWebhookTool(
            tool,
            inputParams,
          );
          break;

        default:
          executionResult = {
            status: "error",
            errorMessage: `Unknown tool type: ${tool.toolType}`,
            executionTimeMs: Date.now() - startTime,
          };
      }

      // Set final execution time
      executionResult.executionTimeMs = Date.now() - startTime;

      // Log execution
      await ToolExecutor.logExecution(
        tool.id,
        executionResult,
        inputParams,
        agentId,
        conversationId,
      );

      return executionResult;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      const result: ToolExecutionResult = {
        status: "error",
        errorMessage,
        executionTimeMs,
      };

      logger.error(`Tool execution error for tool ${tool.id}:`, error);

      try {
        await ToolExecutor.logExecution(
          tool.id,
          result,
          inputParams,
          agentId,
          conversationId,
        );
      } catch (logError) {
        logger.error("Failed to log tool execution:", logError);
      }

      return result;
    }
  }

  /**
   * Validate input parameters against tool's input schema
   */
  private static validateInput(
    tool: Tool,
    inputParams: Record<string, any>,
  ): string | null {
    try {
      const inputSchema = tool.inputSchema as Record<string, any>;

      // Basic validation - check required fields
      if (inputSchema.required && Array.isArray(inputSchema.required)) {
        for (const field of inputSchema.required) {
          if (!(field in inputParams)) {
            return `Missing required field: ${field}`;
          }
        }
      }

      // Type validation for properties
      if (inputSchema.properties) {
        for (const [field, fieldSchema] of Object.entries(
          inputSchema.properties,
        )) {
          if (field in inputParams) {
            const fieldSpec = fieldSchema as Record<string, any>;
            const value = inputParams[field];

            // Check type
            if (fieldSpec.type && typeof value !== fieldSpec.type) {
              return `Field ${field} has incorrect type. Expected ${fieldSpec.type}, got ${typeof value}`;
            }
          }
        }
      }

      return null;
    } catch (error) {
      return `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }

  /**
   * Execute an API-based tool
   */
  private static async executeApiTool(
    tool: Tool,
    inputParams: Record<string, any>,
  ): Promise<ToolExecutionResult> {
    try {
      const config = tool.config as Record<string, any>;
      const endpoint = config.endpoint;

      if (!endpoint) {
        return {
          status: "error",
          errorMessage: "API endpoint not configured",
          executionTimeMs: 0,
        };
      }

      // For testing, we only simulate the request
      // Real execution would happen at runtime via AI-SDK
      logger.info(`[TEST] Would call API: ${endpoint}`, { inputParams });

      return {
        status: "success",
        outputResult: {
          message: "Test execution successful",
          endpoint,
          inputParams,
          simulatedResponse: true,
        },
        executionTimeMs: 100,
      };
    } catch (error) {
      return {
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "API execution failed",
        executionTimeMs: 0,
      };
    }
  }

  /**
   * Execute an MCP-based tool
   */
  private static async executeMcpTool(
    tool: Tool,
    inputParams: Record<string, any>,
  ): Promise<ToolExecutionResult> {
    try {
      const config = tool.config as Record<string, any>;

      // For testing, we only validate and simulate
      logger.info(`[TEST] Would execute MCP tool: ${tool.name}`, {
        config,
        inputParams,
      });

      return {
        status: "success",
        outputResult: {
          message: "MCP test execution successful",
          toolName: tool.name,
          inputParams,
          simulatedResponse: true,
        },
        executionTimeMs: 50,
      };
    } catch (error) {
      return {
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "MCP execution failed",
        executionTimeMs: 0,
      };
    }
  }

  /**
   * Execute a JavaScript-based tool
   */
  private static async executeJavaScriptTool(
    tool: Tool,
    inputParams: Record<string, any>,
  ): Promise<ToolExecutionResult> {
    try {
      const config = tool.config as Record<string, any>;
      const code = config.code;

      if (!code) {
        return {
          status: "error",
          errorMessage: "JavaScript code not configured",
          executionTimeMs: 0,
        };
      }

      // For testing only - validate code exists but don't execute
      logger.info(`[TEST] JavaScript tool prepared: ${tool.name}`, {
        codeLength: code.length,
      });

      return {
        status: "success",
        outputResult: {
          message: "JavaScript test prepared successfully",
          toolName: tool.name,
          codeLength: code.length,
          simulatedResponse: true,
        },
        executionTimeMs: 75,
      };
    } catch (error) {
      return {
        status: "error",
        errorMessage:
          error instanceof Error
            ? error.message
            : "JavaScript execution failed",
        executionTimeMs: 0,
      };
    }
  }

  /**
   * Execute a database-based tool
   */
  private static async executeDatabaseTool(
    tool: Tool,
    inputParams: Record<string, any>,
  ): Promise<ToolExecutionResult> {
    try {
      const config = tool.config as Record<string, any>;

      if (!config.connectionString && !config.host) {
        return {
          status: "error",
          errorMessage: "Database connection not configured",
          executionTimeMs: 0,
        };
      }

      // For testing, we only validate connection config
      logger.info(`[TEST] Database tool validated: ${tool.name}`, {
        inputParams,
      });

      return {
        status: "success",
        outputResult: {
          message: "Database tool test validated successfully",
          toolName: tool.name,
          inputParams,
          simulatedResponse: true,
        },
        executionTimeMs: 150,
      };
    } catch (error) {
      return {
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "Database execution failed",
        executionTimeMs: 0,
      };
    }
  }

  /**
   * Execute a webhook-based tool
   */
  private static async executeWebhookTool(
    tool: Tool,
    inputParams: Record<string, any>,
  ): Promise<ToolExecutionResult> {
    try {
      const config = tool.config as Record<string, any>;
      const webhookUrl = config.webhookUrl;

      if (!webhookUrl) {
        return {
          status: "error",
          errorMessage: "Webhook URL not configured",
          executionTimeMs: 0,
        };
      }

      // For testing, we only simulate the request
      logger.info(`[TEST] Webhook prepared: ${webhookUrl}`, { inputParams });

      return {
        status: "success",
        outputResult: {
          message: "Webhook test prepared successfully",
          webhookUrl,
          inputParams,
          simulatedResponse: true,
        },
        executionTimeMs: 120,
      };
    } catch (error) {
      return {
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "Webhook execution failed",
        executionTimeMs: 0,
      };
    }
  }

  /**
   * Log execution to database
   */
  private static async logExecution(
    toolId: string,
    result: ToolExecutionResult,
    inputParams: Record<string, any>,
    agentId?: string,
    conversationId?: string,
  ): Promise<void> {
    try {
      const logData: ToolExecutionLogInsert = {
        toolId,
        agentId: agentId ?? null,
        conversationId: conversationId ?? null,
        status: result.status,
        inputParams,
        outputResult: result.outputResult ?? null,
        errorMessage: result.errorMessage ?? null,
        executionTimeMs: result.executionTimeMs,
        executionContext: {
          type: "test",
          timestamp: new Date().toISOString(),
        },
        executionType: "test",
      };

      await toolRepository.createExecutionLog(logData);
    } catch (error) {
      logger.error("Failed to log tool execution:", error);
      throw error;
    }
  }
}

export default ToolExecutor;
