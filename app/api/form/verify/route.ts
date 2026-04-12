import { NextResponse } from "next/server";
import { z } from "zod";
import { hashOtp, safeEqual } from "@/lib/otp";
import {
  addOtpFailedEvent,
  getOtpSession,
  markSessionVerified,
} from "@/lib/data";

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: Request) {
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  let session:
    | {
        id: string;
        otp_hash: string | null;
        otp_expires_at: string | null;
        verified_at: string | null;
      }
    | null = null;
  try {
    session = await getOtpSession(parsed.data.sessionId);
  } catch {
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: "סשן לא נמצא" }, { status: 404 });
  }

  if (session.verified_at) {
    return NextResponse.json({ ok: true });
  }

  if (!session.otp_hash || !session.otp_expires_at) {
    return NextResponse.json({ error: "אין קוד אימות פעיל" }, { status: 400 });
  }

  const exp = new Date(session.otp_expires_at);
  if (Date.now() > exp.getTime()) {
    return NextResponse.json({ error: "הקוד פג תוקף" }, { status: 400 });
  }

  const provided = hashOtp(parsed.data.code);
  if (!safeEqual(provided, session.otp_hash)) {
    await addOtpFailedEvent(session.id);
    return NextResponse.json({ error: "קוד שגוי" }, { status: 401 });
  }

  await markSessionVerified(session.id);

  return NextResponse.json({ ok: true });
}
