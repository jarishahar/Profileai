"use client";

import useSWR from "swr";

export function useUserAgentAccess(
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
      if (!res.ok) throw new Error("Failed to fetch agent access");
      return res.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    },
  );

  return {
    agents: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
