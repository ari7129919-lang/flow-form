"use client";

import { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      setOk(false);
      try {
        const res = await fetch("/api/admin/settings");
        const json = (await res.json().catch(() => null)) as any;
        if (res.ok) {
          setEmail(json?.adminReceiverEmail ?? "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ adminReceiverEmail: email }),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        setError(json?.error ?? "שגיאה בשמירה");
        return;
      }
      setOk(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">הגדרות</h1>
      <p className="mt-1 text-sm text-zinc-600">הגדר כתובת מייל שמקבלת את התוצאות.</p>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-medium text-zinc-900">מייל יעד</div>
        <p className="mt-1 text-xs text-zinc-600">ישמש לשליחת תוצאות (בשלב הבא).</p>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || saving}
          placeholder="example@domain.com"
          className="mt-4 h-11 w-full rounded-xl border border-zinc-300 px-3 outline-none focus:border-[#b08d57] disabled:opacity-60"
          inputMode="email"
        />

        {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
        {ok ? <div className="mt-3 text-sm text-[#b08d57]">נשמר בהצלחה</div> : null}

        <button
          type="button"
          onClick={save}
          disabled={loading || saving}
          className="mt-4 h-11 w-full rounded-xl bg-[#b08d57] text-white transition-all hover:brightness-95 disabled:opacity-50"
        >
          {saving ? "שומר..." : "שמירה"}
        </button>
      </div>
    </div>
  );
}
