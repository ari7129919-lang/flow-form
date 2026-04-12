"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
} from "lucide-react";

function NavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={
        "group flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all " +
        (active
          ? "bg-emerald-600 text-white shadow-sm"
          : "text-zinc-700 hover:bg-zinc-100")
      }
    >
      <Icon className={"size-4 transition-transform group-hover:scale-105 " + (active ? "text-white" : "text-zinc-500")} />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-zinc-50">
      <div className="mx-auto flex w-full max-w-7xl gap-4 px-4 py-4">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-4 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-3">
              <div className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-sm font-semibold text-white">
                FF
              </div>
              <div className="flex flex-col">
                <div className="text-sm font-semibold text-zinc-900">Flow Form</div>
                <div className="text-xs text-zinc-600">Admin</div>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              <NavItem href="/admin" label="דשבורד" icon={LayoutDashboard} />
              <NavItem href="/admin/forms" label="טפסים" icon={FileText} />
              <NavItem href="/admin/sessions" label="תשובות" icon={BarChart3} />
              <NavItem href="/admin/settings" label="הגדרות" icon={Settings} />
            </nav>

            <form action="/api/admin/logout" method="post" className="pt-2">
              <button
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-all hover:bg-zinc-100"
                type="submit"
              >
                <LogOut className="size-4 text-zinc-500 transition-transform group-hover:scale-105" />
                יציאה
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="size-5" />
              </div>
              <div className="flex flex-col leading-tight">
                <div className="text-sm font-semibold text-zinc-900">לוח ניהול</div>
                <div className="text-xs text-zinc-500">ממשק ניהול מקצועי</div>
              </div>
            </div>

            <div className="md:hidden">
              <Link
                href="/admin"
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-all hover:bg-zinc-100"
              >
                דשבורד
              </Link>
            </div>
          </div>

          <div className="animate-in fade-in duration-300">{children}</div>
        </main>
      </div>
    </div>
  );
}
