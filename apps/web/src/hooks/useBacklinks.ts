import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Relation } from "@/hooks/useRelations";
import { useRealtime } from "@/hooks/useRealtime";
import type { RealtimeEvent } from "@/lib/realtime";

export function useBacklinks(projectId: string | undefined, docId: string | undefined) {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!projectId || !docId) return;
    setLoading(true);
    try {
      const data = await api.get<Relation[]>(`/projects/${projectId}/docs/${docId}/backlinks`);
      setRelations(data);
    } catch {
      setRelations([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, docId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRealtime = useCallback(
    (event: RealtimeEvent) => {
      if (event.entity !== "relations") return;
      const payload = event.payload as Relation | undefined;
      if (payload && payload.targetDocId !== docId) return;
      if (event.action === "delete" && payload?.targetDocId !== docId) return;
      refresh();
    },
    [docId, refresh]
  );

  useRealtime(projectId, handleRealtime);

  return { relations, loading, refresh };
}
