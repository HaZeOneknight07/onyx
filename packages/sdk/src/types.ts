// --- Projects ---

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  slug: string;
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

// --- Documents ---

export type DocumentType = "doc" | "note" | "adr" | "lesson" | "snippet";
export type DocumentStatus = "draft" | "approved" | "deprecated";

export interface Document {
  id: string;
  projectId: string;
  type: DocumentType;
  title: string;
  status: DocumentStatus;
  pinned: boolean;
  tags: string[] | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentWithVersion extends Document {
  currentVersion?: DocumentVersion;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  contentMarkdown: string;
  contentHash: string;
  changeReason: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CreateDocumentInput {
  title: string;
  type?: DocumentType;
  content: string;
  tags?: string[];
  pinned?: boolean;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  status?: DocumentStatus;
  tags?: string[];
  pinned?: boolean;
  changeReason?: string;
}

// --- Sources ---

export interface Source {
  id: string;
  projectId: string;
  url: string;
  title: string | null;
  fetchedAt: string | null;
  etag: string | null;
  contentHash: string | null;
}

export interface SourceSnapshot {
  id: string;
  sourceId: string;
  contentMarkdown: string;
  fetchedAt: string;
  contentHash: string;
}

export interface CreateSourceInput {
  url: string;
  title?: string;
}

export interface UpdateSourceInput {
  url?: string;
  title?: string;
}

// --- Tasks ---

export type TaskStatus = "todo" | "doing" | "blocked" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[] | null;
  linkedDocId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  tags?: string[];
  linkedDocId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  linkedDocId?: string | null;
}

// --- Relations ---

export interface Relation {
  id: string;
  sourceDocId: string;
  targetDocId: string;
  relationType: string;
  createdAt: string;
}

export interface CreateRelationInput {
  sourceDocId: string;
  targetDocId: string;
  relationType: string;
}

// --- Agent Events ---

export interface AgentEvent {
  id: string;
  projectId: string;
  sessionId: string | null;
  eventType: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreateAgentEventInput {
  sessionId?: string;
  eventType: string;
  payload?: Record<string, unknown>;
}

export interface AgentEventFilters {
  eventType?: string;
  sessionId?: string;
  from?: string;
  to?: string;
}

// --- API Tokens ---

export interface ApiToken {
  id: string;
  userId: string;
  projectId: string | null;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

// --- Search ---

export interface SearchFilters {
  docTypes?: string[];
  tags?: string[];
  status?: string[];
}

export interface SearchInput {
  query: string;
  limit?: number;
  semanticWeight?: number;
  filters?: SearchFilters;
}

export interface SearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  documentStatus: string;
  documentTags: string[] | null;
  content: string;
  headingPath: string | null;
  chunkIndex: number;
  tokenCount: number;
  semanticScore: number;
  textScore: number;
  combinedScore: number;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
}

// --- Context Packs ---

export interface ContextPackInput {
  query: string;
  maxTokens?: number;
  includeMetadata?: boolean;
  filters?: SearchFilters;
}

export interface ContextPack {
  markdown: string;
  tokenCount: number;
  chunkCount: number;
  query: string;
}

// --- Ingestion ---

export interface IngestUrlInput {
  sourceId?: string;
  url?: string;
  title?: string;
}

export interface IngestUrlResponse {
  jobId: string;
  sourceId: string;
  status: "queued";
}

// --- Common ---

export interface SuccessResponse {
  success: true;
}
