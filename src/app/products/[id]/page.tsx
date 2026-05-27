import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import ClientAddToCart from './ClientAddToCart';
import styles from './page.module.css';
import { 
  ShoppingCartIcon 
} from '@heroicons/react/24/outline';

export const revalidate = 60; // revalidate every 60 seconds

async function getRelatedProducts(categoryId: string, currentProductId: string) {
  try {
    return await Product.find({ 
      category: categoryId, 
      _id: { $ne: currentProductId } 
    }).limit(4).lean();
  } catch (error) {
    return [];
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  
  const { id } = await params;
  
  let product = null;
  try {
    product = await Product.findById(id).populate('category', 'name slug').lean();
  } catch (e) {
    return notFound();
  }

  if (!product) {
    return notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const related = (await getRelatedProducts(product.category._id.toString(), product._id.toString())) as any[];
  const discountedPrice = product.price - (product.price * (product.discount / 100));

  // Transform specs map to object/entries safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const specMap = product.specs instanceof Map ? Object.fromEntries(product.specs) : (product.specs || {});
  const specsEntries = Object.entries(specMap);

  return (
    <div className={styles.detailContainer}>
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
              <span className={styles.stars}>★ {product.rating.toFixed(1)}</span>
              <span className={styles.reviewCount}>({product.reviewCount} customer reviews)</span>
            </div>
          )}

          <div className={styles.priceArea}>
            <span className={styles.price}>${discountedPrice.toFixed(2)}</span>
            {product.discount > 0 && (
              <>
                <span className={styles.originalPrice}>${product.price.toFixed(2)}</span>
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

          <ClientAddToCart product={{
            productId: product._id.toString(),
            name: product.name,
            price: discountedPrice,
            image: product.image,
            stock: product.stock
          }} />
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
                      ${(item.price - (item.price * (item.discount / 100))).toFixed(2)}
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
