import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteQuestion, updateQuestion } from "@/lib/data";

const paramsSchema = z.object({
  questionId: z.string().min(1),
});

const bodySchema = z.object({
  order: z.number().int().positive().optional(),
  text: z.string().trim().min(1).optional(),
  required: z.boolean().optional(),
  allowOther: z.boolean().optional(),
});

export async function PUT(req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const raw = await ctx.params;
  const parsedParams = paramsSchema.safeParse({ questionId: raw.questionId });
  if (!parsedParams.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const row = await updateQuestion(parsedParams.data.questionId, parsed.data);
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const raw = await ctx.params;
  const parsedParams = paramsSchema.safeParse({ questionId: raw.questionId });
  if (!parsedParams.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  await deleteQuestion(parsedParams.data.questionId);
  return NextResponse.json({ ok: true });
}
