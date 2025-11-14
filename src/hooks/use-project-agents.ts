"use client";

import useSWR from "swr";

interface ProjectAgent {
  id: string;
  name: string;
  description?: string;
  status?: string;
}

export function useProjectAgents(projectId: string | undefined) {
  const url = projectId ? `/api/projects/${projectId}/agents` : null;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    },
  );

  return {
    agents: (data?.agents || []) as ProjectAgent[],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
