import { ExperimentList } from "@/components/ExperimentList";
import { listExperiments } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function ExperimentsPage() {
  const experiments = listExperiments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Experiments</h1>
        <p className="text-muted-foreground mt-1">
          Browse and inspect your agent evaluation results.
        </p>
      </div>
      <ExperimentList experiments={experiments} />
    </div>
  );
}
