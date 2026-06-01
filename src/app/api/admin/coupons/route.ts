import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { sanitizeString } from "@/lib/validation";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;
  return user?.role === "admin" ? user : null;
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    await dbConnect();
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(coupons);
  } catch (error) {
    console.error("GET /api/admin/coupons error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as { codes?: unknown; discountPercent?: unknown };
    const discountPercent = Number(body.discountPercent);

    if (!Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 100) {
      return NextResponse.json({ message: "Discount must be between 1 and 100." }, { status: 400 });
    }

    const rawCodes = Array.isArray(body.codes) ? body.codes : [];
    const codes: string[] = rawCodes
      .map((c: unknown) => sanitizeString(c).toUpperCase())
      .filter(Boolean);

    if (codes.length === 0) {
      return NextResponse.json({ message: "Provide at least one coupon code." }, { status: 400 });
    }

    await dbConnect();

    const docs = codes.map(code => ({ code, discountPercent }));
    const inserted = await Coupon.insertMany(docs, { ordered: false }).catch((err: {
      writeErrors?: { errmsg?: string }[];
      result?: { insertedCount?: number; nInserted?: number };
      insertedCount?: number;
    }) => {
      if (err?.writeErrors) {
        // insertedCount comes from the bulk write result attached to the error
        const insertedCount = err.result?.insertedCount ?? err.result?.nInserted ?? err.insertedCount ?? 0;
        const dupes = err.writeErrors
          .filter((e) => e?.errmsg?.includes("duplicate key"))
          .map((e) => {
            // Use the raw errmsg string directly — JSON.stringify would double-escape
            // inner quotes and break the regex match.
            const m = (e.errmsg ?? "").match(/"([^"]+)"/);
            return m ? m[1] : null;
          })
          .filter(Boolean) as string[];
        if (dupes.length > 0) {
          throw Object.assign(new Error("DUPLICATE"), { dupes, insertedCount });
        }
      }
      throw err;
    });

    return NextResponse.json({ created: inserted.length }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string; dupes?: string[]; insertedCount?: number };
    if (err?.message === "DUPLICATE") {
      return NextResponse.json(
        {
          created: err.insertedCount ?? 0,
          message: `Duplicate codes skipped: ${err.dupes?.join(", ")}`,
        },
        { status: 409 }
      );
    }
    console.error("POST /api/admin/coupons error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
