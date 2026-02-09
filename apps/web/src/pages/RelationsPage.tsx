import { useParams } from "react-router-dom";
import { useDocuments } from "@/hooks/useDocuments";
import { useRelations } from "@/hooks/useRelations";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RelationshipGraph } from "@/components/relations/RelationshipGraph";

export function RelationsPage() {
  const { projectId } = useParams();
  const { documents, loading: docsLoading } = useDocuments(projectId);
  const { relations, loading: relationsLoading } = useRelations(projectId);

  if (docsLoading || relationsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relationships</h1>
        <p className="text-sm text-muted-foreground">
          Visualize how documents reference or depend on each other.
        </p>
      </div>
      <RelationshipGraph
        documents={documents.map((d) => ({ id: d.id, title: d.title }))}
        relations={relations}
      />
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Relation List</h2>
        {relations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No relations yet.</p>
        ) : (
          <div className="space-y-2">
            {relations.map((rel) => (
              <div key={rel.id} className="border rounded-md p-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {documents.find((d) => d.id === rel.sourceDocId)?.title || rel.sourceDocId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    → {documents.find((d) => d.id === rel.targetDocId)?.title || rel.targetDocId}
                  </p>
                </div>
                <Badge variant="outline">{rel.relationType}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
