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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const settings = await Settings.find({ key: { $in: ["fromEmail", "shippingFeeInside", "shippingFeeOutside"] } });
  const get = (key: string) => settings.find((s: { key: string; value: string }) => s.key === key)?.value;

  return NextResponse.json({
    fromEmail: get("fromEmail") ?? process.env.EMAIL_FROM ?? "",
    shippingFeeInside: Number(get("shippingFeeInside") ?? 50),
    shippingFeeOutside: Number(get("shippingFeeOutside") ?? 150),
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const body = (await req.json()) as {
    fromEmail?: string;
    shippingFeeInside?: number;
    shippingFeeOutside?: number;
  };

  const updates: Promise<unknown>[] = [];

  if (body.fromEmail !== undefined) {
    const email = normalizeEmail(body.fromEmail);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "Invalid email address." }, { status: 400 });
    }
    updates.push(Settings.findOneAndUpdate({ key: "fromEmail" }, { value: email }, { upsert: true }));
  }

  if (body.shippingFeeInside !== undefined) {
    const fee = Number(body.shippingFeeInside);
    if (isNaN(fee) || fee < 0) {
      return NextResponse.json({ message: "Invalid shipping fee for Inside Chottogram." }, { status: 400 });
    }
    updates.push(Settings.findOneAndUpdate({ key: "shippingFeeInside" }, { value: String(fee) }, { upsert: true }));
  }

  if (body.shippingFeeOutside !== undefined) {
    const fee = Number(body.shippingFeeOutside);
    if (isNaN(fee) || fee < 0) {
      return NextResponse.json({ message: "Invalid shipping fee for Outside Chottogram." }, { status: 400 });
    }
    updates.push(Settings.findOneAndUpdate({ key: "shippingFeeOutside" }, { value: String(fee) }, { upsert: true }));
  }

  await Promise.all(updates);
  return NextResponse.json({ message: "Settings saved successfully." });
}
