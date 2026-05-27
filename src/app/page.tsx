import Link from 'next/link';
import Image from 'next/image';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import styles from './page.module.css';
import { 
  ShoppingCartIcon, 
  WrenchScrewdriverIcon, 
  CommandLineIcon, 
  CpuChipIcon, 
  CubeTransparentIcon,
  RocketLaunchIcon,
  BoltIcon,
  Cog6ToothIcon,
  LinkIcon,
  WifiIcon,
  SunIcon,
  CircleStackIcon,
  LightBulbIcon,
  ComputerDesktopIcon,
  SpeakerWaveIcon,
  BuildingOffice2Icon,
  GlobeAltIcon,
  PuzzlePieceIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
  SignalIcon,
  BeakerIcon,
  AdjustmentsHorizontalIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

const iconMap: Record<string, React.ComponentType<{ className?: string; width?: number; height?: number }>> = {
  CpuChipIcon,
  CommandLineIcon,
  CubeTransparentIcon,
  TruckIcon,
  SignalIcon,
  RocketLaunchIcon,
  BoltIcon,
  WrenchScrewdriverIcon,
  BeakerIcon,
  LinkIcon,
  AdjustmentsHorizontalIcon,
  Cog6ToothIcon,
  WifiIcon,
  SunIcon,
  CircleStackIcon,
  LightBulbIcon,
  ComputerDesktopIcon,
  SpeakerWaveIcon,
  BuildingOffice2Icon,
  GlobeAltIcon,
  PuzzlePieceIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
};

async function getFeaturedProducts() {
  await dbConnect();
  return await Product.find({ featured: true }).limit(8).populate('category', 'name').lean();
}

async function getFeaturedCategories() {
  await dbConnect();
  return await Category.find({ featured: true }).limit(6).lean();
}

export default async function Home() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products = (await getFeaturedProducts()) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories = (await getFeaturedCategories()) as any[];

  return (
    <div className={styles.homeContainer}>
      {/* Hero Section */}
      <section className={`${styles.hero} glass-card`}>
        <div className={styles.heroContent}>
          <span className="badge badge-orange">Industrial Grade Robotics Hardware</span>
          <h1 className={styles.heroTitle}>
            Precision Parts for the <span className="gradient-text-orange">Next Generation</span> of Robots.
          </h1>
          <p className={styles.heroDescription}>
            Supplying Arduino development boards, high-torque brushless DC motors, carbon fiber propellers, and professional engineering consultancies for R&D labs and factories.
          </p>
          <div className={styles.heroActions}>
            <Link href="/products" className="btn-orange">
              Explore Catalog →
            </Link>
            <Link href="/services" className="btn-secondary">
              Technical Services
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <div className={styles.trustBar}>
        <div className={styles.trustItem}>
          <span className={styles.trustCheck}>✓</span>
          <span>ISO 9001 Certified Quality</span>
        </div>
        <div className={styles.trustItem}>
          <span className={styles.trustCheck}>✓</span>
          <span>Fast Chittagong Delivery</span>
        </div>
        <div className={styles.trustItem}>
          <span className={styles.trustCheck}>✓</span>
          <span>24/7 Engineering Support</span>
        </div>
        <div className={styles.trustItem}>
          <span className={styles.trustCheck}>✓</span>
          <span>100% Secure Checkout</span>
        </div>
      </div>

      {/* Featured Products */}
      <section>
        <div className="section-header">
          <div>
            <h2 className="section-title">Featured Components</h2>
            <p className="section-sub">Precision engineered, rigorously tested premium parts.</p>
          </div>
          <Link href="/products" className="view-all-link">
            View all products
          </Link>
        </div>

        <div className={styles.productGrid}>
          {products.map((product) => (
            <div className={styles.productCard} key={product._id.toString()}>
              <Link href={`/products/${product._id.toString()}`} className={styles.cardImageContainer}>
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
                  <span className={styles.discountBadge}>-{product.discount}%</span>
                )}
              </Link>
              <div className={styles.cardInfo}>
                <p className={styles.productCategory}>{product.category?.name || "Components"}</p>
                <h3 className={styles.productTitle}>
                  <Link href={`/products/${product._id.toString()}`}>{product.name}</Link>
                </h3>
                <div className={styles.productFooter}>
                  <div>
                    <span className={styles.price}>
                      ${(product.price - (product.price * (product.discount / 100))).toFixed(2)}
                    </span>
                    {product.discount > 0 && (
                      <span className={styles.originalPrice}>${product.price.toFixed(2)}</span>
                    )}
                  </div>
                  <Link href={`/products/${product._id.toString()}`} className={styles.orderBtn}>
                    <ShoppingCartIcon width={16} height={16} />
                    Order
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Banner / Service Section CTA */}
      <section className={styles.servicesPromo}>
        <div className={styles.promoContent}>
          <span className="badge badge-primary">Robotics Shop CTG Services</span>
          <h2>Need Custom Assembly or PCB Design?</h2>
          <p>We provide full-service manufacturing, component sourcing, custom wiring, and mechanical consultancy for robotics projects.</p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link href="/services" className="btn-primary">
              <WrenchScrewdriverIcon width={18} height={18} /> Request Engineering Support
            </Link>
          </div>
        </div>
      </section>

      {/* Shop By Category */}
      <section>
        <div className="section-header">
          <div>
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-sub">Explore our extensive range of electronic parts.</p>
          </div>
          <Link href="/products" className="view-all-link">
            All Categories
          </Link>
        </div>

        <div className={styles.categoriesGrid}>
          {categories.map((category) => {
            const Icon = iconMap[category.icon] || CpuChipIcon;
            return (
              <Link
                href={`/products?category=${category.slug}`}
                key={category._id.toString()}
                className={`${styles.categoryCard} glass-card`}
              >
                <div className={styles.categoryIconContainer}>
                  <Icon className={styles.categoryIcon} width={28} height={28} />
                </div>
                <h3>{category.name}</h3>
                <span className={styles.productCount}>{category.productCount || 0} Products</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Trust & Details Info Banner */}
      <section className={`${styles.engineeringFeature} glass-card`}>
        <div className={styles.featureLeft}>
          <h2>Built for Industrial Reliability.</h2>
          <p>Every component undergoes strict quality checks before leaving our warehouse. We supply full testing sheets and design integration support for schools, R&D labs, and factories.</p>
          <div className={styles.featurePoints}>
            <div className={styles.point}>
              <span className={styles.pointIcon}>✔</span>
              <div>
                <strong>ISO 9001 Certified</strong>
                <p>Standardized quality control for all components.</p>
              </div>
            </div>
            <div className={styles.point}>
              <span className={styles.pointIcon}>✔</span>
              <div>
                <strong>Engineering Support</strong>
                <p>Direct support from our hardware engineering team.</p>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.featureRight}>
          <div className={styles.specTerminal}>
            <div className={styles.terminalHeader}>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.terminalTitle}>DATASHEET PREVIEW</span>
            </div>
            <div className={styles.terminalContent}>
              <div className={styles.termRow}><span>Voltage Tolerance:</span> <span>+/- 0.05V</span></div>
              <div className={styles.termRow}><span>Thermal Range:</span> <span>-20C to +85C</span></div>
              <div className={styles.termRow}><span>MTBF:</span> <span>100,000 Hours</span></div>
              <div className={styles.termRow}><span>Signal Latency:</span> <span>&lt; 1.2ms</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className={styles.newsletterSection}>
        <h2>Subscribe to Our Newsletter</h2>
        <p>Get notified about new components arrivals, engineering guides, and exclusive discount codes.</p>
        <form className={styles.newsletterForm} action="/api/newsletter" method="POST">
          <input type="email" name="email" placeholder="Enter your email address" required />
          <button type="submit" className="btn-orange">Subscribe</button>
        </form>
      </section>
    </div>
  );
}
