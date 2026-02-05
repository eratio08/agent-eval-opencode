import { NextResponse } from "next/server";
import { listExperiments } from "@/lib/data";

export async function GET() {
  return NextResponse.json(listExperiments());
}
