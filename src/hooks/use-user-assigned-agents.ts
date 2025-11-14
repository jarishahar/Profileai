"use client";

import useSWR from "swr";

interface UserAgent {
  agentId: string;
  agentName: string;
}

export function useUserAssignedAgents(
  projectId: string | undefined,
  userId: string | undefined,
) {
  const url =
    projectId && userId
      ? `/api/projects/${projectId}/users/${userId}/agents`
      : null;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch assigned agents");
      return res.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    },
  );

  return {
    assignedAgents: (data?.data || []) as UserAgent[],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
