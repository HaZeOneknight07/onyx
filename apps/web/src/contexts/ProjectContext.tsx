import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project) => void;
  loading: boolean;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProjects = useCallback(async () => {
    try {
      const data = await api.get<Project[]>("/projects");
      setProjects(data);

      const savedId = localStorage.getItem("onyx_current_project");
      const saved = data.find((p) => p.id === savedId);
      if (saved) {
        setCurrentProjectState(saved);
      } else if (data.length > 0 && !currentProject) {
        setCurrentProjectState(data[0]);
        localStorage.setItem("onyx_current_project", data[0].id);
      }
    } catch {
      // Not authenticated yet
    } finally {
      setLoading(false);
    }
  }, []);

  const setCurrentProject = useCallback((project: Project) => {
    setCurrentProjectState(project);
    localStorage.setItem("onyx_current_project", project.id);
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  return (
    <ProjectContext.Provider
      value={{ projects, currentProject, setCurrentProject, loading, refreshProjects }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectContext must be used within ProjectProvider");
  return ctx;
}
