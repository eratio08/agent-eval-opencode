import { NextResponse } from "next/server";
import { getExperimentDetail } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string; timestamp: string }> }
) {
  const { name, timestamp } = await params;
  const data = getExperimentDetail(
    decodeURIComponent(name),
    decodeURIComponent(timestamp)
  );

  if (!data) {
    return NextResponse.json(
      { error: `Experiment run not found: ${name}/${timestamp}` },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
