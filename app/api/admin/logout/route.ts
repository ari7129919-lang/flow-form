import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/adminSession";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/admin/login", req.url));
  clearAdminCookie(res);
  return res;
}
