# @vercel/agent-eval-playground

A web-based dashboard for browsing agent-eval experiment results. Ships as a standalone Next.js app

## Usage

```bash
# Run from your eval project root (where results/ and evals/ live)
npx @vercel/agent-eval-playground

# With options
npx @vercel/agent-eval-playground --results-dir ./results --evals-dir ./evals --port 3001
```

### CLI Options

| Flag | Default | Description |
|------|---------|-------------|
| `--results-dir <dir>` | `./results` | Path to experiment results directory |
| `--evals-dir <dir>` | `./evals` | Path to eval fixtures directory |
| `--port, -p <port>` | `3000` | HTTP server port |
| `--help, -h` | | Show help |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with stats, recent experiments, eval previews |
| `/experiments` | Full experiment list |
| `/experiments/[name]/[timestamp]` | Experiment detail with per-eval breakdown and run results |
| `/evals` | All eval fixtures |
| `/evals/[name]` | Eval detail with prompt, files, and content |
| `/compare` | Side-by-side comparison of two experiment runs |
| `/transcript/[experiment]/[timestamp]/[evalName]/[run]` | Full agent transcript viewer |

## Architecture

- **Server Components** for all data fetching (`lib/data.ts` reads `fs` directly)
- **Client Components** only for interactivity (`ComparePage` dropdowns, `TranscriptViewer` collapsibles)
- **No API routes** — all data is read server-side, no client-side fetching
- **No database** — filesystem is the source of truth
- **`force-dynamic`** on all pages — data can change between requests

### How it works

The CLI (`bin.mjs`) resolves the bundled `next` binary, sets `RESULTS_DIR` and `EVALS_DIR` as environment variables, and spawns `next dev` from the package directory. Server Components in `lib/data.ts` read directly from the filesystem.

## Publishing

Published alongside `@vercel/agent-eval` via changesets. Run `npx changeset`, select `@vercel/agent-eval-playground`, and merge to main. The release workflow handles the rest via OIDC.
