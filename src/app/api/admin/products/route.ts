import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { escapeRegExp, isValidObjectId, sanitizeString } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { role?: string } | undefined;
    if (!session || sessionUser?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = (await req.json()) as Record<string, unknown>;
    const name = sanitizeString(payload.name);
    const description = sanitizeString(payload.description);
    const image = sanitizeString(payload.image);
    const categoryInput = sanitizeString(payload.category);
    const price = Number(payload.price);
    const discount = Number(payload.discount) || 0;
    const stock = Number(payload.stock) || 0;
    const featured = Boolean(payload.featured);

    if (!name || !description || !image || !categoryInput || price <= 0) {
      return NextResponse.json({ message: "Invalid product data." }, { status: 400 });
    }

    await dbConnect();

    let categoryId = categoryInput;
    if (!isValidObjectId(categoryId)) {
      let cat = await Category.findOne({ name: { $regex: new RegExp(`^${escapeRegExp(categoryId)}$`, "i") } });
      if (!cat) {
        cat = await Category.create({ name: categoryId });
      }
      categoryId = cat._id;
    }

    const product = await Product.create({
      name,
      description,
      price,
      discount,
      stock,
      image,
      category: categoryId,
      featured,
    });

    return NextResponse.json({ message: "Product created successfully.", product }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}
