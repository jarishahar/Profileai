"use client";

import useSWR from "swr";

export function useProjectRoles(
  projectId: string | undefined,
  withUserCount?: boolean,
) {
  const url = projectId
    ? `/api/projects/${projectId}/roles${withUserCount ? "?withUserCount=true" : ""}`
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch roles");
      return res.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    },
  );

  return {
    roles: data?.data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
