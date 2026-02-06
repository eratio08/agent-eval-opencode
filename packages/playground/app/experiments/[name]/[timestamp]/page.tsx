import { notFound } from "next/navigation";
import { ExperimentDetail } from "@/components/ExperimentDetail";
import { getExperimentDetail } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ExperimentPage({
  params,
}: {
  params: Promise<{ name: string; timestamp: string }>;
}) {
  const { name, timestamp } = await params;
  const decodedName = decodeURIComponent(name);
  const decodedTimestamp = decodeURIComponent(timestamp);

  const data = getExperimentDetail(decodedName, decodedTimestamp);

  if (!data) {
    notFound();
  }

  return <ExperimentDetail data={data} />;
}
