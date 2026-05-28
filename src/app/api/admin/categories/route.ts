import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Category from "@/models/Category";
import { escapeRegExp, sanitizeString } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { role?: string } | undefined;
    if (!session || sessionUser?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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

    // Check if category name already exists
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${escapeRegExp(name)}$`, "i") } });
    if (existingCategory) {
      return NextResponse.json({ message: "Category already exists." }, { status: 409 });
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const category = await Category.create({
      name,
      slug,
      description,
      icon,
      featured,
    });

    return NextResponse.json({ message: "Category created successfully.", category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}
