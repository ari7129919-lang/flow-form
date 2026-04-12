import { Resend } from "resend";

export function getResendClient(): Resend {
  throw new Error("Resend is disabled. This project uses Gmail SMTP (nodemailer). ");
}
