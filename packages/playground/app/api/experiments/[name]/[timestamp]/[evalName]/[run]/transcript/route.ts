import { NextResponse } from "next/server";
import { getTranscript } from "@/lib/data";

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
  const data = getTranscript(
    decodeURIComponent(name),
    decodeURIComponent(timestamp),
    decodeURIComponent(evalName),
    decodeURIComponent(run)
  );

  if (!data) {
    return NextResponse.json(
      { error: "Transcript not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
