"use client";

import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  UserIcon, 
  EnvelopeIcon, 
  CalendarIcon, 
  ShieldCheckIcon,
  ShoppingBagIcon, 
  ArrowLeftOnRectangleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from "@heroicons/react/24/outline";
import styles from "./page.module.css";

type OrderItem = {
  product: {
    name: string;
    image: string;
    price: number;
  } | null;
  quantity: number;
  priceAtPurchase: number;
};

type Order = {
  _id: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  shippingDetails: {
    address: string;
    city: string;
    zipCode: string;
  };
  createdAt: string;
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      void Promise.resolve().then(() => fetchOrders());
    }
  }, [status, fetchOrders]);

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  if (status === "loading") {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  const user = session.user as { name?: string | null; email?: string | null; image?: string | null; role?: string };

  return (
    <div className={styles.container}>
      {/* Header Profile Card */}
      <section className={styles.profileCard}>
        <div className={styles.profileGlow}></div>
        <div className={styles.avatarSection}>
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? 'Profile avatar'}
              width={96}
              height={96}
              className={styles.avatar}
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              <UserIcon width={48} height={48} />
            </div>
          )}
          <div className={styles.badgeRow}>
            <span className={`${styles.roleBadge} ${user.role === 'admin' ? styles.adminBadge : styles.userBadge}`}>
              {user.role === "admin" ? <ShieldCheckIcon width={14} height={14} /> : null}
              {user.role?.toUpperCase()}
            </span>
          </div>
        </div>

        <div className={styles.profileDetails}>
          <h1 className={styles.userName}>{user.name}</h1>
          
          <div className={styles.detailRow}>
            <EnvelopeIcon width={18} height={18} className={styles.detailIcon} />
            <span>{user.email}</span>
          </div>

          <div className={styles.detailRow}>
            <CalendarIcon width={18} height={18} className={styles.detailIcon} />
            <span>Member since {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
          </div>

          <div className={styles.profileActions}>
            {user.role === "admin" && (
              <Link href="/admin">
                <button className="btn-primary">Admin Dashboard</button>
              </Link>
            )}
            <button 
              onClick={() => signOut({ callbackUrl: "/" })} 
              className={styles.btnLogout}
            >
              <ArrowLeftOnRectangleIcon width={18} height={18} />
              Logout
            </button>
          </div>
        </div>
      </section>

      {/* Orders Tracking Section */}
      <section className={styles.ordersSection}>
        <h2 className={styles.sectionTitle}>
          <ShoppingBagIcon width={24} height={24} className={styles.titleIcon} />
          Your Order History
        </h2>

        {loadingOrders ? (
          <div className={styles.loadingOrders}>
            <div className={styles.spinnerSmall}></div>
            <p>Retrieving your orders...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className={styles.ordersList}>
            {orders.map((order) => {
              const isExpanded = !!expandedOrders[order._id];
              const orderDate = new Date(order.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric"
              });

              return (
                <div key={order._id} className={styles.orderCard}>
                  <div 
                    onClick={() => toggleOrderExpansion(order._id)} 
                    className={styles.orderHeader}
                  >
                    <div className={styles.headerInfo}>
                      <span className={styles.orderId}>Order #{order._id.slice(-8).toUpperCase()}</span>
                      <span className={styles.orderDate}>{orderDate}</span>
                    </div>

                    <div className={styles.headerMeta}>
                      <span className={styles.orderTotal}>${order.total.toFixed(2)}</span>
                      <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <button className={styles.expandBtn} aria-label="Toggle details">
                        {isExpanded ? <ChevronUpIcon width={20} height={20} /> : <ChevronDownIcon width={20} height={20} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={styles.orderDetails}>
                      <div className={styles.detailsGrid}>
                        <div className={styles.shippingSection}>
                          <h3>Shipping Address</h3>
                          <p>{order.shippingDetails.address}</p>
                          <p>{order.shippingDetails.city} - {order.shippingDetails.zipCode}</p>
                        </div>
                        
                        <div className={styles.paymentSection}>
                          <h3>Method</h3>
                          <p>Cash on Delivery (COD)</p>
                          <p className={styles.orderFullId}>Full Order ID: <code>{order._id}</code></p>
                        </div>
                      </div>

                      <div className={styles.itemsSection}>
                        <h3>Purchased Items</h3>
                        <div className={styles.itemsList}>
                          {order.items.map((item, idx) => (
                            <div key={idx} className={styles.itemRow}>
                              {item.product?.image ? (
                                <Image
                                  src={item.product.image}
                                  alt={item.product.name || "Product"}
                                  width={80}
                                  height={80}
                                  className={styles.itemImage}
                                  style={{ objectFit: 'cover' }}
                                />
                              ) : (
                                <div className={styles.itemImagePlaceholder}></div>
                              )}
                              <div className={styles.itemMeta}>
                                <span className={styles.itemName}>{item.product?.name || "Deleted Product"}</span>
                                <span className={styles.itemPrice}>
                                  {item.quantity} x ${item.priceAtPurchase.toFixed(2)}
                                </span>
                              </div>
                              <span className={styles.itemSubtotal}>
                                ${(item.quantity * item.priceAtPurchase).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyOrders}>
            <h3>No orders found</h3>
            <p>You haven&apos;t placed any orders yet. Start building your hardware project today!</p>
            <Link href="/products">
              <button className="btn-primary" style={{ marginTop: "1rem" }}>Browse Components</button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
