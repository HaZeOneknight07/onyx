import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRealtime } from "@/hooks/useRealtime";
import type { RealtimeEvent } from "@/lib/realtime";

export interface Relation {
  id: string;
  sourceDocId: string;
  targetDocId: string;
  relationType: string;
  createdAt: string;
}

interface RelationQuery {
  sourceDocId?: string;
  targetDocId?: string;
}

export function useRelations(projectId: string | undefined, query?: RelationQuery) {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);

  const matchesQuery = useCallback(
    (relation: Relation) => {
      if (query?.sourceDocId && relation.sourceDocId !== query.sourceDocId) return false;
      if (query?.targetDocId && relation.targetDocId !== query.targetDocId) return false;
      return true;
    },
    [query?.sourceDocId, query?.targetDocId]
  );

  const refresh = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query?.sourceDocId) params.set("sourceDocId", query.sourceDocId);
      if (query?.targetDocId) params.set("targetDocId", query.targetDocId);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const data = await api.get<Relation[]>(`/projects/${projectId}/relations${suffix}`);
      setRelations(data);
    } catch {
      setRelations([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, query?.sourceDocId, query?.targetDocId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRealtime = useCallback(
    (event: RealtimeEvent) => {
      if (event.entity !== "relations") return;
      setRelations((current) => {
        if (event.action === "delete") {
          return current.filter((rel) => rel.id !== event.id);
        }
        const payload = event.payload as Relation | undefined;
        if (!payload || !matchesQuery(payload)) return current;
        const next = current.filter((rel) => rel.id !== payload.id);
        next.push(payload);
        return next;
      });
    },
    [matchesQuery]
  );

  useRealtime(projectId, handleRealtime);

  return { relations, loading, refresh };
}
