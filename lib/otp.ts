import crypto from "crypto";

export function generateOtpCode() {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, "0");
}

export function hashOtp(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function safeEqual(a: string, b: string) {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
