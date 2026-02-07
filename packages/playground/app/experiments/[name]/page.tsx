import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getExperiment, getExperimentDetail } from "@/lib/data";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ExperimentRunsPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const experiment = getExperiment(decodedName);

  if (!experiment) {
    notFound();
  }

  // Get details for each timestamp to show pass rates
  const runsWithDetails = experiment.timestamps.map((timestamp) => {
    const detail = getExperimentDetail(decodedName, timestamp);
    if (!detail) {
      return { timestamp, passRate: null, totalRuns: 0, passedRuns: 0 };
    }

    const totalRuns = detail.evals.reduce((sum, e) => sum + e.totalRuns, 0);
    const passedRuns = detail.evals.reduce((sum, e) => sum + e.passedRuns, 0);
    const passRate = totalRuns > 0 ? (passedRuns / totalRuns) * 100 : 0;

    return {
      timestamp,
      passRate,
      totalRuns,
      passedRuns,
      evalCount: detail.evals.length,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/experiments" className="hover:text-foreground">
            Experiments
          </Link>
          <span>/</span>
          <span>{decodedName}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{decodedName}</h1>
        <p className="text-muted-foreground mt-1">
          All runs for this experiment ({experiment.timestamps.length} total)
        </p>
      </div>

      <Card>
        <CardContent className="pt-0">
          <div>
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-3 py-2 text-xs text-muted-foreground font-medium border-b border-border">
              <span className="w-8">#</span>
              <span>Timestamp</span>
              <span className="w-24">Pass Rate</span>
              <span className="w-32">Evals</span>
            </div>
            {/* Rows */}
            {runsWithDetails.map((run, index) => (
              <Link
                key={run.timestamp}
                href={`/experiments/${encodeURIComponent(decodedName)}/${encodeURIComponent(run.timestamp)}`}
                className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted rounded-md"
              >
                <span className="w-8 text-muted-foreground">
                  {runsWithDetails.length - index}
                </span>
                <span className="font-mono text-sm">
                  {formatTimestamp(run.timestamp)}
                </span>
                <span className="w-24">
                  {run.passRate !== null ? (
                    <span className="flex items-center gap-2">
                      <Badge
                        variant={
                          run.passRate === 100
                            ? "default"
                            : run.passRate >= 50
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {run.passRate.toFixed(0)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {run.passedRuns}/{run.totalRuns}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </span>
                <span className="w-32 text-sm text-muted-foreground">
                  {run.evalCount ?? 0} eval{run.evalCount !== 1 ? "s" : ""}
                </span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatTimestamp(ts: string): string {
  try {
    const isoString = ts.replace(/T(\d{2})-(\d{2})-(\d{2})/, "T$1:$2:$3");
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return ts;
    return date.toLocaleString();
  } catch {
    return ts;
  }
}
