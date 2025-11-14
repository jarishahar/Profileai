import "server-only";

import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { vertex } from "@ai-sdk/google-vertex";
import { LanguageModel } from "ai";

/**
 * AI Models Configuration
 *
 * Comprehensive list of available LLM models organized by provider.
 * Models marked as enabled can be used; others show "Coming Soon" in the UI.
 *
 * Currently supported SDKs: OpenAI, Google, Google Vertex AI
 * Future support: Anthropic, xAI, Mistral, DeepSeek (requires SDK installation)
 * 
 * Note: Vertex AI models are not eagerly loaded because they require runtime configuration
 * (GOOGLE_VERTEX_LOCATION). They are only instantiated when actually used by a project.
 */

const staticModels = {
  openai: {
    "gpt-4o": openai("gpt-4o"),
    "gpt-4o-mini": openai("gpt-4o-mini"),
    "gpt-4-turbo": openai("gpt-4-turbo"),
    "gpt-4": openai("gpt-4"),
  },
  google: {
    "generative/gemini-2.5-flash": google("gemini-2.5-flash"),
    "generative/gemini-2.0-flash": google("gemini-2.0-flash"),
  },
};

/**
 * Model metadata with provider, display name, and status
 */
export const modelsMetadata = {
  openai: {
    provider: "OpenAI",
    apiKeyEnv: "OPENAI_API_KEY",
    models: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        enabled: true,
        description: "Most capable model, best for complex tasks",
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        enabled: true,
        description: "Faster and cheaper, great for simple tasks",
      },
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        enabled: true,
        description: "Previous generation turbo model",
      },
      {
        id: "gpt-4",
        name: "GPT-4",
        enabled: true,
        description: "Base GPT-4 model",
      },
    ],
  },
  google: {
    provider: "Google",
    apiKeyEnv: "GOOGLE_GENERATIVE_AI_API_KEY",
    models: [
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        enabled: true,
        description: "Fastest Google model, excellent reasoning",
      },
      {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        enabled: true,
        description: "High-speed multimodal model",
      },
    ],
  },
  anthropic: {
    provider: "Anthropic",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    models: [
      {
        id: "claude-3-5-sonnet",
        name: "Claude 3.5 Sonnet",
        enabled: false,
        description: "Most capable Claude model (Coming Soon)",
      },
      {
        id: "claude-3-opus",
        name: "Claude 3 Opus",
        enabled: false,
        description: "Most capable previous generation (Coming Soon)",
      },
      {
        id: "claude-3-sonnet",
        name: "Claude 3 Sonnet",
        enabled: false,
        description: "Balanced capabilities (Coming Soon)",
      },
    ],
  },
  xai: {
    provider: "xAI",
    apiKeyEnv: "XAI_API_KEY",
    models: [
      {
        id: "grok-beta",
        name: "Grok Beta",
        enabled: false,
        description: "Latest Grok model (Coming Soon)",
      },
      {
        id: "grok-3",
        name: "Grok 3",
        enabled: false,
        description: "Advanced reasoning model (Coming Soon)",
      },
    ],
  },
  mistral: {
    provider: "Mistral",
    apiKeyEnv: "MISTRAL_API_KEY",
    models: [
      {
        id: "mistral-large",
        name: "Mistral Large",
        enabled: false,
        description: "Most capable Mistral model (Coming Soon)",
      },
      {
        id: "mistral-8x7b",
        name: "Mistral 8x7B",
        enabled: false,
        description: "Efficient mixture of experts (Coming Soon)",
      },
    ],
  },
  deepseek: {
    provider: "DeepSeek",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    models: [
      {
        id: "deepseek-chat",
        name: "DeepSeek Chat",
        enabled: false,
        description: "High-performance chat model (Coming Soon)",
      },
      {
        id: "deepseek-coder",
        name: "DeepSeek Coder",
        enabled: false,
        description: "Specialized for code (Coming Soon)",
      },
    ],
  },
};

const fallbackModel = staticModels.openai["gpt-4o"];

/**
 * Get all available models organized by provider
 * Used for API responses and UI dropdowns
 */
export function getAvailableModels() {
  return Object.entries(modelsMetadata).map(([providerKey, providerData]) => ({
    provider: providerKey,
    providerName: providerData.provider,
    hasAPIKey: checkProviderAPIKey(providerKey as keyof typeof modelsMetadata),
    models: providerData.models,
  }));
}

/**
 * Get a language model instance by provider and model ID
 * For Google provider, optionally specify type: 'generative' or 'vertex'
 * 
 * Vertex models are lazily instantiated to avoid requiring GOOGLE_VERTEX_LOCATION at startup
 */
export function getModel(provider: string, modelId: string, type?: string): LanguageModel {
  try {
    // Special handling for Vertex AI - lazy load to avoid startup errors
    if (provider === "google" && type === "vertex") {
      try {
        return vertex(modelId);
      } catch (error) {
        console.error(
          `Failed to initialize Vertex AI model ${modelId}. Make sure GOOGLE_VERTEX_LOCATION is set:`,
          error
        );
        return fallbackModel;
      }
    }

    const models = (
      staticModels as Record<string, Record<string, LanguageModel>>
    )[provider];
    
    if (models) {
      // For Google Generative AI - use the model key with type prefix
      if (provider === "google" && type === "generative") {
        const typeKey = `${type}/${modelId}`;
        if (models[typeKey]) {
          return models[typeKey];
        }
      }
      
      // Fall back to model ID without type
      if (models[modelId]) {
        return models[modelId];
      }
    }
  } catch (error) {
    console.error(`Failed to get model ${provider}/${modelId}:`, error);
  }
  return fallbackModel;
}

/**
 * Check if provider has configured API key
 */
function checkProviderAPIKey(provider: keyof typeof modelsMetadata): boolean {
  const apiKeyEnv = modelsMetadata[provider].apiKeyEnv;
  const key = process.env[apiKeyEnv];
  return !!key && key !== "****" && key !== "";
}

/**
 * Get model display name (provider/model format)
 */
export function getModelDisplayName(provider: string, modelId: string): string {
  const providerData = (modelsMetadata as Record<string, any>)[provider];
  if (!providerData) return `${provider}/${modelId}`;

  const model = providerData.models.find((m: any) => m.id === modelId);
  return model ? `${provider}/${modelId}` : `${provider}/${modelId}`;
}

/**
 * Get model metadata
 */
export function getModelMetadata(provider: string, modelId: string) {
  const providerData = (modelsMetadata as Record<string, any>)[provider];
  if (!providerData) return null;

  return providerData.models.find((m: any) => m.id === modelId) || null;
}
