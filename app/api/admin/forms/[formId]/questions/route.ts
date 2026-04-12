import { NextResponse } from "next/server";
import { z } from "zod";
import { createQuestion, listQuestionsByFormId } from "@/lib/data";

const paramsSchema = z.object({
  formId: z.string().min(1),
});

export async function GET(_req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const raw = await ctx.params;
  const parsed = paramsSchema.safeParse({ formId: raw.formId });
  if (!parsed.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const questions = await listQuestionsByFormId(parsed.data.formId);
  return NextResponse.json({ questions });
}

const bodySchema = z.object({
  order: z.number().int().positive(),
  text: z.string().trim().min(1),
  required: z.boolean(),
  allowOther: z.boolean(),
});

export async function POST(req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const raw = await ctx.params;
  const parsedParams = paramsSchema.safeParse({ formId: raw.formId });
  if (!parsedParams.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const row = await createQuestion({
    formId: parsedParams.data.formId,
    order: parsed.data.order,
    text: parsed.data.text,
    required: parsed.data.required,
    allowOther: parsed.data.allowOther,
  });

  return NextResponse.json(row);
}
