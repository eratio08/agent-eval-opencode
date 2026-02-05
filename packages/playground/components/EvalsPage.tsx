import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShowMore } from "@/components/ShowMore";

interface EvalInfo {
  name: string;
  prompt: string;
  files: string[];
}

interface EvalsPageProps {
  evals: EvalInfo[];
  total: number;
  showAll: boolean;
}

export function EvalsPage({ evals, total, showAll }: EvalsPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Evals</h1>
        <p className="text-muted-foreground mt-1">
          Browse all eval fixtures in your project.
        </p>
      </div>

      {evals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">No evals found</p>
            <p className="text-muted-foreground text-sm mt-2">
              Create evals in your{" "}
              <code className="text-foreground bg-muted px-1.5 py-0.5 rounded text-xs">
                evals/
              </code>{" "}
              directory.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ShowMore total={total} showAllHref={showAll ? undefined : "/evals?all"} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evals.map((evalInfo) => (
            <Link key={evalInfo.name} href={`/evals/${encodeURIComponent(evalInfo.name)}`} className="block cursor-pointer">
            <Card className="transition-colors hover:bg-muted">
              <CardHeader>
                <CardTitle className="text-base">{evalInfo.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {evalInfo.prompt && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {evalInfo.prompt.slice(0, 200)}
                    {evalInfo.prompt.length > 200 ? "..." : ""}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {evalInfo.files.slice(0, 5).map((file) => (
                    <Badge
                      key={file}
                      variant="secondary"
                      className="text-xs font-mono"
                    >
                      {file}
                    </Badge>
                  ))}
                  {evalInfo.files.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{evalInfo.files.length - 5} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </ShowMore>
      )}
    </div>
  );
}
