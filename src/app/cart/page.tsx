"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrashIcon,
  MapPinIcon,
  TruckIcon,
  LockClosedIcon,
  ExclamationCircleIcon,
  ShoppingBagIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
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

// All 11 districts of Chattogram Division (with common alternate spellings)
const CTG_DISTRICTS = [
  'chittagong', 'chattogram', 'chottogram', 'ctg',
  'bandarban',
  'brahmanbaria', 'brahman baria', 'b baria',
  'chandpur',
  'comilla', 'cumilla',
  "cox's bazar", 'coxs bazar', 'coxsbazar', 'cox bazar',
  'feni',
  'khagrachari', 'khagrachhari', 'khagra chari',
  'lakshmipur', 'laksmipur', 'laxmipur',
  'noakhali',
  'rangamati', 'rangamathi',
];

function isCTGDistrict(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return CTG_DISTRICTS.some(d => lower.includes(d));
}

function detectZone(division: string, address: string, city: string): 'inside' | 'outside' | null {
  // City field is the highest-priority signal
  if (city.trim()) {
    if (isCTGDistrict(city)) return 'inside';
    return 'outside'; // any filled, non-CTG city → outside
  }
  // Division dropdown is next
  if (division) {
    return DIVISIONS.find(d => d.name === division)?.inside ? 'inside' : 'outside';
  }
  // Address text fallback
  if (address.trim()) {
    return /\bctg\b|chittagong|chottogram|chattogram/i.test(address) ? 'inside' : 'outside';
  }
  return null;
}

type FieldName = 'name' | 'email' | 'phone' | 'address' | 'city';

function validatePhone(raw: string): boolean {
  const s = raw.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
  const local = s.replace(/^(880|0088|88)/, '');
  return /^01[3-9]\d{8}$/.test(local);
}

function getFieldError(field: FieldName, value: string): string {
  const v = value.trim();
  switch (field) {
    case 'name':
      if (!v) return 'Full name is required';
      if (v.length < 2) return 'At least 2 characters required';
      return '';
    case 'email':
      if (!v) return 'Email address is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address';
      return '';
    case 'phone':
      if (!v) return 'Phone number is required';
      if (!validatePhone(value)) return 'Enter a valid BD number (e.g. 01712345678)';
      return '';
    case 'address':
      if (!v) return 'Delivery address is required';
      if (v.length < 5) return 'Please enter a more specific address';
      return '';
    case 'city':
      if (!v) return 'District is required';
      return '';
  }
}

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [buyerDetails, setBuyerDetails] = useState({
    name: '', email: '', phone: '', address: '', city: '',
  });
  const [division, setDivision] = useState('');
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    name: false, email: false, phone: false, address: false, city: false,
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [serverError, setServerError] = useState('');
  const [shippingFees, setShippingFees] = useState({ inside: 50, outside: 150 });

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);

  useEffect(() => {
    fetch('/api/shipping-fees')
      .then(r => r.json() as Promise<{ inside: number; outside: number }>)
      .then(data => setShippingFees(data))
      .catch(() => {});
  }, []);

  // Derive session prefills at render time — no useEffect/setState needed
  const name  = buyerDetails.name  || (session?.user?.name  ?? '');
  const email = buyerDetails.email || (session?.user?.email ?? '');

  const handleDivisionChange = (div: string) => setDivision(div);

  const handleCityChange = (city: string) => {
    setBuyerDetails(p => ({ ...p, city }));
    if (isCTGDistrict(city)) setDivision('Chattogram');
  };

  const shippingZone = detectZone(division, buyerDetails.address, buyerDetails.city);
  const shippingFee = shippingZone === 'inside' ? shippingFees.inside
    : shippingZone === 'outside' ? shippingFees.outside : 0;
  const couponDiscount = appliedCoupon
    ? parseFloat((totalPrice * (appliedCoupon.discountPercent / 100)).toFixed(2))
    : 0;
  const finalTotal = totalPrice - couponDiscount + shippingFee;

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError('Please enter a coupon code.'); return; }
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json() as { valid?: boolean; discountPercent?: number; code?: string; message?: string };
      if (res.ok && data.valid) {
        setAppliedCoupon({ code: data.code!, discountPercent: data.discountPercent! });
        setCouponInput('');
        toast.success(`Coupon applied — ${data.discountPercent}% off!`);
      } else {
        setCouponError(data.message || 'Invalid coupon.');
      }
    } catch {
      setCouponError('Could not apply coupon. Try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const fieldErrors: Record<FieldName, string> = {
    name:    getFieldError('name',    name),
    email:   getFieldError('email',   email),
    phone:   getFieldError('phone',   buyerDetails.phone),
    address: getFieldError('address', buyerDetails.address),
    city:    getFieldError('city',    buyerDetails.city),
  };

  const allFieldsValid = Object.values(fieldErrors).every(e => e === '');
  const isBuyerComplete = division !== '' && allFieldsValid;

  const shouldShowError = (f: FieldName) =>
    (touched[f] || submitAttempted) && fieldErrors[f] !== '';
  const isValid = (f: FieldName) =>
    touched[f] && fieldErrors[f] === '';

  const handleBlur = (f: FieldName) => setTouched(prev => ({ ...prev, [f]: true }));

  const handleCheckout = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (status === 'loading') { setServerError('Checking login status, please wait...'); return; }
    if (status !== 'authenticated') { router.push('/login'); return; }
    if (!division) { setServerError('Please select your delivery division.'); return; }
    if (!isBuyerComplete) { setServerError('Please fix the highlighted errors before placing your order.'); return; }

    setLoading(true);
    setServerError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          buyerDetails: { ...buyerDetails, name, email, division },
          shippingZone: shippingZone ?? 'outside',
          total: finalTotal,
          couponCode: appliedCoupon?.code ?? '',
        }),
      });

      if (res.ok) {
        clearCart();
        setOrderPlaced(true);
        toast.success('Order placed successfully!');
      } else {
        const data = await res.json() as { message?: string };
        toast.error(data.message || 'Failed to place order');
        setServerError(data.message || 'Failed to place order');
      }
    } catch {
      toast.error('An error occurred during checkout');
      setServerError('An error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className={styles.emptyCart}>
        <div className={styles.successIcon}>✓</div>
        <h2>Order Placed Successfully!</h2>
        <p>Thank you! Check your email for the confirmation.</p>
        <Link href="/products">
          <button className="btn-primary" style={{ marginTop: '2rem' }}>Continue Shopping</button>
        </Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <ShoppingBagIcon width={48} height={48} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
        <h2>Your cart is empty</h2>
        <p>Looks like you haven&apos;t added any components yet.</p>
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

        {/* ── Cart Items ── */}
        <div className={styles.cartItems}>
          {cart.map(item => (
            <div key={item.productId} className={styles.cartItem}>
              <Image
                src={item.image}
                alt={item.name}
                width={80}
                height={80}
                sizes="80px"
                className={styles.itemImage}
              />
              <div className={styles.itemInfo}>
                <Link href={`/products/${item.productId}`} className={styles.itemName}>
                  {item.name}
                </Link>
                <div className={styles.itemMeta}>
                  <span className={styles.unitPrice}>৳{item.price.toFixed(2)} each</span>
                  <span className={styles.itemTotal}>৳{(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <div className={styles.quantityControl}>
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} aria-label="Decrease">−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} aria-label="Increase">+</button>
                </div>
              </div>
              <button
                onClick={() => removeFromCart(item.productId)}
                className={styles.removeBtn}
                aria-label="Remove item"
              >
                <TrashIcon width={18} height={18} />
              </button>
            </div>
          ))}
        </div>

        {/* ── Order Summary ── */}
        <aside className={styles.summary}>

          {/* Header */}
          <div className={styles.summaryHeader}>
            <span className={styles.summaryTitle}>Order Summary</span>
            <span className={styles.itemBadge}>{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Mini item list */}
          <div className={styles.miniItems}>
            {cart.map(item => (
              <div key={item.productId} className={styles.miniItem}>
                <span className={styles.miniName}>
                  {item.name}
                  <span className={styles.miniQty}> ×{item.quantity}</span>
                </span>
                <span className={styles.miniPrice}>৳{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Price rows */}
          <div className={styles.priceSection}>
            <div className={styles.priceRow}>
              <span>Subtotal</span>
              <span>৳{totalPrice.toFixed(2)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className={`${styles.priceRow} ${styles.discountRow}`}>
                <span>
                  <TagIcon width={13} height={13} />
                  Coupon ({appliedCoupon!.code})
                  <button
                    className={styles.removeCouponBtn}
                    onClick={() => setAppliedCoupon(null)}
                    title="Remove coupon"
                  >×</button>
                </span>
                <span className={styles.discountAmount}>−৳{couponDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className={styles.priceRow}>
              <span>
                Shipping (COD)
                {shippingZone && (
                  <span className={`${styles.zonePill} ${shippingZone === 'inside' ? styles.zonePillInside : styles.zonePillOutside}`}>
                    {shippingZone === 'inside' ? 'Inside CTG' : 'Outside CTG'}
                  </span>
                )}
              </span>
              <span className={shippingZone ? '' : styles.feeUnset}>
                {shippingZone ? `৳${shippingFee.toFixed(2)}` : '—'}
              </span>
            </div>
          </div>

          {/* Coupon input — only shown to logged-in users */}
          {status === 'authenticated' && !appliedCoupon && (
            <div className={styles.sectionBlock}>
              <div className={styles.sectionTitle}>
                <TagIcon width={14} height={14} />
                Coupon Code
              </div>
              <div className={styles.couponRow}>
                <input
                  className={styles.couponInput}
                  type="text"
                  value={couponInput}
                  onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                  placeholder="Enter code"
                  maxLength={32}
                />
                <button
                  className={styles.couponApplyBtn}
                  onClick={handleApplyCoupon}
                  disabled={couponLoading}
                >
                  {couponLoading ? '…' : 'Apply'}
                </button>
              </div>
              {couponError && <p className={styles.fieldErr}>{couponError}</p>}
            </div>
          )}

          <div className={styles.totalRow}>
            <span>Total</span>
            <span className={styles.totalAmount}>৳{finalTotal.toFixed(2)}</span>
          </div>

          {/* COD label */}
          <div className={styles.codLabel}>
            <TruckIcon width={15} height={15} />
            <span>Payment: Cash on Delivery</span>
          </div>

          {/* Delivery Location */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionTitle}>
              <MapPinIcon width={14} height={14} />
              Delivery Location <span className={styles.req}>*</span>
            </div>
            <select
              className={`${styles.divSelect} ${!division && submitAttempted ? styles.divSelectError : division ? styles.divSelectFilled : ''}`}
              value={division}
              onChange={e => handleDivisionChange(e.target.value)}
            >
              <option value="">— Choose your division —</option>
              {DIVISIONS.map(d => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
            {!division && submitAttempted && (
              <p className={styles.fieldErr}>Please select your division</p>
            )}

            {shippingZone && (
              <div className={`${styles.zoneStrip} ${shippingZone === 'inside' ? styles.zoneInside : styles.zoneOutside}`}>
                <span>{shippingZone === 'inside' ? '📍 Inside Chattogram' : '🚚 Outside Chattogram'}</span>
                <span className={styles.zoneFee}>৳{shippingFee}</span>
              </div>
            )}
          </div>

          {/* Buyer form or login prompt */}
          {status === 'authenticated' ? (
            <form onSubmit={handleCheckout} noValidate className={styles.buyerForm}>
              <div className={styles.sectionTitle} style={{ marginBottom: '0.75rem' }}>
                Customer Details
              </div>

              {(
                [
                  { key: 'name',    label: 'Full Name',         type: 'text',  placeholder: 'Your full name',      autocomplete: 'name' },
                  { key: 'email',   label: 'Email Address',     type: 'email', placeholder: 'name@example.com',    autocomplete: 'email' },
                  { key: 'phone',   label: 'Phone Number',      type: 'tel',   placeholder: '01712 345 678',       autocomplete: 'tel' },
                  { key: 'address', label: 'Delivery Address',  type: 'text',  placeholder: 'House / Road / Area', autocomplete: 'street-address' },
                  { key: 'city',    label: 'District',           type: 'text',  placeholder: 'e.g. Feni, Comilla, Dhaka…', autocomplete: 'address-level2' },
                ] as const
              ).map(({ key, label, type, placeholder, autocomplete }) => (
                <div key={key} className={styles.field}>
                  <label className={styles.fieldLabel}>
                    {label} <span className={styles.req}>*</span>
                  </label>
                  <div className={`${styles.inputRow} ${shouldShowError(key) ? styles.inputRowErr : isValid(key) ? styles.inputRowOk : ''}`}>
                    <input
                      type={type}
                      value={key === 'name' ? name : key === 'email' ? email : buyerDetails[key]}
                      onChange={e =>
                        key === 'city'
                          ? handleCityChange(e.target.value)
                          : setBuyerDetails(p => ({ ...p, [key]: e.target.value }))
                      }
                      onBlur={() => handleBlur(key)}
                      placeholder={placeholder}
                      autoComplete={autocomplete}
                    />
                    {touched[key] && (
                      isValid(key)
                        ? <CheckCircleIcon width={16} height={16} className={styles.iconOk} />
                        : <ExclamationCircleIcon width={16} height={16} className={styles.iconErr} />
                    )}
                  </div>
                  {shouldShowError(key) && (
                    <p className={styles.fieldErr}>{fieldErrors[key]}</p>
                  )}
                </div>
              ))}

              {serverError && (
                <div className={styles.serverError}>
                  <ExclamationCircleIcon width={15} height={15} />
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                className={styles.placeOrderBtn}
                disabled={loading}
              >
                <LockClosedIcon width={15} height={15} />
                {loading ? 'Processing…' : 'Place Order'}
              </button>
            </form>
          ) : (
            <div className={styles.loginBlock}>
              <p>Sign in to complete your purchase</p>
              <Link href="/login?callbackUrl=/cart" className={styles.placeOrderBtn} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                <LockClosedIcon width={15} height={15} />
                Login to Checkout
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
