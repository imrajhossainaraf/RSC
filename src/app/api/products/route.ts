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
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") || "0");
    const sort = searchParams.get("sort");
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "999999");
    const inStock = searchParams.get("inStock");

    const query: Record<string, unknown> = {};

    if (category) {
      if (isValidObjectId(category)) {
        query.category = category;
      } else {
        const cat = await Category.findOne({ 
          $or: [
            { slug: category },
            { name: { $regex: new RegExp(`^${escapeRegExp(category)}$`, "i") } }
          ]
        });
        if (cat) {
          query.category = cat._id;
        } else {
          // If category isn't found, return empty array immediately
          return NextResponse.json([]);
        }
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: new RegExp(escapeRegExp(search), "i") } },
        { description: { $regex: new RegExp(escapeRegExp(search), "i") } },
        { tags: { $in: [new RegExp(escapeRegExp(search), "i")] } }
      ];
    }

    if (featured === "true") {
      query.featured = true;
    }

    if (inStock === "true") {
      query.stock = { $gt: 0 };
    }

    if (minPrice > 0 || maxPrice < 999999) {
      query.price = { $gte: minPrice, $lte: maxPrice };
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "price_asc") {
      sortOption = { price: 1 };
    } else if (sort === "price_desc") {
      sortOption = { price: -1 };
    } else if (sort === "rating") {
      sortOption = { rating: -1 };
    } else if (sort === "newest") {
      sortOption = { createdAt: -1 };
    }

    let dbQuery = Product.find(query).populate("category", "name slug");
    if (limit > 0) {
      dbQuery = dbQuery.limit(limit);
    }

    const products = await dbQuery.sort(sortOption).lean();

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
