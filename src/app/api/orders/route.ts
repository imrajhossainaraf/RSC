import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import nodemailer from "nodemailer";
import { isValidObjectId, sanitizeString } from "@/lib/validation";

type OrderItemPayload = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type BuyerDetailsPayload = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
};

type ProductDocument = {
  stock: number;
  name: string;
  image?: string;
  save: () => Promise<unknown>;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string; role?: string; email?: string } | undefined;

    if (!session || !sessionUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isValidObjectId(sessionUser.id) && sessionUser.email) {
      await dbConnect();
      const existingUser = await User.findOne({ email: sessionUser.email });
      if (existingUser) {
        sessionUser.id = existingUser._id.toString();
      }
    }

    if (!isValidObjectId(sessionUser.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = (await req.json()) as Record<string, unknown>;
    const items = Array.isArray(payload.items) ? payload.items : [];
    const buyerDetails = (payload.buyerDetails as Record<string, unknown> | undefined) ?? {};
    const total = Number(payload.total) || 0;

    if (!items.length) {
      return NextResponse.json({ message: "Cart is empty." }, { status: 400 });
    }

    const buyerName = sanitizeString(buyerDetails.name);
    const buyerEmail = sanitizeString(buyerDetails.email);
    const buyerPhone = sanitizeString(buyerDetails.phone);
    const address = sanitizeString(buyerDetails.address);
    const city = sanitizeString(buyerDetails.city);
    const zipCode = sanitizeString(buyerDetails.zipCode);

    if (!buyerName || !buyerEmail || !buyerPhone || !address || !city || !zipCode) {
      return NextResponse.json({ message: "All buyer and shipping details are required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      return NextResponse.json({ message: "Invalid email address." }, { status: 400 });
    }

    if (!/^[0-9+()\s-]{6,30}$/.test(buyerPhone)) {
      return NextResponse.json({ message: "Invalid phone number." }, { status: 400 });
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

    const orderItems = items.map((item: OrderItemPayload) => {
      const itemRecord = item as Record<string, unknown>;
      return {
        product: item.productId,
        productName: item.name,
        productImage: String(itemRecord.image || ''),
        quantity: Number(item.quantity),
        priceAtPurchase: Number(item.price),
      };
    });

    const order = await Order.create({
      user: sessionUser.id,
      buyerDetails: {
        name: buyerName,
        email: buyerEmail,
        phone: buyerPhone,
        address,
        city,
        zipCode,
      },
      items: orderItems,
      total,
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
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <h2>Buyer Information</h2>
            <p><strong>Name:</strong> ${sanitizeString(buyerName)}</p>
            <p><strong>Email:</strong> ${sanitizeString(buyerEmail)}</p>
            <p><strong>Phone:</strong> ${sanitizeString(buyerPhone)}</p>
            
            <h2>Shipping Address</h2>
            <p>${sanitizeString(address)}</p>
            <p>${sanitizeString(city)}, ${sanitizeString(zipCode)}</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <h2>Order Details</h2>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Total Amount:</strong> <strong style="color: #27AE60;">$${total.toFixed(2)}</strong></p>
            
            <h2>Items Ordered</h2>
            <table style="border-collapse: collapse; width: 100%; margin: 15px 0;">
              <tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;">
                <th style="text-align: left; padding: 12px; border: 1px solid #ddd;">Product Name</th>
                <th style="text-align: center; padding: 12px; border: 1px solid #ddd;">Quantity</th>
                <th style="text-align: right; padding: 12px; border: 1px solid #ddd;">Price per Unit</th>
                <th style="text-align: right; padding: 12px; border: 1px solid #ddd;">Subtotal</th>
              </tr>
              ${items
                .map(
                  (item: OrderItemPayload) =>
                    `<tr style="border-bottom: 1px solid #ddd;">
                      <td style="padding: 12px; border: 1px solid #ddd;">${sanitizeString(item.name)}</td>
                      <td style="text-align: center; padding: 12px; border: 1px solid #ddd;">${Number(item.quantity)}</td>
                      <td style="text-align: right; padding: 12px; border: 1px solid #ddd;">$${Number(item.price).toFixed(2)}</td>
                      <td style="text-align: right; padding: 12px; border: 1px solid #ddd;"><strong>$${(Number(item.quantity) * Number(item.price)).toFixed(2)}</strong></td>
                    </tr>`
                )
                .join("")}
              <tr style="background-color: #f9f9f9;">
                <td colspan="3" style="text-align: right; padding: 12px; border: 1px solid #ddd; font-weight: bold;">TOTAL:</td>
                <td style="text-align: right; padding: 12px; border: 1px solid #ddd; font-weight: bold; color: #27AE60; font-size: 18px;">$${total.toFixed(2)}</td>
              </tr>
            </table>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply directly to this address.</p>
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

    let orders;
    if (userRole === "admin") {
      orders = await Order.find({})
        .populate("user", "name email")
        .populate("items.product")
        .sort({ createdAt: -1 });
    } else {
      if (!isValidObjectId(userId)) {
        // If the session contains a non-ObjectId id (e.g. from an OAuth provider),
        // attempt to avoid a CastError by returning an empty list instead of throwing.
        return NextResponse.json([]);
      }

      orders = await Order.find({ user: userId }).populate("items.product").sort({ createdAt: -1 });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
