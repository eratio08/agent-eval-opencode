"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { TranscriptSummary, ToolName } from "@/lib/types";

interface O11ySummaryProps {
  summary: TranscriptSummary;
}

const TOOL_LABELS: Record<ToolName, string> = {
  file_read: "File Read",
  file_write: "File Write",
  file_edit: "File Edit",
  shell: "Shell",
  web_fetch: "Web Fetch",
  web_search: "Web Search",
  glob: "Glob",
  grep: "Grep",
  list_dir: "List Dir",
  agent_task: "Agent Task",
  unknown: "Unknown",
};

export function O11ySummary({ summary }: O11ySummaryProps) {
  const toolEntries = Object.entries(summary.toolCalls)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-4">
      {/* Overview stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="py-3 px-4">
            <div className="text-xs text-muted-foreground">Total Turns</div>
            <div className="text-xl font-bold">{summary.totalTurns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="text-xs text-muted-foreground">Tool Calls</div>
            <div className="text-xl font-bold">{summary.totalToolCalls}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="text-xs text-muted-foreground">Thinking</div>
            <div className="text-xl font-bold">{summary.thinkingBlocks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="text-xs text-muted-foreground">Errors</div>
            <div className="text-xl font-bold text-destructive">
              {summary.errors.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tool calls breakdown */}
      {toolEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tool Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toolEntries.map(([tool, count]) => (
                  <TableRow key={tool}>
                    <TableCell className="text-sm">
                      {TOOL_LABELS[tool as ToolName] ?? tool}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Files */}
      {(summary.filesRead.length > 0 || summary.filesModified.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.filesRead.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Read ({summary.filesRead.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {summary.filesRead.slice(0, 20).map((f) => (
                    <Badge key={f} variant="secondary" className="text-xs font-mono">
                      {f}
                    </Badge>
                  ))}
                  {summary.filesRead.length > 20 && (
                    <Badge variant="outline" className="text-xs">
                      +{summary.filesRead.length - 20} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {summary.filesModified.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Modified ({summary.filesModified.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {summary.filesModified.slice(0, 20).map((f) => (
                    <Badge key={f} variant="secondary" className="text-xs font-mono">
                      {f}
                    </Badge>
                  ))}
                  {summary.filesModified.length > 20 && (
                    <Badge variant="outline" className="text-xs">
                      +{summary.filesModified.length - 20} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shell commands */}
      {summary.shellCommands.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Shell Commands ({summary.shellCommands.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {summary.shellCommands.slice(0, 20).map((cmd, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs font-mono bg-muted rounded px-2 py-1"
                >
                  <span className="truncate">{cmd.command}</span>
                  {cmd.exitCode !== undefined && (
                    <Badge
                      variant={cmd.exitCode === 0 ? "secondary" : "destructive"}
                      className="text-xs ml-2 shrink-0"
                    >
                      exit {cmd.exitCode}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {summary.errors.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive">
              Errors ({summary.errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {summary.errors.map((err, i) => (
                <div
                  key={i}
                  className="text-xs font-mono bg-destructive/10 text-destructive rounded px-2 py-1"
                >
                  {err}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
