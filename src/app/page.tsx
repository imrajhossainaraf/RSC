export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import '@/models/Category'; // registers the Category schema so populate() works
import styles from './page.module.css';
import { TruckIcon, SparklesIcon, ShieldCheckIcon, PhoneIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import WishlistButton from '@/components/WishlistButton';
import HowItWorks from '@/components/HowItWorks';

async function getFeaturedProducts() {
  await dbConnect();
  return await Product.find({ featured: true })
    .sort({ updatedAt: -1 })
    .limit(16)
    .populate('category', 'name')
    .lean();
}

export default async function Home() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products = (await getFeaturedProducts()) as any[];


  return (
    <div className={styles.homeContainer}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>Precision Series</span>
          <h1 className={styles.heroTitle}>
            Desire Components
            <br />
            As You See Fit
          </h1>
          <p className={styles.heroDescription}>
            From microcontrollers to power supplies, find everything you need to
            build the future. Trusted by high-performance hardware engineers
            globally.
          </p>
          <div className={styles.heroActions}>
            <Link href="/products" className="btn-primary">
              All Products
            </Link>
            <Link href="/services" className="btn-secondary">
              Services
            </Link>
          </div>
        </div>
        <div className={styles.heroImageWrapper}>
          <div className={styles.heroImagePanel}>
            <Image
              src="/images/hero.jpg"
              alt="Electronics Components"
              fill
              className={styles.heroImg}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className={styles.heroBadgeChip}>
            <span className={styles.chipIcon}>
              <CpuChipIcon width={14} height={14} />
            </span>
            <div className={styles.chipContent}>
              <span className={styles.chipText}>New: Fractal Series</span>
              <span className={styles.chipLine} />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {products.length > 0 && (
      <section>
        <div className="section-header">
          <div>
            <h2 className="section-title">Featured Products</h2>
          </div>
          <Link href="/products" className="view-all-link">
            View All &gt;
          </Link>
        </div>

        <div className={styles.productGrid}>
          {products.map((product) => (
            <div className={styles.productCard} key={product._id.toString()}>
              <Link
                href={`/products/${product._id.toString()}`}
                className={styles.cardImageContainer}
              >
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className={styles.productImage}
                  />
                ) : (
                  <div className={styles.imageFallback}>Component Image</div>
                )}
                {product.discount > 0 && (
                  <span className={styles.discountBadge}>
                    -{product.discount}%
                  </span>
                )}
              </Link>
              <div className={styles.cardInfo}>
                <p className={styles.productCategory}>
                  {product.category?.name || "Category"}
                </p>
                <h3 className={styles.productTitle}>
                  <Link href={`/products/${product._id.toString()}`}>
                    {product.name}
                  </Link>
                </h3>
                <div className={styles.productRating}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} className={i <= Math.round(product.rating || 0) ? styles.starFilled : styles.starEmpty}>★</span>
                  ))}
                  {product.reviewCount > 0 && (
                    <span className={styles.ratingCount}>({product.reviewCount})</span>
                  )}
                </div>
                <div className={styles.priceRow}>
                  <span className={styles.price}>
                    ৳{(product.price - product.price * (product.discount / 100)).toFixed(2)}
                  </span>
                  {product.discount > 0 && (
                    <span className={styles.originalPrice}>
                      ৳{product.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className={styles.cardFooter}>
                  <Link
                    href={`/products/${product._id.toString()}`}
                    className="btn-orange"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Order Now
                  </Link>
                  <WishlistButton
                    productId={product._id.toString()}
                    name={product.name}
                    price={product.price - product.price * (product.discount / 100)}
                    image={product.image ?? ''}
                    stock={product.stock ?? 0}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href="/products" className="btn-primary">
            All Products
          </Link>
        </div>
      </section>
      )}

      {/* How It Works */}
      <HowItWorks />

      {/* Features Banner */}
      <section className={styles.featuresBanner}>
        <div className={styles.featureItem}>
          <TruckIcon width={24} height={24} className={styles.featureIcon} />
          <div>
            <h4>Free Shipping</h4>
            <p>On all orders over $50</p>
          </div>
        </div>
        <div className={styles.featureItem}>
          <SparklesIcon width={24} height={24} className={styles.featureIcon} />
          <div>
            <h4>Easy Returns</h4>
            <p>30-day money-back guarantee</p>
          </div>
        </div>
        <div className={styles.featureItem}>
          <ShieldCheckIcon
            width={24}
            height={24}
            className={styles.featureIcon}
          />
          <div>
            <h4>Secure Payment</h4>
            <p>100% secure checkout</p>
          </div>
        </div>
        <div className={styles.featureItem}>
          <PhoneIcon width={24} height={24} className={styles.featureIcon} />
          <div>
            <h4>24/7 Support</h4>
            <p>Dedicated customer support</p>
          </div>
        </div>
      </section>
    </div>
  );
}
