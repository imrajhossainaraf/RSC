/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { items, shippingDetails, total } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ message: "Cart is empty" }, { status: 400 });
    }

    await dbConnect();

    // 1. Verify stock for all items first
    const productsToUpdate = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json({ message: `Product "${item.name}" not found.` }, { status: 404 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json({ 
          message: `Insufficient stock for "${product.name}". Only ${product.stock} left in stock.` 
        }, { status: 400 });
      }
      productsToUpdate.push({ product, quantity: item.quantity });
    }

    // 2. Deduct stock for all items
    for (const update of productsToUpdate) {
      update.product.stock -= update.quantity;
      await update.product.save();
    }

    // Map cart items to the schema format
    const orderItems = items.map((item: any) => ({
      product: item.productId,
      quantity: item.quantity,
      priceAtPurchase: item.price
    }));

    const order = await Order.create({
      user: (session.user as any).id,
      items: orderItems,
      total,
      shippingDetails
    });

    // Send Email to Admin via Nodemailer
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: 'gmail', // Can be configured further if needed
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const adminEmails = process.env.ADMIN_EMAILS || process.env.EMAIL_FROM;

        if (adminEmails) {
          await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: adminEmails,
            subject: `New Order Placed - ${order._id}`,
            html: `
              <h1>New Order Received!</h1>
              <p><strong>Order ID:</strong> ${order._id}</p>
              <p><strong>Customer Email:</strong> ${session.user.email}</p>
              <p><strong>Total:</strong> $${total.toFixed(2)}</p>
              <h2>Shipping Details:</h2>
              <p>${shippingDetails.address}, ${shippingDetails.city} - ${shippingDetails.zipCode}</p>
              <h2>Items:</h2>
              <ul>
                ${items.map((item: any) => `<li>${item.quantity}x ${item.name} - $${item.price.toFixed(2)}</li>`).join('')}
              </ul>
              <p>Please review and process the order from the Admin Panel.</p>
            `
          });
        }
      }
    } catch (emailError) {
      console.error("Failed to send order email, but order was created:", emailError);
      // We don't fail the whole request if email fails, just log it.
    }

    return NextResponse.json({ message: "Order placed successfully", orderId: order._id }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ message: "An error occurred while placing the order." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    let orders;
    if (userRole === "admin") {
      orders = await Order.find({})
        .populate("user", "name email")
        .populate("items.product")
        .sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ user: userId })
        .populate("items.product")
        .sort({ createdAt: -1 });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
