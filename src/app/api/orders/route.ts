import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
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
