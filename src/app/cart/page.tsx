"use client";

import Image from 'next/image';
import { useState } from 'react';
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
    phone: ''
  });
  const [shippingDetails, setShippingDetails] = useState({
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
    buyerDetails.phone.trim() !== '';

  const isShippingComplete =
    shippingDetails.address.trim() !== '' &&
    shippingDetails.city.trim() !== '' &&
    shippingDetails.zipCode.trim() !== '';

  useEffect(() => {
    if (session?.user) {
      setBuyerDetails((prev) => ({
        ...prev,
        name: session.user.name ?? prev.name,
        email: session.user.email ?? prev.email,
      }));
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

    if (!isShippingComplete) {
      setError('Please complete shipping details before placing your order.');
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
          shippingDetails,
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
              <h3 style={{ fontSize: '1.1rem', marginTop: '1rem' }}>Shipping Details</h3>
              <div className={styles.formGroup}>
                <label>Address</label>
                <input required type="text" value={shippingDetails.address} onChange={e => setShippingDetails({...shippingDetails, address: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>City</label>
                <input required type="text" value={shippingDetails.city} onChange={e => setShippingDetails({...shippingDetails, city: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Zip Code</label>
                <input required type="text" value={shippingDetails.zipCode} onChange={e => setShippingDetails({...shippingDetails, zipCode: e.target.value})} />
              </div>
              <button
                type="submit"
                className={`btn-primary ${styles.checkoutBtn}`}
                disabled={loading || !isShippingComplete || status !== 'authenticated'}
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
