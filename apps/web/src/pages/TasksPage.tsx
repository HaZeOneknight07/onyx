import { useState } from "react";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TaskDialog } from "@/components/tasks/TaskDialog";

const statusColors: Record<string, string> = {
  todo: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  doing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  blocked: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const priorityColors: Record<string, string> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  urgent: "destructive",
};

export function TasksPage() {
  const { projectId } = useParams();
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks(projectId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button onClick={() => { setEditingTask(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Task
        </Button>
      </div>
      {tasks.length === 0 ? (
        <p className="text-muted-foreground">No tasks yet.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="border rounded-lg p-4 flex items-center gap-4">
              <Select
                value={task.status}
                onValueChange={(value) => updateTask(task.id, { status: value })}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["todo", "doing", "blocked", "done"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{task.title}</p>
                {task.description && (
                  <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                )}
              </div>
              <Badge variant={priorityColors[task.priority] as any || "outline"}>
                {task.priority}
              </Badge>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditingTask(task); setDialogOpen(true); }}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this task?")) deleteTask(task.id); }}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSave={async (data) => {
          if (editingTask) {
            await updateTask(editingTask.id, data);
          } else {
            await createTask(data);
          }
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
