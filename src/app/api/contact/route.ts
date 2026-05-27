import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    console.log(`[Contact Submission] From: ${name} <${email}>. Subject: ${subject}. Message: ${message}`);

    const emailRecipient = process.env.ADMIN_EMAILS || process.env.EMAIL_FROM;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && emailRecipient) {
      try {
        const transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: emailRecipient,
          subject: `Contact Form: ${subject}`,
          text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        });
      } catch (mailError) {
        console.warn("Mail dispatch skipped/failed:", mailError);
      }
    }

    return NextResponse.json({ message: 'Message sent successfully' }, { status: 201 });
  } catch (error) {
    console.error('Contact submission error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
