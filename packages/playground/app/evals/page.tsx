import { EvalsPage } from "@/components/EvalsPage";
import { listEvals } from "@/lib/data";

export const dynamic = "force-dynamic";

const LIMIT = 21; // 7 rows of 3

export default async function EvalsRoute({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  const { all } = await searchParams;
  const showAll = all !== undefined;
  const { items: evals, total } = listEvals(showAll ? undefined : LIMIT);

  return <EvalsPage evals={evals} total={total} showAll={showAll} />;
}
