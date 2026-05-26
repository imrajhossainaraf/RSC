/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const data = await req.json();

    // Check if category is a valid ObjectId, otherwise treat it as a name and find/create it
    let categoryId = data.category;
    if (categoryId && !categoryId.match(/^[0-9a-fA-F]{24}$/)) {
      let cat = await Category.findOne({ name: { $regex: new RegExp(`^${categoryId}$`, 'i') } });
      if (!cat) {
        cat = await Category.create({ name: categoryId });
      }
      categoryId = cat._id;
    }

    const product = await Product.create({
      ...data,
      category: categoryId
    });

    return NextResponse.json({ message: "Product created successfully", product }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
