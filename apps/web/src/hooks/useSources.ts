import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useRealtime } from "@/hooks/useRealtime";
import type { RealtimeEvent } from "@/lib/realtime";

interface Source {
  id: string;
  projectId: string;
  url: string;
  title: string | null;
  lastFetchedAt: string | null;
  contentHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useSources(projectId: string | undefined) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  const sortSources = useCallback((items: Source[]) => {
    return [...items].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, []);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await api.get<Source[]>(`/projects/${projectId}/sources`);
      setSources(data);
    } catch {
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleRealtime = useCallback(
    (event: RealtimeEvent) => {
      if (event.entity !== "sources") return;
      setSources((current) => {
        if (event.action === "delete") {
          return current.filter((source) => source.id !== event.id);
        }
        const payload = event.payload as Source | undefined;
        if (!payload) return current;
        const next = current.filter((source) => source.id !== payload.id);
        next.push(payload);
        return sortSources(next);
      });
    },
    [sortSources]
  );

  useRealtime(projectId, handleRealtime);

  const createSource = async (body: { url: string; title?: string }) => {
    const source = await api.post<Source>(`/projects/${projectId}/sources`, body);
    await refresh();
    return source;
  };

  const deleteSource = async (sourceId: string) => {
    await api.delete(`/projects/${projectId}/sources/${sourceId}`);
    await refresh();
  };

  const ingestUrl = async (body: { url?: string; sourceId?: string; title?: string }) => {
    return api.post<{ jobId: string; sourceId: string; status: string }>(`/projects/${projectId}/ingest`, body);
  };

  return { sources, loading, refresh, createSource, deleteSource, ingestUrl };
}
