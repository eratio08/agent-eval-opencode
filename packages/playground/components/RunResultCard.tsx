"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

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

interface RunResultCardProps {
  runName: string;
  result: RunResult | null;
  experiment: string;
  timestamp: string;
  evalName: string;
}

export function RunResultCard({
  runName,
  result,
  experiment,
  timestamp,
  evalName,
}: RunResultCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!result) {
    return (
      <Card className="opacity-50">
        <CardContent className="py-3 px-4">
          <span className="text-sm text-muted-foreground">{runName}: No result</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="transition-colors hover:bg-muted/50">
        <CollapsibleTrigger className="w-full">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChevronRight
                className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
              />
              <span className="text-sm font-medium">{runName}</span>
              <Badge
                variant={result.status === "passed" ? "default" : "destructive"}
              >
                {result.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {result.o11y && (
                <span>{result.o11y.totalToolCalls} tool calls</span>
              )}
              <span>{result.duration.toFixed(1)}s</span>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 space-y-3">
            {result.error && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm text-destructive font-mono">{result.error}</p>
              </div>
            )}
            {result.o11y && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-md bg-muted p-2">
                  <div className="text-muted-foreground">Tool Calls</div>
                  <div className="font-medium">{result.o11y.totalToolCalls}</div>
                </div>
                <div className="rounded-md bg-muted p-2">
                  <div className="text-muted-foreground">Thinking</div>
                  <div className="font-medium">{result.o11y.thinkingBlocks}</div>
                </div>
                <div className="rounded-md bg-muted p-2">
                  <div className="text-muted-foreground">Errors</div>
                  <div className="font-medium">{result.o11y.errors.length}</div>
                </div>
              </div>
            )}
            <a
              href={`/transcript/${encodeURIComponent(experiment)}/${encodeURIComponent(timestamp)}/${encodeURIComponent(evalName)}/${encodeURIComponent(runName)}`}
              className="inline-flex items-center text-sm text-primary underline-offset-4 hover:underline"
            >
              View transcript →
            </a>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
