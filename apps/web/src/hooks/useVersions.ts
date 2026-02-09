import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface Version {
  id: string;
  documentId: string;
  versionNumber: number;
  content: string;
  contentHash: string;
  changeReason: string | null;
  createdAt: string;
}

export function useVersions(projectId: string | undefined, docId: string | undefined) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!projectId || !docId) return;
    setLoading(true);
    try {
      const data = await api.get<any[]>(`/projects/${projectId}/docs/${docId}/versions`);
      const mapped = data.map((v) => ({
        id: v.id,
        documentId: v.documentId,
        versionNumber: v.version,
        content: v.contentMarkdown,
        contentHash: v.contentHash,
        changeReason: v.changeReason,
        createdAt: v.createdAt,
      }));
      setVersions(mapped);
    } catch {
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, docId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { versions, loading, refresh };
}
