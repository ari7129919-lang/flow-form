import Link from "next/link";
import {
  getLifecycleFunnelReport,
  getProblemQuestionsReport,
  listForms,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const formIdRaw = sp.formId;
  const formId = typeof formIdRaw === "string" && formIdRaw.trim().length > 0 ? formIdRaw : null;

  const tabRaw = sp.tab;
  const tab = typeof tabRaw === "string" && ["funnel", "questions"].includes(tabRaw) ? tabRaw : "funnel";

  const [forms, lifecycle, problems] = await Promise.all([
    listForms(),
    getLifecycleFunnelReport({ formId }),
    getProblemQuestionsReport({ formId }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">דוחות</h1>
          <div className="mt-1 text-sm text-zinc-600">סיכום השלמות ונתוני התקדמות</div>
        </div>
        <Link
          href="/admin"
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-all hover:bg-zinc-100"
        >
          חזרה
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-medium text-zinc-900">פילטר</div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-zinc-700">טופס</div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/reports?tab=${encodeURIComponent(tab)}`}
              className={
                "rounded-xl border px-3 py-2 text-sm transition-all " +
                (!formId
                  ? "border-[#b08d57]/30 bg-[#f6f1e6] text-zinc-900"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100")
              }
            >
              הכל
            </Link>
            {forms.map((f) => (
              <Link
                key={f.id}
                href={`/admin/reports?tab=${encodeURIComponent(tab)}&formId=${encodeURIComponent(f.id)}`}
                className={
                  "rounded-xl border px-3 py-2 text-sm transition-all " +
                  (formId === f.id
                    ? "border-[#b08d57]/30 bg-[#f6f1e6] text-zinc-900"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100")
                }
              >
                {f.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/admin/reports?tab=funnel${formId ? `&formId=${encodeURIComponent(formId)}` : ""}`}
            className={
              "rounded-xl border px-3 py-2 text-sm transition-all " +
              (tab === "funnel"
                ? "border-[#b08d57]/30 bg-[#f6f1e6] text-zinc-900"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100")
            }
          >
            דוח משפך
          </Link>
          <Link
            href={`/admin/reports?tab=questions${formId ? `&formId=${encodeURIComponent(formId)}` : ""}`}
            className={
              "rounded-xl border px-3 py-2 text-sm transition-all " +
              (tab === "questions"
                ? "border-[#b08d57]/30 bg-[#f6f1e6] text-zinc-900"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100")
            }
          >
            שאלות בעייתיות
          </Link>
        </div>
      </div>

      {tab === "funnel" ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium">
            משפך: כניסות → אימות → התחלת שאלות → השלמה
          </div>

          {lifecycle.steps.length === 0 ? (
            <div className="px-4 py-8 text-sm text-zinc-600">אין עדיין נתונים להצגה.</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {lifecycle.steps.map((s, idx) => {
                const prev = idx === 0 ? lifecycle.totalSessions : lifecycle.steps[idx - 1]?.count ?? lifecycle.totalSessions;
                const keptPct = prev > 0 ? Math.round((s.count / prev) * 1000) / 10 : 0;
                const dropPct = idx === 0 || prev <= 0 ? 0 : Math.round(((prev - s.count) / prev) * 1000) / 10;
                return (
                  <div key={s.key} className="grid grid-cols-12 items-center gap-2 px-4 py-3 text-sm">
                    <div className="col-span-5 font-medium text-zinc-900">{s.label}</div>
                    <div className="col-span-2 text-zinc-700">{s.count}</div>
                    <div className="col-span-5 text-left text-zinc-600">
                      {idx === 0 ? "—" : `נשארו ${keptPct}% | נשירה ${dropPct}%`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {tab === "questions" ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium">
            שאלות בעייתיות (נטישה לפי שאלה)
          </div>

          {problems.rows.length === 0 ? (
            <div className="px-4 py-8 text-sm text-zinc-600">אין עדיין נתונים להצגה.</div>
          ) : (
            <>
              <div className="border-b border-zinc-200 px-4 py-3 text-xs text-zinc-600">
                בסיס החישוב: {problems.totalVerified} משתמשים שעברו אימות
              </div>

              <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-medium text-zinc-600">
                <div className="col-span-2">שאלה</div>
                <div className="col-span-3">הגיעו לשאלה</div>
                <div className="col-span-3">ענו על השאלה</div>
                <div className="col-span-2">נשרו</div>
                <div className="col-span-2 text-left">% נשירה</div>
              </div>

              <div className="divide-y divide-zinc-100">
                {problems.rows.map((r) => (
                  <div key={r.questionOrder} className="grid grid-cols-12 items-center gap-2 px-4 py-3 text-sm">
                    <div className="col-span-2 font-medium text-zinc-900">{r.questionOrder}</div>
                    <div className="col-span-3 text-zinc-700">{r.reached}</div>
                    <div className="col-span-3 text-zinc-700">{r.answered}</div>
                    <div className="col-span-2 text-zinc-700">{r.dropped}</div>
                    <div className="col-span-2 text-left text-zinc-600">{r.droppedPct}%</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
