import Link from "next/link";
import Image from "next/image";
import {
  Squares2X2Icon,
  WrenchScrewdriverIcon,
  PhoneIcon,
  ShareIcon,
  ShoppingCartIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import styles from "./Footer.module.css";

const shopLinks = [
  { label: "All Products",    href: "/products", icon: Squares2X2Icon },
  { label: "Services",        href: "/services", icon: WrenchScrewdriverIcon },
  { label: "Cart",            href: "/cart",     icon: ShoppingCartIcon },
  { label: "Wishlist",        href: "/wishlist", icon: HeartIcon },
];

const companyLinks = [
  { label: "Share & Careers", href: "/admin",   icon: ShareIcon },
  { label: "Contact Us",      href: "/contact", icon: PhoneIcon },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>

        {/* Brand */}
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLogo}>
            <Image
              src="/images/ChatGPT Image May 28, 2026, 09_02_11 PM.png"
              alt="Robotics Shop CTG"
              width={52}
              height={52}
              className={styles.logoImg}
            />
            <div>
              <p className={styles.brandName}>Robotics Shop CTG</p>
              <p className={styles.brandTagline}>Precision components. Delivered.</p>
            </div>
          </Link>
          <p className={styles.brandDesc}>
            Your trusted source for electronic components, development boards,
            and robotics supplies in Chittagong, Bangladesh.
          </p>
        </div>

        {/* Shop */}
        <div className={styles.linkGroup}>
          <h4 className={styles.groupTitle}>Shop</h4>
          <ul className={styles.linkList}>
            {shopLinks.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className={styles.footerLink}>
                  <Icon width={15} height={15} className={styles.linkIcon} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company — Share & Careers highlighted */}
        <div className={styles.linkGroup}>
          <h4 className={styles.groupTitle}>Company</h4>
          <ul className={styles.linkList}>
            {companyLinks.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`${styles.footerLink} ${label === "Share & Careers" ? styles.highlightLink : ""}`}
                >
                  <Icon width={15} height={15} className={styles.linkIcon} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

      </div>

      <div className={styles.bottom}>
        <p className={styles.copy}>
          © {new Date().getFullYear()} Robotics Shop CTG. All rights reserved.
        </p>
        <p className={styles.madeIn}>Made in Chittagong, Bangladesh 🇧🇩</p>
      </div>
    </footer>
  );
}
