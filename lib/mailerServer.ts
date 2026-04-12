import nodemailer from "nodemailer";
import { getServerEnv } from "@/lib/env";

export type SendMailArgs = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export function getMailerTransport() {
  const env = getServerEnv();

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function sendMail(args: SendMailArgs) {
  const env = getServerEnv();
  const transport = getMailerTransport();

  await transport.sendMail({
    from: env.SMTP_FROM,
    to: args.to,
    subject: args.subject,
    text: args.text,
    html: args.html,
  });
}
