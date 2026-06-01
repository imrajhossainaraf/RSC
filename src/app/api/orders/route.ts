import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Settings from "@/models/Settings";
import User from "@/models/User";
import Coupon from "@/models/Coupon";
import { sendMail } from "@/lib/mailer";
import { isValidObjectId, sanitizeString } from "@/lib/validation";

type OrderItemPayload = {
  productId: string;
  name: string;
  quantity: number;
  image?: string;
};

type BuyerDetailsPayload = Record<string, unknown>;


type ProductDoc = {
  _id: { toString(): string };
  name: string;
  price: number;
  discount: number;
  stock: number;
  image?: string;
  save(): Promise<unknown>;
};

export async function POST(req: Request) {
  // Tracked outside the try block so the catch can roll back an atomic coupon claim
  // if stock deduction or Order.create fails after the claim is made.
  let claimedCouponId: unknown = null;
  let claimingUserId: string | undefined;

  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string; role?: string; email?: string } | undefined;

    if (!session || !sessionUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isValidObjectId(sessionUser.id) && sessionUser.email) {
      await dbConnect();
      const existingUser = await User.findOne({ email: sessionUser.email }).select("_id");
      if (existingUser) sessionUser.id = existingUser._id.toString();
    }

    if (!isValidObjectId(sessionUser.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    claimingUserId = sessionUser.id;

    const payload = (await req.json()) as Record<string, unknown>;
    const items = Array.isArray(payload.items) ? (payload.items as OrderItemPayload[]) : [];
    const buyerDetails = (payload.buyerDetails as BuyerDetailsPayload | undefined) ?? {};
    const shippingZone = payload.shippingZone === "outside" ? "outside" : "inside";
    const couponCodeRaw = typeof payload.couponCode === "string"
      ? sanitizeString(payload.couponCode).toUpperCase()
      : "";

    if (!items.length) {
      return NextResponse.json({ message: "Cart is empty." }, { status: 400 });
    }

    const buyerName = sanitizeString(buyerDetails.name);
    const buyerEmail = sanitizeString(buyerDetails.email);
    const buyerPhone = sanitizeString(buyerDetails.phone);
    const address = sanitizeString(buyerDetails.address);
    const city = sanitizeString(buyerDetails.city);

    if (!buyerName || !buyerEmail || !buyerPhone || !address || !city) {
      return NextResponse.json({ message: "All buyer and shipping details are required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      return NextResponse.json({ message: "Invalid email address." }, { status: 400 });
    }

    if (!/^[0-9+()\s-]{6,30}$/.test(buyerPhone)) {
      return NextResponse.json({ message: "Invalid phone number." }, { status: 400 });
    }

    await dbConnect();

    // 1. Fetch products and validate stock — no writes yet
    const productsToUpdate: Array<{ product: ProductDoc; quantity: number }> = [];

    for (const item of items) {
      if (!item || !isValidObjectId(item.productId) || Number(item.quantity) <= 0) {
        return NextResponse.json({ message: "Invalid cart item." }, { status: 400 });
      }
      const product = await Product.findById(item.productId) as ProductDoc | null;
      if (!product) {
        return NextResponse.json({ message: `Product "${sanitizeString(item.name)}" not found.` }, { status: 404 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { message: `Insufficient stock for "${product.name}". Only ${product.stock} left.` },
          { status: 400 }
        );
      }
      productsToUpdate.push({ product, quantity: item.quantity });
    }

    // 2. Build order items and calculate totals — no writes yet
    const orderItems = productsToUpdate.map(({ product, quantity }) => {
      const effectivePrice = product.price - (product.price * (product.discount / 100));
      return {
        product: product._id,
        productName: product.name,
        productImage: product.image ?? "",
        quantity,
        priceAtPurchase: parseFloat(effectivePrice.toFixed(2)),
      };
    });

    const feeSettings = await Settings.find({ key: { $in: ["shippingFeeInside", "shippingFeeOutside"] } });
    const feeInside = Number(feeSettings.find((s: { key: string; value: string }) => s.key === "shippingFeeInside")?.value ?? 50);
    const feeOutside = Number(feeSettings.find((s: { key: string; value: string }) => s.key === "shippingFeeOutside")?.value ?? 150);
    const shippingFee = shippingZone === "outside" ? feeOutside : feeInside;

    const itemsTotal = parseFloat(
      orderItems.reduce((sum, i) => sum + i.priceAtPurchase * i.quantity, 0).toFixed(2)
    );

    // 3. Atomically claim the coupon BEFORE touching stock.
    //    Uses findOneAndUpdate with $addToSet so the check+mark is a single DB operation,
    //    eliminating the TOCTOU window between reading usedBy and writing it.
    //    claimedCouponId is set so the catch block can roll back on later failures.
    let couponDiscount = 0;
    let appliedCouponCode = "";
    if (couponCodeRaw) {
      const claimed = await Coupon.findOneAndUpdate(
        { code: couponCodeRaw, isActive: true, usedBy: { $ne: sessionUser.id } },
        { $addToSet: { usedBy: sessionUser.id } },
        { new: true }
      ) as { _id: unknown; discountPercent: number } | null;

      if (!claimed) {
        // Distinguish error messages without a separate query when possible
        const existing = await Coupon.findOne({ code: couponCodeRaw }).select("isActive") as { isActive: boolean } | null;
        if (!existing) return NextResponse.json({ message: "Coupon code not found." }, { status: 400 });
        if (!existing.isActive) return NextResponse.json({ message: "This coupon is no longer active." }, { status: 400 });
        return NextResponse.json({ message: "You have already used this coupon." }, { status: 400 });
      }

      claimedCouponId = claimed._id;
      couponDiscount = parseFloat((itemsTotal * (claimed.discountPercent / 100)).toFixed(2));
      appliedCouponCode = couponCodeRaw;
    }

    const serverTotal = parseFloat((itemsTotal - couponDiscount + shippingFee).toFixed(2));

    // 4. Deduct stock — coupon already validated above
    for (const { product, quantity } of productsToUpdate) {
      product.stock -= quantity;
      await product.save();
    }

    // 5. Create order
    const order = await Order.create({
      user: sessionUser.id,
      buyerDetails: { name: buyerName, email: buyerEmail, phone: buyerPhone, address, city },
      items: orderItems,
      total: serverTotal,
      shippingFee,
      shippingZone,
      couponCode: appliedCouponCode,
      couponDiscount,
    });

    // Order succeeded — disable the coupon rollback
    claimedCouponId = null;

    // Send order confirmation to customer (non-blocking)
    sendMail({
      to: buyerEmail,
      subject: `Order Confirmed — Robotics Shop CTG (#${order._id})`,
      html: buildConfirmationEmail(buyerName, order._id.toString(), orderItems, itemsTotal, shippingFee, shippingZone, couponDiscount, appliedCouponCode),
    }).catch((err) => console.warn("Order confirmation email failed:", err));

    return NextResponse.json({ message: "Order placed successfully.", orderId: order._id }, { status: 201 });
  } catch (error) {
    // Roll back the atomic coupon claim so the user can retry with the same coupon
    if (claimedCouponId && claimingUserId) {
      await Coupon.findByIdAndUpdate(claimedCouponId, { $pull: { usedBy: claimingUserId } })
        .catch(e => console.error("Coupon rollback failed:", e));
    }
    console.error("Error creating order:", error);
    return NextResponse.json({ message: "An error occurred while placing the order." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const sessionUser = session.user as { id?: string; role?: string };

    if (sessionUser.role === "admin") {
      const orders = await Order.find({})
        .populate("user", "name email")
        .populate("items.product")
        .sort({ createdAt: -1 });
      return NextResponse.json(orders);
    }

    if (!isValidObjectId(sessionUser.id)) {
      return NextResponse.json([]);
    }

    const orders = await Order.find({ user: sessionUser.id })
      .populate("items.product")
      .sort({ createdAt: -1 });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

function buildConfirmationEmail(
  name: string,
  orderId: string,
  items: { productName: string; quantity: number; priceAtPurchase: number }[],
  subtotal: number,
  shippingFee: number,
  shippingZone: string,
  couponDiscount = 0,
  couponCode = "",
): string {
  const total = subtotal - couponDiscount + shippingFee;
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:10px;border:1px solid #e2e8f0;">${i.productName}</td>
        <td style="padding:10px;border:1px solid #e2e8f0;text-align:center;">${i.quantity}</td>
        <td style="padding:10px;border:1px solid #e2e8f0;text-align:right;">৳${i.priceAtPurchase.toFixed(2)}</td>
        <td style="padding:10px;border:1px solid #e2e8f0;text-align:right;font-weight:bold;">৳${(i.quantity * i.priceAtPurchase).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
      <div style="background:#7c3aed;padding:24px 32px;border-radius:8px 8px 0 0;">
        <h1 style="color:white;margin:0;font-size:1.5rem;">Order Confirmed!</h1>
      </div>
      <div style="padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
        <p>Hi <strong>${name}</strong>, thank you for your order!</p>
        <p style="color:#64748b;font-size:0.9rem;">Order ID: <code>${orderId}</code></p>

        <table style="border-collapse:collapse;width:100%;margin:24px 0;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;">Product</th>
              <th style="padding:10px;border:1px solid #e2e8f0;">Qty</th>
              <th style="padding:10px;border:1px solid #e2e8f0;text-align:right;">Unit Price</th>
              <th style="padding:10px;border:1px solid #e2e8f0;text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            ${couponDiscount > 0 ? `<tr>
              <td colspan="3" style="padding:10px;border:1px solid #e2e8f0;text-align:right;color:#15803d;">Coupon Discount (${couponCode})</td>
              <td style="padding:10px;border:1px solid #e2e8f0;text-align:right;color:#15803d;">−৳${couponDiscount.toFixed(2)}</td>
            </tr>` : ""}
            <tr>
              <td colspan="3" style="padding:10px;border:1px solid #e2e8f0;text-align:right;">Shipping (COD — ${shippingZone === "outside" ? "Outside Chottogram" : "Inside Chottogram"})</td>
              <td style="padding:10px;border:1px solid #e2e8f0;text-align:right;">৳${shippingFee.toFixed(2)}</td>
            </tr>
            <tr style="background:#f8fafc;">
              <td colspan="3" style="padding:12px;border:1px solid #e2e8f0;text-align:right;font-weight:bold;">TOTAL</td>
              <td style="padding:12px;border:1px solid #e2e8f0;text-align:right;font-weight:bold;color:#7c3aed;font-size:1.1rem;">৳${total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <p style="color:#64748b;font-size:0.85rem;">
          We'll process your order shortly. You can track it in your
          <a href="${process.env.NEXTAUTH_URL || ""}/profile" style="color:#7c3aed;">profile page</a>.
        </p>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="color:#94a3b8;font-size:0.75rem;margin:0;">
          Robotics Shop CTG — Electronics &amp; Components, Chittagong, Bangladesh
        </p>
      </div>
    </div>`;
}
