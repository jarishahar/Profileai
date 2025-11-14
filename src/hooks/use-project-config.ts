"use client";

import { useEffect, useState, useCallback } from "react";

export interface ProjectConfigItem {
  id: string;
  provider: string;
  type?: string; // 'generative' or 'vertex' for Google provider
  enabled: boolean;
  name?: string;
  description?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseProjectConfigResult {
  configs: ProjectConfigItem[];
  isLoading: boolean;
  error: Error | null;
  saveConfig: (
    provider: string,
    apiKey: string,
    name?: string,
    description?: string,
    enabled?: boolean,
    type?: string,
  ) => Promise<void>;
  deleteConfig: (configId: string) => Promise<void>;
  toggleConfig: (configId: string, enabled: boolean) => Promise<void>;
  refreshConfigs: () => Promise<void>;
}

/**
 * Hook for managing project provider configurations (API keys, etc.)
 * Used in project settings page to configure provider credentials
 */
export function useProjectConfig(projectId: string): UseProjectConfigResult {
  const [configs, setConfigs] = useState<ProjectConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshConfigs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/config`);
      if (!response.ok) {
        throw new Error("Failed to fetch project configurations");
      }

      const data = await response.json();
      setConfigs(data.configs || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      console.error("Error fetching project configs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refreshConfigs();
  }, [refreshConfigs]);

  const saveConfig = useCallback(
    async (
      provider: string,
      apiKey: string,
      name?: string,
      description?: string,
      enabled: boolean = true,
      type?: string,
    ) => {
      try {
        setError(null);

        const response = await fetch(`/api/projects/${projectId}/config`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider,
            apiKey,
            name,
            description,
            enabled,
            type,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save configuration");
        }

        await refreshConfigs();
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        console.error("Error saving config:", error);
        throw error;
      }
    },
    [projectId, refreshConfigs],
  );

  const deleteConfig = useCallback(
    async (configId: string) => {
      try {
        setError(null);

        const response = await fetch(
          `/api/projects/${projectId}/config/${configId}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to delete configuration");
        }

        await refreshConfigs();
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        console.error("Error deleting config:", error);
        throw error;
      }
    },
    [projectId, refreshConfigs],
  );

  const toggleConfig = useCallback(
    async (configId: string, enabled: boolean) => {
      try {
        setError(null);

        // Find the config to get its provider
        const config = configs.find((c) => c.id === configId);
        if (!config) throw new Error("Config not found");

        // Call a separate PATCH endpoint to toggle without requiring apiKey
        const response = await fetch(
          `/api/projects/${projectId}/config/${configId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enabled }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to toggle config");
        }

        // Update local state
        setConfigs((prevConfigs) =>
          prevConfigs.map((c) => (c.id === configId ? { ...c, enabled } : c)),
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        console.error("Error toggling config:", error);
        throw error;
      }
    },
    [projectId, configs],
  );

  return {
    configs,
    isLoading,
    error,
    saveConfig,
    deleteConfig,
    toggleConfig,
    refreshConfigs,
  };
}
