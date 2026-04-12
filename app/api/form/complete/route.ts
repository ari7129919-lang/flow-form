import { NextResponse } from "next/server";
import { z } from "zod";
import { completeSession, getSessionReport } from "@/lib/data";
import { getAdminReceiverEmail } from "@/lib/settings";
import { sendMail } from "@/lib/mailerServer";

function fmtDateTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("he-IL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const bodySchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(req: Request) {
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  await completeSession(parsed.data.sessionId);

  const to = await getAdminReceiverEmail();
  if (to) {
    const report = await getSessionReport(parsed.data.sessionId);
    if (report) {
      const session: any = (report as any).session;
      const questions: any[] = (report as any).questions ?? [];
      const answers: any[] = (report as any).answers ?? [];
      const byQuestionId = new Map<string, any>();
      for (const a of answers) {
        const qid = a.questionId ?? a.question_id;
        byQuestionId.set(qid, a);
      }

      const lines: string[] = [];
      lines.push(`מייל: ${session.email ?? ""}`);
      lines.push(`טלפון: ${session.phone ?? ""}`);
      lines.push(`שם: ${session.name ?? ""}`);
      lines.push(`זמן סיום: ${fmtDateTime(session.completedAt ?? session.completed_at ?? null)}`);
      lines.push("");
      for (const q of questions) {
        const a = byQuestionId.get(q.id);
        const rawValue = a?.value ?? a?.answer;
        const otherText = a?.otherText ?? a?.other_text;
        const answerText =
          rawValue === "other"
            ? otherText ?? ""
            : rawValue === "yes"
              ? "כן"
              : rawValue === "no"
                ? "לא"
                : "";
        lines.push(`${q.order}. ${q.text}`);
        lines.push(`תשובה: ${answerText || "(לא נענה)"}`);
        lines.push("");
      }

      const subject = `טופס חדש התקבל - ${session.email ?? ""}`;

      await sendMail({
        to,
        subject,
        text: lines.join("\n"),
        html: `<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
          <h2 style="margin:0 0 12px">טופס חדש התקבל</h2>
          <div style="color:#3f3f46;font-size:13px;margin:0 0 10px">מייל: <b>${escapeHtml(session.email ?? "")}</b> | טלפון: <b>${escapeHtml(session.phone ?? "")}</b> | שם: <b>${escapeHtml(session.name ?? "")}</b> | זמן סיום: <b>${escapeHtml(fmtDateTime(session.completedAt ?? session.completed_at ?? null))}</b></div>
          <div style="border:1px solid #e4e4e7;border-radius:12px;overflow:hidden">
            ${questions
              .map((q) => {
                const a = byQuestionId.get(q.id);
                const rawValue = a?.value ?? a?.answer;
                const otherText = a?.otherText ?? a?.other_text;
                const answerText =
                  rawValue === "other"
                    ? otherText ?? ""
                    : rawValue === "yes"
                      ? "כן"
                      : rawValue === "no"
                        ? "לא"
                        : "";
                return `
                  <div style="padding:12px 14px;border-top:1px solid #f4f4f5">
                    <div style="font-size:14px;font-weight:700;color:#18181b">${q.order}. ${escapeHtml(q.text)}</div>
                    <div style="margin-top:6px;font-size:14px;color:#27272a">${escapeHtml(answerText || "(לא נענה)")}</div>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>`,
      });
    }
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
