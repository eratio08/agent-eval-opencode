import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EvalDetailData {
  name: string;
  prompt: string;
  files: string[];
  fileContents?: Record<string, string>;
}

interface EvalDetailProps {
  data: EvalDetailData;
}

export function EvalDetail({ data }: EvalDetailProps) {
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
        <span>{data.name}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{data.name}</h1>
      </div>

      <Tabs defaultValue="prompt" className="w-full">
        <TabsList>
          <TabsTrigger value="prompt">PROMPT.md</TabsTrigger>
          {evalFile && <TabsTrigger value="eval">{evalFileName}</TabsTrigger>}
          {packageJson && <TabsTrigger value="package">package.json</TabsTrigger>}
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="prompt" className="mt-4">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <pre className="text-sm font-mono whitespace-pre-wrap rounded-lg bg-muted p-4">
              {data.prompt || "No PROMPT.md found."}
            </pre>
          </ScrollArea>
        </TabsContent>

        {evalFile && (
          <TabsContent value="eval" className="mt-4">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <pre className="text-sm font-mono whitespace-pre-wrap rounded-lg bg-muted p-4 overflow-x-auto">
                {evalFile}
              </pre>
            </ScrollArea>
          </TabsContent>
        )}

        {packageJson && (
          <TabsContent value="package" className="mt-4">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <pre className="text-sm font-mono whitespace-pre-wrap rounded-lg bg-muted p-4 overflow-x-auto">
                {packageJson}
              </pre>
            </ScrollArea>
          </TabsContent>
        )}

        <TabsContent value="files" className="mt-4">
          <div className="text-sm text-muted-foreground mb-3">
            {data.files.length} files
          </div>
          <div className="space-y-1">
            {data.files.map((file) => (
              <div
                key={file}
                className="flex items-center gap-2 text-sm font-mono bg-muted rounded-lg px-3 py-1.5"
              >
                <FileIcon filename={file} />
                <span>{file}</span>
              </div>
            ))}
          </div>
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
