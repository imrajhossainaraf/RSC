import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

type OrderItem = {
  productName: string;
  quantity: number;
  priceAtPurchase: number;
};

type PopulatedOrder = {
  _id: string;
  buyerDetails: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
  };
  items: OrderItem[];
  total: number;
  createdAt: Date;
};

function buildOrderBlock(order: PopulatedOrder, index: number): string {
  const rows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:10px;border:1px solid #ddd;">${item.productName}</td>
          <td style="text-align:center;padding:10px;border:1px solid #ddd;">${item.quantity}</td>
          <td style="text-align:right;padding:10px;border:1px solid #ddd;">$${item.priceAtPurchase.toFixed(2)}</td>
          <td style="text-align:right;padding:10px;border:1px solid #ddd;"><strong>$${(item.quantity * item.priceAtPurchase).toFixed(2)}</strong></td>
        </tr>`
    )
    .join("");

  return `
    <div style="margin-bottom:40px;padding:20px;border:1px solid #e0e0e0;border-radius:6px;">
      <h3 style="margin:0 0 8px;color:#333;">Order ${index + 1} — <span style="color:#888;font-size:14px;">${order._id}</span></h3>
      <p style="margin:4px 0;font-size:13px;color:#555;">
        Placed: ${new Date(order.createdAt).toLocaleString()}
      </p>

      <h4 style="margin:16px 0 6px;">Buyer</h4>
      <p style="margin:2px 0;">${order.buyerDetails.name} &bull; ${order.buyerDetails.email} &bull; ${order.buyerDetails.phone}</p>
      <p style="margin:2px 0;">${order.buyerDetails.address}, ${order.buyerDetails.city} ${order.buyerDetails.zipCode}</p>

      <h4 style="margin:16px 0 6px;">Items</h4>
      <table style="border-collapse:collapse;width:100%;">
        <tr style="background:#f5f5f5;">
          <th style="text-align:left;padding:10px;border:1px solid #ddd;">Product</th>
          <th style="text-align:center;padding:10px;border:1px solid #ddd;">Qty</th>
          <th style="text-align:right;padding:10px;border:1px solid #ddd;">Unit Price</th>
          <th style="text-align:right;padding:10px;border:1px solid #ddd;">Subtotal</th>
        </tr>
        ${rows}
        <tr style="background:#f9f9f9;">
          <td colspan="3" style="text-align:right;padding:10px;border:1px solid #ddd;font-weight:bold;">ORDER TOTAL:</td>
          <td style="text-align:right;padding:10px;border:1px solid #ddd;font-weight:bold;color:#27AE60;font-size:16px;">$${order.total.toFixed(2)}</td>
        </tr>
      </table>
    </div>`;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const emailRecipient = process.env.ADMIN_EMAILS || process.env.EMAIL_FROM;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !emailRecipient) {
    return NextResponse.json({ message: "Email not configured" }, { status: 500 });
  }

  await dbConnect();

  const pendingOrders = await Order.find({ emailNotified: false }).sort({ createdAt: 1 }).lean<PopulatedOrder[]>();

  if (!pendingOrders.length) {
    return NextResponse.json({ message: "No new orders to notify." });
  }

  const grandTotal = pendingOrders.reduce((sum, o) => sum + o.total, 0);
  const orderBlocks = pendingOrders.map((o, i) => buildOrderBlock(o, i)).join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;color:#333;">
      <h1 style="border-bottom:2px solid #27AE60;padding-bottom:12px;">Order Digest</h1>
      <p style="font-size:15px;">
        <strong>${pendingOrders.length} new order${pendingOrders.length > 1 ? "s" : ""}</strong>
        received in the last 2 hours.
        Combined total: <strong style="color:#27AE60;">$${grandTotal.toFixed(2)}</strong>
      </p>
      ${orderBlocks}
      <hr style="border:none;border-top:1px solid #ddd;margin:30px 0;">
      <p style="color:#999;font-size:12px;">Automated digest — do not reply.</p>
    </div>`;

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: emailRecipient,
    subject: `Order Digest — ${pendingOrders.length} new order${pendingOrders.length > 1 ? "s" : ""} ($${grandTotal.toFixed(2)})`,
    html,
  });

  const ids = pendingOrders.map((o) => o._id);
  await Order.updateMany({ _id: { $in: ids } }, { emailNotified: true });

  return NextResponse.json({
    message: `Digest sent for ${pendingOrders.length} order(s).`,
    orderIds: ids,
  });
}
