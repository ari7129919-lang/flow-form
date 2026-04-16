import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionReport, updateSessionTreatment } from "@/lib/data";

const paramsSchema = z.object({
  sessionId: z.string().uuid(),
});

const patchBodySchema = z.object({
  treatmentStatus: z.enum(["untreated", "treated", "reviewing"]),
  treatmentNote: z.string().trim().optional().nullable(),
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

export async function PATCH(req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const raw = await ctx.params;
  const parsedParams = paramsSchema.safeParse({ sessionId: raw.sessionId });
  if (!parsedParams.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const parsedBody = patchBodySchema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  await updateSessionTreatment({
    sessionId: parsedParams.data.sessionId,
    treatmentStatus: parsedBody.data.treatmentStatus,
    treatmentNote: parsedBody.data.treatmentNote ?? null,
  });

  return NextResponse.json({ ok: true });
}
