import Link from "next/link";
import { getSessionReport } from "@/lib/data";

function statusBadge(status: string) {
  if (status === "treated") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "reviewing") return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-zinc-50 text-zinc-700 border-zinc-200";
}

function statusText(status: string) {
  if (status === "treated") return "טופל";
  if (status === "reviewing") return "בבדיקה";
  return "לא טופל";
}

export default async function AdminSessionDetailsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const report = await getSessionReport(sessionId);

  if (!report) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-zinc-600">סשן לא נמצא</div>
        <Link className="mt-4 inline-block underline" href="/admin/sessions">
          חזרה
        </Link>
      </div>
    );
  }

  const session: any = (report as any).session;
  const questions: any[] = (report as any).questions ?? [];
  const answers: any[] = (report as any).answers ?? [];

  const treatmentStatus = session.treatmentStatus ?? session.treatment_status ?? "untreated";
  const treatmentNote = session.treatmentNote ?? session.treatment_note ?? null;

  const byQuestionId = new Map<string, any>();
  for (const a of answers) {
    const qid = a.questionId ?? a.question_id;
    byQuestionId.set(qid, a);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">פרטי סשן</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
            <span>{sessionId}</span>
            <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs ${statusBadge(String(treatmentStatus))}`}>
              {statusText(String(treatmentStatus))}
            </span>
            {treatmentNote ? (
              <span title={String(treatmentNote)} className="max-w-[28rem] truncate text-xs text-zinc-500">
                {String(treatmentNote)}
              </span>
            ) : null}
          </div>
        </div>
        <Link
          href="/admin/sessions"
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-all hover:bg-zinc-100"
        >
          חזרה
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">מייל</div>
          <div className="mt-1 text-sm font-medium">{session.email}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">טלפון</div>
          <div className="mt-1 text-sm font-medium">{session.phone ?? ""}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">שם</div>
          <div className="mt-1 text-sm font-medium">{session.name ?? ""}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium">תשובות</div>
        <div className="divide-y divide-zinc-100">
          {questions.map((q) => {
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
            return (
              <div key={q.id} className="px-4 py-3 transition-colors hover:bg-zinc-50">
                <div className="text-sm font-medium text-zinc-900">
                  {q.order}. {q.text}
                </div>
                <div className="mt-1 text-sm text-zinc-700">
                  {answerText || <span className="text-zinc-400">לא נענה</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
