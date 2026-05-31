"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  UserCircleIcon,
  ArrowRightEndOnRectangleIcon,
  XMarkIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import styles from "./Navbar.module.css";

const CATEGORIES = [
  { name: "Electronics", slug: "electronics-components" },
  { name: "Robotics", slug: "robotics-automation" },
  { name: "Drones", slug: "drones-accessories" },
  { name: "Power", slug: "power-batteries" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile search when route changes
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setMobileSearchOpen(false);
      setSearchQuery("");
    });
    return () => { cancelled = true; };
  }, [pathname]);

  // Focus the input when mobile search opens
  useEffect(() => {
    if (mobileSearchOpen) mobileSearchRef.current?.focus();
  }, [mobileSearchOpen]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
      setSearchQuery("");
    }
  };

  const profileHref = session ? "/profile" : `/login?callbackUrl=${encodeURIComponent(pathname)}`;

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logo}>
            <Image
              src="/images/ChatGPT Image May 28, 2026, 09_02_11 PM.png"
              alt="Robotics Shop CTG logo"
              width={64}
              height={64}
              loading="eager"
              priority
              className={styles.logoIcon}
            />
            <div className={styles.logoText}>
              <span className={styles.logoShort}>RSC</span>
              <span className={styles.logoMain}>Robotics Shop Ctg</span>
            </div>
          </Link>
        </div>

        {/* Desktop search bar */}
        <form className={styles.searchContainer} onSubmit={handleSearch}>
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

        {/* Desktop right nav */}
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

        {/* Mobile action icons */}
        <div className={styles.mobileActions}>
          <button
            className={styles.mobileIconBtn}
            onClick={() => setMobileSearchOpen((o) => !o)}
            aria-label="Search"
          >
            {mobileSearchOpen
              ? <XMarkIcon width={22} height={22} />
              : <MagnifyingGlassIcon width={22} height={22} />}
          </button>
          <Link
            href="/contact"
            className={styles.mobileIconBtn}
            aria-label="Contact"
          >
            <PhoneIcon width={22} height={22} />
          </Link>
          <Link
            href={profileHref}
            className={`${styles.mobileIconBtn} ${session ? styles.mobileIconActive : ""}`}
            aria-label={session ? "Profile" : "Login"}
          >
            {session
              ? <UserCircleIcon width={22} height={22} />
              : <ArrowRightEndOnRectangleIcon width={22} height={22} />}
          </Link>
        </div>
      </header>

      {/* Mobile search drawer — rendered outside the header so it slides below it */}
      {mobileSearchOpen && (
        <div className={styles.mobileSearchDrawer}>
          <form onSubmit={handleSearch} className={styles.mobileSearchForm}>
            <div className={styles.searchWrapper}>
              <input
                ref={mobileSearchRef}
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
        </div>
      )}
    </>
  );
}
