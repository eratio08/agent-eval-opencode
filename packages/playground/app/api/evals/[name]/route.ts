import { NextResponse } from "next/server";
import { getEvalDetail } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const data = getEvalDetail(decodeURIComponent(name));

  if (!data) {
    return NextResponse.json(
      { error: `Eval not found: ${name}` },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
