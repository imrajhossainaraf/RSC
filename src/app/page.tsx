import Link from 'next/link';
import styles from './page.module.css';
import {
  CpuChipIcon,
  WrenchScrewdriverIcon,
  BoltIcon,
  WifiIcon,
  RocketLaunchIcon,
  EyeIcon,
  CubeTransparentIcon,
  Cog6ToothIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';

export default function Home() {
  const categories = [
    { name: 'Compute & Logic', icon: CpuChipIcon, path: '/products?category=compute' },
    { name: 'Actuators', icon: WrenchScrewdriverIcon, path: '/products?category=actuators' },
    { name: 'Drones', icon: RocketLaunchIcon, path: '/products?category=drones' },
    { name: 'Power Systems', icon: BoltIcon, path: '/products?category=power' },
    { name: 'Sensors', icon: EyeIcon, path: '/products?category=sensors' },
    { name: 'Connectivity', icon: WifiIcon, path: '/products?category=connectivity' },
    { name: 'Robotics', icon: CubeTransparentIcon, path: '/products?category=robotics' },
    { name: 'Dev Boards', icon: Cog6ToothIcon, path: '/products?category=boards' },
  ];

  const featured = [
    {
      name: 'Arduino Uno Rev3 Original',
      category: 'Compute & Logic',
      price: '$24.50',
      icon: CpuChipIcon,
      path: '/products?category=compute',
    },
    {
      name: 'Brushless DC Motor 400KV',
      category: 'Actuators',
      price: '$112.00',
      icon: WrenchScrewdriverIcon,
      path: '/products?category=actuators',
    },
    {
      name: 'Carbon Fiber Propellers (Set)',
      category: 'Drones',
      price: '$45.99',
      icon: RocketLaunchIcon,
      path: '/products?category=drones',
    },
    {
      name: 'LiPo Battery Pack 5000mAh',
      category: 'Power Systems',
      price: '$89.00',
      icon: BoltIcon,
      path: '/products?category=power',
    },
  ];

  return (
    <div className={styles.homeContainer}>
      <section className={styles.hero}>
        <div>
          <span className={styles.heroLabel}>Industrial grade hardware</span>
          <h1>Precision parts for the next generation of robots.</h1>
          <p>
            Fast delivery on Arduinos, sensors, batteries, and pro-grade automation components for R&amp;D, labs, and factories.
          </p>
        </div>
        <div className={styles.heroActions}>
          <Link href="/products">
            <button className="btn-primary">Explore Catalog</button>
          </Link>
          <Link href="/contact">
            <button className={styles.btnSecondary}>Technical Support</button>
          </Link>
        </div>
      </section>

      <section>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Featured Components</h2>
            <p className={styles.sectionDescription}>Shop top industrial parts with category icons and fast access buttons.</p>
          </div>
          <Link href="/products" className={styles.viewAll}>
            View all products
          </Link>
        </div>

        <div className={styles.featureGrid}>
          {featured.map((item) => {
            const Icon = item.icon;
            return (
              <div className={styles.featureCard} key={item.name}>
                <div className={styles.featureImage}>
                  <Icon width={30} height={30} />
                </div>
                <div>
                  <p className={styles.featureMeta}>{item.category}</p>
                  <h3>{item.name}</h3>
                </div>
                <div className={styles.featureCardFooter}>
                  <strong>{item.price}</strong>
                  <Link href={item.path} className={styles.cardButton}>
                    <ShoppingCartIcon width={16} height={16} />
                    Order Now
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>Shop by Category</h2>
        <div className={styles.categoriesGrid}>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link href={category.path} key={category.name} className={styles.categoryCard}>
                <div className={styles.categoryIcon}>
                  <Icon width={28} height={28} />
                </div>
                <h3>{category.name}</h3>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
