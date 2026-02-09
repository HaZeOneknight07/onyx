import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRealtime } from "@/hooks/useRealtime";
import type { RealtimeEvent } from "@/lib/realtime";

export interface AuditEvent {
  id: string;
  projectId: string;
  sessionId: string | null;
  eventType: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

interface EventFilters {
  eventType?: string;
  sessionId?: string;
  from?: string;
  to?: string;
}

export function useAuditEvents(projectId: string | undefined, filters?: EventFilters) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const matchesFilters = useCallback(
    (event: AuditEvent) => {
      if (filters?.eventType && event.eventType !== filters.eventType) return false;
      if (filters?.sessionId && event.sessionId !== filters.sessionId) return false;
      if (filters?.from && new Date(event.createdAt) < new Date(filters.from)) return false;
      if (filters?.to && new Date(event.createdAt) > new Date(filters.to)) return false;
      return true;
    },
    [filters?.eventType, filters?.sessionId, filters?.from, filters?.to]
  );

  const refresh = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.eventType) params.set("eventType", filters.eventType);
      if (filters?.sessionId) params.set("sessionId", filters.sessionId);
      if (filters?.from) params.set("from", filters.from);
      if (filters?.to) params.set("to", filters.to);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const data = await api.get<AuditEvent[]>(`/projects/${projectId}/events${suffix}`);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, filters?.eventType, filters?.sessionId, filters?.from, filters?.to]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRealtime = useCallback(
    (event: RealtimeEvent) => {
      if (event.entity !== "audit" || event.action !== "create") return;
      const payload = event.payload as AuditEvent | undefined;
      if (!payload) return;
      if (!matchesFilters(payload)) return;
      setEvents((current) => [payload, ...current]);
    },
    [matchesFilters]
  );

  useRealtime(projectId, handleRealtime);

  return { events, loading, refresh };
}
