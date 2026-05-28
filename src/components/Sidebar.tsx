"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import styles from "./Sidebar.module.css";
import {
  HomeIcon,
  ShoppingCartIcon,
  UserIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  WrenchScrewdriverIcon,
  HeartIcon,
  Squares2X2Icon,
  PhoneIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";

// ... Categories and types (keep only necessary ones if they are moved, but let's just keep them here for now)
type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ width?: number; height?: number; className?: string }>;
  badge?: number;
  adminOnly?: boolean;
  authOnly?: boolean;
};

type SessionUser = {
  role?: string;
};

const CATEGORIES = [
  { name: "Electronics Components", slug: "electronics-components" },
  { name: "Development Boards", slug: "development-boards" },
  { name: "Robotics & Automation", slug: "robotics-automation" },
  { name: "RC Models & Vehicles", slug: "rc-models-vehicles" },
  { name: "RC Transmitters & Receivers", slug: "rc-transmitters-receivers" },
  { name: "Drones & Accessories", slug: "drones-accessories" },
  { name: "Power & Batteries", slug: "power-batteries" },
  { name: "Tools & Equipment", slug: "tools-equipment" },
  { name: "Test & Measurement", slug: "test-measurement" },
  { name: "Cables & Connectors", slug: "cables-connectors" },
  { name: "Switches & Relays", slug: "switches-relays" },
  { name: "Motors & Drivers", slug: "motors-drivers" },
  { name: "Wireless Modules", slug: "wireless-modules" },
  { name: "Solar", slug: "solar" },
  { name: "PCB & Prototyping", slug: "pcb-prototyping" },
  { name: "LEDs & Lighting", slug: "leds-lighting" },
  { name: "Display Modules", slug: "display-modules" },
  { name: "Audio Components", slug: "audio-components" },
  { name: "Industrial Electronics", slug: "industrial-electronics" },
  { name: "IoT Devices", slug: "iot-devices" },
  { name: "DIY Electronics Kits", slug: "diy-kits" },
  { name: "Electronic Gadgets", slug: "electronic-gadgets" },
  { name: "Electrical Accessories", slug: "electrical-accessories" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const sessionUser = session?.user as SessionUser | undefined;
  const { totalItems } = useCart();
  const [expanded, setExpanded] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const topNavItems: NavItem[] = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "Products", href: "/products", icon: Squares2X2Icon },
    { name: "Services", href: "/services", icon: WrenchScrewdriverIcon },
    { name: "Cart", href: "/cart", icon: ShoppingCartIcon, badge: totalItems },
    { name: "Wishlist", href: "/wishlist", icon: HeartIcon, authOnly: true },
    { name: "Profile", href: "/profile", icon: UserIcon, authOnly: true },
    { name: "Admin", href: "/admin", icon: ShieldCheckIcon, adminOnly: true },
    { name: "Contact", href: "/contact", icon: PhoneIcon },
  ];

  const visibleNavItems = topNavItems.filter((item) => {
    if (item.adminOnly) return sessionUser?.role === "admin";
    if (item.authOnly) return !!session?.user;
    return true;
  });

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {expanded && (
        <div className={styles.overlay} onClick={() => setExpanded(false)}></div>
      )}
      <aside className={`${styles.sidebar} ${expanded ? styles.expanded : ""}`}>
        <button 
          className={styles.toggleBtn}
          onClick={() => setExpanded(!expanded)}
          aria-label="Toggle Sidebar"
        >
          {expanded ? <XMarkIcon width={24} height={24} /> : <Bars3Icon width={24} height={24} />}
        </button>

        <nav className={styles.mainNav}>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            
            // Render regular items
            if (item.name !== "Products") {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${styles.link} ${isActive(item.href) ? styles.active : ""}`}
                  title={!expanded ? item.name : undefined}
                  onClick={() => setExpanded(false)}
                >
                  <span className={styles.linkIcon}>
                    <Icon width={22} height={22} />
                    {item.badge && item.badge > 0 ? (
                      <span className={styles.badge}>{item.badge}</span>
                    ) : null}
                  </span>
                  {expanded && <span className={styles.linkText}>{item.name}</span>}
                </Link>
              );
            }

            // Render Products with Categories dropdown
            return (
              <div key={item.name} className={styles.dropdownWrapper}>
                <div 
                  className={`${styles.link} ${isActive(item.href) ? styles.active : ""} ${styles.dropdownTrigger}`}
                  title={!expanded ? item.name : undefined}
                  onClick={() => {
                    if (!expanded) {
                      setExpanded(true);
                    }
                    setCategoriesOpen(!categoriesOpen);
                  }}
                >
                  <span className={styles.linkIcon}>
                    <Icon width={22} height={22} />
                  </span>
                  {expanded && (
                    <>
                      <span className={styles.linkText}>{item.name}</span>
                      <ChevronDownIcon width={16} height={16} className={`${styles.chevron} ${categoriesOpen ? styles.chevronOpen : ""}`} />
                    </>
                  )}
                </div>
                {expanded && categoriesOpen && (
                  <div className={styles.dropdownContent}>
                    {CATEGORIES.map((cat) => (
                      <Link 
                        key={cat.slug}
                        href={`/products?category=${cat.slug}`}
                        className={styles.subLink}
                        onClick={() => setExpanded(false)}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className={styles.bottomNav}>
          {session ? (
            <button
              onClick={() => signOut()}
              className={`${styles.link} ${styles.logoutBtn}`}
              title={!expanded ? "Logout" : undefined}
            >
              <span className={styles.linkIcon}>
                <ArrowRightOnRectangleIcon width={22} height={22} />
              </span>
              {expanded && <span className={styles.linkText}>Logout</span>}
            </button>
          ) : (
            <Link href="/login" className={styles.link} title={!expanded ? "Login" : undefined}>
              <span className={styles.linkIcon}>
                <UserIcon width={22} height={22} />
              </span>
              {expanded && <span className={styles.linkText}>Login / Register</span>}
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
