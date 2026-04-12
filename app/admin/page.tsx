import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">דשבורד</h1>
        <div className="mt-1 text-sm text-zinc-600">ניהול טפסים, תשובות והגדרות</div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/admin/forms"
          className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
        >
          <div className="text-sm text-zinc-500">טפסים</div>
          <div className="mt-2 text-sm font-medium text-zinc-900">ניהול טפסים ושאלות</div>
          <div className="mt-1 text-xs text-zinc-600">יצירה, עריכה, נאג׳ ו-UX</div>
          <div className="mt-3 text-xs text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100">
            פתח ניהול טפסים
          </div>
        </Link>

        <Link
          href="/admin/sessions"
          className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
        >
          <div className="text-sm text-zinc-500">תשובות</div>
          <div className="mt-2 text-sm font-medium text-zinc-900">טפסים שנשלחו</div>
          <div className="mt-1 text-xs text-zinc-600">צפייה בפרטים ותשובות לפי שאלה</div>
          <div className="mt-3 text-xs text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100">
            פתח תשובות
          </div>
        </Link>

        <Link
          href="/admin/settings"
          className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
        >
          <div className="text-sm text-zinc-500">הגדרות</div>
          <div className="mt-2 text-sm font-medium text-zinc-900">מייל יעד ועוד</div>
          <div className="mt-1 text-xs text-zinc-600">קביעת כתובת לקבלת תוצאות</div>
          <div className="mt-3 text-xs text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100">
            פתח הגדרות
          </div>
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-sm text-zinc-500">קישור ללקוח</div>
        <div className="mt-2 text-sm">
          לדוגמה: <Link className="underline" href="/f/demo">/f/demo</Link>
        </div>
      </div>
    </div>
  );
}
