"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
} from "lucide-react";
import ResetAllDataButton from "@/app/admin/ResetAllDataButton";

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
          ? "bg-[#b08d57] text-white shadow-sm"
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
    <div className="min-h-[100dvh] bg-[radial-gradient(1000px_circle_at_20%_0%,rgba(176,141,87,0.10),transparent_60%),linear-gradient(180deg,#fbf8f2,#f3f4f6)]">
      <div className="mx-auto flex w-full max-w-7xl gap-4 px-4 py-4">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-4 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-3 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 rounded-xl bg-[#f6f1e6]/80 px-3 py-3">
              <div className="grid size-9 place-items-center overflow-hidden rounded-xl bg-[#f6f1e6] ring-1 ring-zinc-200">
                <Image src="/bot-avatar-v2.jpeg" alt="" width={36} height={36} className="size-9 object-cover" />
              </div>
              <div className="flex flex-col">
                <div className="text-sm font-semibold text-zinc-900">אלישבע יועצת מס בכירה </div>
                <div className="text-xs text-zinc-600">ניהול</div>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              <NavItem href="/admin" label="דשבורד" icon={LayoutDashboard} />
              <NavItem href="/admin/forms" label="טפסים" icon={FileText} />
              <NavItem href="/admin/sessions" label="תשובות" icon={BarChart3} />
              <NavItem href="/admin/reports" label="דוחות" icon={BarChart3} />
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
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl bg-[#f6f1e6] text-zinc-900 ring-1 ring-zinc-200">
                <ShieldCheck className="size-5" />
              </div>
              <div className="flex flex-col leading-tight">
                <div className="text-sm font-semibold text-zinc-900">לוח ניהול</div>
                <div className="text-xs text-zinc-500">ממשק ניהול </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <ResetAllDataButton />
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
          </div>

          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}
