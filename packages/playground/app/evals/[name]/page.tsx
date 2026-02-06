import { notFound } from "next/navigation";
import { EvalDetail } from "@/components/EvalDetail";
import { getEvalDetail } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EvalDetailRoute({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const data = getEvalDetail(decodedName);

  if (!data) {
    notFound();
  }

  return <EvalDetail data={data} />;
}
