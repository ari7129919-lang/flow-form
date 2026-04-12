import crypto from "crypto";
import type { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";

const COOKIE_NAME = "ff_admin";

function base64url(input: Buffer | string) {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sign(payload: string, secret: string) {
  return base64url(crypto.createHmac("sha256", secret).update(payload).digest());
}

export function createAdminCookieValue() {
  const env = getServerEnv();
  const issuedAt = Date.now().toString();
  const payload = `v1.${issuedAt}`;
  const sig = sign(payload, env.ADMIN_SESSION_SECRET);
  return `${payload}.${sig}`;
}

export function setAdminCookie(res: NextResponse) {
  const value = createAdminCookieValue();
  res.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAdminCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function isAdminSessionValid(raw?: string) {
  if (!raw) return false;
  const env = getServerEnv();

  const parts = raw.split(".");
  if (parts.length !== 3) return false;

  const payload = `${parts[0]}.${parts[1]}`;
  const sig = parts[2];
  const expected = sign(payload, env.ADMIN_SESSION_SECRET);

  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
