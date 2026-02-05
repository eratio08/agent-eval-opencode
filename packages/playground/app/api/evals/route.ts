import { NextResponse } from "next/server";
import { listEvals } from "@/lib/data";

export async function GET() {
  return NextResponse.json(listEvals());
}
