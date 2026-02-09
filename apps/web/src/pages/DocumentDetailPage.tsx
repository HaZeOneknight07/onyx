import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, History, Trash2 } from "lucide-react";
import { useDocument } from "@/hooks/useDocuments";
import { useDocuments } from "@/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownRenderer } from "@/components/documents/MarkdownRenderer";
import { DocumentEditor } from "@/components/documents/DocumentEditor";
import { VersionHistory } from "@/components/documents/VersionHistory";
import { BacklinksPanel } from "@/components/relations/BacklinksPanel";

export function DocumentDetailPage() {
  const { projectId, docId } = useParams();
  const navigate = useNavigate();
  const { document: doc, loading, refresh } = useDocument(projectId, docId);
  const { documents, updateDocument, deleteDocument } = useDocuments(projectId);
  const [editorOpen, setEditorOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!doc) return <p>Document not found.</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/p/${projectId}/documents`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{doc.title}</h1>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{doc.type}</Badge>
            <Badge variant="secondary">{doc.status}</Badge>
            {doc.tags?.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
            <History className="h-4 w-4 mr-1" /> History
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditorOpen(true)}>
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={async () => {
            if (confirm("Delete this document?")) {
              await deleteDocument(doc.id);
              navigate(`/p/${projectId}/documents`);
            }
          }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="prose prose-neutral dark:prose-invert max-w-none border rounded-lg p-6">
          <MarkdownRenderer content={doc.currentVersion?.content || ""} />
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Backlinks</h2>
          <BacklinksPanel
            projectId={projectId!}
            docId={doc.id}
            documents={documents.map((d) => ({ id: d.id, title: d.title }))}
          />
        </div>
      </div>
      <DocumentEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initialData={{ title: doc.title, type: doc.type, content: doc.currentVersion?.content || "", tags: doc.tags, status: doc.status }}
        onSave={async (data) => {
          await updateDocument(doc.id, data);
          await refresh();
          setEditorOpen(false);
        }}
      />
      <VersionHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        projectId={projectId!}
        docId={doc.id}
      />
    </div>
  );
}
