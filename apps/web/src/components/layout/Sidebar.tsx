import { NavLink } from "react-router-dom";
import { FileText, CheckSquare, Globe, Search, Network, ClipboardList } from "lucide-react";
import { useProjectContext } from "@/contexts/ProjectContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "documents", label: "Documents", icon: FileText },
  { to: "tasks", label: "Tasks", icon: CheckSquare },
  { to: "sources", label: "Sources", icon: Globe },
  { to: "search", label: "Search", icon: Search },
  { to: "relations", label: "Relations", icon: Network },
  { to: "audit", label: "Audit Log", icon: ClipboardList },
];

export function Sidebar() {
  const { currentProject } = useProjectContext();
  if (!currentProject) return null;

  return (
    <aside className="hidden md:flex w-60 flex-col border-r bg-muted/30 px-3 py-4">
      <div className="px-3 pb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
        Workspace
      </div>
      <div className="space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={`/p/${currentProject.id}/${to}`}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/90 text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
              )
            }
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-background/80 border border-border/60 group-hover:border-border/90">
              <Icon className="h-4 w-4 text-primary/80 group-hover:text-primary" />
            </span>
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
