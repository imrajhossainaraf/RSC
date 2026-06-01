import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import User from "@/models/User";
import { sanitizeString, isValidObjectId } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "You must be logged in to apply a coupon." }, { status: 401 });
    }

    const sessionUser = session.user as { id?: string; email?: string };
    const body = (await req.json()) as { code?: unknown };
    const code = sanitizeString(body.code).toUpperCase();

    if (!code) {
      return NextResponse.json({ message: "Please enter a coupon code." }, { status: 400 });
    }

    await dbConnect();

    let userId = sessionUser.id;
    if (!isValidObjectId(userId) && sessionUser.email) {
      const user = await User.findOne({ email: sessionUser.email }).select("_id");
      if (user) userId = user._id.toString();
    }

    if (!isValidObjectId(userId)) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
      return NextResponse.json({ message: "Invalid coupon code." }, { status: 404 });
    }
    if (!coupon.isActive) {
      return NextResponse.json({ message: "This coupon is no longer active." }, { status: 400 });
    }

    const alreadyUsed = coupon.usedBy.some(
      (uid: { toString(): string }) => uid.toString() === userId
    );
    if (alreadyUsed) {
      return NextResponse.json({ message: "You have already used this coupon." }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
    });
  } catch (error) {
    console.error("Coupon validate error:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}
