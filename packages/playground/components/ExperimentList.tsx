import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShowMore } from "@/components/ShowMore";

interface ExperimentInfo {
  name: string;
  timestamps: string[];
  latestTimestamp: string | null;
  latestPassRate?: number;
  latestTotalRuns?: number;
  latestPassedRuns?: number;
}

interface ExperimentListProps {
  experiments: ExperimentInfo[];
  total: number;
  showAll: boolean;
}

export function ExperimentList({ experiments, total, showAll }: ExperimentListProps) {
  if (experiments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-lg">No experiments found</p>
          <p className="text-muted-foreground text-sm mt-2">
            Run an experiment with <code className="text-foreground bg-muted px-1.5 py-0.5 rounded text-xs">agent-eval &lt;config&gt;</code> to see results here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-0">
        <div>
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-3 py-2 text-xs text-muted-foreground font-medium border-b border-border">
            <span>Name</span>
            <span className="w-12 text-right">Runs</span>
            <span className="w-24">Pass Rate</span>
            <span className="w-44">Latest Run</span>
          </div>
          {/* Rows */}
          <ShowMore total={total} showAllHref={showAll ? undefined : "/experiments?all"}>
            {experiments.map((exp) => (
              <div
                key={exp.name}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-3 py-2.5 transition-colors hover:bg-muted rounded-md"
              >
                <Link
                  href={`/experiments/${encodeURIComponent(exp.name)}`}
                  className="font-medium truncate hover:underline"
                >
                  {exp.name}
                </Link>
                <Link
                  href={`/experiments/${encodeURIComponent(exp.name)}`}
                  className="w-12 text-right text-muted-foreground hover:text-foreground hover:underline"
                  title="View all runs"
                >
                  {exp.timestamps.length}
                </Link>
                <Link
                  href={
                    exp.latestTimestamp
                      ? `/experiments/${encodeURIComponent(exp.name)}/${encodeURIComponent(exp.latestTimestamp)}`
                      : "#"
                  }
                  className="w-24 block"
                >
                  {exp.latestPassRate !== undefined ? (
                    <span className="flex items-center gap-2">
                      <Badge
                        variant={
                          exp.latestPassRate === 100
                            ? "default"
                            : exp.latestPassRate >= 50
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {exp.latestPassRate.toFixed(0)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {exp.latestPassedRuns}/{exp.latestTotalRuns}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </Link>
                <Link
                  href={
                    exp.latestTimestamp
                      ? `/experiments/${encodeURIComponent(exp.name)}/${encodeURIComponent(exp.latestTimestamp)}`
                      : "#"
                  }
                  className="w-44 text-xs text-muted-foreground hover:text-foreground"
                >
                  {exp.latestTimestamp ? formatTimestamp(exp.latestTimestamp) : "--"}
                </Link>
              </div>
            ))}
          </ShowMore>
        </div>
      </CardContent>
    </Card>
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
