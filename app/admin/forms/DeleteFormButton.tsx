"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteFormButton({ formId }: { formId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function onDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/forms/${encodeURIComponent(formId)}`, { method: "DELETE" });
      if (!res.ok) return;
      router.refresh();
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={loading}
        className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs text-red-700 transition-all hover:bg-red-50 disabled:opacity-50"
      >
        {loading ? "מוחק..." : "מחיקה"}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg">
            <div className="text-base font-semibold text-zinc-900">מחיקת טופס</div>
            <div className="mt-2 text-sm leading-6 text-zinc-600">
              הפעולה הזו תמחק את הטופס וכל השאלות שלו. הפעולה אינה הפיכה.
            </div>
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
                onClick={onDelete}
                disabled={loading}
                className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "מוחק..." : "כן, למחוק"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
