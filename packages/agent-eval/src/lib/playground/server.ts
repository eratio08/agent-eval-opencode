/**
 * Playground HTTP server.
 * Serves the pre-built Next.js static export, API routes, and
 * optionally Server-Sent Events for live mode.
 * Follows the same pattern as Mastra's studio.ts.
 */

import http from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { handleApiRequest, type ApiContext } from './api.js';
import { startWatcher, type WatchEvent } from './watcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface PlaygroundServerOptions {
  port: number;
  resultsDir: string;
  evalsDir: string;
  /** Enable live mode with file watching + SSE */
  watch?: boolean;
}

/** MIME types for static file serving */
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

/**
 * Start the playground server.
 */
export function startPlaygroundServer(
  options: PlaygroundServerOptions
): http.Server {
  const { port, resultsDir, evalsDir, watch: watchEnabled } = options;

  // Locate the pre-built playground files
  // At runtime, __dirname is dist/lib/playground/
  // The playground files are at dist/playground/
  const playgroundDir = join(__dirname, '..', '..', 'playground');

  if (!existsSync(playgroundDir)) {
    throw new Error(
      `Playground files not found at ${playgroundDir}. ` +
        'Run "npm run build" in the workspace root first.'
    );
  }

  const apiContext: ApiContext = { resultsDir, evalsDir };

  // Read and modify index.html with runtime config
  const indexHtmlPath = join(playgroundDir, 'index.html');
  let indexHtml: string;

  if (existsSync(indexHtmlPath)) {
    indexHtml = readFileSync(indexHtmlPath, 'utf-8')
      .replaceAll('%%AGENT_EVAL_API_PORT%%', String(port))
      .replaceAll('%%AGENT_EVAL_API_BASE%%', `http://localhost:${port}`);
  } else {
    indexHtml = `<!DOCTYPE html><html><body><p>Playground files not found. Run "npm run build" first.</p></body></html>`;
  }

  // SSE: track connected clients
  const sseClients = new Set<http.ServerResponse>();

  // Start file watcher if watch mode is enabled
  let stopWatcher: (() => void) | undefined;

  if (watchEnabled) {
    stopWatcher = startWatcher({
      resultsDir,
      onUpdate: (event: WatchEvent) => {
        const data = JSON.stringify(event);
        for (const client of sseClients) {
          client.write(`data: ${data}\n\n`);
        }
      },
    });
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`);
    const pathname = url.pathname;

    // CORS headers for local development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // SSE endpoint for live updates
    if (pathname === '/api/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      // Send initial heartbeat
      res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

      sseClients.add(res);

      req.on('close', () => {
        sseClients.delete(res);
      });

      return;
    }

    // API routes
    if (pathname.startsWith('/api/')) {
      const apiResponse = handleApiRequest(req.method || 'GET', pathname, apiContext);

      if (apiResponse) {
        res.writeHead(apiResponse.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(apiResponse.body));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    // Static file serving
    // Decode URI components so URL-encoded paths like %5B%5B...slug%5D%5D
    // match the literal [[...slug]] directories on disk
    const decodedPathname = decodeURIComponent(pathname);
    const ext = extname(decodedPathname);

    if (ext && ext !== '.html') {
      const filePath = join(playgroundDir, decodedPathname);
      if (existsSync(filePath)) {
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const content = readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
        return;
      }
    }

    // For Next.js static export, check for page-specific HTML files
    const possibleHtmlPaths = [
      join(playgroundDir, decodedPathname + '.html'),
      join(playgroundDir, decodedPathname, 'index.html'),
    ];

    for (const htmlPath of possibleHtmlPaths) {
      if (existsSync(htmlPath)) {
        const pageHtml = readFileSync(htmlPath, 'utf-8')
          .replaceAll('%%AGENT_EVAL_API_PORT%%', String(port))
          .replaceAll('%%AGENT_EVAL_API_BASE%%', `http://localhost:${port}`);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(pageHtml);
        return;
      }
    }

    // SPA fallback — serve index.html for all non-asset routes
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(indexHtml);
  });

  server.on('close', () => {
    if (stopWatcher) stopWatcher();
    for (const client of sseClients) {
      client.end();
    }
    sseClients.clear();
  });

  server.listen(port, () => {
    // Server started — caller handles logging
  });

  return server;
}
