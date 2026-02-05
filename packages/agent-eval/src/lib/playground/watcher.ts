/**
 * File watcher for live mode.
 * Watches the results directory and notifies connected clients via callbacks.
 */

import { watch, type FSWatcher } from 'fs';
import { relative, dirname } from 'path';

export interface WatchEvent {
  type: 'results-updated';
  /** Experiment name (top-level dir under results/) */
  experiment?: string;
  /** Timestamp directory */
  timestamp?: string;
  /** Raw filename that changed */
  filename: string;
}

export interface WatcherOptions {
  resultsDir: string;
  /** Called when results change */
  onUpdate: (event: WatchEvent) => void;
  /** Debounce interval in ms */
  debounceMs?: number;
}

/**
 * Start watching the results directory for changes.
 * Returns a cleanup function.
 */
export function startWatcher(options: WatcherOptions): () => void {
  const { resultsDir, onUpdate, debounceMs = 500 } = options;

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingEvent: WatchEvent | null = null;

  const flush = () => {
    if (pendingEvent) {
      onUpdate(pendingEvent);
      pendingEvent = null;
    }
  };

  let watcher: FSWatcher;

  try {
    watcher = watch(resultsDir, { recursive: true }, (_eventType, filename) => {
      if (!filename) return;

      // Parse experiment/timestamp from the path
      const parts = filename.split('/');
      const experiment = parts[0];
      const timestamp = parts.length > 1 ? parts[1] : undefined;

      pendingEvent = {
        type: 'results-updated',
        experiment,
        timestamp,
        filename,
      };

      // Debounce: batch rapid file changes into a single event
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(flush, debounceMs);
    });
  } catch {
    // fs.watch may fail if directory doesn't exist yet — that's fine
    return () => {};
  }

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    watcher.close();
  };
}
