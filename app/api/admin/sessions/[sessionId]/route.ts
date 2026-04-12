import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionReport } from "@/lib/data";

const paramsSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function GET(_req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const raw = await ctx.params;
  const parsed = paramsSchema.safeParse({ sessionId: raw.sessionId });
  if (!parsed.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const report = await getSessionReport(parsed.data.sessionId);
  if (!report) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  return NextResponse.json(report);
}
