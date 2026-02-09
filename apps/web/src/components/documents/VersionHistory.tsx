import { useEffect, useMemo, useState } from "react";
import DiffViewer from "react-diff-viewer-continued";
import { useTheme } from "@/contexts/ThemeContext";
import { useVersions } from "@/hooks/useVersions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  docId: string;
}

export function VersionHistory({ open, onOpenChange, projectId, docId }: Props) {
  const { theme } = useTheme();
  const { versions, loading } = useVersions(projectId, docId);
  const sorted = useMemo(
    () => [...versions].sort((a, b) => b.versionNumber - a.versionNumber),
    [versions]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (sorted.length && !selectedId) {
      setSelectedId(sorted[0].id);
    }
  }, [open, sorted, selectedId]);

  const selectedIndex = sorted.findIndex((v) => v.id === selectedId);
  const selected = selectedIndex >= 0 ? sorted[selectedIndex] : null;
  const previous = selectedIndex >= 0 ? sorted[selectedIndex + 1] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No versions yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              {sorted.map((version) => (
                <Button
                  key={version.id}
                  type="button"
                  variant={version.id === selectedId ? "default" : "outline"}
                  className="w-full justify-between"
                  onClick={() => setSelectedId(version.id)}
                >
                  <span>v{version.versionNumber}</span>
                  <span className="text-xs opacity-70">
                    {new Date(version.createdAt).toLocaleDateString()}
                  </span>
                </Button>
              ))}
            </div>
            {selected && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">v{selected.versionNumber}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(selected.createdAt).toLocaleString()}
                  </span>
                  {selected.changeReason && (
                    <Badge variant="outline">{selected.changeReason}</Badge>
                  )}
                </div>
                <Tabs defaultValue="diff">
                  <TabsList>
                    <TabsTrigger value="diff">Diff</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                  </TabsList>
                <TabsContent value="diff">
                  <div className="diff-viewer max-h-[420px] overflow-auto rounded-md border bg-muted/10">
                    <DiffViewer
                      oldValue={previous?.content || ""}
                      newValue={selected.content}
                      splitView
                      showDiffOnly
                      useDarkTheme={theme === "dark"}
                      styles={{
                        contentText: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
                        line: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
                        diffContainer: { overflowX: "auto" },
                      }}
                    />
                  </div>
                  {!previous && (
                    <p className="text-xs text-muted-foreground mt-2">
                      First version has no previous diff.
                    </p>
                  )}
                </TabsContent>
                  <TabsContent value="content">
                    <pre className="whitespace-pre-wrap rounded-md border bg-muted/20 text-foreground p-4 text-sm">
                      {selected.content}
                    </pre>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
