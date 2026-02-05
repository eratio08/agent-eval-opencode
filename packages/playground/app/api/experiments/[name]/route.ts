import { NextResponse } from "next/server";
import { getExperiment } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const data = getExperiment(decodeURIComponent(name));

  if (!data) {
    return NextResponse.json(
      { error: `Experiment not found: ${name}` },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
