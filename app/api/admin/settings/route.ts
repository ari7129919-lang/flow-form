import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminReceiverEmail, setAdminReceiverEmail } from "@/lib/settings";

export async function GET() {
  const adminReceiverEmail = await getAdminReceiverEmail();
  return NextResponse.json({ adminReceiverEmail });
}

const bodySchema = z.object({
  adminReceiverEmail: z.string().trim().email().or(z.literal("")),
});

export async function PUT(req: Request) {
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  await setAdminReceiverEmail(parsed.data.adminReceiverEmail);
  return NextResponse.json({ ok: true });
}
