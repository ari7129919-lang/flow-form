"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [slug, setSlug] = useState("");

  const href = useMemo(() => {
    const s = slug.trim();
    return s ? `/f/${encodeURIComponent(s)}` : "";
  }, [slug]);

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

            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex gap-2">
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="הכנס slug של טופס"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
                />
                <button
                  type="button"
                  disabled={!href}
                  onClick={() => href && router.push(href)}
                  className="h-10 shrink-0 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition enabled:hover:bg-zinc-800 disabled:opacity-50"
                >
                  פתח
                </button>
              </div>
              <div className="mt-2 text-[11px] leading-5 text-zinc-600 dark:text-zinc-400">
                קישור לדוגמה: <span className="font-mono">/f/&lt;slug&gt;</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
