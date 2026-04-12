"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminNewFormPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/forms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        setError(data?.error ?? "שגיאה ביצירת טופס");
        return;
      }

      router.replace(`/admin/forms/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">טופס חדש</h1>
      <p className="mt-1 text-sm text-zinc-600">צור טופס חדש והתחל להוסיף שאלות.</p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם הטופס"
          className="h-11 rounded-xl border border-zinc-300 px-3 outline-none focus:border-emerald-500"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="slug (לדוגמה: demo)"
          className="h-11 rounded-xl border border-zinc-300 px-3 outline-none focus:border-emerald-500"
        />

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <button
          type="submit"
          disabled={loading || name.trim().length === 0 || slug.trim().length === 0}
          className="h-11 rounded-xl bg-emerald-600 text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "יוצר..." : "צור טופס"}
        </button>
      </form>
    </div>
  );
}
