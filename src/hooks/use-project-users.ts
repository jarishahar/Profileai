"use client";

import useSWR from "swr";

export function useProjectUsers(
  projectId: string | undefined,
  withRoles?: boolean,
  withAgentCount?: boolean,
) {
  const params = new URLSearchParams();
  if (withRoles) params.append("withRoles", "true");
  if (withAgentCount) params.append("withAgentCount", "true");
  const query = params.toString();
  const url = projectId
    ? `/api/projects/${projectId}/users${query ? "?" + query : ""}`
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    },
  );

  return {
    users: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
