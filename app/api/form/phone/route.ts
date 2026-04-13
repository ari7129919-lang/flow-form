import { NextResponse } from "next/server";
import { z } from "zod";
import { updateSessionPhone } from "@/lib/data";

const bodySchema = z.object({
  sessionId: z.string().uuid(),
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
    }),
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

  try {
    await updateSessionPhone({ sessionId: parsed.data.sessionId, phone: parsed.data.phone.trim() });
  } catch {
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
