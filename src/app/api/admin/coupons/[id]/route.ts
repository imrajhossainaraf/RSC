import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { isValidObjectId } from "@/lib/validation";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;
  return user?.role === "admin" ? user : null;
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid coupon ID." }, { status: 400 });
    }

    await dbConnect();
    const deleted = await Coupon.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "Coupon not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Coupon deleted." });
  } catch (error) {
    console.error("DELETE /api/admin/coupons/[id] error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid coupon ID." }, { status: 400 });
    }

    const body = (await req.json()) as { isActive?: boolean };
    await dbConnect();
    const updated = await Coupon.findByIdAndUpdate(id, { isActive: body.isActive }, { new: true });
    if (!updated) {
      return NextResponse.json({ message: "Coupon not found." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/admin/coupons/[id] error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
