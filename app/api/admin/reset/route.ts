import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isAdminSessionValid } from "@/lib/adminSession";
import { resetAllData } from "@/lib/data";

export async function POST(req: Request) {
  const cookie = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (!isAdminSessionValid(cookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = (await req.json().catch(() => null)) as any;
  const deleteForms = Boolean(json?.deleteForms);
  await resetAllData({ deleteForms });
  return NextResponse.json({ ok: true });
}
