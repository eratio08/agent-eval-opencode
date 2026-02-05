"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getEval } from "@/lib/api-client";

interface EvalDetailData {
  name: string;
  prompt: string;
  files: string[];
  fileContents?: Record<string, string>;
}

interface EvalDetailProps {
  name: string;
}

export function EvalDetail({ name }: EvalDetailProps) {
  const [data, setData] = useState<EvalDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEval(name)
      .then((d) => {
        setData(d as unknown as EvalDetailData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [name]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading eval...
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {error || "Failed to load eval"}
        </CardContent>
      </Card>
    );
  }

  const evalFile = data.fileContents?.["EVAL.ts"] || data.fileContents?.["EVAL.tsx"];
  const evalFileName = data.fileContents?.["EVAL.ts"] ? "EVAL.ts" : "EVAL.tsx";
  const packageJson = data.fileContents?.["package.json"];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <a href="/evals" className="hover:underline underline-offset-4">
          Evals
        </a>
        <span>/</span>
        <span>{name}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
      </div>

      <Tabs defaultValue="prompt" className="w-full">
        <TabsList>
          <TabsTrigger value="prompt">PROMPT.md</TabsTrigger>
          {evalFile && <TabsTrigger value="eval">{evalFileName}</TabsTrigger>}
          {packageJson && <TabsTrigger value="package">package.json</TabsTrigger>}
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="prompt" className="mt-4">
          <Card>
            <CardContent className="py-4">
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="prose prose-invert max-w-none">
                  <pre className="text-sm font-mono whitespace-pre-wrap bg-muted rounded p-4">
                    {data.prompt || "No PROMPT.md found."}
                  </pre>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {evalFile && (
          <TabsContent value="eval" className="mt-4">
            <Card>
              <CardContent className="py-4">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <pre className="text-sm font-mono whitespace-pre-wrap bg-muted rounded p-4 overflow-x-auto">
                    {evalFile}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {packageJson && (
          <TabsContent value="package" className="mt-4">
            <Card>
              <CardContent className="py-4">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <pre className="text-sm font-mono whitespace-pre-wrap bg-muted rounded p-4 overflow-x-auto">
                    {packageJson}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="files" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Fixture Files ({data.files.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {data.files.map((file) => (
                  <div
                    key={file}
                    className="flex items-center gap-2 text-sm font-mono bg-muted rounded px-3 py-1.5"
                  >
                    <FileIcon filename={file} />
                    <span>{file}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FileIcon({ filename }: { filename: string }) {
  const ext = filename.split(".").pop()?.toLowerCase();

  const iconMap: Record<string, string> = {
    ts: "TS",
    tsx: "TX",
    js: "JS",
    json: "{}",
    md: "MD",
    css: "CS",
    html: "HT",
  };

  const label = iconMap[ext || ""] || "F";

  return (
    <Badge variant="outline" className="text-[10px] font-mono px-1 py-0 h-5 w-6 flex items-center justify-center">
      {label}
    </Badge>
  );
}
