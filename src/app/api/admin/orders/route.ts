import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { isValidObjectId, sanitizeString } from "@/lib/validation";

function requireAdmin(session: Awaited<ReturnType<typeof getServerSession>>): boolean {
  if (!session) return false;
  return (session as { user?: { role?: string } }).user?.role === "admin";
}

const VALID_STATUSES = ["pending", "processing", "completed", "cancelled"] as const;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const status = searchParams.get("status") ?? "";

  await dbConnect();

  const filter = status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])
    ? { status }
    : {};

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return NextResponse.json({ orders, total, page, pages: Math.ceil(total / limit) });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { orderId, status } = (await req.json()) as { orderId?: string; status?: string };

  if (!orderId || !isValidObjectId(orderId)) {
    return NextResponse.json({ message: "Invalid order ID." }, { status: 400 });
  }

  const safeStatus = sanitizeString(status ?? "");
  if (!VALID_STATUSES.includes(safeStatus as typeof VALID_STATUSES[number])) {
    return NextResponse.json({ message: "Invalid status value." }, { status: 400 });
  }

  await dbConnect();
  const order = await Order.findByIdAndUpdate(orderId, { status: safeStatus }, { new: true });
  if (!order) return NextResponse.json({ message: "Order not found." }, { status: 404 });

  return NextResponse.json({ message: "Order status updated.", order });
}
