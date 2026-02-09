import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface DocumentEditorData {
  title: string;
  type?: string;
  content: string;
  tags?: string[];
  status?: string;
  changeReason?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: DocumentEditorData) => Promise<void> | void;
  initialData?: DocumentEditorData;
}

const STATUS_OPTIONS = ["draft", "approved", "deprecated"];
const TYPE_OPTIONS = ["doc", "note", "adr", "lesson", "snippet"];

export function DocumentEditor({ open, onOpenChange, onSave, initialData }: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("note");
  const [status, setStatus] = useState("draft");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initialData?.title || "");
    setType(initialData?.type || "note");
    setStatus(initialData?.status || "draft");
    setContent(initialData?.content || "");
    setTags((initialData?.tags || []).join(", "));
    setChangeReason(initialData?.changeReason || "");
  }, [open, initialData]);

  const parsedTags = useMemo(
    () => tags.split(",").map((t) => t.trim()).filter(Boolean),
    [tags]
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ title, type, status, content, tags: parsedTags, changeReason: changeReason || undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Document" : "New Document"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="doc-title">Title</Label>
              <Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="doc-tags">Tags</Label>
              <Input
                id="doc-tags"
                placeholder="design, infra, agents"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>
          {initialData && (
            <div className="space-y-2">
              <Label htmlFor="doc-reason">Change reason (optional)</Label>
              <Input
                id="doc-reason"
                placeholder="Short note about this update"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="doc-content">Content</Label>
            <Textarea
              id="doc-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[220px] font-mono"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
