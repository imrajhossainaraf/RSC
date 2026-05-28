import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { escapeRegExp, isValidObjectId, sanitizeString } from "@/lib/validation";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { role?: string } | undefined;
    if (!session || sessionUser?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid product ID." }, { status: 400 });
    }

    const payload = (await req.json()) as Record<string, unknown>;
    const name = sanitizeString(payload.name);
    const description = sanitizeString(payload.description);
    const image = sanitizeString(payload.image);
    const categoryInput = sanitizeString(payload.category);
    const price = Number(payload.price);
    const discount = Number(payload.discount) ?? 0;
    const stock = Number(payload.stock) ?? 0;
    const featured = Boolean(payload.featured);

    if (!name || !description || !image || !categoryInput || price <= 0) {
      return NextResponse.json({ message: "Invalid product data." }, { status: 400 });
    }

    await dbConnect();

    // Check if category exists or resolve it
    let categoryId = categoryInput;
    if (!isValidObjectId(categoryId)) {
      let cat = await Category.findOne({ name: { $regex: new RegExp(`^${escapeRegExp(categoryId)}$`, "i") } });
      if (!cat) {
        // Slug generation
        const slug = categoryId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
        cat = await Category.create({ name: categoryId, slug });
      }
      categoryId = cat._id;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        price,
        discount,
        stock,
        image,
        category: categoryId,
        featured,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Product updated successfully.", product: updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { role?: string } | undefined;
    if (!session || sessionUser?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid product ID." }, { status: 400 });
    }

    await dbConnect();

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}
