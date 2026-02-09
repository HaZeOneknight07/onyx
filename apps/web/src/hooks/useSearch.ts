import { useState, useCallback } from "react";
import { api } from "@/lib/api";

interface SearchResult {
  documentId: string;
  title: string;
  type: string;
  status: string;
  tags: string[];
  snippet: string;
  score: number;
  semanticScore?: number;
  textScore?: number;
}

interface SearchApiRow {
  documentId: string;
  documentTitle: string;
  documentType: string;
  documentStatus: string;
  documentTags: string[] | null;
  content: string;
  combinedScore: number;
  semanticScore?: number;
  textScore?: number;
}

interface SearchApiResponse {
  results: SearchApiRow[];
  query: string;
}

interface SearchFilters {
  docTypes?: string[];
  tags?: string[];
  status?: string;
}

export function useSearch(projectId: string | undefined) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string, filters?: SearchFilters) => {
    if (!projectId || !query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.post<SearchApiResponse>(`/projects/${projectId}/search`, {
        query,
        filters,
      });
      const mapped = data.results.map((r) => ({
        documentId: r.documentId,
        title: r.documentTitle,
        type: r.documentType,
        status: r.documentStatus,
        tags: r.documentTags || [],
        snippet: r.content.length > 220 ? `${r.content.slice(0, 220)}...` : r.content,
        score: r.combinedScore,
        semanticScore: r.semanticScore,
        textScore: r.textScore,
      }));
      setResults(mapped);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  return { results, loading, search };
}
