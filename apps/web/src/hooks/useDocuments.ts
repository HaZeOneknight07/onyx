import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useRealtime } from "@/hooks/useRealtime";
import type { RealtimeEvent } from "@/lib/realtime";

interface Document {
  id: string;
  projectId: string;
  title: string;
  type: string;
  status: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  currentVersion?: {
    id: string;
    versionNumber: number;
    content: string;
    contentHash: string;
    changeReason: string | null;
    createdAt: string;
  };
}

export function useDocuments(projectId: string | undefined) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const sortDocuments = useCallback((items: Document[]) => {
    return [...items].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, []);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await api.get<Document[]>(`/projects/${projectId}/docs`);
      setDocuments(data);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleRealtime = useCallback(
    (event: RealtimeEvent) => {
      if (event.entity !== "documents") return;
      setDocuments((current) => {
        if (event.action === "delete") {
          return current.filter((doc) => doc.id !== event.id);
        }
        const payload = event.payload as Document | undefined;
        if (!payload) return current;
        const next = current.filter((doc) => doc.id !== payload.id);
        next.push(payload);
        return sortDocuments(next);
      });
    },
    [sortDocuments]
  );

  useRealtime(projectId, handleRealtime);

  const createDocument = async (body: { title: string; type?: string; content: string; tags?: string[]; pinned?: boolean }) => {
    const doc = await api.post<Document>(`/projects/${projectId}/docs`, body);
    await refresh();
    return doc;
  };

  const updateDocument = async (docId: string, body: Partial<{ title: string; type: string; content: string; status: string; tags: string[]; pinned: boolean; changeReason: string }>) => {
    const doc = await api.patch<Document>(`/projects/${projectId}/docs/${docId}`, body);
    await refresh();
    return doc;
  };

  const deleteDocument = async (docId: string) => {
    await api.delete(`/projects/${projectId}/docs/${docId}`);
    await refresh();
  };

  return { documents, loading, refresh, createDocument, updateDocument, deleteDocument };
}

export function useDocument(projectId: string | undefined, docId: string | undefined) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  const mapDocument = useCallback((data: any) => {
    return data
      ? {
          ...data,
          currentVersion: data.currentVersion
            ? {
                id: data.currentVersion.id,
                versionNumber: data.currentVersion.version,
                content: data.currentVersion.contentMarkdown,
                contentHash: data.currentVersion.contentHash,
                changeReason: data.currentVersion.changeReason,
                createdAt: data.currentVersion.createdAt,
              }
            : undefined,
        }
      : null;
  }, []);

  const refresh = useCallback(async () => {
    if (!projectId || !docId) return;
    setLoading(true);
    try {
      const data = await api.get<any>(`/projects/${projectId}/docs/${docId}`);
      setDocument(mapDocument(data));
    } catch {
      setDocument(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, docId, mapDocument]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleRealtime = useCallback(
    (event: RealtimeEvent) => {
      if (event.entity !== "documents") return;
      if (event.action === "delete" && event.id === docId) {
        setDocument(null);
        return;
      }
      const payload = event.payload as any;
      if (payload?.id === docId) {
        setDocument(mapDocument(payload));
      }
    },
    [docId, mapDocument]
  );

  useRealtime(projectId, handleRealtime);

  return { document, loading, refresh };
}
