import { ComparePage } from "@/components/ComparePage";
import { listExperiments } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function CompareRoute() {
  const experiments = listExperiments();
  return <ComparePage experiments={experiments} />;
}
