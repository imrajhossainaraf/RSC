import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";

export async function GET() {
  await dbConnect();
  const settings = await Settings.find({ key: { $in: ["shippingFeeInside", "shippingFeeOutside"] } });
  return NextResponse.json({
    inside: Number(settings.find((s: { key: string; value: string }) => s.key === "shippingFeeInside")?.value ?? 50),
    outside: Number(settings.find((s: { key: string; value: string }) => s.key === "shippingFeeOutside")?.value ?? 150),
  });
}
