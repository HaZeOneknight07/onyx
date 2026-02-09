import { useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, ExternalLink } from "lucide-react";
import { useSources } from "@/hooks/useSources";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IngestUrlDialog } from "@/components/sources/IngestUrlDialog";

export function SourcesPage() {
  const { projectId } = useParams();
  const { sources, loading, deleteSource, ingestUrl, refresh } = useSources(projectId);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sources</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Ingest URL
        </Button>
      </div>
      {sources.length === 0 ? (
        <p className="text-muted-foreground">No sources yet. Ingest a URL to get started.</p>
      ) : (
        <div className="border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">URL</th>
                <th className="text-left p-3 font-medium">Last Fetched</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{source.title || "Untitled"}</td>
                  <td className="p-3">
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                      {source.url.length > 50 ? source.url.slice(0, 50) + "..." : source.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {source.lastFetchedAt ? new Date(source.lastFetchedAt).toLocaleString() : "Never"}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={async () => { await ingestUrl({ sourceId: source.id }); await refresh(); }}>
                        Re-fetch
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this source?")) deleteSource(source.id); }}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <IngestUrlDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onIngest={async (url, title) => {
          await ingestUrl({ url, title });
          await refresh();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
