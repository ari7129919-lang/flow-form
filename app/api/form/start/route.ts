import { NextResponse } from "next/server";
import { z } from "zod";
import { generateOtpCode, hashOtp } from "@/lib/otp";
import { sendMail } from "@/lib/mailerServer";
import { getServerEnv } from "@/lib/env";
import { createOtpSession, getFormBySlug } from "@/lib/data";

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const bodySchema = z.object({
  formSlug: z.string().min(1),
  name: z.string().trim().min(1).optional(),
  phone: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .superRefine((val, ctx) => {
      const digits = val.replace(/\D/g, "");
      if (digits.length < 9) {
        ctx.addIssue({ code: "custom", message: "מספר טלפון חייב להכיל לפחות 9 ספרות" });
      }
    })
    .optional(),
  email: z.preprocess(
    (v) => {
      if (typeof v !== "string") return v;
      const cleaned = v
        .trim()
        .replace(/[\s\u200e\u200f\u202a-\u202e]/g, "")
        .toLowerCase();
      return cleaned;
    },
    z.string().email("כתובת מייל לא תקינה"),
  ),
});

export async function POST(req: Request) {
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.flatten();
    return NextResponse.json(
      {
        error: "יש שדה אחד או יותר לא תקין",
        details: {
          fieldErrors: details.fieldErrors,
          formErrors: details.formErrors,
        },
      },
      { status: 400 },
    );
  }

  const env = getServerEnv();

  let form: { id: string; slug: string; name: string } | null = null;
  try {
    form = await getFormBySlug(parsed.data.formSlug);
  } catch (e) {
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
  }

  if (!form) {
    return NextResponse.json({ error: "טופס לא נמצא" }, { status: 404 });
  }

  const code = generateOtpCode();
  const otpHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  let session: { id: string };
  try {
    session = await createOtpSession({
      formId: form.id,
      name: parsed.data.name ?? null,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      otpHash,
      otpExpiresAtIso: expiresAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "שגיאה ביצירת סשן" }, { status: 500 });
  }

  if (!env.USE_MOCK_DATA) {
    try {
      await sendMail({
        to: parsed.data.email,
        subject: "קוד אימות חד-פעמי",
        text: `קוד האימות שלך הוא: ${code}\n\nהקוד בתוקף ל-10 דקות. אם לא ביקשת קוד, אפשר להתעלם מהודעה זו.`,
        html: `
          <div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
            <h2 style="margin:0 0 12px">קוד אימות חד-פעמי</h2>
            <p style="margin:0 0 8px">להמשך מילוי הטופס <b>${escapeHtml(form.name)}</b>, הזן את הקוד הבא:</p>
            <div style="display:inline-block;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:14px 18px;font-size:22px;letter-spacing:4px;font-weight:700;color:#065f46">
              ${code}
            </div>
            <p style="margin:12px 0 0;color:#52525b;font-size:13px">הקוד בתוקף ל-10 דקות. אם לא ביקשת קוד, אפשר להתעלם מהודעה זו.</p>
          </div>
        `,
      });
    } catch (e) {
      console.error("[otp:start] sendMail failed", {
        formId: form.id,
        formSlug: parsed.data.formSlug,
        to: parsed.data.email,
        error: e,
      });
      return NextResponse.json({ error: "שגיאה בשליחת קוד למייל" }, { status: 500 });
    }
  }

  return NextResponse.json({
    sessionId: session.id,
    ...(env.USE_MOCK_DATA ? { debugCode: code } : {}),
  });
}
