import { NextResponse } from "next/server";
import { getAvailableModels } from "lib/ai/models";

/**
 * GET /api/chat/models
 *
 * Returns available LLM models organized by provider
 * Used by the agent form to populate model selection dropdown
 */
export async function GET() {
  try {
    const models = getAvailableModels();

    // Sort by provider (those with API keys first)
    const sorted = models.sort((a, b) => {
      if (a.hasAPIKey && !b.hasAPIKey) return -1;
      if (!a.hasAPIKey && b.hasAPIKey) return 1;
      return 0;
    });

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 },
    );
  }
}
