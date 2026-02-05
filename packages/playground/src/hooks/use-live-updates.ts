"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface LiveEvent {
  type: "connected" | "results-updated";
  experiment?: string;
  timestamp?: string;
  filename?: string;
}

/**
 * Hook that connects to the SSE endpoint for live updates.
 * Returns whether connected and a callback to force refresh when data changes.
 */
export function useLiveUpdates(onUpdate?: (event: LiveEvent) => void) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<LiveEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const apiBase =
      typeof window !== "undefined" && window.__AGENT_EVAL_CONFIG__
        ? window.__AGENT_EVAL_CONFIG__.apiBase
        : "http://localhost:3000";

    const es = new EventSource(`${apiBase}/api/events`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data: LiveEvent = JSON.parse(event.data);
        if (data.type === "connected") {
          setConnected(true);
        } else {
          setLastEvent(data);
          onUpdate?.(data);
        }
      } catch {
        // Ignore parse errors
      }
    };

    es.onerror = () => {
      setConnected(false);
      // EventSource will auto-reconnect
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [onUpdate]);

  return { connected, lastEvent };
}
