"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CopyClientLinkButton from "../CopyClientLinkButton";

type TabKey = "details" | "questions" | "nudges" | "danger";

function isTabKey(v: string | null): v is TabKey {
  return v === "details" || v === "questions" || v === "nudges" || v === "danger";
}

type FormPayload = {
  form: {
    id: string;
    slug: string;
    name: string;
    welcomeTitle: string;
    welcomeSubtitle: string;
    completionTitle: string;
    completionSubtitle: string;
    chatCopy: {
      introTitle: string;
      introSubtitle: string;
      eligibilityQuestion?: string;
      eligibilityNoMessage?: string;
      askName: string;
      askEmail: string;
      askPhone: string;
      otpPrompt: string;
    };
    nudges: Array<{ atQuestionOrder: number; text: string }>;
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
  const sp = useSearchParams();
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  const tabRaw = sp.get("tab");
  const tab: TabKey = isTabKey(tabRaw) ? tabRaw : "details";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FormPayload | null>(null);

  const [newQText, setNewQText] = useState("");
  const [newQRequired, setNewQRequired] = useState(true);
  const [newQAllowOther, setNewQAllowOther] = useState(true);

  const [nudgesSaving, setNudgesSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  async function deleteForm() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/forms/${encodeURIComponent(formId)}`, { method: "DELETE" });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as any;
        setError(json?.error ?? "שגיאה במחיקה");
        return;
      }
      router.replace("/admin/forms");
      router.refresh();
    } finally {
      setSaving(false);
      setDeleteOpen(false);
    }
  }

  async function saveNudges(nudges: Array<{ atQuestionOrder: number; text: string }>) {
    setNudgesSaving(true);
    try {
      await saveFormPatch({ nudges });
    } finally {
      setNudgesSaving(false);
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
            type="button"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-all hover:bg-zinc-100"
            onClick={() => router.push("/admin/forms")}
          >
            חזרה
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => router.replace(`/admin/forms/${encodeURIComponent(formId)}?tab=details`)}
          className={
            "rounded-xl border px-3 py-2 text-sm transition-all " +
            (tab === "details"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100")
          }
        >
          פרטים
        </button>
        <button
          type="button"
          onClick={() => router.replace(`/admin/forms/${encodeURIComponent(formId)}?tab=questions`)}
          className={
            "rounded-xl border px-3 py-2 text-sm transition-all " +
            (tab === "questions"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100")
          }
        >
          שאלות
        </button>
        <button
          type="button"
          onClick={() => router.replace(`/admin/forms/${encodeURIComponent(formId)}?tab=nudges`)}
          className={
            "rounded-xl border px-3 py-2 text-sm transition-all " +
            (tab === "nudges"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100")
          }
        >
          עידודים
        </button>
        <button
          type="button"
          onClick={() => router.replace(`/admin/forms/${encodeURIComponent(formId)}?tab=danger`)}
          className={
            "rounded-xl border px-3 py-2 text-sm transition-all " +
            (tab === "danger"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100")
          }
        >
          אזור מסוכן
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {deleteOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg">
            <div className="text-base font-semibold text-zinc-900">מחיקת טופס</div>
            <div className="mt-2 text-sm leading-6 text-zinc-600">הפעולה הזו תמחק את הטופס וכל השאלות שלו. הפעולה אינה הפיכה.</div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={saving}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-all hover:bg-zinc-100 disabled:opacity-50"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={deleteForm}
                disabled={saving}
                className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "מוחק..." : "כן, למחוק"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "details" ? (
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
            <textarea
              value={data.form.welcomeTitle}
              onChange={(e) => setData({ ...data, form: { ...data.form, welcomeTitle: e.target.value } })}
              onBlur={() => saveFormPatch({ welcomeTitle: data.form.welcomeTitle })}
              disabled={saving}
              rows={2}
              className="min-h-20 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 outline-none transition-colors focus:border-emerald-500 disabled:opacity-60"
            />

            <label className="text-xs text-zinc-500">Welcome subtitle</label>
            <textarea
              value={data.form.welcomeSubtitle}
              onChange={(e) => setData({ ...data, form: { ...data.form, welcomeSubtitle: e.target.value } })}
              onBlur={() => saveFormPatch({ welcomeSubtitle: data.form.welcomeSubtitle })}
              disabled={saving}
              rows={3}
              className="min-h-24 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 outline-none transition-colors focus:border-emerald-500 disabled:opacity-60"
            />

            <label className="text-xs text-zinc-500">Completion title</label>
            <textarea
              value={data.form.completionTitle}
              onChange={(e) => setData({ ...data, form: { ...data.form, completionTitle: e.target.value } })}
              onBlur={() => saveFormPatch({ completionTitle: data.form.completionTitle })}
              disabled={saving}
              rows={2}
              className="min-h-20 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 outline-none transition-colors focus:border-emerald-500 disabled:opacity-60"
            />

            <label className="text-xs text-zinc-500">Completion subtitle</label>
            <textarea
              value={data.form.completionSubtitle}
              onChange={(e) => setData({ ...data, form: { ...data.form, completionSubtitle: e.target.value } })}
              onBlur={() => saveFormPatch({ completionSubtitle: data.form.completionSubtitle })}
              disabled={saving}
              rows={3}
              className="min-h-24 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 outline-none transition-colors focus:border-emerald-500 disabled:opacity-60"
            />

            <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-medium text-zinc-900">טקסטים של הצ׳אט בתחילת השאלון</div>
              <div className="mt-1 text-xs text-zinc-600">אפשר להדביק טקסט רב־שורות עם אימוג׳ים. זה מוצג ללקוח כמו צ׳אט בוט.</div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <label className="text-xs text-zinc-500">כותרת פתיחה</label>
                <textarea
                  value={data.form.chatCopy?.introTitle ?? ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      form: { ...data.form, chatCopy: { ...(data.form.chatCopy as any), introTitle: e.target.value } },
                    })
                  }
                  onBlur={() => saveFormPatch({ chatCopy: data.form.chatCopy })}
                  disabled={saving}
                  rows={2}
                  className="min-h-20 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-500 disabled:opacity-60"
                />

                <label className="text-xs text-zinc-500">תת־כותרת פתיחה</label>
                <textarea
                  value={data.form.chatCopy?.introSubtitle ?? ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      form: { ...data.form, chatCopy: { ...(data.form.chatCopy as any), introSubtitle: e.target.value } },
                    })
                  }
                  onBlur={() => saveFormPatch({ chatCopy: data.form.chatCopy })}
                  disabled={saving}
                  rows={3}
                  className="min-h-24 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-500 disabled:opacity-60"
                />

                <label className="text-xs text-zinc-500">שאלה: זכאות (כן/לא)</label>
                <textarea
                  value={data.form.chatCopy?.eligibilityQuestion ?? ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      form: { ...data.form, chatCopy: { ...(data.form.chatCopy as any), eligibilityQuestion: e.target.value } },
                    })
                  }
                  onBlur={() => saveFormPatch({ chatCopy: data.form.chatCopy })}
                  disabled={saving}
                  rows={2}
                  className="min-h-20 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-500 disabled:opacity-60"
                />

                <label className="text-xs text-zinc-500">הודעה במקרה של "לא" (זכאות)</label>
                <textarea
                  value={data.form.chatCopy?.eligibilityNoMessage ?? ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      form: { ...data.form, chatCopy: { ...(data.form.chatCopy as any), eligibilityNoMessage: e.target.value } },
                    })
                  }
                  onBlur={() => saveFormPatch({ chatCopy: data.form.chatCopy })}
                  disabled={saving}
                  rows={3}
                  className="min-h-24 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-500 disabled:opacity-60"
                />

                <label className="text-xs text-zinc-500">שאלה: שם</label>
                <textarea
                  value={data.form.chatCopy?.askName ?? ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      form: { ...data.form, chatCopy: { ...(data.form.chatCopy as any), askName: e.target.value } },
                    })
                  }
                  onBlur={() => saveFormPatch({ chatCopy: data.form.chatCopy })}
                  disabled={saving}
                  rows={2}
                  className="min-h-20 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-500 disabled:opacity-60"
                />

                <label className="text-xs text-zinc-500">שאלה: מייל</label>
                <textarea
                  value={data.form.chatCopy?.askEmail ?? ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      form: { ...data.form, chatCopy: { ...(data.form.chatCopy as any), askEmail: e.target.value } },
                    })
                  }
                  onBlur={() => saveFormPatch({ chatCopy: data.form.chatCopy })}
                  disabled={saving}
                  rows={2}
                  className="min-h-20 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-500 disabled:opacity-60"
                />

                <label className="text-xs text-zinc-500">שאלה: טלפון</label>
                <textarea
                  value={data.form.chatCopy?.askPhone ?? ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      form: { ...data.form, chatCopy: { ...(data.form.chatCopy as any), askPhone: e.target.value } },
                    })
                  }
                  onBlur={() => saveFormPatch({ chatCopy: data.form.chatCopy })}
                  disabled={saving}
                  rows={2}
                  className="min-h-20 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-500 disabled:opacity-60"
                />

                <label className="text-xs text-zinc-500">הודעה לפני הזנת קוד אימות</label>
                <textarea
                  value={data.form.chatCopy?.otpPrompt ?? ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      form: { ...data.form, chatCopy: { ...(data.form.chatCopy as any), otpPrompt: e.target.value } },
                    })
                  }
                  onBlur={() => saveFormPatch({ chatCopy: data.form.chatCopy })}
                  disabled={saving}
                  rows={2}
                  className="min-h-20 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>
            </div>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-sm font-medium text-zinc-900">מה הלאה?</div>
            <div className="mt-1 text-xs text-zinc-600">עבור לטאב "שאלות" כדי לערוך ולהוסיף שאלות. לטאב "עידודים" כדי להוסיף הודעות באמצע.</div>
          </div>
        </div>
      ) : null}

      {tab === "questions" ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-zinc-900">טיפים</div>
              <div className="mt-2 text-sm leading-6 text-zinc-600">אפשר לשנות את סדר השאלה (Order) ולערוך את הטקסט. למחיקה יש כפתור ייעודי.</div>
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
      ) : null}

      {tab === "nudges" ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-zinc-900">עידודים במהלך השאלון</div>
            <div className="mt-1 text-xs text-zinc-600">מופיעים ללקוח לפני שאלות מסוימות (למשל: ״מעולה ממשיכים 💪״).</div>

            <div className="mt-4 flex flex-col gap-3">
              {(data.form.nudges ?? []).length === 0 ? (
                <div className="text-sm text-zinc-600">עדיין אין עידודים.</div>
              ) : (
                (data.form.nudges ?? []).map((n, idx) => (
                  <div key={idx} className="rounded-xl border border-zinc-200 bg-white p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                      <div className="sm:col-span-2">
                        <label className="text-xs text-zinc-500">לפני שאלה מספר</label>
                        <input
                          value={String(n.atQuestionOrder)}
                          onChange={(e) => {
                            const v = e.target.value.trim();
                            const num = v ? Number(v) : 1;
                            const next = [...(data.form.nudges ?? [])];
                            next[idx] = { ...next[idx], atQuestionOrder: Number.isFinite(num) ? Math.max(1, Math.floor(num)) : 1 };
                            setData({ ...data, form: { ...data.form, nudges: next } });
                          }}
                          disabled={saving || nudgesSaving}
                          inputMode="numeric"
                          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 px-3 outline-none transition-colors focus:border-emerald-500 disabled:opacity-60"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-xs text-zinc-500">טקסט</label>
                        <textarea
                          value={n.text}
                          onChange={(e) => {
                            const next = [...(data.form.nudges ?? [])];
                            next[idx] = { ...next[idx], text: e.target.value };
                            setData({ ...data, form: { ...data.form, nudges: next } });
                          }}
                          disabled={saving || nudgesSaving}
                          rows={2}
                          className="mt-1 min-h-20 w-full resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 outline-none transition-colors focus:border-emerald-500 disabled:opacity-60"
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const next = (data.form.nudges ?? []).filter((_, i) => i !== idx);
                          setData({ ...data, form: { ...data.form, nudges: next } });
                        }}
                        disabled={saving || nudgesSaving}
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-all hover:bg-zinc-100 disabled:opacity-60"
                      >
                        מחיקה
                      </button>
                    </div>
                  </div>
                ))
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const next = [...(data.form.nudges ?? [])];
                    next.push({ atQuestionOrder: 1, text: "" });
                    setData({ ...data, form: { ...data.form, nudges: next } });
                  }}
                  disabled={saving || nudgesSaving}
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-700 transition-all hover:bg-zinc-100 disabled:opacity-60"
                >
                  הוסף עידוד
                </button>

                <button
                  type="button"
                  onClick={() => saveNudges(data.form.nudges ?? [])}
                  disabled={saving || nudgesSaving}
                  className="h-11 rounded-xl bg-emerald-600 px-4 text-sm text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
                >
                  {nudgesSaving ? "שומר..." : "שמירת עידודים"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-zinc-900">תאימות לאחור (ישן)</div>
            <div className="mt-1 text-xs text-zinc-600">אם יש שימוש בשדה נאג׳ הישן, אפשר לערוך גם כאן.</div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <textarea
                  value={data.form.nudgeText ?? ""}
                  onChange={(e) => setData({ ...data, form: { ...data.form, nudgeText: e.target.value || null } })}
                  onBlur={() => saveFormPatch({ nudgeText: data.form.nudgeText })}
                  disabled={saving}
                  rows={2}
                  className="min-h-20 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm leading-6 outline-none transition-colors focus:border-emerald-500 disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "danger" ? (
        <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-zinc-900">אזור מסוכן</div>
          <div className="mt-2 text-sm leading-6 text-zinc-600">מחיקת טופס תמחק גם את השאלות שלו. הפעולה אינה הפיכה.</div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              disabled={saving}
              className="h-11 rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-700 transition-all hover:bg-red-50 disabled:opacity-50"
            >
              מחיקת טופס
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
