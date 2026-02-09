import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import { useProjectContext } from "@/contexts/ProjectContext";

const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("@/pages/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const DocumentsPage = lazy(() => import("@/pages/DocumentsPage").then((m) => ({ default: m.DocumentsPage })));
const DocumentDetailPage = lazy(() => import("@/pages/DocumentDetailPage").then((m) => ({ default: m.DocumentDetailPage })));
const TasksPage = lazy(() => import("@/pages/TasksPage").then((m) => ({ default: m.TasksPage })));
const SourcesPage = lazy(() => import("@/pages/SourcesPage").then((m) => ({ default: m.SourcesPage })));
const SearchPage = lazy(() => import("@/pages/SearchPage").then((m) => ({ default: m.SearchPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const RelationsPage = lazy(() => import("@/pages/RelationsPage").then((m) => ({ default: m.RelationsPage })));
const AuditLogPage = lazy(() => import("@/pages/AuditLogPage").then((m) => ({ default: m.AuditLogPage })));

function HomePage() {
  const { currentProject, loading } = useProjectContext();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-2xl font-semibold">No projects yet</h1>
          <p className="text-sm text-muted-foreground">
            Create a project from the selector in the header to get started.
          </p>
        </div>
      </div>
    );
  }

  return <Navigate to={`/p/${currentProject.id}/documents`} replace />;
}

function NotFoundPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">The page you are looking for doesn't exist.</p>
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading…
      </div>
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="p/:projectId">
              <Route index element={<Navigate to="documents" replace />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="docs/:docId" element={<DocumentDetailPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="sources" element={<SourcesPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="relations" element={<RelationsPage />} />
              <Route path="audit" element={<AuditLogPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
