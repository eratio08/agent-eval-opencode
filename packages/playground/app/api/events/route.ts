import { watch, type FSWatcher } from "fs";
import { resolve } from "path";

/**
 * Server-Sent Events endpoint for live updates.
 * Watches the results directory and pushes change notifications.
 */
export async function GET() {
  const resultsDir = resolve(process.env.RESULTS_DIR || "./results");
  const watchEnabled = process.env.WATCH === "true";

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial connection event
      send({ type: "connected", watch: watchEnabled });

      if (!watchEnabled) {
        return;
      }

      // Watch for file changes
      let watcher: FSWatcher;
      let debounceTimer: ReturnType<typeof setTimeout> | undefined;

      try {
        watcher = watch(
          resultsDir,
          { recursive: true },
          (_eventType, filename) => {
            if (!filename) return;

            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              const parts = filename.split("/");
              send({
                type: "results-updated",
                experiment: parts[0],
                timestamp: parts.length > 1 ? parts[1] : undefined,
                filename,
              });
            }, 500);
          }
        );

        // Clean up when the client disconnects
        const cleanup = () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          watcher.close();
        };

        // AbortController isn't directly available here, but the stream
        // will be cancelled when the client disconnects
        controller.close = new Proxy(controller.close, {
          apply(target, thisArg, args) {
            cleanup();
            return Reflect.apply(target, thisArg, args);
          },
        });
      } catch {
        // Directory may not exist yet — that's fine
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
