import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  Document,
  DocumentWithVersion,
  DocumentVersion,
  CreateDocumentInput,
  UpdateDocumentInput,
  Source,
  SourceSnapshot,
  CreateSourceInput,
  UpdateSourceInput,
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  Relation,
  CreateRelationInput,
  AgentEvent,
  CreateAgentEventInput,
  AgentEventFilters,
  SearchInput,
  SearchResponse,
  ContextPackInput,
  ContextPack,
  IngestUrlInput,
  IngestUrlResponse,
  SuccessResponse,
} from "./types";

export interface OnyxClientOptions {
  baseUrl: string;
  token: string;
}

export class OnyxClient {
  private baseUrl: string;
  private token: string;

  constructor(options: OnyxClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.token = options.token;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api/v1${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
        ...init?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Onyx API error ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  // --- Projects ---

  listProjects(): Promise<Project[]> {
    return this.request("/projects");
  }

  createProject(input: CreateProjectInput): Promise<Project> {
    return this.request("/projects", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  getProject(projectId: string): Promise<Project> {
    return this.request(`/projects/${projectId}`);
  }

  updateProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
    return this.request(`/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  deleteProject(projectId: string): Promise<SuccessResponse> {
    return this.request(`/projects/${projectId}`, { method: "DELETE" });
  }

  // --- Documents ---

  listDocuments(projectId: string): Promise<Document[]> {
    return this.request(`/projects/${projectId}/docs`);
  }

  createDocument(projectId: string, input: CreateDocumentInput): Promise<DocumentWithVersion> {
    return this.request(`/projects/${projectId}/docs`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  getDocument(projectId: string, docId: string): Promise<DocumentWithVersion> {
    return this.request(`/projects/${projectId}/docs/${docId}`);
  }

  updateDocument(projectId: string, docId: string, input: UpdateDocumentInput): Promise<DocumentWithVersion> {
    return this.request(`/projects/${projectId}/docs/${docId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  deleteDocument(projectId: string, docId: string): Promise<SuccessResponse> {
    return this.request(`/projects/${projectId}/docs/${docId}`, { method: "DELETE" });
  }

  listDocumentVersions(projectId: string, docId: string): Promise<DocumentVersion[]> {
    return this.request(`/projects/${projectId}/docs/${docId}/versions`);
  }

  listBacklinks(projectId: string, docId: string): Promise<Relation[]> {
    return this.request(`/projects/${projectId}/docs/${docId}/backlinks`);
  }

  // --- Sources ---

  listSources(projectId: string): Promise<Source[]> {
    return this.request(`/projects/${projectId}/sources`);
  }

  createSource(projectId: string, input: CreateSourceInput): Promise<Source> {
    return this.request(`/projects/${projectId}/sources`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  getSource(projectId: string, sourceId: string): Promise<Source> {
    return this.request(`/projects/${projectId}/sources/${sourceId}`);
  }

  updateSource(projectId: string, sourceId: string, input: UpdateSourceInput): Promise<Source> {
    return this.request(`/projects/${projectId}/sources/${sourceId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  deleteSource(projectId: string, sourceId: string): Promise<SuccessResponse> {
    return this.request(`/projects/${projectId}/sources/${sourceId}`, { method: "DELETE" });
  }

  listSourceSnapshots(projectId: string, sourceId: string): Promise<SourceSnapshot[]> {
    return this.request(`/projects/${projectId}/sources/${sourceId}/snapshots`);
  }

  // --- Tasks ---

  listTasks(projectId: string): Promise<Task[]> {
    return this.request(`/projects/${projectId}/tasks`);
  }

  createTask(projectId: string, input: CreateTaskInput): Promise<Task> {
    return this.request(`/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  getTask(projectId: string, taskId: string): Promise<Task> {
    return this.request(`/projects/${projectId}/tasks/${taskId}`);
  }

  updateTask(projectId: string, taskId: string, input: UpdateTaskInput): Promise<Task> {
    return this.request(`/projects/${projectId}/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  deleteTask(projectId: string, taskId: string): Promise<SuccessResponse> {
    return this.request(`/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });
  }

  // --- Relations ---

  listRelations(projectId: string, filters?: { sourceDocId?: string; targetDocId?: string }): Promise<Relation[]> {
    const params = new URLSearchParams();
    if (filters?.sourceDocId) params.set("sourceDocId", filters.sourceDocId);
    if (filters?.targetDocId) params.set("targetDocId", filters.targetDocId);
    const qs = params.toString();
    return this.request(`/projects/${projectId}/relations${qs ? `?${qs}` : ""}`);
  }

  createRelation(projectId: string, input: CreateRelationInput): Promise<Relation> {
    return this.request(`/projects/${projectId}/relations`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  deleteRelation(projectId: string, relationId: string): Promise<SuccessResponse> {
    return this.request(`/projects/${projectId}/relations/${relationId}`, { method: "DELETE" });
  }

  // --- Agent Events ---

  listAgentEvents(projectId: string, filters?: AgentEventFilters): Promise<AgentEvent[]> {
    const params = new URLSearchParams();
    if (filters?.eventType) params.set("eventType", filters.eventType);
    if (filters?.sessionId) params.set("sessionId", filters.sessionId);
    if (filters?.from) params.set("from", filters.from);
    if (filters?.to) params.set("to", filters.to);
    const qs = params.toString();
    return this.request(`/projects/${projectId}/events${qs ? `?${qs}` : ""}`);
  }

  createAgentEvent(projectId: string, input: CreateAgentEventInput): Promise<AgentEvent> {
    return this.request(`/projects/${projectId}/events`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  // --- Search ---

  search(projectId: string, input: SearchInput): Promise<SearchResponse> {
    return this.request(`/projects/${projectId}/search`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  // --- Context Packs ---

  generateContextPack(projectId: string, input: ContextPackInput): Promise<ContextPack> {
    return this.request(`/projects/${projectId}/context/packs`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  // --- Ingestion ---

  ingestUrl(projectId: string, input: IngestUrlInput): Promise<IngestUrlResponse> {
    return this.request(`/projects/${projectId}/ingest`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
}
