import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { useContextPack } from "@/hooks/useContextPack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SearchPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { results, loading, search } = useSearch(projectId);
  const { createPack, loading: packLoading, lastPack, error: packError } = useContextPack(projectId);
  const [query, setQuery] = useState("");
  const [maxTokens, setMaxTokens] = useState("8000");
  const [includeMeta, setIncludeMeta] = useState(true);
  const [docTypes, setDocTypes] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Search</h1>
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search documents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </form>
      {loading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
      {!loading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r) => (
            <div
              key={r.documentId}
              className="border rounded-lg p-4 hover:bg-muted/30 cursor-pointer"
              onClick={() => navigate(`/p/${projectId}/docs/${r.documentId}`)}
            >
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium">{r.title}</h3>
                <Badge variant="outline">{r.type}</Badge>
                <Badge variant="secondary">{r.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{r.snippet}</p>
              <div className="flex gap-2 mt-2">
                {r.tags?.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                <span className="text-xs text-muted-foreground ml-auto">
                  Score: {r.score?.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && results.length === 0 && query && (
        <p className="text-muted-foreground">No results found.</p>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Agent Context Pack</CardTitle>
          <CardDescription>Generate a copy-ready context bundle for LLM runs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Query (reuse search query)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Input
              placeholder="Max tokens"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
            />
            <Input
              placeholder="Doc types (comma separated)"
              value={docTypes}
              onChange={(e) => setDocTypes(e.target.value)}
            />
            <Input
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <Input
              placeholder="Status (comma separated)"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeMeta}
                onChange={(e) => setIncludeMeta(e.target.checked)}
              />
              Include metadata
            </label>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                const pack = await createPack({
                  query,
                  maxTokens: Number(maxTokens) || 8000,
                  includeMetadata: includeMeta,
                  filters: {
                    docTypes: docTypes.split(",").map((t) => t.trim()).filter(Boolean),
                    tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                    status: status.split(",").map((t) => t.trim()).filter(Boolean),
                  },
                });
                if (pack?.markdown) {
                  await navigator.clipboard.writeText(pack.markdown);
                }
              }}
              disabled={packLoading || !query.trim()}
            >
              {packLoading ? "Building..." : "Build & Copy Context"}
            </Button>
            {lastPack && (
              <span className="text-sm text-muted-foreground self-center">
                {lastPack.chunkCount} chunks · {lastPack.tokenCount} tokens
              </span>
            )}
          </div>
          {packError && <p className="text-sm text-destructive">{packError}</p>}
          {lastPack?.markdown && (
            <Textarea value={lastPack.markdown} readOnly className="min-h-[200px] font-mono" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
