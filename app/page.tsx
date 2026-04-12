import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-14 dark:bg-black">
      <main className="w-full max-w-3xl">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            FlowForm
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            מערכת שאלון בצ׳אט + לוח ניהול.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/admin"
              className="rounded-xl border border-zinc-200 bg-zinc-900 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-zinc-800 dark:border-zinc-800"
            >
              כניסה ללוח ניהול
            </Link>

            <Link
              href="/f"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
            >
              פתיחת שאלון (לפי קישור)
            </Link>
          </div>

          <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs leading-6 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200">
            <div className="font-semibold">טיפ</div>
            אם יש לך קישור טופס, הוא נראה בדרך כלל כך: <span className="font-mono">/f/&lt;slug&gt;</span>
          </div>
        </div>
      </main>
    </div>
  );
}
