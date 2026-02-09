import { Link } from "react-router-dom";
import { useBacklinks } from "@/hooks/useBacklinks";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface DocSummary {
  id: string;
  title: string;
}

interface Props {
  projectId: string;
  docId: string;
  documents: DocSummary[];
}

export function BacklinksPanel({ projectId, docId, documents }: Props) {
  const { relations, loading } = useBacklinks(projectId, docId);
  const docMap = new Map(documents.map((d) => [d.id, d.title]));

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (relations.length === 0) {
    return <p className="text-sm text-muted-foreground">No backlinks yet.</p>;
  }

  return (
    <div className="space-y-2">
      {relations.map((rel) => (
        <div key={rel.id} className="border rounded-md p-3 flex items-center gap-3">
          <div className="flex-1">
            <Link
              to={`/p/${projectId}/docs/${rel.sourceDocId}`}
              className="font-medium hover:underline"
            >
              {docMap.get(rel.sourceDocId) || rel.sourceDocId}
            </Link>
            <p className="text-xs text-muted-foreground">Source document</p>
          </div>
          <Badge variant="outline">{rel.relationType}</Badge>
        </div>
      ))}
    </div>
  );
}
