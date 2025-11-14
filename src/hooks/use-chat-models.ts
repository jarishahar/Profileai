"use client";

import { useEffect, useState } from "react";

export interface ModelInfo {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}

export interface ProviderModels {
  provider: string;
  providerName: string;
  hasAPIKey: boolean;
  models: ModelInfo[];
}

export interface UseChatModelsResult {
  providers: ProviderModels[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for fetching available chat models
 * Used in agent form and other components to populate model selection
 */
export function useChatModels(): UseChatModelsResult {
  const [providers, setProviders] = useState<ProviderModels[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/chat/models");
        if (!response.ok) {
          throw new Error("Failed to fetch models");
        }

        const data = await response.json();
        setProviders(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        console.error("Error fetching chat models:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []);

  return { providers, isLoading, error };
}
