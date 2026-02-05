"use client";

import { usePathname } from "next/navigation";
import { ExperimentList } from "@/components/ExperimentList";
import { ExperimentDetail } from "@/components/ExperimentDetail";
import { TranscriptPage } from "@/components/TranscriptPage";
import { ComparePage } from "@/components/ComparePage";
import { EvalsPage } from "@/components/EvalsPage";
import { EvalDetail } from "@/components/EvalDetail";

export function ClientRouter() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // / -> Experiment list
  if (segments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Experiments</h1>
          <p className="text-muted-foreground mt-1">
            Browse and inspect your agent evaluation results.
          </p>
        </div>
        <ExperimentList />
      </div>
    );
  }

  // /experiments/:name/:timestamp -> Experiment detail
  if (segments[0] === "experiments" && segments.length >= 3) {
    return (
      <ExperimentDetail
        name={decodeURIComponent(segments[1])}
        timestamp={decodeURIComponent(segments[2])}
      />
    );
  }

  // /transcript/:experiment/:timestamp/:eval/:run -> Transcript viewer
  if (segments[0] === "transcript" && segments.length >= 5) {
    return (
      <TranscriptPage
        experiment={decodeURIComponent(segments[1])}
        timestamp={decodeURIComponent(segments[2])}
        evalName={decodeURIComponent(segments[3])}
        run={decodeURIComponent(segments[4])}
      />
    );
  }

  // /compare -> Comparison view
  if (segments[0] === "compare") {
    return <ComparePage />;
  }

  // /evals/:name -> Eval detail
  if (segments[0] === "evals" && segments.length >= 2) {
    return <EvalDetail name={decodeURIComponent(segments[1])} />;
  }

  // /evals -> Evals browser
  if (segments[0] === "evals") {
    return <EvalsPage />;
  }

  // 404
  return (
    <div className="py-12 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-muted-foreground mt-2">
        The page at{" "}
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
          {pathname}
        </code>{" "}
        does not exist.
      </p>
      <a
        href="/"
        className="text-primary underline-offset-4 hover:underline mt-4 inline-block"
      >
        Go home
      </a>
    </div>
  );
}
