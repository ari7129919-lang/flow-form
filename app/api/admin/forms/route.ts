import { NextResponse } from "next/server";
import { z } from "zod";
import { createForm, listForms } from "@/lib/data";

export async function GET() {
  const forms = await listForms();
  return NextResponse.json({ forms });
}

const bodySchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
});

export async function POST(req: Request) {
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const row = await createForm({ name: parsed.data.name, slug: parsed.data.slug });
  return NextResponse.json(row);
}
