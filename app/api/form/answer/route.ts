import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertAnswer } from "@/lib/data";

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  formSlug: z.string().min(1),
  questionId: z.string().min(1),
  questionOrder: z.number().int().positive(),
  value: z.enum(["yes", "no", "other"]),
  otherText: z.string().trim().min(1).optional().nullable(),
});

export async function POST(req: Request) {
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  await upsertAnswer({
    sessionId: parsed.data.sessionId,
    formSlug: parsed.data.formSlug,
    questionId: parsed.data.questionId,
    questionOrder: parsed.data.questionOrder,
    value: parsed.data.value,
    otherText: parsed.data.otherText ?? null,
  });

  return NextResponse.json({ ok: true });
}
