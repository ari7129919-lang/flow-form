import Link from "next/link";
import CopyClientLinkButton from "./CopyClientLinkButton";
import { listForms } from "@/lib/data";

import DeleteFormButton from "@/app/admin/forms/DeleteFormButton";

export const dynamic = "force-dynamic";

export default async function AdminFormsPage() {
  const forms = await listForms();
  const totalForms = (forms as any[]).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">טפסים</h1>
          <div className="mt-1 text-sm text-zinc-600">ניהול טפסים ושאלות</div>
        </div>
        <Link
          href="/admin/forms/new"
          className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-700"
        >
          טופס חדש
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-xs text-zinc-500">סה״כ טפסים</div>
            <div className="mt-2 text-3xl font-semibold text-zinc-900">{totalForms}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-xs text-zinc-500">פעולה מהירה</div>
            <div className="mt-3">
              <Link
                href="/admin/forms/new"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition-all hover:bg-emerald-700"
              >
                צור טופס חדש
              </Link>
            </div>
            <div className="mt-2 text-xs text-zinc-600">לאחר יצירה תוכל להעתיק קישור ללקוח ולהפיץ.</div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm sm:col-span-2">
            <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-medium text-zinc-600">
              <div className="col-span-4">שם</div>
              <div className="col-span-4">Slug</div>
              <div className="col-span-2">נאג׳</div>
              <div className="col-span-2 text-left">פעולות</div>
            </div>

            {totalForms === 0 ? (
              <div className="px-4 py-10">
                <div className="text-sm font-medium text-zinc-900">אין עדיין טפסים</div>
                <div className="mt-1 text-sm text-zinc-600">צור טופס חדש כדי להתחיל לקבל תשובות.</div>
                <Link
                  href="/admin/forms/new"
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition-all hover:bg-emerald-700"
                >
                  צור טופס ראשון
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {(forms as any[]).map((f) => (
                  <div key={f.id} className="grid grid-cols-12 items-center gap-2 px-4 py-3 text-sm">
                    <div className="col-span-4 font-medium text-zinc-900">{f.name}</div>
                    <div className="col-span-4 text-zinc-600">{f.slug === "demo" ? "" : f.slug}</div>
                    <div className="col-span-2 text-zinc-600">{f.nudge_question_order ?? f.nudgeQuestionOrder ?? "-"}</div>
                    <div className="col-span-2 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <CopyClientLinkButton slug={f.slug} />
                        <Link
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 transition-all hover:bg-zinc-100"
                          href={`/admin/forms/${f.id}`}
                        >
                          עריכה
                        </Link>
                        <DeleteFormButton formId={String(f.id)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-zinc-900">המלצות</div>
          <div className="mt-3 flex flex-col gap-3 text-sm text-zinc-700">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
              <div className="font-medium text-zinc-900">מייל יעד</div>
              <div className="mt-1 text-xs text-zinc-600">ודא שהוגדר מייל לקבלת התוצאות.</div>
              <Link href="/admin/settings" className="mt-2 inline-flex text-xs font-medium text-emerald-700 underline">
                פתח הגדרות
              </Link>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
              <div className="font-medium text-zinc-900">בדיקת קישור ללקוח</div>
              <div className="mt-1 text-xs text-zinc-600">לאחר יצירה, העתק קישור ונסה אותו בחלון גלישה פרטי.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
