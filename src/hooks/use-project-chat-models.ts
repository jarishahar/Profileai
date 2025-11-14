import { useState, useEffect } from "react";

export interface ModelInfo {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  enabled?: boolean;
}

export interface ProviderModels {
  provider: string;
  providerName: string;
  hasAPIKey: boolean;
  models: ModelInfo[];
}

export interface UseProjectChatModelsResult {
  models: ProviderModels[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch available LLM models for a specific project
 * Checks project-level API key configurations to determine available providers
 */
export function useProjectChatModels(
  projectId: string,
): UseProjectChatModelsResult {
  const [models, setModels] = useState<ProviderModels[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/models`);

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      setModels(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error fetching project models:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [projectId]);

  const refetch = async () => {
    await fetchModels();
  };

  return { models, loading, error, refetch };
}
