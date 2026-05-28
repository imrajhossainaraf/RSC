import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { sendMail } from '@/lib/mailer';
import { sanitizeString, normalizeEmail } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json() as Record<string, unknown>;
    const name = sanitizeString(body.name);
    const email = normalizeEmail(String(body.email ?? ""));
    const subject = sanitizeString(body.subject);
    const message = sanitizeString(body.message);

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'Invalid email address.' }, { status: 400 });
    }

    const adminRecipient = (process.env.ADMIN_EMAILS || "").split(",")[0].trim();
    if (adminRecipient) {
      await sendMail({
        to: adminRecipient,
        subject: `Contact Form: ${subject}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      });
    }

    return NextResponse.json({ message: 'Message sent successfully' }, { status: 201 });
  } catch (error) {
    console.error('Contact submission error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
