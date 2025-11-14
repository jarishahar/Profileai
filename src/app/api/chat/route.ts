import { google } from "@ai-sdk/google";
import { convertToModelMessages, stepCountIs, streamText, tool } from "ai";
import { z } from "zod";
import { getSession } from "auth/server";
import { pgDb } from "lib/db/pg/db.pg";
import { knowledgeBase } from "lib/db/pg/schema.pg";
import { eq, and } from "drizzle-orm";
import { searchKnowledge } from "lib/knowledge/search-service";

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, knowledgeBaseId } = await req.json();

    // Verify user has access to this knowledge base
    const [kb] = await pgDb
      .select()
      .from(knowledgeBase)
      .where(
        and(
          eq(knowledgeBase.id, knowledgeBaseId),
          eq(knowledgeBase.userId, session.user.id)
        )
      );

    if (!kb) {
      return new Response("Knowledge base not found or access denied", {
        status: 403,
      });
    }

    // Define tools using the tool() helper
    const tools = {
      search_knowledge_base: tool({
        description: `Search for relevant information in the "${kb.name}" knowledge base using semantic similarity. Use this tool to find specific information from the documents.`,
        inputSchema: z.object({
          query: z.string().describe("The search query text"),
          limit: z
            .number()
            .optional()
            .default(5)
            .describe("Maximum number of results to return"),
          threshold: z
            .number()
            .optional()
            .default(0.5)
            .describe("Minimum similarity threshold (0-1)"),
        }),
        execute: async ({ query, limit = 5, threshold = 0.5 }) => {
          console.log("AI is searching knowledge base:", {
            query,
            limit,
            threshold,
            kbId: knowledgeBaseId,
          });

          try {
            const results = await searchKnowledge(knowledgeBaseId, query, {
              limit,

              enabledOnly: true,
            });

            if (results.length === 0) {
              return {
                success: false,
                message: `No relevant information found for query: "${query}". Try rephrasing or lowering the threshold.`,
                results: [],
              };
            }

            return {
              success: true,
              message: `Found ${results.length} relevant results`,
              results: results.map((r, i) => ({
                rank: i + 1,
                content: r.content,
                similarity: `${(r.similarity * 100).toFixed(1)}%`,
                chunkIndex: r.chunkIndex,
                tokenCount: r.tokenCount,
              })),
            };
          } catch (error) {
            console.error("Error in search_knowledge_base tool:", error);
            return {
              success: false,
              message: `Error searching knowledge base: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
              results: [],
            };
          }
        },
      }),
      get_knowledge_base_info: tool({
        description: `Get information about the current knowledge base "${kb.name}", including its description, document count, and configuration.`,
        inputSchema: z.object({}),
        execute: async () => {
          console.log("AI is retrieving knowledge base info:", {
            knowledgeBaseId,
          });
          return {
            name: kb.name,
            description: kb.description || "No description provided",
            embeddingModel: kb.embeddingModel,
            totalTokens: kb.tokenCount || 0,
            id: kb.id,
          };
        },
      }),
    };

    // Create streaming text response with tools
    const result = streamText({
      model: google("gemini-2.5-flash"),
      messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(5),
      tools,
      system: `You are an AI assistant that helps users understand and explore their profile.

CRITICAL INSTRUCTIONS FOR SEARCH QUERIES:
- You MUST use the search_knowledge_base tool to answer ANY question about content, topics, summaries, or specific information
- NEVER make up or assume what's in the knowledge base - ALWAYS search first
- When users ask "what topics" or "summarize", make multiple searches with SPECIFIC, DESCRIPTIVE queries like:
  * "business requirements and objectives"
  * "technical specifications and features"
  * "project scope and deliverables"
  * "user requirements and use cases"
  * "system architecture and design"
- NEVER use generic single-word queries like "summary", "topics", or "overview"
- Use threshold 0.2 for broad exploration, 0.3-0.4 for specific searches
- Make 2-4 different searches with varied queries to cover different aspects
- ONLY use get_knowledge_base_info when asked specifically about metadata (token count, model, etc.)

${kb.description ? `Knowledge base description: ${kb.description}\n` : ""}

Response format:
1. Search the knowledge base with 2-4 specific, descriptive queries covering different aspects
2. Synthesize the actual content found across all searches
3. Present a comprehensive answer with proper citations
4. If no results, try lowering threshold to 0.1 or suggest different keywords
5. Do NOT include chunk numbers or similarity scores in the final answer. Only use them internally for reasoning.

Be conversational but precise. Format responses with markdown for readability.`,
      temperature: 0.7,
      onStepFinish: ({ toolCalls, toolResults }) => {
        console.log("Step finished:", {
          toolCallsCount: toolCalls?.length,
          toolResultsCount: toolResults?.length,
          toolNames: toolCalls?.map((tc) => tc.toolName),
        });
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
