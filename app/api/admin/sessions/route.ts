import { NextResponse } from "next/server";
import { listCompletedSessions } from "@/lib/data";

export async function GET() {
  const data = await listCompletedSessions();
  return NextResponse.json({ sessions: data });
}
