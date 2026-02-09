import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronsUpDown, Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectContext } from "@/contexts/ProjectContext";
import { ProjectCreateDialog } from "./ProjectCreateDialog";

export function ProjectSwitcher() {
  const { projects, currentProject, setCurrentProject } = useProjectContext();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  const handleSelect = (project: typeof projects[0]) => {
    setCurrentProject(project);
    navigate(`/p/${project.id}/documents`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-[200px] justify-between">
            <span className="flex items-center gap-2 truncate">
              <FolderOpen className="h-4 w-4 shrink-0" />
              {currentProject?.name || "Select project"}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px]">
          <DropdownMenuLabel>Projects</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {projects.map((p) => (
            <DropdownMenuItem key={p.id} onClick={() => handleSelect(p)}>
              {p.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ProjectCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
