import Link from "next/link";
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
        <Link href="/experiments" className="cursor-pointer hover:underline underline-offset-4">
          Experiments
        </Link>
        <span>/</span>
        <Link
          href={`/experiments/${encodeURIComponent(experiment)}/${encodeURIComponent(timestamp)}`}
          className="cursor-pointer hover:underline underline-offset-4"
        >
          {experiment}
        </Link>
        <span>/</span>
        <span>{evalName}</span>
        <span>/</span>
        <span>{run}</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Transcript</h1>

      <TranscriptViewer transcript={transcript} />
    </div>
  );
}
