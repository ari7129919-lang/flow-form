import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteForm, getFormAdmin, updateForm } from "@/lib/data";

const paramsSchema = z.object({
  formId: z.string().min(1),
});

export async function GET(_req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const raw = await ctx.params;
  const parsed = paramsSchema.safeParse({ formId: raw.formId });
  if (!parsed.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const form = await getFormAdmin(parsed.data.formId);
  if (!form) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  return NextResponse.json(form);
}

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
  welcomeTitle: z.string().trim().min(1).optional(),
  welcomeSubtitle: z.string().trim().min(1).optional(),
  completionTitle: z.string().trim().min(1).optional(),
  completionSubtitle: z.string().trim().min(1).optional(),
  nudgeQuestionOrder: z.number().int().positive().nullable().optional(),
  nudgeText: z.string().trim().min(1).nullable().optional(),
});

export async function PUT(req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const raw = await ctx.params;
  const parsedParams = paramsSchema.safeParse({ formId: raw.formId });
  if (!parsedParams.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const row = await updateForm(parsedParams.data.formId, parsed.data);
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const raw = await ctx.params;
  const parsedParams = paramsSchema.safeParse({ formId: raw.formId });
  if (!parsedParams.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  await deleteForm(parsedParams.data.formId);
  return NextResponse.json({ ok: true });
}
