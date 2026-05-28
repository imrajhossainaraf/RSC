import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { normalizeEmail } from "@/lib/validation";

function isAdmin(session: Awaited<ReturnType<typeof getServerSession>>): boolean {
  if (!session) return false;
  return (session as { user?: { role?: string } }).user?.role === "admin";
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const admins = await User.find({ role: "admin" }).select("_id name email createdAt").lean();
  return NextResponse.json(admins);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { email } = (await req.json()) as { email?: string };
  const normalised = email ? normalizeEmail(email) : "";
  if (!normalised) return NextResponse.json({ message: "Email is required." }, { status: 400 });

  await dbConnect();
  const user = await User.findOneAndUpdate(
    { email: normalised },
    { role: "admin" },
    { new: true }
  ).select("_id name email");

  if (!user) {
    return NextResponse.json({ message: "No account found with that email. The user must sign up first." }, { status: 404 });
  }

  return NextResponse.json({ message: `${user.email} is now an admin.`, user });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { email } = (await req.json()) as { email?: string };
  const normalised = email ? normalizeEmail(email) : "";
  const currentEmail = normalizeEmail(String((session!.user as { email?: string })?.email ?? ""));

  if (normalised === currentEmail) {
    return NextResponse.json({ message: "You cannot remove your own admin role." }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findOneAndUpdate(
    { email: normalised },
    { role: "user" },
    { new: true }
  ).select("_id name email");

  if (!user) return NextResponse.json({ message: "Admin not found." }, { status: 404 });

  return NextResponse.json({ message: `${user.email} admin role removed.` });
}
