export type RealtimeEntity = "tasks" | "documents" | "sources" | "relations" | "audit";
export type RealtimeAction = "create" | "update" | "delete";

export interface RealtimeEvent {
  projectId: string;
  entity: RealtimeEntity;
  action: RealtimeAction;
  id?: string;
  payload?: unknown;
  timestamp: string;
}

type Listener = (event: RealtimeEvent) => void;

class RealtimeClient {
  private source: EventSource | null = null;
  private projectId: string | null = null;
  private listeners = new Set<Listener>();
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;

  connect(projectId: string) {
    if (this.projectId === projectId && this.source) return;
    this.close();

    this.projectId = projectId;
    const source = new EventSource(`/api/v1/projects/${projectId}/realtime`, {
      withCredentials: true,
    });

    source.addEventListener("change", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as RealtimeEvent;
        this.dispatch(data);
      } catch {
        // Ignore malformed payloads.
      }
    });

    source.addEventListener("ready", () => {
      this.reconnectAttempts = 0;
    });

    source.addEventListener("ping", () => {});

    source.onerror = () => {
      this.scheduleReconnect();
    };

    this.source = source;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private dispatch(event: RealtimeEvent) {
    for (const listener of this.listeners) listener(event);
  }

  private scheduleReconnect() {
    if (!this.projectId || this.reconnectTimer) return;
    if (this.source) {
      this.source.close();
      this.source = null;
    }

    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15000);
    this.reconnectAttempts += 1;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (this.projectId) this.connect(this.projectId);
    }, delay);
  }

  close() {
    if (this.source) {
      this.source.close();
      this.source = null;
    }
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export const realtime = new RealtimeClient();
