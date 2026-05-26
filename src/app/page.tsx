import Link from 'next/link';
import styles from './page.module.css';
import { CpuChipIcon, WrenchScrewdriverIcon, BoltIcon, WifiIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const categories = [
    { name: 'Microcontrollers', icon: CpuChipIcon, path: '/products?category=microcontrollers' },
    { name: 'Sensors & Modules', icon: WifiIcon, path: '/products?category=sensors' },
    { name: 'Motors & Actuators', icon: WrenchScrewdriverIcon, path: '/products?category=motors' },
    { name: 'Power & Batteries', icon: BoltIcon, path: '/products?category=power' },
  ];

  return (
    <div className={styles.homeContainer}>
      
      <section className={styles.hero}>
        <h1>Build the Future with <span>Premium</span> Components</h1>
        <p>Your one-stop shop for Arduinos, sensors, motors, and everything you need for your next great invention.</p>
        <div className={styles.heroActions}>
          <Link href="/products">
            <button className="btn-primary">Shop Now</button>
          </Link>
          <Link href="/about">
            <button className={styles.btnSecondary}>Learn More</button>
          </Link>
        </div>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>Featured Categories</h2>
        <div className={styles.categoriesGrid}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link href={cat.path} key={cat.name} className={styles.categoryCard}>
                <div className={styles.categoryIcon}>
                  <Icon width={32} height={32} />
                </div>
                <h3>{cat.name}</h3>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Placeholders for new arrivals / discounted products */}
      <section>
        <h2 className={styles.sectionTitle}>New Arrivals</h2>
        <p style={{ color: '#a0aec0' }}>Products will appear here once added to the database.</p>
      </section>

    </div>
  );
}
