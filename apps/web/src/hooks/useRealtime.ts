import { useEffect } from "react";
import { realtime, type RealtimeEvent } from "@/lib/realtime";

export function useRealtime(projectId: string | undefined, handler: (event: RealtimeEvent) => void) {
  useEffect(() => {
    if (!projectId) return;
    realtime.connect(projectId);
    const unsubscribe = realtime.subscribe(handler);
    return () => {
      unsubscribe();
    };
  }, [projectId, handler]);
}
