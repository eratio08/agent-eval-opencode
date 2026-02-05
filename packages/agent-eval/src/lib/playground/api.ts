/**
 * API route handlers for the playground server.
 * All handlers are read-only — they read JSON files from the results/ and evals/ directories.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join, resolve } from 'path';

export interface ApiContext {
  resultsDir: string;
  evalsDir: string;
}

interface ApiResponse {
  status: number;
  body: unknown;
}

/**
 * Route an API request to the appropriate handler.
 * Returns null if the path doesn't match any API route.
 */
export function handleApiRequest(
  method: string,
  pathname: string,
  ctx: ApiContext
): ApiResponse | null {
  if (method !== 'GET') {
    return { status: 405, body: { error: 'Method not allowed' } };
  }

  // Strip trailing slash
  const path = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  // GET /api/experiments
  if (path === '/api/experiments') {
    return listExperiments(ctx);
  }

  // GET /api/experiments/:name
  const expMatch = path.match(/^\/api\/experiments\/([^/]+)$/);
  if (expMatch) {
    return getExperiment(decodeURIComponent(expMatch[1]), ctx);
  }

  // GET /api/experiments/:name/:timestamp
  const expDetailMatch = path.match(/^\/api\/experiments\/([^/]+)\/([^/]+)$/);
  if (expDetailMatch) {
    return getExperimentDetail(
      decodeURIComponent(expDetailMatch[1]),
      decodeURIComponent(expDetailMatch[2]),
      ctx
    );
  }

  // GET /api/experiments/:name/:timestamp/:eval/:run/result
  const runResultMatch = path.match(
    /^\/api\/experiments\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\/result$/
  );
  if (runResultMatch) {
    return getRunResult(
      decodeURIComponent(runResultMatch[1]),
      decodeURIComponent(runResultMatch[2]),
      decodeURIComponent(runResultMatch[3]),
      decodeURIComponent(runResultMatch[4]),
      ctx
    );
  }

  // GET /api/experiments/:name/:timestamp/:eval/:run/transcript
  const transcriptMatch = path.match(
    /^\/api\/experiments\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\/transcript$/
  );
  if (transcriptMatch) {
    return getTranscript(
      decodeURIComponent(transcriptMatch[1]),
      decodeURIComponent(transcriptMatch[2]),
      decodeURIComponent(transcriptMatch[3]),
      decodeURIComponent(transcriptMatch[4]),
      ctx
    );
  }

  // GET /api/evals
  if (path === '/api/evals') {
    return listEvals(ctx);
  }

  // GET /api/evals/:name
  const evalMatch = path.match(/^\/api\/evals\/([^/]+)$/);
  if (evalMatch) {
    return getEvalDetail(decodeURIComponent(evalMatch[1]), ctx);
  }

  return null;
}

/** List all experiments from the results directory */
function listExperiments(ctx: ApiContext): ApiResponse {
  const resultsDir = resolve(ctx.resultsDir);

  if (!existsSync(resultsDir)) {
    return { status: 200, body: [] };
  }

  const entries = readdirSync(resultsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  const experiments = entries.map((name) => {
    const expDir = join(resultsDir, name);
    const timestamps = readdirSync(expDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
      .reverse();

    // Read latest summary to get pass rate
    let latestPassRate: number | undefined;
    let latestTotalRuns = 0;
    let latestPassedRuns = 0;

    if (timestamps.length > 0) {
      const latestDir = join(expDir, timestamps[0]);
      const evalDirs = readdirSync(latestDir, { withFileTypes: true }).filter(
        (e) => e.isDirectory()
      );

      for (const evalDir of evalDirs) {
        const summaryPath = join(latestDir, evalDir.name, 'summary.json');
        if (existsSync(summaryPath)) {
          try {
            const summary = JSON.parse(readFileSync(summaryPath, 'utf-8'));
            latestTotalRuns += summary.totalRuns ?? 0;
            latestPassedRuns += summary.passedRuns ?? 0;
          } catch {
            // Skip invalid summary files
          }
        }
      }

      if (latestTotalRuns > 0) {
        latestPassRate = (latestPassedRuns / latestTotalRuns) * 100;
      }
    }

    return {
      name,
      timestamps,
      latestTimestamp: timestamps[0] ?? null,
      latestPassRate,
      latestTotalRuns,
      latestPassedRuns,
    };
  });

  return { status: 200, body: experiments };
}

/** Get timestamps for a specific experiment */
function getExperiment(name: string, ctx: ApiContext): ApiResponse {
  const expDir = join(resolve(ctx.resultsDir), name);

  if (!existsSync(expDir)) {
    return { status: 404, body: { error: `Experiment not found: ${name}` } };
  }

  const timestamps = readdirSync(expDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
    .reverse();

  return {
    status: 200,
    body: { name, timestamps, latestTimestamp: timestamps[0] ?? null },
  };
}

/** Get full experiment detail for a specific timestamp */
function getExperimentDetail(
  name: string,
  timestamp: string,
  ctx: ApiContext
): ApiResponse {
  const runDir = join(resolve(ctx.resultsDir), name, timestamp);

  if (!existsSync(runDir)) {
    return {
      status: 404,
      body: { error: `Experiment run not found: ${name}/${timestamp}` },
    };
  }

  const evalDirs = readdirSync(runDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  const evals = evalDirs.map((evalName) => {
    const evalDir = join(runDir, evalName);
    const summaryPath = join(evalDir, 'summary.json');

    let summary = { totalRuns: 0, passedRuns: 0, passRate: '0%', meanDuration: 0 };
    if (existsSync(summaryPath)) {
      try {
        summary = JSON.parse(readFileSync(summaryPath, 'utf-8'));
      } catch {
        // Use defaults
      }
    }

    // List run directories
    const runDirs = readdirSync(evalDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name.startsWith('run-'))
      .map((e) => e.name)
      .sort();

    // Read each run's result.json
    const runs = runDirs.map((runDirName) => {
      const resultPath = join(evalDir, runDirName, 'result.json');
      let result = null;
      if (existsSync(resultPath)) {
        try {
          result = JSON.parse(readFileSync(resultPath, 'utf-8'));
        } catch {
          // Skip
        }
      }
      return { name: runDirName, result };
    });

    return {
      name: evalName,
      totalRuns: summary.totalRuns,
      passedRuns: summary.passedRuns,
      passRate: typeof summary.passRate === 'string'
        ? parseFloat(summary.passRate)
        : summary.passRate,
      meanDuration: summary.meanDuration,
      runs,
    };
  });

  return {
    status: 200,
    body: {
      name,
      timestamp,
      evals,
    },
  };
}

/** Get result for a specific run */
function getRunResult(
  experiment: string,
  timestamp: string,
  evalName: string,
  run: string,
  ctx: ApiContext
): ApiResponse {
  const resultPath = join(
    resolve(ctx.resultsDir),
    experiment,
    timestamp,
    evalName,
    run,
    'result.json'
  );

  if (!existsSync(resultPath)) {
    return { status: 404, body: { error: 'Run result not found' } };
  }

  try {
    const result = JSON.parse(readFileSync(resultPath, 'utf-8'));
    return { status: 200, body: { result } };
  } catch {
    return { status: 500, body: { error: 'Failed to read result' } };
  }
}

/** Get parsed transcript for a specific run */
function getTranscript(
  experiment: string,
  timestamp: string,
  evalName: string,
  run: string,
  ctx: ApiContext
): ApiResponse {
  const transcriptPath = join(
    resolve(ctx.resultsDir),
    experiment,
    timestamp,
    evalName,
    run,
    'transcript.json'
  );

  if (!existsSync(transcriptPath)) {
    return { status: 404, body: { error: 'Transcript not found' } };
  }

  try {
    const transcript = JSON.parse(readFileSync(transcriptPath, 'utf-8'));
    return { status: 200, body: transcript };
  } catch {
    return { status: 500, body: { error: 'Failed to read transcript' } };
  }
}

/** List all evals from the evals directory */
function listEvals(ctx: ApiContext): ApiResponse {
  const evalsDir = resolve(ctx.evalsDir);

  if (!existsSync(evalsDir)) {
    return { status: 200, body: [] };
  }

  const entries = readdirSync(evalsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  const evals = entries.map((name) => {
    const evalDir = join(evalsDir, name);
    const promptPath = join(evalDir, 'PROMPT.md');
    let prompt = '';
    if (existsSync(promptPath)) {
      prompt = readFileSync(promptPath, 'utf-8');
    }

    // List all files in the eval directory (non-recursive)
    const files = readdirSync(evalDir, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name);

    return { name, prompt, files };
  });

  return { status: 200, body: evals };
}

/** Get detail for a specific eval */
function getEvalDetail(name: string, ctx: ApiContext): ApiResponse {
  const evalDir = join(resolve(ctx.evalsDir), name);

  if (!existsSync(evalDir)) {
    return { status: 404, body: { error: `Eval not found: ${name}` } };
  }

  const promptPath = join(evalDir, 'PROMPT.md');
  let prompt = '';
  if (existsSync(promptPath)) {
    prompt = readFileSync(promptPath, 'utf-8');
  }

  // Recursively list files
  const files: string[] = [];
  function walk(dir: string, prefix: string) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(join(dir, entry.name), relativePath);
      } else {
        files.push(relativePath);
      }
    }
  }
  walk(evalDir, '');

  // Read file contents for key files
  const fileContents: Record<string, string> = {};
  const keyFiles = ['PROMPT.md', 'EVAL.ts', 'EVAL.tsx', 'package.json'];
  for (const file of keyFiles) {
    const filePath = join(evalDir, file);
    if (existsSync(filePath)) {
      try {
        fileContents[file] = readFileSync(filePath, 'utf-8');
      } catch {
        // Skip unreadable files
      }
    }
  }

  return {
    status: 200,
    body: { name, prompt, files, fileContents },
  };
}
