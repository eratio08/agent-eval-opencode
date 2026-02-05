"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listExperiments } from "@/lib/api-client";

interface ExperimentInfo {
  name: string;
  timestamps: string[];
  latestTimestamp: string | null;
  latestPassRate?: number;
  latestTotalRuns?: number;
  latestPassedRuns?: number;
}

export function ExperimentList() {
  const [experiments, setExperiments] = useState<ExperimentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listExperiments()
      .then((data) => {
        setExperiments(data as ExperimentInfo[]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading experiments...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Error: {error}
        </CardContent>
      </Card>
    );
  }

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
      <CardHeader>
        <CardTitle>Experiments</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Experiment</TableHead>
              <TableHead>Runs</TableHead>
              <TableHead>Pass Rate</TableHead>
              <TableHead>Latest Run</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {experiments.map((exp) => (
              <TableRow key={exp.name}>
                <TableCell className="font-medium">{exp.name}</TableCell>
                <TableCell>{exp.timestamps.length}</TableCell>
                <TableCell>
                  {exp.latestPassRate !== undefined ? (
                    <div className="flex items-center gap-2">
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
                    </div>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </TableCell>
                <TableCell>
                  {exp.latestTimestamp ? (
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(exp.latestTimestamp)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {exp.latestTimestamp && (
                    <a
                      href={`/experiments/${encodeURIComponent(exp.name)}/${encodeURIComponent(exp.latestTimestamp)}`}
                      className="text-sm text-primary underline-offset-4 hover:underline"
                    >
                      View
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function formatTimestamp(ts: string): string {
  try {
    // Timestamps are like "2024-01-26T12-00-00Z" — convert dashes back to colons for time
    const isoString = ts.replace(/T(\d{2})-(\d{2})-(\d{2})/, "T$1:$2:$3");
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return ts;
    return date.toLocaleString();
  } catch {
    return ts;
  }
}
