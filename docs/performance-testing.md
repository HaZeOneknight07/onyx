# Performance Testing

This guide uses a small, real-world dataset derived from the repository’s docs and source files to exercise the API’s document creation and search endpoints.

## What It Does

The script will:
- Create a new project
- Ingest a configurable number of repo files as documents
- Run a set of search queries
- Emit timing metrics to `perf-results/`

## Run

```sh
ONYX_API_URL=https://api-onyx.ashmorestudios.com \
ONYX_API_TOKEN=YOUR_TOKEN \
bun run perf:test
```

## Configuration

Environment variables:

| Variable | Default | Description |
| --- | --- | --- |
| `PERF_MAX_FILES` | `30` | Maximum repo files to scan |
| `PERF_MAX_FILE_BYTES` | `20000` | Maximum file size (bytes) |
| `PERF_DOC_COUNT` | `20` | Documents to create |
| `PERF_PROJECT_SLUG` | `perf-<timestamp>` | Slug for the test project |
| `PERF_PROJECT_NAME` | `Perf Test Project` | Project name |

## Results

A JSON result is written to `perf-results/` with:
- project id / slug
- document count
- search query count
- timings (ms)

## Notes

- This does not clean up the project; you may delete it via API if desired.
- For larger tests, increase `PERF_DOC_COUNT` and `PERF_MAX_FILES`.
