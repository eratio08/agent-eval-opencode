import { EvalsPage } from "@/components/EvalsPage";
import { listEvals } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function EvalsRoute() {
  const evals = listEvals();
  return <EvalsPage evals={evals} />;
}
