"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-white to-zinc-100 px-4 py-16 md:py-24 dark:from-emerald-950 dark:via-black dark:to-zinc-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 size-[420px] animate-pulse rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-600/15" />
        <div className="absolute -bottom-32 -right-24 size-[520px] animate-pulse rounded-full bg-sky-200/40 blur-3xl [animation-delay:700ms] dark:bg-sky-600/15" />
        <div className="absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 blur-3xl dark:bg-white/5" />
      </div>

      <main className="relative w-full max-w-6xl">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="animate-[fadeInUp_600ms_ease-out]">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-800 shadow-sm backdrop-blur dark:border-emerald-900/60 dark:bg-black/40 dark:text-emerald-200">
              מערכת טפסים בצ׳אט
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              לוח ניהול
            </div>

            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl dark:text-zinc-50">
              FlowForm
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
              בנה שאלון קצר, שלח אותו כלקוח חוויית צ׳אט, וקבל את התשובות מסודרות בלוח ניהול ברור.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/admin"
                className="group inline-flex h-14 items-center justify-center rounded-2xl bg-zinc-900 px-6 text-base font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                כניסה ללוח ניהול
                <span className="ml-2 transition-transform group-hover:translate-x-0.5">←</span>
              </Link>

              <Link
                href="/admin/forms/new"
                className="inline-flex h-14 items-center justify-center rounded-2xl border border-zinc-200 bg-white/70 px-6 text-base font-medium text-zinc-800 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-100 dark:hover:bg-black/40"
              >
                צור טופס חדש
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-black/30">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">אימות מאובטח</div>
                <div className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">OTP למייל לפני התחלת שאלון</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-black/30">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">חוויית צ׳אט</div>
                <div className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">הודעות, התקדמות, ועיצוב מודרני</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-black/30">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">דוחות</div>
                <div className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">משפך + סשנים ותשובות</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -rotate-2 rounded-[28px] bg-gradient-to-br from-emerald-200/60 via-white/60 to-sky-200/60 blur-xl dark:from-emerald-800/25 dark:to-sky-800/25" />
            <div className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-white/75 p-6 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-black/35">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">לוח ניהול</div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">תצוגה מהירה של מה מחכה בפנים</div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="size-2 rounded-full bg-red-400/80" />
                  <div className="size-2 rounded-full bg-amber-400/80" />
                  <div className="size-2 rounded-full bg-emerald-400/80" />
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-black/30">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">טפסים</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">ניהול שאלות, הודעות צ׳אט ומחיקה בטוחה</div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-black/30">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">סשנים</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">צפייה בתשובות ובפרטי לקוח</div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-black/30">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">דוחות</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">משפך נטישות + פילטר לפי טופס</div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-[1px]">
                <div className="rounded-2xl bg-white/90 px-4 py-3 dark:bg-black/40">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">מוכן להתחיל?</div>
                  <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">הכנס ללוח הניהול, צור טופס ותפיץ ללקוחות.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-black/30">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">נראה מקצועי</div>
            <div className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">עיצוב נקי ומודרני שמתאים לפרודקשן.</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-black/30">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">מאובטח</div>
            <div className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">OTP למייל לפני תחילת מילוי השאלון.</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-black/30">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">קל להפצה</div>
            <div className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">יוצרים טופס, מעתיקים קישור ומפיצים ללקוחות.</div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
