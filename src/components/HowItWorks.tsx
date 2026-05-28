'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './HowItWorks.module.css';

const steps = [
  {
    icon: '🔭',
    title: 'Browse & Discover',
    description:
      'Explore over 10,000 precision components with smart filtering by category, spec range, or project compatibility. New arrivals land every week.',
    side: 'left',
  },
  {
    icon: '📐',
    title: 'Review Specs & Datasheets',
    description:
      'Every listing ships with full datasheets, tolerance ratings, and pinout diagrams — so you order with complete technical confidence every time.',
    side: 'right',
    highlight: true,
  },
  {
    icon: '🛒',
    title: 'Secure Checkout',
    description:
      'Fast, encrypted checkout with multiple payment options. Save components to your wishlist and revisit past builds with your full order history.',
    side: 'left',
  },
  {
    icon: '📦',
    title: 'Tracked Delivery',
    description:
      'Worldwide shipping with real-time parcel tracking. All components arrive in anti-static, impact-resistant packaging — safely, every time.',
    side: 'right',
  },
];

export default function HowItWorks() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [chipY, setChipY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const trackHeight = rect.height - 64; // 64px = chip diameter
      const scrolled = vh - rect.top;
      const scrollable = rect.height + vh;
      const p = Math.min(1, Math.max(0, scrolled / scrollable));
      setChipY(p * trackHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.badge}>Simple Process</span>
        <h2 className={styles.title}>
          How It <span className={styles.accent}>Works</span>
        </h2>
        <p className={styles.subtitle}>
          From discovery to doorstep — your seamless component ordering experience
        </p>
      </div>

      <div ref={timelineRef} className={styles.timeline}>
        {/* Vertical dashed center track */}
        <div className={styles.track} />

        {/* Scroll-driven chip */}
        <div
          className={styles.chip}
          style={{ transform: `translateX(-50%) translateY(${chipY}px)` }}
          aria-hidden="true"
        >
          ⚡
        </div>

        {steps.map((step, i) => (
          <div key={i} className={styles.stepRow}>
            {/* Left slot */}
            <div className={styles.slot}>
              {step.side === 'left' && (
                <div className={`${styles.card} ${styles.cardLeft}`}>
                  <span className={styles.cardIcon}>{step.icon}</span>
                  <h3 className={styles.cardTitle}>{step.title}</h3>
                  <p className={styles.cardDesc}>{step.description}</p>
                </div>
              )}
            </div>

            {/* Center connector dot */}
            <div className={styles.center}>
              <div
                className={`${styles.hLine} ${styles.hLineLeft} ${step.side === 'left' ? styles.hLineActive : ''}`}
              />
              <div className={styles.dot} />
              <div
                className={`${styles.hLine} ${styles.hLineRight} ${step.side === 'right' ? styles.hLineActive : ''}`}
              />
            </div>

            {/* Right slot */}
            <div className={styles.slot}>
              {step.side === 'right' && (
                <div
                  className={`${styles.card} ${styles.cardRight} ${step.highlight ? styles.cardHighlight : ''}`}
                >
                  <span className={styles.cardIcon}>{step.icon}</span>
                  <h3 className={styles.cardTitle}>{step.title}</h3>
                  <p className={styles.cardDesc}>{step.description}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
