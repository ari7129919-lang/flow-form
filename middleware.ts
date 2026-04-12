import { NextResponse, type NextRequest } from "next/server";
import { isAdminSessionValidEdge } from "@/lib/adminSessionEdge";

export async function middleware(req: NextRequest) {
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin");
  const isAdminApi = req.nextUrl.pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  if (req.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (req.nextUrl.pathname === "/api/admin/login" || req.nextUrl.pathname === "/api/admin/logout") {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("ff_admin")?.value;
  if (await isAdminSessionValidEdge(cookie)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
