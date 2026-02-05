import { notFound } from "next/navigation";
import { TranscriptPage } from "@/components/TranscriptPage";
import { getTranscript } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function TranscriptRoute({
  params,
}: {
  params: Promise<{
    experiment: string;
    timestamp: string;
    evalName: string;
    run: string;
  }>;
}) {
  const { experiment, timestamp, evalName, run } = await params;
  const decodedExperiment = decodeURIComponent(experiment);
  const decodedTimestamp = decodeURIComponent(timestamp);
  const decodedEvalName = decodeURIComponent(evalName);
  const decodedRun = decodeURIComponent(run);

  const transcript = getTranscript(
    decodedExperiment,
    decodedTimestamp,
    decodedEvalName,
    decodedRun
  );

  if (!transcript) {
    notFound();
  }

  return (
    <TranscriptPage
      experiment={decodedExperiment}
      timestamp={decodedTimestamp}
      evalName={decodedEvalName}
      run={decodedRun}
      transcript={transcript}
    />
  );
}
