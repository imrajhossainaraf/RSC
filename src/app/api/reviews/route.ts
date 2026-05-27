import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Product from '@/models/Product';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product');

    if (!productId) {
      return NextResponse.json({ message: 'Product ID required' }, { status: 400 });
    }

    const reviews = await Review.find({ product: productId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { productId, rating, comment } = await request.json();

    if (!productId || !rating || !comment) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userSession = session.user as any;
    const userId = userSession.id;
    const userName = session.user.name || 'Anonymous User';

    const newReview = await Review.create({
      product: productId,
      user: userId,
      userName,
      rating: Number(rating),
      comment,
    });

    // Update Product stats
    const productReviews = await Review.find({ product: productId });
    const totalRating = productReviews.reduce((acc, rev) => acc + rev.rating, 0);
    const averageRating = totalRating / productReviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: parseFloat(averageRating.toFixed(1)),
      reviewCount: productReviews.length,
    });

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    console.error('Error posting review:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
