import { NextResponse } from "next/server";
import { getRunResult } from "@/lib/data";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      name: string;
      timestamp: string;
      evalName: string;
      run: string;
    }>;
  }
) {
  const { name, timestamp, evalName, run } = await params;
  const data = getRunResult(
    decodeURIComponent(name),
    decodeURIComponent(timestamp),
    decodeURIComponent(evalName),
    decodeURIComponent(run)
  );

  if (!data) {
    return NextResponse.json(
      { error: "Run result not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
