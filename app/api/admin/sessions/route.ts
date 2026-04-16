import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSessionsCounts, listAdminSessions } from "@/lib/data";

const querySchema = z.object({
  formId: z.string().trim().min(1).optional(),
  q: z.string().trim().optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  tab: z.enum(["all", "untreated", "treated", "reviewing"]).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    formId: url.searchParams.get("formId") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    dateFrom: url.searchParams.get("dateFrom") ?? undefined,
    dateTo: url.searchParams.get("dateTo") ?? undefined,
    tab: (url.searchParams.get("tab") as any) ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const treatmentStatus = parsed.data.tab && parsed.data.tab !== "all" ? parsed.data.tab : "all";

  const [sessions, counts] = await Promise.all([
    listAdminSessions({
      formId: parsed.data.formId ?? null,
      emailQuery: parsed.data.q ?? null,
      dateFrom: parsed.data.dateFrom ?? null,
      dateTo: parsed.data.dateTo ?? null,
      treatmentStatus,
    }),
    getAdminSessionsCounts({
      formId: parsed.data.formId ?? null,
      emailQuery: parsed.data.q ?? null,
      dateFrom: parsed.data.dateFrom ?? null,
      dateTo: parsed.data.dateTo ?? null,
    }),
  ]);

  return NextResponse.json({ sessions, counts });
}
