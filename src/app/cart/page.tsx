"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrashIcon } from '@heroicons/react/24/outline';
import styles from './page.module.css';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [buyerDetails, setBuyerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [error, setError] = useState('');

  const isBuyerComplete =
    buyerDetails.name.trim() !== '' &&
    buyerDetails.email.trim() !== '' &&
    buyerDetails.phone.trim() !== '' &&
    buyerDetails.address.trim() !== '' &&
    buyerDetails.city.trim() !== '' &&
    buyerDetails.zipCode.trim() !== '';

  useEffect(() => {
    if (session?.user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBuyerDetails((prev) => {
        if (prev.name === '' && prev.email === '') {
          return {
            ...prev,
            name: session.user?.name ?? '',
            email: session.user?.email ?? '',
          };
        }
        return prev;
      });
    }
  }, [session]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === 'loading') {
      setError('Checking login status, please wait...');
      return;
    }

    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }

    if (!isBuyerComplete) {
      setError('Please complete all buyer and shipping details before placing your order.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          buyerDetails,
          total: totalPrice,
        })
      });

      if (res.ok) {
        clearCart();
        setOrderPlaced(true);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to place order');
      }
    } catch (fetchError) {
      console.error('Checkout error:', fetchError);
      setError('An error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className={styles.emptyCart}>
        <h2>Order Placed Successfully!</h2>
        <p style={{ marginTop: '1rem' }}>Thank you for your purchase. You will receive an email confirmation shortly.</p>
        <Link href="/products">
          <button className="btn-primary" style={{ marginTop: '2rem' }}>Continue Shopping</button>
        </Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <h2>Your cart is empty</h2>
        <p style={{ marginTop: '1rem' }}>Looks like you haven&apos;t added any components yet.</p>
        <Link href="/products">
          <button className="btn-primary" style={{ marginTop: '2rem' }}>Start Shopping</button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.cartContainer}>
      <h1 className={styles.cartHeader}>Your Cart</h1>
      
      <div className={styles.cartLayout}>
        <div className={styles.cartItems}>
          {cart.map((item) => (
            <div key={item.productId} className={styles.cartItem}>
              <Image
                src={item.image}
                alt={item.name}
                width={96}
                height={96}
                sizes="96px"
                style={{ objectFit: 'cover', borderRadius: '0.75rem' }}
                className={styles.itemImage}
              />

              <div className={styles.itemInfo}>
                <Link href={`/products/${item.productId}`} className={styles.itemName}>
                  {item.name}
                </Link>
                <div className={styles.itemPrice}>${item.price.toFixed(2)}</div>
                
                <div className={styles.quantityControl}>
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                </div>
              </div>
              
              <button onClick={() => removeFromCart(item.productId)} className={styles.removeBtn} aria-label="Remove item">
                <TrashIcon width={24} height={24} />
              </button>
            </div>
          ))}
        </div>

        <div className={styles.summary}>
          <h2>Order Summary</h2>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Shipping</span>
            <span>Free (COD/Manual)</span>
          </div>
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          
          {error && <div style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>{error}</div>}

          {status === 'authenticated' ? (
            <form onSubmit={handleCheckout} className={styles.shippingForm}>
              <h3 style={{ fontSize: '1.1rem', marginTop: '1rem' }}>Buyer & Shipping Details</h3>
              <div className={styles.formGroup}>
                <label>Full Name</label>
                <input
                  required
                  type="text"
                  value={buyerDetails.name}
                  onChange={e => setBuyerDetails({ ...buyerDetails, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input
                  required
                  type="email"
                  value={buyerDetails.email}
                  onChange={e => setBuyerDetails({ ...buyerDetails, email: e.target.value })}
                  placeholder="name@example.com"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Phone Number</label>
                <input
                  required
                  type="tel"
                  value={buyerDetails.phone}
                  onChange={e => setBuyerDetails({ ...buyerDetails, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Address</label>
                <input
                  required
                  type="text"
                  value={buyerDetails.address}
                  onChange={e => setBuyerDetails({ ...buyerDetails, address: e.target.value })}
                  placeholder="123 Main St"
                />
              </div>
              <div className={styles.formGroup}>
                <label>City</label>
                <input
                  required
                  type="text"
                  value={buyerDetails.city}
                  onChange={e => setBuyerDetails({ ...buyerDetails, city: e.target.value })}
                  placeholder="Dhaka"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Zip Code</label>
                <input
                  required
                  type="text"
                  value={buyerDetails.zipCode}
                  onChange={e => setBuyerDetails({ ...buyerDetails, zipCode: e.target.value })}
                  placeholder="1207"
                />
              </div>
              <button
                type="submit"
                className={`btn-primary ${styles.checkoutBtn}`}
                disabled={loading || !isBuyerComplete}
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          ) : (
            <Link href="/login">
              <button className={`btn-primary ${styles.checkoutBtn}`}>Login to Checkout</button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
