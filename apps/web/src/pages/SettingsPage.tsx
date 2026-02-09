import { useState } from "react";
import { Plus, Copy, Trash2, Key } from "lucide-react";
import { useTokens } from "@/hooks/useTokens";
import { useProjectContext } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export function SettingsPage() {
  const { tokens, loading, createToken, deleteToken, refresh } = useTokens();
  const { projects } = useProjectContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const result = await createToken({ name, projectId: selectedProjectId });
      setCreatedToken(result.token);
      await refresh();
      setName("");
      setSelectedProjectId("");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Key className="h-5 w-5" /> API Tokens
          </h2>
          <Button onClick={() => { setCreatedToken(null); setCreateOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Create Token
          </Button>
        </div>
        {tokens.length === 0 ? (
          <p className="text-muted-foreground">No API tokens.</p>
        ) : (
          <div className="space-y-2">
            {tokens.map((token) => (
              <div key={token.id} className="border rounded-lg p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium">{token.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {token.tokenPrefix}... · Created {new Date(token.createdAt).toLocaleDateString()}
                    {token.lastUsedAt && ` · Last used ${new Date(token.lastUsedAt).toLocaleDateString()}`}
                  </p>
                </div>
                {token.expiresAt && (
                  <Badge variant="outline">Expires {new Date(token.expiresAt).toLocaleDateString()}</Badge>
                )}
                <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this token?")) deleteToken(token.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{createdToken ? "Token Created" : "Create API Token"}</DialogTitle>
          </DialogHeader>
          {createdToken ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Copy this token now. You won't be able to see it again.
              </p>
              <div className="flex gap-2">
                <Input value={createdToken} readOnly className="font-mono text-sm" />
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(createdToken)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={() => setCreateOpen(false)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating || !selectedProjectId}>
                  {creating ? "Creating..." : "Create Token"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
