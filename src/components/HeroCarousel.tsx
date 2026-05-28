"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CubeTransparentIcon, CpuChipIcon } from "@heroicons/react/24/outline";
import styles from "./HeroCarousel.module.css";

type Slide = { image: string; name: string };

export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 3500);
    return () => clearInterval(id);
  }, [slides.length]);

  if (!slides.length) {
    return (
      <div className={styles.fallback}>
        <CubeTransparentIcon width={56} height={56} className={styles.fallbackIcon} />
        <p>Featured components coming soon</p>
      </div>
    );
  }

  return (
    <div className={styles.carousel}>
      <div className={styles.imageWrapper}>
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`${styles.slide} ${i === current ? styles.active : ""}`}
          >
            <Image
              src={slide.image}
              alt={slide.name}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className={styles.image}
              priority={i === 0}
            />
          </div>
        ))}
        <div className={styles.label}>
          <span className={styles.labelIcon}>
            <CpuChipIcon width={12} height={12} />
          </span>
          <span className={styles.labelText}>{slides[current]?.name}</span>
        </div>
      </div>

      {slides.length > 1 && (
        <div className={styles.dots}>
          {slides.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.activeDot : ""}`}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
