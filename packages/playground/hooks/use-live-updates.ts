"use client";

import { useEffect, useRef, useState } from "react";

interface LiveEvent {
  type: "connected" | "results-updated";
  experiment?: string;
  timestamp?: string;
  filename?: string;
}

/**
 * Hook that connects to the SSE endpoint for live updates.
 * Returns whether connected and the last event received.
 */
export function useLiveUpdates(onUpdate?: (event: LiveEvent) => void) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<LiveEvent | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    const es = new EventSource("/api/events");

    es.onmessage = (event) => {
      try {
        const data: LiveEvent = JSON.parse(event.data);
        if (data.type === "connected") {
          setConnected(true);
        } else {
          setLastEvent(data);
          onUpdateRef.current?.(data);
        }
      } catch {
        // Ignore parse errors
      }
    };

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
    };
  }, []);

  return { connected, lastEvent };
}
