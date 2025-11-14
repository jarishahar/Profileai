// lib/mailer.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

type Mail = { to: string; subject: string; html: string };

export async function sendMail(mail: Mail) {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || "no-reply@example.com",
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
    });
  } catch (err) {
    const e: any = new Error("Failed to send email");
    e.code = "MAIL_SEND_FAILED";
    throw e;
  }
}
