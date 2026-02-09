import { Outlet, useParams } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useEffect } from "react";
import { useProjectContext } from "@/contexts/ProjectContext";

export function Layout() {
  const { projectId } = useParams();
  const { projects, currentProject, setCurrentProject } = useProjectContext();

  useEffect(() => {
    if (!projectId) return;
    const match = projects.find((p) => p.id === projectId);
    if (match && match.id !== currentProject?.id) {
      setCurrentProject(match);
    }
  }, [projectId, projects, currentProject, setCurrentProject]);

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
