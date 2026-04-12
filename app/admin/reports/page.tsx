import Link from "next/link";
import { getFunnelReport, getReportsOverview, listForms } from "@/lib/data";

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
  const tab = typeof tabRaw === "string" && ["overview", "answers", "funnel"].includes(tabRaw) ? tabRaw : "overview";

  const [forms, overview, funnel] = await Promise.all([
    listForms(),
    getReportsOverview({ formId }),
    getFunnelReport({ formId }),
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
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
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
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
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
            href={`/admin/reports?tab=overview${formId ? `&formId=${encodeURIComponent(formId)}` : ""}`}
            className={
              "rounded-xl border px-3 py-2 text-sm transition-all " +
              (tab === "overview"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100")
            }
          >
            סיכום
          </Link>
          <Link
            href={`/admin/reports?tab=answers${formId ? `&formId=${encodeURIComponent(formId)}` : ""}`}
            className={
              "rounded-xl border px-3 py-2 text-sm transition-all " +
              (tab === "answers"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100")
            }
          >
            תשובות לפי שאלה
          </Link>
          <Link
            href={`/admin/reports?tab=funnel${formId ? `&formId=${encodeURIComponent(formId)}` : ""}`}
            className={
              "rounded-xl border px-3 py-2 text-sm transition-all " +
              (tab === "funnel"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100")
            }
          >
            משפך נטישות
          </Link>
        </div>
      </div>

      {tab === "overview" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-xs text-zinc-500">התחילו</div>
            <div className="mt-2 text-3xl font-semibold text-zinc-900">{overview.funnel.started}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-xs text-zinc-500">אומתו</div>
            <div className="mt-2 text-3xl font-semibold text-zinc-900">{overview.funnel.verified}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-xs text-zinc-500">הושלמו</div>
            <div className="mt-2 text-3xl font-semibold text-zinc-900">{overview.funnel.completed}</div>
          </div>
        </div>
      ) : null}

      {tab === "answers" ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium">מענה לפי מספר שאלה</div>
          {overview.answersByQuestionOrder.length === 0 ? (
            <div className="px-4 py-8 text-sm text-zinc-600">אין עדיין נתונים להצגה.</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {overview.answersByQuestionOrder.map((row) => (
                <div key={row.questionOrder} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm">
                  <div className="col-span-4 font-medium text-zinc-900">שאלה {row.questionOrder}</div>
                  <div className="col-span-8 text-zinc-700">{row.answers} נענו</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === "funnel" ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium">משפך נטישות (מדויק)</div>
          {funnel.steps.length === 0 ? (
            <div className="px-4 py-8 text-sm text-zinc-600">אין עדיין נתונים להצגה.</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {funnel.steps.map((s, idx) => {
                const prev = idx === 0 ? funnel.totalSessions : funnel.steps[idx - 1]?.count ?? funnel.totalSessions;
                const pct = prev > 0 ? Math.round((s.count / prev) * 100) : 0;
                return (
                  <div key={s.key} className="grid grid-cols-12 items-center gap-2 px-4 py-3 text-sm">
                    <div className="col-span-6 font-medium text-zinc-900">{s.label}</div>
                    <div className="col-span-3 text-zinc-700">{s.count}</div>
                    <div className="col-span-3 text-left text-zinc-600">{idx === 0 ? "—" : `${pct}%`}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
