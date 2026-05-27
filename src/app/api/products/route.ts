import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { escapeRegExp, isValidObjectId, sanitizeString } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const category = sanitizeString(searchParams.get("category"));
    const search = sanitizeString(searchParams.get("search"));

    const query: Record<string, unknown> = {};

    if (category) {
      if (isValidObjectId(category)) {
        query.category = category;
      } else {
        const cat = await Category.findOne({ name: { $regex: new RegExp(`^${escapeRegExp(category)}$`, "i") } });
        if (cat) {
          query.category = cat._id;
        }
      }
    }

    if (search) {
      query.name = { $regex: new RegExp(escapeRegExp(search), "i") };
    }

    const products = await Product.find(query).populate("category", "name").sort({ createdAt: -1 }).lean();

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
