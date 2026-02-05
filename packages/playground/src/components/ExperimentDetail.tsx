"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RunResultCard } from "@/components/RunResultCard";
import { getExperimentDetail } from "@/lib/api-client";

interface EvalDetail {
  name: string;
  totalRuns: number;
  passedRuns: number;
  passRate: number;
  meanDuration: number;
  runs: { name: string; result: RunResult | null }[];
}

interface RunResult {
  status: "passed" | "failed";
  error?: string;
  duration: number;
  o11y?: {
    totalToolCalls: number;
    thinkingBlocks: number;
    errors: string[];
  };
}

interface ExperimentDetailData {
  name: string;
  timestamp: string;
  evals: EvalDetail[];
}

interface ExperimentDetailProps {
  name: string;
  timestamp: string;
}

export function ExperimentDetail({ name, timestamp }: ExperimentDetailProps) {
  const [data, setData] = useState<ExperimentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getExperimentDetail(name, timestamp)
      .then((d) => {
        setData(d as unknown as ExperimentDetailData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [name, timestamp]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading experiment detail...
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {error || "Failed to load experiment"}
        </CardContent>
      </Card>
    );
  }

  const totalEvals = data.evals.length;
  const passedEvals = data.evals.filter(
    (e) => e.passedRuns === e.totalRuns
  ).length;
  const overallPassRate =
    data.evals.reduce((sum, e) => sum + e.passRate, 0) / (totalEvals || 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <a href="/" className="hover:underline underline-offset-4">
            Experiments
          </a>
          <span>/</span>
          <span>{name}</span>
          <span>/</span>
          <span>{formatTimestamp(timestamp)}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 px-4">
            <div className="text-xs text-muted-foreground">
              Overall Pass Rate
            </div>
            <div className="text-2xl font-bold mt-1">
              {overallPassRate.toFixed(0)}%
            </div>
            <Progress value={overallPassRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4">
            <div className="text-xs text-muted-foreground">Evals</div>
            <div className="text-2xl font-bold mt-1">
              {passedEvals}/{totalEvals}
            </div>
            <div className="text-xs text-muted-foreground mt-1">passed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4">
            <div className="text-xs text-muted-foreground">Avg Duration</div>
            <div className="text-2xl font-bold mt-1">
              {(
                data.evals.reduce((s, e) => s + e.meanDuration, 0) /
                (totalEvals || 1)
              ).toFixed(1)}
              s
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4">
            <div className="text-xs text-muted-foreground">Timestamp</div>
            <div className="text-sm font-medium mt-1">
              {formatTimestamp(timestamp)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Per-eval breakdown */}
      <div className="space-y-6">
        {data.evals.map((evalDetail) => (
          <Card key={evalDetail.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{evalDetail.name}</CardTitle>
                  <Badge
                    variant={
                      evalDetail.passedRuns === evalDetail.totalRuns
                        ? "default"
                        : "destructive"
                    }
                  >
                    {evalDetail.passedRuns}/{evalDetail.totalRuns} passed
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  avg {evalDetail.meanDuration.toFixed(1)}s
                </div>
              </div>
              <Progress value={evalDetail.passRate} className="h-1.5 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {evalDetail.runs.map((run) => (
                  <RunResultCard
                    key={run.name}
                    runName={run.name}
                    result={run.result}
                    experiment={name}
                    timestamp={timestamp}
                    evalName={evalDetail.name}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
