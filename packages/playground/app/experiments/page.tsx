import { ExperimentList } from "@/components/ExperimentList";
import { listExperiments } from "@/lib/data";

export const dynamic = "force-dynamic";

const LIMIT = 20;

export default async function ExperimentsPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  const { all } = await searchParams;
  const showAll = all !== undefined;
  const { items: experiments, total } = listExperiments(showAll ? undefined : LIMIT);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Experiments</h1>
        <p className="text-muted-foreground mt-1">
          Browse and inspect your agent evaluation results.
        </p>
      </div>
      <ExperimentList experiments={experiments} total={total} showAll={showAll} />
    </div>
  );
}
