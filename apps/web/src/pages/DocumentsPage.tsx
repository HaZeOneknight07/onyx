import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentEditor } from "@/components/documents/DocumentEditor";

export function DocumentsPage() {
  const { projectId } = useParams();
  const { documents, loading, createDocument } = useDocuments(projectId);
  const [editorOpen, setEditorOpen] = useState(false);

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
        <h1 className="text-2xl font-bold">Documents</h1>
        <Button onClick={() => setEditorOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Document
        </Button>
      </div>
      {documents.length === 0 ? (
        <p className="text-muted-foreground">No documents yet. Create one to get started.</p>
      ) : (
        <div className="border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Tags</th>
                <th className="text-left p-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <Link to={`/p/${projectId}/docs/${doc.id}`} className="font-medium text-primary hover:underline">
                      {doc.title}
                    </Link>
                  </td>
                  <td className="p-3"><Badge variant="outline">{doc.type}</Badge></td>
                  <td className="p-3"><Badge variant="secondary">{doc.status}</Badge></td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {doc.tags?.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <DocumentEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={async (data) => {
          await createDocument(data);
          setEditorOpen(false);
        }}
      />
    </div>
  );
}
