"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { getTranscript } from "@/lib/api-client";
import type { Transcript } from "@/lib/types";

interface TranscriptPageProps {
  experiment: string;
  timestamp: string;
  evalName: string;
  run: string;
}

export function TranscriptPage({
  experiment,
  timestamp,
  evalName,
  run,
}: TranscriptPageProps) {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTranscript(experiment, timestamp, evalName, run)
      .then((t) => {
        setTranscript(t);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [experiment, timestamp, evalName, run]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading transcript...
        </CardContent>
      </Card>
    );
  }

  if (error || !transcript) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {error || "Failed to load transcript"}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <a href="/" className="hover:underline underline-offset-4">
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
