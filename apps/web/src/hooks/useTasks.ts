import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useRealtime } from "@/hooks/useRealtime";
import type { RealtimeEvent } from "@/lib/realtime";

interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  tags: string[];
  linkedDocId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useTasks(projectId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const sortTasks = useCallback((items: Task[]) => {
    return [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, []);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await api.get<Task[]>(`/projects/${projectId}/tasks`);
      setTasks(data);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleRealtime = useCallback(
    (event: RealtimeEvent) => {
      if (event.entity !== "tasks") return;
      setTasks((current) => {
        if (event.action === "delete") {
          return current.filter((task) => task.id !== event.id);
        }
        const payload = event.payload as Task | undefined;
        if (!payload) return current;
        const next = current.filter((task) => task.id !== payload.id);
        next.push(payload);
        return sortTasks(next);
      });
    },
    [sortTasks]
  );

  useRealtime(projectId, handleRealtime);

  const createTask = async (body: { title: string; description?: string; priority?: string; tags?: string[]; linkedDocId?: string }) => {
    const task = await api.post<Task>(`/projects/${projectId}/tasks`, body);
    await refresh();
    return task;
  };

  const updateTask = async (taskId: string, body: Partial<{ title: string; description: string; status: string; priority: string; tags: string[]; linkedDocId: string }>) => {
    const task = await api.patch<Task>(`/projects/${projectId}/tasks/${taskId}`, body);
    await refresh();
    return task;
  };

  const deleteTask = async (taskId: string) => {
    await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    await refresh();
  };

  return { tasks, loading, refresh, createTask, updateTask, deleteTask };
}
