import { NextResponse } from "next/server";
import { z } from "zod";
import { getFormBootstrap } from "@/lib/data";

const querySchema = z.object({
  formSlug: z.string().min(1),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    formSlug: url.searchParams.get("formSlug"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const data = await getFormBootstrap(parsed.data.formSlug);
  if (!data) {
    return NextResponse.json({ error: "טופס לא נמצא" }, { status: 404 });
  }

  return NextResponse.json(data);
}
