import Link from "next/link";
import { getReportsOverview, listCompletedSessions, listForms } from "@/lib/data";
import CopyClientLinkButton from "./forms/CopyClientLinkButton";

export const dynamic = "force-dynamic";

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

export default async function AdminHomePage() {
  const [forms, completedSessions, overview] = await Promise.all([
    listForms(),
    listCompletedSessions(),
    getReportsOverview({ formId: null }),
  ]);

  const formsArr = (forms ?? []) as any[];
  const sessionsArr = (completedSessions ?? []) as any[];
  const recentForms = formsArr.slice(0, 6);
  const recentSessions = sessionsArr.slice(0, 6);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">דשבורד</h1>
        <div className="text-sm text-zinc-600">ניהול טפסים, תשובות, דוחות והגדרות</div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-xs text-zinc-500">טפסים</div>
          <div className="mt-2 text-3xl font-semibold text-zinc-900">{formsArr.length}</div>
          <div className="mt-3">
            <Link href="/admin/forms" className="text-xs font-medium text-[#b08d57] underline">
              פתח ניהול טפסים
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-xs text-zinc-500">התחילו</div>
          <div className="mt-2 text-3xl font-semibold text-zinc-900">{overview.funnel.started}</div>
          <div className="mt-3">
            <Link href="/admin/reports?tab=overview" className="text-xs font-medium text-[#b08d57] underline">
              פתח דוחות
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-xs text-zinc-500">אומתו</div>
          <div className="mt-2 text-3xl font-semibold text-zinc-900">{overview.funnel.verified}</div>
          <div className="mt-1 text-xs text-zinc-500">כולל הושלמו</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-xs text-zinc-500">הושלמו</div>
          <div className="mt-2 text-3xl font-semibold text-zinc-900">{overview.funnel.completed}</div>
          <div className="mt-3">
            <Link href="/admin/sessions" className="text-xs font-medium text-[#b08d57] underline">
              פתח תשובות
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-zinc-900">פעולות מהירות</div>
              <div className="mt-1 text-xs text-zinc-500">הדברים שעושים הכי הרבה</div>
            </div>
            <Link
              href="/admin/forms/new"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#b08d57] px-4 text-sm font-medium text-white transition-all hover:brightness-95"
            >
              צור טופס חדש
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/admin/forms"
              className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm transition-all hover:bg-white"
            >
              <div className="font-medium text-zinc-900">טפסים</div>
              <div className="mt-1 text-xs text-zinc-600">עריכה, מחיקה, קישור ללקוח</div>
            </Link>
            <Link
              href="/admin/sessions"
              className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm transition-all hover:bg-white"
            >
              <div className="font-medium text-zinc-900">תשובות</div>
              <div className="mt-1 text-xs text-zinc-600">פתיחה מהירה של טופס שנשלח</div>
            </Link>
            <Link
              href="/admin/settings"
              className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm transition-all hover:bg-white"
            >
              <div className="font-medium text-zinc-900">הגדרות</div>
              <div className="mt-1 text-xs text-zinc-600">מייל יעד ושליחה</div>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-zinc-900">סטטוס</div>
          <div className="mt-3 flex flex-col gap-3 text-sm text-zinc-700">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
              <div className="text-xs text-zinc-500">מה עכשיו?</div>
              <div className="mt-1 font-medium text-zinc-900">צור טופס והעתק קישור ללקוח</div>
              <div className="mt-1 text-xs text-zinc-600">אחרי שיש תשובות, כנס ל״תשובות״ כדי לראות פירוט.</div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
              <div className="text-xs text-zinc-500">דוחות</div>
              <div className="mt-1 font-medium text-zinc-900">משפך נטישות + פילטר לפי טופס</div>
              <Link href="/admin/reports?tab=funnel" className="mt-2 inline-flex text-xs font-medium text-[#b08d57] underline">
                פתח משפך
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-zinc-900">טפסים אחרונים</div>
            <Link href="/admin/forms" className="text-xs font-medium text-[#b08d57] underline">
              לכל הטפסים
            </Link>
          </div>

          {recentForms.length === 0 ? (
            <div className="mt-3 text-sm text-zinc-600">אין טפסים. צור טופס חדש כדי להתחיל.</div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {recentForms.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-900">{f.name}</div>
                    <div className="truncate text-xs text-zinc-600">{f.slug === "demo" ? "" : `/f/${f.slug}`}</div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <CopyClientLinkButton slug={f.slug} />
                    <Link
                      href={`/admin/forms/${encodeURIComponent(f.id)}`}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 transition-all hover:bg-zinc-100"
                    >
                      עריכה
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-zinc-900">תשובות אחרונות</div>
            <Link href="/admin/sessions" className="text-xs font-medium text-[#b08d57] underline">
              לכל התשובות
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <div className="mt-3 text-sm text-zinc-600">עדיין אין סשנים שהושלמו.</div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {recentSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-900">{s.email}</div>
                    <div className="truncate text-xs text-zinc-600">
                      {fmtDateTime(s.completedAt ?? s.completed_at ?? s.createdAt ?? s.created_at)}
                    </div>
                  </div>
                  <Link
                    href={`/admin/sessions/${encodeURIComponent(s.id)}`}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 transition-all hover:bg-zinc-100"
                  >
                    פתיחה
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
