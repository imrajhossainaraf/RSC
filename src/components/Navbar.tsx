"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import styles from "./Navbar.module.css";

const CATEGORIES = [
  { name: "Electronics", slug: "electronics-components" },
  { name: "Robotics", slug: "robotics-automation" },
  { name: "Drones", slug: "drones-accessories" },
  { name: "Power", slug: "power-batteries" },
];

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logo}>
          <Image
              src="/images/ChatGPT Image May 28, 2026, 09_02_11 PM.png"
              alt="Robotics Shop CTG logo"
              width={64}
              height={64}
              className={styles.logoIcon}
            />
          <div className={styles.logoText}>
            <span className={styles.logoMain}>Robotics Shop CTG</span>
          </div>
        </Link>
      </div>

      <form
        className={styles.searchContainer}
        onSubmit={(e) => {
          e.preventDefault();
          if (searchQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
          }
        }}
      >
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search products..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className={styles.searchBtn}>
            <MagnifyingGlassIcon width={20} height={20} />
          </button>
        </div>
      </form>

      <div className={styles.rightNav}>
        <div className={styles.dropdownContainer}>
          <button 
            className={styles.dropdownBtn}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            All Categories <ChevronDownIcon width={16} height={16} />
          </button>
          
          {dropdownOpen && (
            <div className={styles.dropdownMenu}>
              {CATEGORIES.map((cat) => (
                <Link 
                  key={cat.slug} 
                  href={`/products?category=${cat.slug}`}
                  className={styles.dropdownItem}
                  onClick={() => setDropdownOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
              <div className={styles.dropdownDivider}></div>
              <Link 
                href="/products"
                className={styles.dropdownItem}
                onClick={() => setDropdownOpen(false)}
              >
                View All Categories
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
