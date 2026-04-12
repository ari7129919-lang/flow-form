"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CopyClientLinkButton from "../CopyClientLinkButton";

type FormPayload = {
  form: {
    id: string;
    slug: string;
    name: string;
    welcomeTitle: string;
    welcomeSubtitle: string;
    nudgeQuestionOrder: number | null;
    nudgeText: string | null;
  };
  questions: Array<{
    id: string;
    formId: string;
    order: number;
    text: string;
    required: boolean;
    allowOther: boolean;
  }>;
};

export default function AdminFormEditPage() {
  const router = useRouter();
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FormPayload | null>(null);

  const [newQText, setNewQText] = useState("");
  const [newQRequired, setNewQRequired] = useState(true);
  const [newQAllowOther, setNewQAllowOther] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/forms/${encodeURIComponent(formId)}`);
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        setError(json?.error ?? "שגיאה בטעינה");
        return;
      }
      setData(json as FormPayload);
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const nextOrder = useMemo(() => {
    const qs = data?.questions ?? [];
    const max = qs.reduce((acc, q) => Math.max(acc, q.order), 0);
    return max + 1;
  }, [data]);

  async function saveFormPatch(patch: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/forms/${encodeURIComponent(formId)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        setError(json?.error ?? "שגיאה בשמירה");
        return;
      }
      setData((prev) => (prev ? { ...prev, form: { ...prev.form, ...(json as any) } } : prev));
    } finally {
      setSaving(false);
    }
  }

  async function addQuestion() {
    if (!newQText.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/forms/${encodeURIComponent(formId)}/questions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          order: nextOrder,
          text: newQText.trim(),
          required: newQRequired,
          allowOther: newQAllowOther,
        }),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        setError(json?.error ?? "שגיאה בהוספת שאלה");
        return;
      }
      setNewQText("");
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function updateQuestion(questionId: string, patch: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/questions/${encodeURIComponent(questionId)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        setError(json?.error ?? "שגיאה בעדכון שאלה");
        return;
      }
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(questionId: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/questions/${encodeURIComponent(questionId)}`, {
        method: "DELETE",
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        setError(json?.error ?? "שגיאה במחיקה");
        return;
      }
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">טוען...</div>;
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-zinc-600">לא נמצא</div>
        <button
          className="mt-4 text-sm underline"
          onClick={() => router.replace("/admin/forms")}
        >
          חזרה
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">עריכת טופס</h1>
          <div className="mt-1 text-sm text-zinc-600">{data.form.slug}</div>
        </div>
        <div className="flex items-center gap-2">
          <CopyClientLinkButton slug={data.form.slug} />
          <button
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-all hover:bg-zinc-100"
            onClick={() => router.push("/admin/forms")}
          >
            חזרה
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-zinc-900">פרטי טופס</div>
          <div className="mt-4 flex flex-col gap-3">
            <label className="text-xs text-zinc-500">שם</label>
            <input
              value={data.form.name}
              onChange={(e) => setData({ ...data, form: { ...data.form, name: e.target.value } })}
              onBlur={() => saveFormPatch({ name: data.form.name })}
              disabled={saving}
              className="h-11 rounded-xl border border-zinc-300 px-3 outline-none transition-colors focus:border-emerald-500 disabled:opacity-60"
            />

            <label className="text-xs text-zinc-500">Welcome title</label>
            <input
              value={data.form.welcomeTitle}
              onChange={(e) => setData({ ...data, form: { ...data.form, welcomeTitle: e.target.value } })}
              onBlur={() => saveFormPatch({ welcomeTitle: data.form.welcomeTitle })}
              disabled={saving}
              className="h-11 rounded-xl border border-zinc-300 px-3 outline-none transition-colors focus:border-emerald-500 disabled:opacity-60"
            />

            <label className="text-xs text-zinc-500">Welcome subtitle</label>
            <input
              value={data.form.welcomeSubtitle}
              onChange={(e) => setData({ ...data, form: { ...data.form, welcomeSubtitle: e.target.value } })}
              onBlur={() => saveFormPatch({ welcomeSubtitle: data.form.welcomeSubtitle })}
              disabled={saving}
              className="h-11 rounded-xl border border-zinc-300 px-3 outline-none transition-colors focus:border-emerald-500 disabled:opacity-60"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-zinc-500">נאג׳ - מספר שאלה</label>
                <input
                  value={data.form.nudgeQuestionOrder ?? ""}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    setData({
                      ...data,
                      form: {
                        ...data.form,
                        nudgeQuestionOrder: v ? Number(v) : null,
                      },
                    });
                  }}
                  onBlur={() => saveFormPatch({ nudgeQuestionOrder: data.form.nudgeQuestionOrder })}
                  disabled={saving}
                  inputMode="numeric"
                  className="h-11 rounded-xl border border-zinc-300 px-3 outline-none transition-colors focus:border-emerald-500 disabled:opacity-60"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-zinc-500">נאג׳ - טקסט</label>
                <input
                  value={data.form.nudgeText ?? ""}
                  onChange={(e) => setData({ ...data, form: { ...data.form, nudgeText: e.target.value || null } })}
                  onBlur={() => saveFormPatch({ nudgeText: data.form.nudgeText })}
                  disabled={saving}
                  className="h-11 rounded-xl border border-zinc-300 px-3 outline-none transition-colors focus:border-emerald-500 disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-zinc-900">הוספת שאלה</div>
          <div className="mt-4 flex flex-col gap-3">
            <label className="text-xs text-zinc-500">טקסט שאלה</label>
            <input
              value={newQText}
              onChange={(e) => setNewQText(e.target.value)}
              disabled={saving}
              className="h-11 rounded-xl border border-zinc-300 px-3 outline-none transition-colors focus:border-emerald-500 disabled:opacity-60"
              placeholder="כתוב שאלה..."
            />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={newQRequired}
                  onChange={(e) => setNewQRequired(e.target.checked)}
                />
                חובה
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={newQAllowOther}
                  onChange={(e) => setNewQAllowOther(e.target.checked)}
                />
                אפשר "אחר"
              </label>
            </div>

            <button
              type="button"
              onClick={addQuestion}
              disabled={saving || newQText.trim().length === 0}
              className="h-11 rounded-xl bg-emerald-600 text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "שומר..." : `הוסף שאלה #${nextOrder}`}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium">שאלות</div>
        {data.questions.length === 0 ? (
          <div className="px-4 py-8 text-sm text-zinc-600">אין שאלות.</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {data.questions
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((q) => (
                <div key={q.id} className="grid grid-cols-12 gap-3 px-4 py-3 transition-colors hover:bg-zinc-50">
                  <div className="col-span-2">
                    <input
                      value={q.order}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        setData({
                          ...data,
                          questions: data.questions.map((x) => (x.id === q.id ? { ...x, order: Number(v || 0) } : x)),
                        });
                      }}
                      onBlur={() => updateQuestion(q.id, { order: q.order })}
                      disabled={saving}
                      className="h-10 w-full rounded-xl border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-500 disabled:opacity-60"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="col-span-7">
                    <input
                      value={q.text}
                      onChange={(e) =>
                        setData({
                          ...data,
                          questions: data.questions.map((x) => (x.id === q.id ? { ...x, text: e.target.value } : x)),
                        })
                      }
                      onBlur={() => updateQuestion(q.id, { text: q.text })}
                      disabled={saving}
                      className="h-10 w-full rounded-xl border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-500 disabled:opacity-60"
                    />
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => deleteQuestion(q.id)}
                      disabled={saving}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 transition-all hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    >
                      מחיקה
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
