/**
 * API client for the agent-eval playground server.
 * Reads configuration injected at runtime via placeholder replacement.
 */

import type {
  ExperimentInfo,
  ExperimentDetail,
  RunDetail,
  Transcript,
  EvalInfo,
} from "./types";

function getApiBase(): string {
  if (typeof window !== "undefined" && window.__AGENT_EVAL_CONFIG__) {
    return window.__AGENT_EVAL_CONFIG__.apiBase;
  }
  // Fallback for development
  return "http://localhost:3000";
}

async function fetchJson<T>(path: string): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/** List all experiments */
export async function listExperiments(): Promise<ExperimentInfo[]> {
  return fetchJson<ExperimentInfo[]>("/api/experiments");
}

/** List timestamped runs for an experiment */
export async function getExperiment(name: string): Promise<ExperimentInfo> {
  return fetchJson<ExperimentInfo>(`/api/experiments/${encodeURIComponent(name)}`);
}

/** Get full experiment detail for a specific timestamp */
export async function getExperimentDetail(
  name: string,
  timestamp: string,
): Promise<ExperimentDetail> {
  return fetchJson<ExperimentDetail>(
    `/api/experiments/${encodeURIComponent(name)}/${encodeURIComponent(timestamp)}`,
  );
}

/** Get result for a specific run */
export async function getRunResult(
  experiment: string,
  timestamp: string,
  evalName: string,
  run: string,
): Promise<RunDetail> {
  return fetchJson<RunDetail>(
    `/api/experiments/${encodeURIComponent(experiment)}/${encodeURIComponent(timestamp)}/${encodeURIComponent(evalName)}/${encodeURIComponent(run)}/result`,
  );
}

/** Get parsed transcript for a specific run */
export async function getTranscript(
  experiment: string,
  timestamp: string,
  evalName: string,
  run: string,
): Promise<Transcript> {
  return fetchJson<Transcript>(
    `/api/experiments/${encodeURIComponent(experiment)}/${encodeURIComponent(timestamp)}/${encodeURIComponent(evalName)}/${encodeURIComponent(run)}/transcript`,
  );
}

/** List all evals */
export async function listEvals(): Promise<EvalInfo[]> {
  return fetchJson<EvalInfo[]>("/api/evals");
}

/** Get detail for a specific eval */
export async function getEval(name: string): Promise<EvalInfo> {
  return fetchJson<EvalInfo>(`/api/evals/${encodeURIComponent(name)}`);
}
