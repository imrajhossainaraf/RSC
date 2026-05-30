"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { ShoppingCartIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/context/CartContext';

type WishlistItem = {
  productId: string;
  name: string;
  price: number;
  image: string;
  stock: number;
};

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const { addToCart } = useCart();

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      const saved = localStorage.getItem('wishlist');
      if (saved) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setWishlist(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
      setLoaded(true);
    }
  }, [loaded]);

  const removeFromWishlist = (id: string) => {
    const updated = wishlist.filter(item => item.productId !== id);
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
  };

  const handleMoveToCart = (item: WishlistItem) => {
    addToCart({
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1
    });
    removeFromWishlist(item.productId);
  };

  return (
    <div className={styles.wishlistContainer}>
      <header className={styles.header}>
        <span className="badge badge-orange">Your Collections</span>
        <h1>Your Saved Items</h1>
        <p className={styles.subtext}>
          Review and move components directly to your cart.
        </p>
      </header>

      {wishlist.length > 0 ? (
        <div className={styles.grid}>
          {wishlist.map((item) => (
            <div key={item.productId} className={`${styles.card} glass-card`}>
              <div className={styles.imageContainer}>
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className={styles.fallback}>Image</div>
                )}
              </div>
              <div className={styles.info}>
                <h3>
                  <Link href={`/products/${item.productId}`}>{item.name}</Link>
                </h3>
                <span className={styles.price}>৳{item.price.toFixed(2)}</span>
                
                <div className={styles.actions}>
                  <button
                    onClick={() => handleMoveToCart(item)}
                    className="btn-primary"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem', justifyContent: 'center' }}
                  >
                    <ShoppingCartIcon width={16} height={16} /> Add to Cart
                  </button>
                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className={styles.deleteBtn}
                    title="Remove from wishlist"
                  >
                    <TrashIcon width={18} height={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>Your wishlist is empty. Explore our catalog to save items!</p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link href="/products" className="btn-orange">
              Browse Components
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
