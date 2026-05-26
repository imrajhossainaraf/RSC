"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import styles from './Sidebar.module.css';
import { 
  HomeIcon, 
  ShoppingCartIcon, 
  UserIcon, 
  CpuChipIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Products', href: '/products', icon: CpuChipIcon },
    { name: 'Cart', href: '/cart', icon: ShoppingCartIcon },
  ];

  if (session?.user) {
    navItems.push({ name: 'Profile', href: '/profile', icon: UserIcon });
    if ((session.user as any).role === 'admin') {
      navItems.push({ name: 'Admin Panel', href: '/admin', icon: ShieldCheckIcon });
    }
  } else {
    navItems.push({ name: 'Login', href: '/login', icon: UserIcon, mobileOnly: true } as any);
  }

  return (
    <aside className={styles.sidebar}>
      <Link href="/" className={styles.logo}>
        ⚡ <span>Circuits</span>
      </Link>
      
      <nav className={styles.navLinks}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`${styles.link} ${isActive ? styles.active : ''} ${(item as any).mobileOnly ? styles.mobileOnly : ''}`}
            >
              <Icon width={24} height={24} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.bottomNav}>
        {session ? (
          <button onClick={() => signOut()} className={styles.link} style={{ width: '100%', background: 'transparent' }}>
            <ArrowRightOnRectangleIcon width={24} height={24} />
            <span>Logout</span>
          </button>
        ) : (
          <Link href="/login" className={styles.link}>
            <UserIcon width={24} height={24} />
            <span>Login / Register</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
