import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { normalizeEmail, sanitizeString } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const name = sanitizeString(payload.name);
    const email = normalizeEmail(payload.email);
    const password = sanitizeString(payload.password);

    if (!name || !email || password.length < 6) {
      return NextResponse.json(
        { message: "Name, email, and password (min 6 chars) are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
    const role = adminEmails.includes(email) ? "admin" : "user";

    await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    return NextResponse.json({ message: "User registered successfully." }, { status: 201 });
  } catch (error) {
    console.error("Error in registration:", error);
    return NextResponse.json({ message: "An error occurred during registration." }, { status: 500 });
  }
}
