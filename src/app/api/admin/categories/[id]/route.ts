import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";
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
      return NextResponse.json({ message: "Invalid category ID." }, { status: 400 });
    }

    const payload = (await req.json()) as Record<string, unknown>;
    const name = sanitizeString(payload.name);
    const description = sanitizeString(payload.description || "");
    const icon = sanitizeString(payload.icon || "");
    const featured = Boolean(payload.featured);

    if (!name) {
      return NextResponse.json({ message: "Category name is required." }, { status: 400 });
    }

    await dbConnect();

    // Check if name is already taken by another category .
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${escapeRegExp(name)}$`, "i") },
      _id: { $ne: id },
    });
    if (existingCategory) {
      return NextResponse.json({ message: "Category name is already in use by another category." }, { status: 409 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name,
        slug,
        description,
        icon,
        featured,
      },
      { new: true }
    );

    if (!updatedCategory) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Category updated successfully.", category: updatedCategory });
  } catch (error) {
    console.error("Error updating category:", error);
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
      return NextResponse.json({ message: "Invalid category ID." }, { status: 400 });
    }

    await dbConnect();

    // Check if any products are using this category
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return NextResponse.json(
        { message: `Cannot delete category. It is currently assigned to ${productCount} product(s).` },
        { status: 400 }
      );
    }

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Category deleted successfully." });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}
