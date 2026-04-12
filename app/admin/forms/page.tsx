import { listForms } from "@/lib/data";
import Link from "next/link";
import CopyClientLinkButton from "./CopyClientLinkButton";

export default async function AdminFormsPage() {
  const forms = await listForms();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">טפסים</h1>
          <div className="mt-1 text-sm text-zinc-600">ניהול טפסים ושאלות</div>
        </div>
        <Link
          href="/admin/forms/new"
          className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-700"
        >
          טופס חדש
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-medium text-zinc-600">
          <div className="col-span-4">שם</div>
          <div className="col-span-4">Slug</div>
          <div className="col-span-2">נאג׳</div>
          <div className="col-span-2 text-left">פעולות</div>
        </div>

        {(forms as any[]).length === 0 ? (
          <div className="px-4 py-8 text-sm text-zinc-600">אין טפסים.</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {(forms as any[]).map((f) => (
              <div key={f.id} className="grid grid-cols-12 items-center gap-2 px-4 py-3 text-sm">
                <div className="col-span-4 font-medium text-zinc-900">{f.name}</div>
                <div className="col-span-4 text-zinc-600">{f.slug}</div>
                <div className="col-span-2 text-zinc-600">{f.nudge_question_order ?? f.nudgeQuestionOrder ?? "-"}</div>
                <div className="col-span-2 text-left">
                  <div className="flex items-center justify-end gap-2">
                    <CopyClientLinkButton slug={f.slug} />
                    <Link
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 transition-all hover:bg-zinc-100"
                      href={`/admin/forms/${f.id}`}
                    >
                      עריכה
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
