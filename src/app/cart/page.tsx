"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import styles from './page.module.css';

const DIVISIONS = [
  { name: 'Barishal',   inside: false },
  { name: 'Chattogram', inside: true  },
  { name: 'Dhaka',      inside: false },
  { name: 'Khulna',     inside: false },
  { name: 'Mymensingh', inside: false },
  { name: 'Rajshahi',   inside: false },
  { name: 'Rangpur',    inside: false },
  { name: 'Sylhet',     inside: false },
];

const CTG_PATTERN = /\bctg\b|chittagong|chottogram|chattogram/i;

function detectZone(division: string, address: string, city: string): 'inside' | 'outside' | null {
  if (division) {
    return DIVISIONS.find(d => d.name === division)?.inside ? 'inside' : 'outside';
  }
  if (!address.trim() && !city.trim()) return null;
  return CTG_PATTERN.test(address) || CTG_PATTERN.test(city) ? 'inside' : 'outside';
}

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
  const [division, setDivision] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [error, setError] = useState('');
  const [shippingFees, setShippingFees] = useState({ inside: 50, outside: 150 });

  useEffect(() => {
    fetch('/api/shipping-fees')
      .then(r => r.json() as Promise<{ inside: number; outside: number }>)
      .then(data => setShippingFees(data))
      .catch(() => {});
  }, []);

  const handleDivisionChange = (div: string) => {
    setDivision(div);
    if (div) {
      setBuyerDetails(prev => ({ ...prev, city: prev.city || div }));
    }
  };

  const shippingZone = detectZone(division, buyerDetails.address, buyerDetails.city);
  const shippingFee = shippingZone === 'inside' ? shippingFees.inside
    : shippingZone === 'outside' ? shippingFees.outside
    : 0;
  const finalTotal = totalPrice + shippingFee;

  const isBuyerComplete =
    division !== '' &&
    buyerDetails.name.trim() !== '' &&
    buyerDetails.email.trim() !== '' &&
    buyerDetails.phone.trim() !== '' &&
    buyerDetails.address.trim() !== '' &&
    buyerDetails.city.trim() !== '';

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

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
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
          buyerDetails: { ...buyerDetails, division },
          shippingZone: shippingZone ?? 'outside',
          total: finalTotal,
        })
      });

      if (res.ok) {
        clearCart();
        setOrderPlaced(true);
        toast.success('Order placed successfully!');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to place order');
        setError(data.message || 'Failed to place order');
      }
    } catch (fetchError) {
      console.error('Checkout error:', fetchError);
      toast.error('An error occurred during checkout');
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
                <div className={styles.itemPrice}>৳{item.price.toFixed(2)}</div>

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

          {/* Division Dropdown */}
          <div className={styles.divisionGroup}>
            <label className={styles.divisionLabel}>Select Division <span style={{ color: '#ef4444' }}>*</span></label>
            <select
              className={styles.divisionSelect}
              value={division}
              onChange={e => handleDivisionChange(e.target.value)}
              required
            >
              <option value="">— Choose your division —</option>
              {DIVISIONS.map(d => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>৳{totalPrice.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>
              Shipping (COD)
              {shippingZone && (
                <span className={`${styles.zoneBadge} ${shippingZone === 'inside' ? styles.zoneBadgeInside : styles.zoneBadgeOutside}`}>
                  {shippingZone === 'inside' ? 'Inside Chattogram' : 'Outside Chattogram'}
                </span>
              )}
            </span>
            <span>{shippingZone ? `৳${shippingFee.toFixed(2)}` : '—'}</span>
          </div>
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>৳{finalTotal.toFixed(2)}</span>
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
                  placeholder="Chattogram"
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
            <Link href="/login?callbackUrl=/cart">
              <button className={`btn-primary ${styles.checkoutBtn}`}>Login to Checkout</button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
