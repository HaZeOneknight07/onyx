import { EventEmitter } from "node:events";

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

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

export function emitRealtime(event: Omit<RealtimeEvent, "timestamp">) {
  emitter.emit(event.projectId, {
    ...event,
    timestamp: new Date().toISOString(),
  });
}

export function subscribeRealtime(projectId: string, handler: (event: RealtimeEvent) => void) {
  emitter.on(projectId, handler);
  return () => emitter.off(projectId, handler);
}
