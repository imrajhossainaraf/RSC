import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import nodemailer from "nodemailer";
import { isValidObjectId, sanitizeString } from "@/lib/validation";

type OrderItemPayload = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type ProductDocument = {
  stock: number;
  name: string;
  save: () => Promise<unknown>;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string; role?: string; email?: string } | undefined;
    if (!session || !sessionUser?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = (await req.json()) as Record<string, unknown>;
    const items = Array.isArray(payload.items) ? payload.items : [];
    const shippingDetails = (payload.shippingDetails as Record<string, unknown> | undefined) ?? {};
    const total = Number(payload.total) || 0;

    if (!items.length) {
      return NextResponse.json({ message: "Cart is empty." }, { status: 400 });
    }

    const address = sanitizeString(shippingDetails.address);
    const city = sanitizeString(shippingDetails.city);
    const zipCode = sanitizeString(shippingDetails.zipCode);

    if (!address || !city || !zipCode) {
      return NextResponse.json({ message: "Shipping details are required." }, { status: 400 });
    }

    if (total <= 0) {
      return NextResponse.json({ message: "Invalid order total." }, { status: 400 });
    }

    await dbConnect();

    const productsToUpdate: Array<{ product: ProductDocument; quantity: number }> = [];

    for (const item of items) {
      if (!item || !isValidObjectId(item.productId) || Number(item.quantity) <= 0) {
        return NextResponse.json({ message: "Invalid cart item." }, { status: 400 });
      }

      const product = await Product.findById(item.productId);
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

    for (const update of productsToUpdate) {
      update.product.stock -= update.quantity;
      await update.product.save();
    }

    const orderItems = items.map((item: OrderItemPayload) => ({
      product: item.productId,
      quantity: Number(item.quantity),
      priceAtPurchase: Number(item.price),
    }));

    const order = await Order.create({
      user: sessionUser.id,
      items: orderItems,
      total,
      shippingDetails: { address, city, zipCode },
    });

    const emailRecipient = process.env.ADMIN_EMAILS || process.env.EMAIL_FROM;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && emailRecipient) {
      try {
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
          subject: `New Order Placed - ${order._id}`,
          html: `
            <h1>New Order Received</h1>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Customer:</strong> ${sessionUser.email ?? 'Unknown'}</p>
            <p><strong>Total:</strong> $${total.toFixed(2)}</p>
            <h2>Shipping</h2>
            <p>${address}, ${city} ${zipCode}</p>
            <h2>Items</h2>
            <ul>
              ${items
                .map(
                  (item: OrderItemPayload) =>
                    `<li>${item.quantity}x ${sanitizeString(item.name)} - $${Number(item.price).toFixed(2)}</li>`
                )
                .join("")}
            </ul>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send order email, but order was created:", emailError);
      }
    }

    return NextResponse.json({ message: "Order placed successfully.", orderId: order._id }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ message: "An error occurred while placing the order." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const sessionUser = session.user as { id?: string; role?: string } | undefined;
    const userRole = sessionUser?.role;
    const userId = sessionUser?.id;

    const orders =
      userRole === "admin"
        ? await Order.find({})
            .populate("user", "name email")
            .populate("items.product")
            .sort({ createdAt: -1 })
        : await Order.find({ user: userId }).populate("items.product").sort({ createdAt: -1 });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
