import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import ClientAddToCart from './ClientAddToCart';
import WishlistButton from '@/components/WishlistButton';
import RatingSection from './RatingSection';
import styles from './page.module.css';
import {
  ShoppingCartIcon
} from '@heroicons/react/24/outline';

import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

const BASE_URL = "https://roboticsshopctg.com";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  await dbConnect();
  const { id } = await params;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = await Product.findById(id).populate("category", "name").lean() as any;
    if (!product) return {};
    const price = (product.price - product.price * (product.discount / 100)).toFixed(2);
    const title = product.name;
    const description = `${product.description.slice(0, 155)}…`;
    return {
      title,
      description,
      alternates: { canonical: `${BASE_URL}/products/${id}` },
      openGraph: {
        title,
        description,
        url: `${BASE_URL}/products/${id}`,
        type: "website",
        images: product.image ? [{ url: product.image, alt: product.name }] : [],
      },
      twitter: { card: "summary_large_image", title, description, images: product.image ? [product.image] : [] },
      other: { price },
    };
  } catch {
    return {};
  }
}

async function getRelatedProducts(categoryId: string, currentProductId: string) {
  try {
    return await Product.find({
      category: categoryId,
      _id: { $ne: currentProductId }
    }).limit(4).lean();
  } catch {
    return [];
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  
  const { id } = await params;
  
  let product = null;
  try {
    product = await Product.findById(id).populate('category', 'name slug').lean();
  } catch {
    return notFound();
  }

  if (!product) {
    return notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoryId = (product.category as any)?._id?.toString() ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const related = categoryId ? (await getRelatedProducts(categoryId, product._id.toString())) as any[] : [];
  const discountedPrice = product.price - (product.price * (product.discount / 100));

  // Transform specs map to object/entries safely
  const specMap = product.specs instanceof Map ? Object.fromEntries(product.specs) : (product.specs || {});
  const specsEntries = Object.entries(specMap);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product._id.toString(),
    brand: { "@type": "Brand", name: "Robotics Shop CTG" },
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/products/${product._id}`,
      priceCurrency: "BDT",
      price: discountedPrice.toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Robotics Shop CTG" },
    },
    ...(product.reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating.toFixed(1),
        reviewCount: product.reviewCount,
      },
    }),
  };

  return (
    <div className={styles.detailContainer}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/products">Products</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category?.slug || ''}`}>{product.category?.name || 'Components'}</Link>
        <span>/</span>
        <span className={styles.activeBreadcrumb}>{product.name}</span>
      </div>

      <div className={`${styles.mainCard} glass-card`}>
        <div className={styles.imageSection}>
          {product.image ? (
            <div className={styles.imageWrapper}>
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
          ) : (
            <div className={styles.placeholder}>No Image Available</div>
          )}
        </div>
        
        <div className={styles.infoSection}>
          <span className="badge badge-orange">{product.category?.name || 'Robotics Component'}</span>
          <h1 className={styles.title}>{product.name}</h1>
          
          {product.reviewCount > 0 && (
            <div className={styles.ratingRow}>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} style={{ color: i <= Math.round(product.rating) ? '#fbbf24' : '#e2e8f0' }}>★</span>
                ))}
              </div>
              <span className={styles.ratingValue}>{product.rating.toFixed(1)}</span>
              <span className={styles.reviewCount}>({product.reviewCount} customer reviews)</span>
            </div>
          )}

          <div className={styles.priceArea}>
            <span className={styles.price}>৳{discountedPrice.toFixed(2)}</span>
            {product.discount > 0 && (
              <>
                <span className={styles.originalPrice}>৳{product.price.toFixed(2)}</span>
                <span className={styles.discountBadge}>Save {product.discount}%</span>
              </>
            )}
          </div>
          
          <div className={styles.stock}>
            {product.stock > 0 ? (
              <span className={styles.inStock}>✓ In Stock ({product.stock} units available)</span>
            ) : (
              <span className={styles.outOfStock}>✗ Out of Stock</span>
            )}
          </div>

          <div className={styles.divider}></div>
          
          <div className={styles.description}>
            <h3>Product Overview</h3>
            <p>{product.description}</p>
          </div>

          <div className={styles.divider}></div>

          <div className={styles.actionsRow}>
            <ClientAddToCart product={{
              productId: product._id.toString(),
              name: product.name,
              price: discountedPrice,
              image: product.image,
              stock: product.stock
            }} />
            <WishlistButton
              productId={product._id.toString()}
              name={product.name}
              price={discountedPrice}
              image={product.image}
              stock={product.stock}
            />
          </div>
        </div>
      </div>

      {/* Specifications */}
      {specsEntries.length > 0 && (
        <section className={`${styles.specsSection} glass-card`}>
          <h2>Technical Specifications</h2>
          <table className={styles.specsTable}>
            <tbody>
              {specsEntries.map(([key, val]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{String(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Ratings & Reviews */}
      <RatingSection productId={product._id.toString()} />

      {/* Related Products */}
      {related.length > 0 && (
        <section className={styles.relatedSection}>
          <div className="section-header">
            <div>
              <h2 className="section-title">You May Also Like</h2>
              <p className="section-sub">Similar components and matching robotics equipment.</p>
            </div>
          </div>
          <div className={styles.relatedGrid}>
            {related.map((item) => (
              <div className={styles.relatedCard} key={item._id.toString()}>
                <Link href={`/products/${item._id.toString()}`} className={styles.relatedImageLink}>
                  <div className={styles.relatedImageContainer}>
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 20vw"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className={styles.relatedFallback}>Image</div>
                    )}
                  </div>
                </Link>
                <div className={styles.relatedInfo}>
                  <h4>
                    <Link href={`/products/${item._id.toString()}`}>{item.name}</Link>
                  </h4>
                  <div className={styles.relatedFooter}>
                    <span className={styles.relatedPrice}>
                      ৳{(item.price - (item.price * (item.discount / 100))).toFixed(2)}
                    </span>
                    <Link href={`/products/${item._id.toString()}`} className={styles.relatedBtn}>
                      <ShoppingCartIcon width={14} height={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
