import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { normalizeEmail } from "@/lib/validation";

function isAdmin(session: Awaited<ReturnType<typeof getServerSession>>): boolean {
  if (!session) return false;
  return (session as { user?: { role?: string } }).user?.role === "admin";
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const setting = await Settings.findOne({ key: "fromEmail" });
  return NextResponse.json({ fromEmail: setting?.value ?? process.env.EMAIL_FROM ?? "" });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { fromEmail } = (await req.json()) as { fromEmail?: string };
  const email = fromEmail ? normalizeEmail(fromEmail) : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Invalid email address." }, { status: 400 });
  }

  await dbConnect();
  await Settings.findOneAndUpdate(
    { key: "fromEmail" },
    { value: email },
    { upsert: true }
  );
  return NextResponse.json({ message: "From-email updated.", fromEmail: email });
}
