import Link from "next/link";
import { listCompletedSessions } from "@/lib/data";

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

export default async function AdminSessionsPage() {
  const sessions = await listCompletedSessions();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">טפסים שנשלחו</h1>
          <div className="mt-1 text-sm text-zinc-600">רשימת סשנים שהושלמו</div>
        </div>
        <Link
          href="/admin"
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-all hover:bg-zinc-100"
        >
          חזרה
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-medium text-zinc-600">
          <div className="col-span-4">מייל</div>
          <div className="col-span-2">טלפון</div>
          <div className="col-span-2">שם</div>
          <div className="col-span-2">זמן סיום</div>
          <div className="col-span-2 text-left">פעולות</div>
        </div>

        {Array.isArray(sessions) && sessions.length === 0 ? (
          <div className="px-4 py-8 text-sm text-zinc-600">עדיין אין סשנים שהושלמו.</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {(sessions as any[]).map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-12 items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-zinc-50"
              >
                <div className="col-span-4 truncate font-medium text-zinc-900">{s.email}</div>
                <div className="col-span-2 truncate text-zinc-700">{s.phone ?? ""}</div>
                <div className="col-span-2 truncate text-zinc-700">{s.name ?? ""}</div>
                <div className="col-span-2 truncate text-zinc-600">
                  {fmtDateTime(s.completedAt ?? s.completed_at ?? s.createdAt ?? s.created_at)}
                </div>
                <div className="col-span-2 text-left">
                  <Link
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 transition-all hover:bg-zinc-100"
                    href={`/admin/sessions/${s.id}`}
                  >
                    פתיחה
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
