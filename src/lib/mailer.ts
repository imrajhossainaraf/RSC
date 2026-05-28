import nodemailer from "nodemailer";
import dbConnect from "./mongodb";
import Settings from "@/models/Settings";

async function getFromEmail(): Promise<string> {
  try {
    await dbConnect();
    const setting = await Settings.findOne({ key: "fromEmail" });
    if (setting?.value) return setting.value as string;
  } catch {
    // fall through to env default
  }
  return process.env.EMAIL_FROM || process.env.EMAIL_USER || "";
}

function createTransport() {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

type MailOptions = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
};

export async function sendMail(opts: MailOptions): Promise<void> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  const from = await getFromEmail();
  const transporter = createTransport();
  await transporter.sendMail({ from, ...opts });
}
