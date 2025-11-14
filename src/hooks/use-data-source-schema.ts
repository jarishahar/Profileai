/**
 * Hook for fetching and caching data source schemas
 * Handles async schema retrieval with error states
 */

import { useEffect, useState } from "react";
import type { DatabaseSchema } from "lib/data-source/database-introspection";

interface SchemaCache {
  [dataSourceId: string]: {
    schema: DatabaseSchema;
    timestamp: number;
  };
}

const SCHEMA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let schemaCache: SchemaCache = {};

export interface DataSourceSchemaState {
  id: string;
  name: string;
  type: string;
  schema?: DatabaseSchema;
  isLoading: boolean;
  error?: string;
}

interface UseDataSourceSchemasProps {
  dataSourceIds: string[];
  projectId: string;
  enabled?: boolean;
  refreshKey?: number; // Change this to force re-fetch
}

/**
 * Fetch schema for a single data source
 * Returns cached schema if available and fresh, otherwise fetches from API
 */
async function fetchDataSourceSchema(
  projectId: string,
  dataSourceId: string,
): Promise<DatabaseSchema> {
  // Check cache
  const cached = schemaCache[dataSourceId];
  if (cached && Date.now() - cached.timestamp < SCHEMA_CACHE_TTL) {
    return cached.schema;
  }

  // Fetch from API
  const response = await fetch(
    `/api/projects/${projectId}/data-sources/${dataSourceId}/schema`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch schema: ${response.statusText}`,
    );
  }

  const schema = (await response.json()) as DatabaseSchema;

  // Cache result
  schemaCache[dataSourceId] = {
    schema,
    timestamp: Date.now(),
  };

  return schema;
}

/**
 * Hook to fetch schemas for multiple data sources
 * Returns array of data sources with schema and loading/error states
 */
export function useDataSourceSchemas({
  dataSourceIds,
  projectId,
  enabled = true,
  refreshKey = 0,
}: UseDataSourceSchemasProps): DataSourceSchemaState[] {
  const [states, setStates] = useState<Map<string, DataSourceSchemaState>>(
    new Map(),
  );

  useEffect(() => {
    if (!enabled || dataSourceIds.length === 0) {
      setStates(new Map());
      return;
    }

    let isMounted = true;

    const fetchSchemas = async () => {
      // Initialize loading states
      const initialStates = new Map(
        dataSourceIds.map((id) => [
          id,
          {
            id,
            name: "",
            type: "",
            isLoading: true,
          } as DataSourceSchemaState,
        ]),
      );
      
      if (isMounted) {
        setStates(initialStates);
      }

      // Fetch all schemas in parallel
      const results = await Promise.allSettled(
        dataSourceIds.map((id) => fetchDataSourceSchema(projectId, id)),
      );

      if (!isMounted) return;

      // Update states with results
      const updatedStates = new Map(initialStates);
      results.forEach((result, index) => {
        const id = dataSourceIds[index];
        const state = updatedStates.get(id) || {
          id,
          name: "",
          type: "",
        };

        if (result.status === "fulfilled") {
          updatedStates.set(id, {
            ...state,
            schema: result.value,
            isLoading: false,
          });
        } else {
          updatedStates.set(id, {
            ...state,
            error: result.reason instanceof Error ? result.reason.message : "Unknown error",
            isLoading: false,
          });
        }
      });

      if (isMounted) {
        setStates(updatedStates);
      }
    };

    void fetchSchemas();

    return () => {
      isMounted = false;
    };
  }, [dataSourceIds, enabled, projectId, refreshKey]);

  return Array.from(states.values());
}

/**
 * Clear schema cache (useful for manual refresh)
 */
export function clearSchemaCache() {
  schemaCache = {};
}

/**
 * Clear specific data source from cache
 */
export function clearDataSourceSchemaCache(dataSourceId: string) {
  delete schemaCache[dataSourceId];
}
