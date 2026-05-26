/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
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
