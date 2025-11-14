/**
 * Hook to fetch agent's assigned data sources
 */

import useSWR from "swr";
import type { DataSource } from "app-types/data-source";

interface AssignedDataSource extends DataSource {
  selectedTools: string[];
}

export function useAgentDataSources(projectId: string, agentId: string) {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: AssignedDataSource[];
  }>(
    agentId
      ? `/api/projects/${projectId}/agents/${agentId}/data-sources`
      : null,
    (url) => fetch(url).then((res) => res.json()),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  );

  return {
    dataSources: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook to fetch all available data sources for a project
 * Separates databases and knowledge bases
 */
export function useProjectDataSources(projectId: string) {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: (DataSource & { category?: string })[];
  }>(
    projectId ? `/api/projects/${projectId}/data-sources-with-kb` : null,
    (url) => fetch(url).then((res) => res.json()),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  );

  // Separate databases and knowledge bases
  const databases = (data?.data || []).filter(
    (ds) => ds.category === "database",
  );
  const knowledgeBases = (data?.data || []).filter(
    (ds) => ds.category === "knowledge_base",
  );
  const apis = (data?.data || []).filter((ds) => ds.category === "api");

  return {
    dataSources: data?.data || [],
    databases,
    knowledgeBases,
    apis,
    isLoading,
    error,
    mutate,
  };
}
