"use client";

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
  PhoneIcon,
  HeartIcon,
  Squares2X2Icon,
  CpuChipIcon,
  CommandLineIcon,
  CubeTransparentIcon,
  TruckIcon,
  SignalIcon,
  RocketLaunchIcon,
  BoltIcon,
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
} from "@heroicons/react/24/outline";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ width?: number; height?: number; className?: string }>;
  badge?: number;
  adminOnly?: boolean;
  authOnly?: boolean;
};

type CategoryItem = {
  name: string;
  slug: string;
  icon: React.ComponentType<{ width?: number; height?: number; className?: string }>;
};

type SessionUser = {
  role?: string;
};

const CATEGORIES: CategoryItem[] = [
  { name: "Electronics Components", slug: "electronics-components", icon: CpuChipIcon },
  { name: "Development Boards", slug: "development-boards", icon: CommandLineIcon },
  { name: "Robotics & Automation", slug: "robotics-automation", icon: CubeTransparentIcon },
  { name: "RC Models & Vehicles", slug: "rc-models-vehicles", icon: TruckIcon },
  { name: "RC Transmitters & Receivers", slug: "rc-transmitters-receivers", icon: SignalIcon },
  { name: "Drones & Accessories", slug: "drones-accessories", icon: RocketLaunchIcon },
  { name: "Power & Batteries", slug: "power-batteries", icon: BoltIcon },
  { name: "Tools & Equipment", slug: "tools-equipment", icon: WrenchScrewdriverIcon },
  { name: "Test & Measurement", slug: "test-measurement", icon: BeakerIcon },
  { name: "Cables & Connectors", slug: "cables-connectors", icon: LinkIcon },
  { name: "Switches & Relays", slug: "switches-relays", icon: AdjustmentsHorizontalIcon },
  { name: "Motors & Drivers", slug: "motors-drivers", icon: Cog6ToothIcon },
  { name: "Wireless Modules", slug: "wireless-modules", icon: WifiIcon },
  { name: "Solar", slug: "solar", icon: SunIcon },
  { name: "PCB & Prototyping", slug: "pcb-prototyping", icon: CircleStackIcon },
  { name: "LEDs & Lighting", slug: "leds-lighting", icon: LightBulbIcon },
  { name: "Display Modules", slug: "display-modules", icon: ComputerDesktopIcon },
  { name: "Audio Components", slug: "audio-components", icon: SpeakerWaveIcon },
  { name: "Industrial Electronics", slug: "industrial-electronics", icon: BuildingOffice2Icon },
  { name: "IoT Devices", slug: "iot-devices", icon: GlobeAltIcon },
  { name: "DIY Electronics Kits", slug: "diy-kits", icon: PuzzlePieceIcon },
  { name: "Electronic Gadgets", slug: "electronic-gadgets", icon: DevicePhoneMobileIcon },
  { name: "Electrical Accessories", slug: "electrical-accessories", icon: SparklesIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const sessionUser = session?.user as SessionUser | undefined;
  const { totalItems } = useCart();

  const topNavItems: NavItem[] = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "All Products", href: "/products", icon: Squares2X2Icon },
    { name: "Our Services", href: "/services", icon: WrenchScrewdriverIcon },
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
    <aside className={styles.sidebar}>
      {/* Logo */}
      <Link href="/" className={styles.logo}>
        <span className={styles.logoIcon}>⚡</span>
        <div className={styles.logoText}>
          <span className={styles.logoMain}>Robotics</span>
          <span className={styles.logoSub}>Shop CTG</span>
        </div>
      </Link>

      {/* Main Navigation */}
      <nav className={styles.mainNav}>
        <p className={styles.navLabel}>Navigation</p>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${styles.link} ${isActive(item.href) ? styles.active : ""}`}
            >
              <span className={styles.linkIcon}>
                <Icon width={18} height={18} />
              </span>
              <span className={styles.linkText}>{item.name}</span>
              {item.badge && item.badge > 0 ? (
                <span className={styles.badge}>{item.badge}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Categories */}
      <div className={styles.categoriesSection}>
        <p className={styles.navLabel}>Categories</p>
        <div className={styles.categoriesList}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = pathname.startsWith("/products") && 
              (typeof window !== "undefined" 
                ? new URLSearchParams(window.location.search).get("category") === cat.slug
                : false);
            return (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className={`${styles.categoryLink} ${active ? styles.active : ""}`}
              >
                <span className={styles.linkIcon}>
                  <Icon width={16} height={16} />
                </span>
                <span className={styles.linkText}>{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Auth */}
      <div className={styles.bottomNav}>
        {session ? (
          <button
            onClick={() => signOut()}
            className={`${styles.link} ${styles.logoutBtn}`}
          >
            <span className={styles.linkIcon}>
              <ArrowRightOnRectangleIcon width={18} height={18} />
            </span>
            <span className={styles.linkText}>Logout</span>
          </button>
        ) : (
          <Link href="/login" className={styles.link}>
            <span className={styles.linkIcon}>
              <UserIcon width={18} height={18} />
            </span>
            <span className={styles.linkText}>Login / Register</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
