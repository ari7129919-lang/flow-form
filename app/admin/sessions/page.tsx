"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function fmtDateTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("he-IL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type TreatmentTab = "all" | "untreated" | "treated" | "reviewing";

type AdminSessionRow = {
  id: string;
  email: string;
  phone: string | null;
  name: string | null;
  completedAt: string | null;
  createdAt: string;
  treatmentStatus: "untreated" | "treated" | "reviewing";
  treatmentNote: string | null;
  adminViewedAt?: string | null;
  adminViewCount?: number;
};

type Counts = { all: number; untreated: number; treated: number; reviewing: number };

function tabLabel(tab: TreatmentTab) {
  if (tab === "all") return "כללי";
  if (tab === "untreated") return "לא טופל";
  if (tab === "treated") return "טופל";
  return "בבדיקה";
}

function statusBadge(status: AdminSessionRow["treatmentStatus"]) {
  if (status === "treated") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "reviewing") return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-zinc-50 text-zinc-700 border-zinc-200";
}

function statusText(status: AdminSessionRow["treatmentStatus"]) {
  if (status === "treated") return "טופל";
  if (status === "reviewing") return "בבדיקה";
  return "לא טופל";
}

export default function AdminSessionsPage() {
  const REFRESH_MS = 7000;
  const [tab, setTab] = useState<TreatmentTab>("all");
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [counts, setCounts] = useState<Counts>({ all: 0, untreated: 0, treated: 0, reviewing: 0 });
  const [sessions, setSessions] = useState<AdminSessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [treatOpen, setTreatOpen] = useState(false);
  const [treatSession, setTreatSession] = useState<AdminSessionRow | null>(null);
  const [treatStatus, setTreatStatus] = useState<AdminSessionRow["treatmentStatus"]>("treated");
  const [treatNote, setTreatNote] = useState("");
  const [treatSaving, setTreatSaving] = useState(false);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (tab) p.set("tab", tab);
    if (q.trim()) p.set("q", q.trim());
    if (dateFrom) p.set("dateFrom", dateFrom);
    if (dateTo) p.set("dateTo", dateTo);
    return p.toString();
  }, [tab, q, dateFrom, dateTo]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const isInitial = sessions.length === 0;
      if (isInitial) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/sessions?${queryString}`, { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as any;
        if (!res.ok) throw new Error(json?.error ?? "שגיאה בטעינת סשנים");
        if (cancelled) return;
        setSessions(Array.isArray(json?.sessions) ? json.sessions : []);
        setCounts(json?.counts ?? { all: 0, untreated: 0, treated: 0, reviewing: 0 });
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "שגיאה");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [queryString, REFRESH_MS, sessions.length]);

  async function saveTreatment() {
    if (!treatSession) return;
    setTreatSaving(true);
    try {
      const res = await fetch(`/api/admin/sessions/${encodeURIComponent(treatSession.id)}` as any, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          treatmentStatus: treatStatus,
          treatmentNote: treatNote.trim() ? treatNote.trim() : null,
        }),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(json?.error ?? "שגיאה בעדכון");

      setTreatOpen(false);
      setTreatSession(null);
      setTreatNote("");
      setTreatStatus("treated");

      const refresh = await fetch(`/api/admin/sessions?${queryString}`, { cache: "no-store" });
      const refreshJson = (await refresh.json().catch(() => null)) as any;
      if (refresh.ok) {
        setSessions(Array.isArray(refreshJson?.sessions) ? refreshJson.sessions : []);
        setCounts(refreshJson?.counts ?? counts);
      }
    } finally {
      setTreatSaving(false);
    }
  }

  function openTreatmentDialog(s: AdminSessionRow) {
    setTreatSession(s);
    setTreatStatus(tab === "untreated" || tab === "reviewing" ? "treated" : s.treatmentStatus);
    setTreatNote(s.treatmentNote ?? "");
    setTreatOpen(true);
  }

  function treatmentButtonText() {
    if (tab === "all" || tab === "treated") return "שינוי סטטוס";
    return "סמן כטופל";
  }

  const totalSessions = sessions.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">טפסים שנשלחו</h1>
          <div className="mt-1 text-sm text-zinc-600">תשובות שהושלמו + סטטוס טיפול</div>
        </div>
        <Link
          href="/admin"
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-all hover:bg-zinc-100"
        >
          חזרה
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium text-zinc-900">פילטרים</div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <div>מוצגים: {totalSessions}</div>
              {refreshing ? <div className="text-zinc-400">מתעדכן...</div> : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-5">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="חיפוש לפי מייל / טלפון / שם"
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#b08d57]/50"
              />
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#b08d57]/50"
              />
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#b08d57]/50"
              />
            </div>
            <div className="md:col-span-1">
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white text-sm text-zinc-700 transition-all hover:bg-zinc-100"
              >
                נקה
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "untreated", "treated", "reviewing"] as TreatmentTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={
                  "rounded-xl border px-3 py-2 text-sm transition-all " +
                  (tab === t
                    ? "border-[#b08d57]/30 bg-[#f6f1e6] text-zinc-900"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100")
                }
              >
                {tabLabel(t)} ({(counts as any)[t] ?? 0})
              </button>
            ))}
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </div>
      </div>

      <div dir="rtl" className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-medium text-zinc-600">
          <div className="col-span-3">מייל</div>
          <div className="col-span-2">טלפון</div>
          <div className="col-span-2">שם</div>
          <div className="col-span-2">פעולות</div>
          <div className="col-span-2">זמן סיום</div>
          <div className="col-span-1">סטטוס</div>
        </div>

        {loading && sessions.length === 0 ? (
          <div className="px-4 py-8 text-sm text-zinc-600">טוען...</div>
        ) : Array.isArray(sessions) && sessions.length === 0 ? (
          <div className="px-4 py-8 text-sm text-zinc-600">עדיין אין סשנים שהושלמו.</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {(sessions as any[]).map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-12 items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-zinc-50"
              >
                <div className="col-span-3 truncate font-medium text-zinc-900">
                  <div className="flex min-w-0 flex-row-reverse items-center gap-2">
                    <span className="truncate">{s.email}</span>
                    {s.adminViewedAt || (Number(s.adminViewCount ?? 0) > 0) ? (
                      <span className="flex shrink-0 flex-row-reverse items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-normal text-zinc-500">{Number(s.adminViewCount ?? 0)}</span>
                      </span>
                    ) : (
                      <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-500" />
                    )}
                  </div>
                </div>
                <div className="col-span-2 truncate text-zinc-700">{s.phone ?? ""}</div>
                <div className="col-span-2 truncate text-zinc-700">{s.name ?? ""}</div>
                <div className="col-span-2">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 transition-all hover:bg-zinc-100"
                      href={`/admin/sessions/${s.id}`}
                    >
                      פתיחה
                    </Link>
                    <button
                      type="button"
                      onClick={() => openTreatmentDialog(s)}
                      className="shrink-0 rounded-xl bg-[#b08d57] px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-95"
                    >
                      {treatmentButtonText()}
                    </button>
                  </div>
                </div>
                <div className="col-span-2 truncate text-zinc-600">
                  {fmtDateTime(s.completedAt ?? s.completed_at ?? s.createdAt ?? s.created_at)}
                </div>
                <div className="col-span-1">
                  <span
                    title={s.treatmentNote ?? ""}
                    className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs ${statusBadge(s.treatmentStatus)} ${
                      s.treatmentNote ? "cursor-help" : ""
                    }`}
                  >
                    {statusText(s.treatmentStatus)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {treatOpen && treatSession ? (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-lg">
            <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto p-5">
              <div className="text-base font-semibold text-zinc-900">איך טופל?</div>
              <div className="mt-1 text-sm text-zinc-600">אפשר לדלג על בחירה/הערה ולהמשיך.</div>

              <div className="mt-4 grid grid-cols-1 gap-2">
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="radio"
                    name="treatStatus"
                    checked={treatStatus === "treated"}
                    onChange={() => setTreatStatus("treated")}
                  />
                  טופל
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="radio"
                    name="treatStatus"
                    checked={treatStatus === "reviewing"}
                    onChange={() => setTreatStatus("reviewing")}
                  />
                  בבדיקה
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="radio"
                    name="treatStatus"
                    checked={treatStatus === "untreated"}
                    onChange={() => setTreatStatus("untreated")}
                  />
                  לא טופל
                </label>
              </div>

              <textarea
                value={treatNote}
                onChange={(e) => setTreatNote(e.target.value)}
                placeholder="הערה (אופציונלי)"
                className="mt-4 min-h-24 w-full resize-none rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-[#b08d57]/50"
              />

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTreatOpen(false);
                    setTreatSession(null);
                  }}
                  disabled={treatSaving}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-all hover:bg-zinc-100 disabled:opacity-50"
                >
                  ביטול
                </button>
                <button
                  type="button"
                  onClick={saveTreatment}
                  disabled={treatSaving}
                  className="rounded-xl bg-[#b08d57] px-3 py-2 text-sm font-medium text-white transition-all hover:brightness-95 disabled:opacity-50"
                >
                  {treatSaving ? "שומר..." : "אישור"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
