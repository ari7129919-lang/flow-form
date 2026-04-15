"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ResetAllDataButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteForms, setDeleteForms] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function onReset() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deleteForms }),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        setError(json?.error ?? "שגיאה באיפוס");
        return;
      }
      setOpen(false);
      router.replace("/admin/forms");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-red-700 transition-all hover:bg-red-50"
      >
        איפוס נתונים
      </button>

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/40 p-4 sm:items-center">
              <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-lg">
                <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto p-5">
                  <div className="text-base font-semibold text-zinc-900">איפוס כל הנתונים</div>
                  <div className="mt-2 text-sm leading-6 text-zinc-600">
                    ברירת מחדל: איפוס תשובות/סשנים/דוחות בלבד. ניתן לבחור למחוק גם את הטפסים והשאלות.
                  </div>

                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-800">
                    <input
                      type="checkbox"
                      checked={deleteForms}
                      onChange={(e) => setDeleteForms(e.target.checked)}
                      disabled={loading}
                      className="mt-1"
                    />
                    <span>מחק גם טפסים ושאלות (בלתי הפיך)</span>
                  </label>

                  {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      disabled={loading}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-all hover:bg-zinc-100 disabled:opacity-50"
                    >
                      ביטול
                    </button>
                    <button
                      type="button"
                      onClick={onReset}
                      disabled={loading}
                      className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:opacity-50"
                    >
                      {loading ? "מאפס..." : deleteForms ? "כן, למחוק הכל" : "כן, לאפס תשובות"}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
