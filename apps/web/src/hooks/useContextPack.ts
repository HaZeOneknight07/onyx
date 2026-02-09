import { useState } from "react";
import { api } from "@/lib/api";

interface ContextPackRequest {
  query: string;
  maxTokens?: number;
  includeMetadata?: boolean;
  filters?: {
    docTypes?: string[];
    tags?: string[];
    status?: string[];
  };
}

interface ContextPackResponse {
  markdown: string;
  tokenCount: number;
  chunkCount: number;
  query: string;
}

export function useContextPack(projectId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [lastPack, setLastPack] = useState<ContextPackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createPack = async (body: ContextPackRequest) => {
    if (!projectId) return null;
    setLoading(true);
    setError(null);
    try {
      const pack = await api.post<ContextPackResponse>(`/projects/${projectId}/context/packs`, body);
      setLastPack(pack);
      return pack;
    } catch (err: any) {
      setError(err?.message || "Failed to build context pack");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createPack, loading, lastPack, error };
}
