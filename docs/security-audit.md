# Security Audit Notes

Date: 2026-02-08

## Scope

Focus areas:
- Token handling (API tokens, MCP tokens)
- Input validation on API routes
- Project-level authorization
- Logging of sensitive data

## Findings & Fixes

### 1) Project authorization not enforced

**Issue:** Project-scoped routes did not validate that the authenticated user (or API token) is a member of the requested project. This allows any authenticated user to access any project ID.

**Fix:** Added `projectScope` middleware to enforce:
- If API token is project-scoped, it can only access its project.
- The user must be a member of the project.
- 404 for missing projects, 403 for unauthorized access.

Files:
- `apps/api/src/middleware/project-scope.ts`
- `apps/api/src/app.ts`

### 2) Sensitive headers in logs

**Issue:** Request logging could potentially emit `Authorization` or cookies.

**Fix:** Pino logger now redacts `req.headers.authorization` and `req.headers.cookie`.

File:
- `packages/shared/src/logger.ts`

### 3) Input validation

All API routes use Zod schemas via `validate()` for request bodies. This includes projects, documents, tasks, sources, ingest, search, context, relations, and tokens.

**Status:** OK.

## Additional Recommendations

- Enforce rate limits on auth and token endpoints.
- Consider API token expiration enforcement via background cleanup.
- Add audit log entries for sensitive actions (token creation/deletion).
