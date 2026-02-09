import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface ApiToken {
  id: string;
  name: string;
  tokenPrefix: string;
  projectId: string | null;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export function useTokens() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<ApiToken[]>("/tokens");
      setTokens(data);
    } catch {
      setTokens([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const createToken = async (body: { name: string; projectId?: string | null; expiresAt?: string }) => {
    return api.post<{ token: string } & ApiToken>("/tokens", body);
  };

  const deleteToken = async (tokenId: string) => {
    await api.delete(`/tokens/${tokenId}`);
    await refresh();
  };

  return { tokens, loading, refresh, createToken, deleteToken };
}
