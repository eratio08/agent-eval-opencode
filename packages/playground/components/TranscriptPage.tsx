import { Card, CardContent } from "@/components/ui/card";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import type { Transcript } from "@/lib/types";

interface TranscriptPageProps {
  experiment: string;
  timestamp: string;
  evalName: string;
  run: string;
  transcript: Transcript;
}

export function TranscriptPage({
  experiment,
  timestamp,
  evalName,
  run,
  transcript,
}: TranscriptPageProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <a href="/experiments" className="hover:underline underline-offset-4">
          Experiments
        </a>
        <span>/</span>
        <a
          href={`/experiments/${encodeURIComponent(experiment)}/${encodeURIComponent(timestamp)}`}
          className="hover:underline underline-offset-4"
        >
          {experiment}
        </a>
        <span>/</span>
        <span>{evalName}</span>
        <span>/</span>
        <span>{run}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transcript</h1>
        <p className="text-muted-foreground mt-1">
          {evalName} &mdash; {run} &mdash;{" "}
          {transcript.agent}
          {transcript.model ? ` / ${transcript.model}` : ""}
        </p>
      </div>

      <TranscriptViewer transcript={transcript} />
    </div>
  );
}
