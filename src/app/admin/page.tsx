"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import RichTextEditor from "@/components/RichTextEditor";
import {
  BriefcaseIcon,
  CpuChipIcon,
  UserGroupIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  TagIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  featured?: boolean;
};

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  stock: number;
  image: string;
  category: string | { _id: string; name: string; slug: string };
  featured: boolean;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const sessionUser = session?.user as { role?: string; email?: string } | undefined;
  const isAdmin = status === "authenticated" && sessionUser?.role === "admin";

  // Navigation Tabs for Admin Panel
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "categories" | "orders" | "coupons" | "settings">("dashboard");

  // Loaded Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Search & Filters for Products
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Product Add/Edit Form State
  const [productForm, setProductForm] = useState({
    _id: "", // filled only when editing
    name: "",
    description: "",
    price: "",
    discount: "0",
    image: "",
    stock: "0",
    category: "",
    featured: false
  });
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productActionLoading, setProductActionLoading] = useState(false);
  const [productMessage, setProductMessage] = useState({ text: "", isError: false });

  // Category Add/Edit Form State
  const [categoryForm, setCategoryForm] = useState({
    _id: "", // filled only when editing
    name: "",
    description: "",
    icon: "",
    featured: false
  });
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [categoryActionLoading, setCategoryActionLoading] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState({ text: "", isError: false });

  // Delete Confirmations
  const [deleteProductConfirm, setDeleteProductConfirm] = useState<string | null>(null);
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<string | null>(null);

  // Orders Tab State
  type OrderBuyer = { name: string; email: string; phone: string; address: string; city: string };
  type OrderItem = { productName: string; quantity: number; priceAtPurchase: number };
  type AdminOrder = { _id: string; buyerDetails?: OrderBuyer; items: OrderItem[]; total: number; shippingFee: number; shippingZone: string; status: string; createdAt: string };
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPages, setOrdersPages] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Settings Tab State
  type AdminUser = { _id: string; name: string; email: string };
  const [fromEmail, setFromEmail] = useState("");
  const [fromEmailInput, setFromEmailInput] = useState("");
  const [fromEmailLoading, setFromEmailLoading] = useState(false);
  const [fromEmailMessage, setFromEmailMessage] = useState({ text: "", isError: false });

  const [shippingFeeInside, setShippingFeeInside] = useState(50);
  const [shippingFeeOutside, setShippingFeeOutside] = useState(150);
  const [shippingFeeInsideInput, setShippingFeeInsideInput] = useState("50");
  const [shippingFeeOutsideInput, setShippingFeeOutsideInput] = useState("150");
  const [shippingFeeLoading, setShippingFeeLoading] = useState(false);
  const [shippingFeeMessage, setShippingFeeMessage] = useState({ text: "", isError: false });

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [addAdminEmail, setAddAdminEmail] = useState("");
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [addAdminMessage, setAddAdminMessage] = useState({ text: "", isError: false });
  const [removeAdminConfirm, setRemoveAdminConfirm] = useState<string | null>(null);

  // Coupons Tab State
  type CouponDoc = { _id: string; code: string; discountPercent: number; isActive: boolean; usedBy: string[] };
  const [coupons, setCoupons] = useState<CouponDoc[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponCodesInput, setCouponCodesInput] = useState("");
  const [couponDiscountInput, setCouponDiscountInput] = useState("10");
  const [couponCreateLoading, setCouponCreateLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState({ text: "", isError: false });
  const [deleteCouponConfirm, setDeleteCouponConfirm] = useState<string | null>(null);

  const [refreshTick, setRefreshTick] = useState(0);

  // Call this to re-fetch store data (from buttons / after mutations).
  // Setting dataLoading here is fine — it comes from an event handler, not an effect.
  const fetchAllData = useCallback(() => {
    setDataLoading(true);
    setRefreshTick(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    // setDataLoading(true) is intentionally deferred into the first .then() so it
    // stays out of the synchronous effect body (satisfies no-direct-set-state-in-use-effect).
    Promise.resolve()
      .then(() => { if (!cancelled) setDataLoading(true); })
      .then(() => Promise.all([fetch("/api/products"), fetch("/api/categories")]))
      .then(([r1, r2]) => Promise.all([r1.json() as Promise<unknown>, r2.json() as Promise<unknown>]))
      .then(([dp, dc]) => {
        if (cancelled) return;
        if (Array.isArray(dp)) setProducts(dp as Product[]);
        if (Array.isArray(dc)) {
          const cats = dc as Category[];
          setCategories(cats);
          if (cats.length > 0) {
            setProductForm(prev => ({ ...prev, category: prev.category || cats[0]._id }));
          }
        }
      })
      .catch(err => console.error("Failed to load store data:", err))
      .finally(() => { if (!cancelled) setDataLoading(false); });
    return () => { cancelled = true; };
  }, [isAdmin, refreshTick]);

  useEffect(() => {
    if (!isAdmin || activeTab !== "orders") return;
    let cancelled = false;
    Promise.resolve()
      .then(() => { if (!cancelled) setOrdersLoading(true); })
      .then(() => {
        const params = new URLSearchParams({ page: String(ordersPage), limit: "20" });
        if (orderStatusFilter) params.set("status", orderStatusFilter);
        return fetch(`/api/admin/orders?${params}`).then(r => r.json() as Promise<{ orders: AdminOrder[]; total: number; pages: number }>);
      })
      .then(data => {
        if (cancelled) return;
        setOrders(data.orders ?? []);
        setOrdersTotal(data.total ?? 0);
        setOrdersPages(data.pages ?? 1);
      })
      .catch(err => console.error("Failed to load orders:", err))
      .finally(() => { if (!cancelled) setOrdersLoading(false); });
    return () => { cancelled = true; };
  }, [isAdmin, activeTab, ordersPage, orderStatusFilter]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      console.error("Failed to update order status:", err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  useEffect(() => {
    if (!isAdmin || activeTab !== "settings") return;
    let cancelled = false;
    Promise.resolve()
      .then(() => { if (!cancelled) setAdminsLoading(true); })
      .then(() => Promise.all([
        fetch("/api/admin/settings").then(r => r.json() as Promise<{ fromEmail: string; shippingFeeInside: number; shippingFeeOutside: number }>),
        fetch("/api/admin/admins").then(r => r.json() as Promise<AdminUser[]>),
      ]))
      .then(([s, a]) => {
        if (cancelled) return;
        setFromEmail(s.fromEmail ?? "");
        setFromEmailInput(s.fromEmail ?? "");
        setShippingFeeInside(s.shippingFeeInside ?? 50);
        setShippingFeeOutside(s.shippingFeeOutside ?? 150);
        setShippingFeeInsideInput(String(s.shippingFeeInside ?? 50));
        setShippingFeeOutsideInput(String(s.shippingFeeOutside ?? 150));
        if (Array.isArray(a)) setAdmins(a);
      })
      .catch(err => console.error("Failed to load settings:", err))
      .finally(() => { if (!cancelled) setAdminsLoading(false); });
    return () => { cancelled = true; };
  }, [isAdmin, activeTab]);

  useEffect(() => {
    if (!isAdmin || activeTab !== "coupons") return;
    let cancelled = false;
    Promise.resolve()
      .then(() => { if (!cancelled) setCouponsLoading(true); })
      .then(() => fetch("/api/admin/coupons").then(r => r.json() as Promise<CouponDoc[]>))
      .then(data => { if (!cancelled && Array.isArray(data)) setCoupons(data); })
      .catch(err => console.error("Failed to load coupons:", err))
      .finally(() => { if (!cancelled) setCouponsLoading(false); });
    return () => { cancelled = true; };
  }, [isAdmin, activeTab]);

  const handleCreateCoupons = async (e: React.FormEvent) => {
    e.preventDefault();
    const discount = Number(couponDiscountInput);
    if (!discount || discount < 1 || discount > 100) {
      setCouponMessage({ text: "Discount must be between 1 and 100.", isError: true });
      return;
    }
    const codes = couponCodesInput
      .split(/[\n,]+/)
      .map(c => c.trim().toUpperCase())
      .filter(Boolean);
    if (codes.length === 0) {
      setCouponMessage({ text: "Enter at least one coupon code.", isError: true });
      return;
    }
    setCouponCreateLoading(true);
    setCouponMessage({ text: "", isError: false });
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes, discountPercent: discount }),
      });
      const data = await res.json() as { created?: number; message?: string };
      if (res.ok || res.status === 409) {
        if (res.ok) setCouponCodesInput("");
        const createdCount = data.created ?? 0;
        const createdText = createdCount > 0 ? `${createdCount} coupon${createdCount !== 1 ? "s" : ""} created. ` : "";
        setCouponMessage({ text: `${createdText}${data.message ?? ""}`.trim() || "Done.", isError: false });
        // Refresh list to reflect any newly inserted codes
        fetch("/api/admin/coupons")
          .then(r => r.json() as Promise<CouponDoc[]>)
          .then(d => { if (Array.isArray(d)) setCoupons(d); })
          .catch(() => {});
      } else {
        setCouponMessage({ text: data.message || "Failed to create coupons.", isError: true });
      }
    } catch {
      setCouponMessage({ text: "Network error.", isError: true });
    } finally {
      setCouponCreateLoading(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCoupons(prev => prev.filter(c => c._id !== id));
        setDeleteCouponConfirm(null);
      } else {
        const data = await res.json() as { message?: string };
        alert(data.message || "Failed to delete coupon.");
      }
    } catch {
      alert("Network error while deleting coupon.");
    }
  };

  const handleToggleCoupon = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (res.ok) {
        setCoupons(prev => prev.map(c => c._id === id ? { ...c, isActive } : c));
      }
    } catch {
      console.error("Failed to toggle coupon.");
    }
  };

  const handleFromEmailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFromEmailLoading(true);
    setFromEmailMessage({ text: "", isError: false });
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromEmail: fromEmailInput }),
      });
      const data = await res.json() as { message: string; fromEmail?: string };
      if (res.ok) {
        setFromEmail(data.fromEmail ?? fromEmailInput);
        setFromEmailMessage({ text: "From-email saved successfully.", isError: false });
      } else {
        setFromEmailMessage({ text: data.message || "Failed to save.", isError: true });
      }
    } catch {
      setFromEmailMessage({ text: "Network error.", isError: true });
    } finally {
      setFromEmailLoading(false);
    }
  };

  const handleShippingFeeSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setShippingFeeLoading(true);
    setShippingFeeMessage({ text: "", isError: false });
    const inside = Number(shippingFeeInsideInput);
    const outside = Number(shippingFeeOutsideInput);
    if (isNaN(inside) || inside < 0 || isNaN(outside) || outside < 0) {
      setShippingFeeMessage({ text: "Shipping fees must be non-negative numbers.", isError: true });
      setShippingFeeLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingFeeInside: inside, shippingFeeOutside: outside }),
      });
      const data = await res.json() as { message: string };
      if (res.ok) {
        setShippingFeeInside(inside);
        setShippingFeeOutside(outside);
        setShippingFeeMessage({ text: "Shipping fees saved successfully.", isError: false });
      } else {
        setShippingFeeMessage({ text: data.message || "Failed to save.", isError: true });
      }
    } catch {
      setShippingFeeMessage({ text: "Network error.", isError: true });
    } finally {
      setShippingFeeLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAdminLoading(true);
    setAddAdminMessage({ text: "", isError: false });
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addAdminEmail }),
      });
      const data = await res.json() as { message: string; user?: AdminUser };
      if (res.ok && data.user) {
        setAdmins(prev => prev.some(a => a._id === data.user!._id) ? prev : [...prev, data.user!]);
        setAddAdminEmail("");
        setAddAdminMessage({ text: data.message, isError: false });
      } else {
        setAddAdminMessage({ text: data.message || "Failed to add admin.", isError: true });
      }
    } catch {
      setAddAdminMessage({ text: "Network error.", isError: true });
    } finally {
      setAddAdminLoading(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    try {
      const res = await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { message: string };
      if (res.ok) {
        setAdmins(prev => prev.filter(a => a.email !== email));
        setRemoveAdminConfirm(null);
      } else {
        alert(data.message || "Failed to remove admin.");
      }
    } catch {
      alert("Network error.");
    }
  };

  // Handle Add or Edit Product Form Submission
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.description.replace(/<[^>]+>/g, "").trim()) {
      setProductMessage({ text: "Component overview / specs is required.", isError: true });
      return;
    }
    setProductActionLoading(true);
    setProductMessage({ text: "", isError: false });

    const endpoint = isEditingProduct 
      ? `/api/admin/products/${productForm._id}` 
      : "/api/admin/products";
    const method = isEditingProduct ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productForm,
          price: parseFloat(productForm.price),
          discount: parseFloat(productForm.discount) || 0,
          stock: parseInt(productForm.stock) || 0
        })
      });

      const result = await response.json();

      if (response.ok) {
        setProductMessage({
          text: isEditingProduct ? "Product updated successfully!" : "Product added successfully!",
          isError: false
        });
        
        // Reset form & states
        resetProductForm();
        // Refresh products list
        void fetchAllData();
        
        // Switch tab to product list if we just added a product
        if (!isEditingProduct) {
          setActiveTab("products");
        }
      } else {
        setProductMessage({ text: result.message || "Failed to process product.", isError: true });
      }
    } catch (err) {
      console.error(err);
      setProductMessage({ text: "A network error occurred. Please try again.", isError: true });
    } finally {
      setProductActionLoading(false);
    }
  };

  // Populate form for product editing
  const startEditProduct = (p: Product) => {
    setIsEditingProduct(true);
    const catId = typeof p.category === "object" ? p.category._id : p.category;
    setProductForm({
      _id: p._id,
      name: p.name,
      description: p.description,
      price: String(p.price),
      discount: String(p.discount),
      image: p.image,
      stock: String(p.stock),
      category: catId,
      featured: p.featured || false
    });
    // Scroll smoothly to form section on active view
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetProductForm = () => {
    setProductForm({
      _id: "",
      name: "",
      description: "",
      price: "",
      discount: "0",
      image: "",
      stock: "0",
      category: categories[0]?._id || "",
      featured: false
    });
    setIsEditingProduct(false);
  };

  // Handle Product Deletion
  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (response.ok) {
        setProducts(prev => prev.filter(p => p._id !== id));
        setDeleteProductConfirm(null);
      } else {
        alert(result.message || "Failed to delete product.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("A network error occurred while deleting product.");
    }
  };

  // Handle Add or Edit Category Form Submission
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryActionLoading(true);
    setCategoryMessage({ text: "", isError: false });

    const endpoint = isEditingCategory 
      ? `/api/admin/categories/${categoryForm._id}` 
      : "/api/admin/categories";
    const method = isEditingCategory ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm)
      });

      const result = await response.json();

      if (response.ok) {
        setCategoryMessage({
          text: isEditingCategory ? "Category updated successfully!" : "Category created successfully!",
          isError: false
        });
        resetCategoryForm();
        void fetchAllData();
      } else {
        setCategoryMessage({ text: result.message || "Failed to process category.", isError: true });
      }
    } catch (err) {
      console.error(err);
      setCategoryMessage({ text: "A network error occurred.", isError: true });
    } finally {
      setCategoryActionLoading(false);
    }
  };

  // Populate form for category editing
  const startEditCategory = (c: Category) => {
    setIsEditingCategory(true);
    setCategoryForm({
      _id: c._id,
      name: c.name,
      description: c.description || "",
      icon: c.icon || "",
      featured: c.featured || false
    });
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      _id: "",
      name: "",
      description: "",
      icon: "",
      featured: false
    });
    setIsEditingCategory(false);
  };

  // Handle Category Deletion
  const deleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (response.ok) {
        setCategories(prev => prev.filter(c => c._id !== id));
        setDeleteCategoryConfirm(null);
      } else {
        alert(result.message || "Failed to delete category.");
      }
    } catch (err) {
      console.error("Delete category error:", err);
      alert("A network error occurred while deleting category.");
    }
  };

  // General loading status during auth check
  if (status === "loading") {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Verifying credentials and loading portal...</p>
      </div>
    );
  }

  // =========================================================
  // GUEST / NORMAL USER VIEW (SHARE & CAREERS PORTAL)
  // =========================================================
  if (!isAdmin) {
    return (
      <div className={styles.portalContainer}>
        {/* Decorative Background Glows */}
        <div className={styles.glowTop}></div>
        <div className={styles.glowBottom}></div>

        <div className={styles.portalHeader}>
          <span className="badge badge-primary">GROW WITH US</span>
          <h1 className={`${styles.portalTitle} gradient-text`}>
            Partnerships & Careers
          </h1>
          <p className={styles.portalSub}>
            Robotics Shop CTG is pioneering the hardware development and electronics ecosystem in Bangladesh. 
            We are expanding rapidly and welcome investors, innovators, and leaders to join our mission.
          </p>
        </div>

        {/* Core Pillars Grid */}
        <div className={styles.pillarsGrid}>
          
          {/* Card 1: Share / Equity */}
          <div className={`${styles.pillarCard} glass-card`}>
            <div className={`${styles.iconWrapper} ${styles.blueIcon}`}>
              <BriefcaseIcon width={32} height={32} />
            </div>
            <h3>Share In Our Company</h3>
            <p>
              Support the next hardware revolution in Chittagong. We offer strategic equity share 
              partnerships for technology enthusiasts, angle investors, and institutional partners who 
              want to support sustainable electronics sourcing and high-end local R&D.
            </p>
            <div className={styles.cardBadge}>Equity & Shares</div>
          </div>

          {/* Card 2: Engineering */}
          <div className={`${styles.pillarCard} glass-card`}>
            <div className={`${styles.iconWrapper} ${styles.purpleIcon}`}>
              <CpuChipIcon width={32} height={32} />
            </div>
            <h3>Join as Hardware/IoT Engineer</h3>
            <p>
              Build the hardware products of tomorrow. We are seeking creative firmware developers, 
              embedded C++ programmers, robotics kits creators, and custom PCB specialists. 
              Gain access to advanced test equipment and turn prototype diagrams into production components.
            </p>
            <div className={styles.cardBadge}>Engineering & R&D</div>
          </div>

          {/* Card 3: Operations / Admin */}
          <div className={`${styles.pillarCard} glass-card`}>
            <div className={`${styles.iconWrapper} ${styles.orangeIcon}`}>
              <UserGroupIcon width={32} height={32} />
            </div>
            <h3>Join our Sourcing & Admin Team</h3>
            <p>
              Keep our robust logistics engine running flawlessly. We are constantly searching for 
              operations managers, marketing leaders, component sourcers, warehouse managers, 
              and technical support experts dedicated to providing exceptional customer experiences.
            </p>
            <div className={styles.cardBadge}>Operations & Sourcing</div>
          </div>

        </div>

        {/* Call to Action Banner */}
        <div className={`${styles.ctaSection} glass-card`}>
          <div className={styles.ctaContent}>
            <h2>Ready to shape the hardware landscape?</h2>
            <p>
              Whether you want to invest, code, design, or manage, get in touch with our leadership team today.
              Let&apos;s create the future of robotics together.
            </p>
          </div>
          <Link href="/contact" className="btn-orange">
            Contact Now
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================
  // ADMIN PANEL VIEW
  // =========================================================
  
  // Calculate dynamic metrics
  const totalProducts = products.length;
  const outOfStockProducts = products.filter(p => p.stock === 0).length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 10).length;
  const averageDiscount = totalProducts > 0 
    ? Math.round(products.reduce((acc, p) => acc + p.discount, 0) / totalProducts) 
    : 0;

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const catId = typeof p.category === "object" ? p.category._id : p.category;
    const matchesCategory = !categoryFilter || catId === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className={styles.adminContainer}>
      {/* Admin Header */}
      <div className={styles.adminHeader}>
        <div>
          <h1 className={styles.headerTitle}>Inventory & Sourcing Dashboard</h1>
          <p className={styles.headerSub}>Logged in as Administrator ({sessionUser?.email})</p>
        </div>
        <button onClick={fetchAllData} className="btn-secondary" title="Refresh store data" disabled={dataLoading}>
          <ArrowPathIcon width={16} height={16} className={dataLoading ? styles.spin : ""} />
          Refresh Data
        </button>
      </div>

      {/* Tabs Menu */}
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabBtn} ${activeTab === "dashboard" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <ChartBarIcon width={18} height={18} />
          Metrics Overview
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === "products" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <ClipboardDocumentListIcon width={18} height={18} />
          Manage Products
          {totalProducts > 0 && <span className={styles.tabBadge}>{totalProducts}</span>}
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "categories" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          <TagIcon width={18} height={18} />
          Category Sourcing
          {categories.length > 0 && <span className={styles.tabBadge}>{categories.length}</span>}
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "orders" ? styles.activeTab : ""}`}
          onClick={() => { setOrdersPage(1); setActiveTab("orders"); }}
        >
          <ClipboardDocumentListIcon width={18} height={18} />
          Orders
          {ordersTotal > 0 && <span className={styles.tabBadge}>{ordersTotal}</span>}
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "coupons" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("coupons")}
        >
          <TagIcon width={18} height={18} />
          Coupons
          {coupons.length > 0 && <span className={styles.tabBadge}>{coupons.length}</span>}
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "settings" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <Cog6ToothIcon width={18} height={18} />
          Settings
        </button>
      </div>

      {/* Message Notifications */}
      {productMessage.text && (
        <div className={`${styles.alert} ${productMessage.isError ? styles.alertError : styles.alertSuccess}`}>
          {productMessage.isError ? <ExclamationTriangleIcon width={20} height={20} /> : <CheckIcon width={20} height={20} />}
          <span>{productMessage.text}</span>
          <button onClick={() => setProductMessage({ text: "", isError: false })} className={styles.alertClose}>
            <XMarkIcon width={16} height={16} />
          </button>
        </div>
      )}

      {/* Dynamic Tab Render */}
      
      {/* ── TAB 1: METRICS OVERVIEW ── */}
      {activeTab === "dashboard" && (
        <div className={styles.tabContent}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statVal}>{totalProducts}</span>
              <span className={styles.statLabel}>Total Components</span>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statVal} ${outOfStockProducts > 0 ? styles.textRed : ""}`}>{outOfStockProducts}</span>
              <span className={styles.statLabel}>Out of Stock</span>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statVal} ${lowStockProducts > 0 ? styles.textOrange : ""}`}>{lowStockProducts}</span>
              <span className={styles.statLabel}>Low Stock Alert</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statVal}>{averageDiscount}%</span>
              <span className={styles.statLabel}>Avg Store Discount</span>
            </div>
          </div>

          {/* Quick Actions and Sourcing Summary */}
          <div className={styles.dashboardSummaryRow}>
            <div className={`${styles.summaryBox} glass-card`}>
              <h3>Product Sourcing Shortcuts</h3>
              <p>Quickly add new components or manage active discounts to boost conversions.</p>
              <div className={styles.shortcutBtns}>
                <button 
                  onClick={() => {
                    resetProductForm();
                    setActiveTab("products");
                  }} 
                  className="btn-primary"
                >
                  <PlusIcon width={18} height={18} /> Add New Component
                </button>
                <button onClick={() => setActiveTab("categories")} className="btn-secondary">
                  Manage Categories
                </button>
              </div>
            </div>

            <div className={`${styles.summaryBox} glass-card`}>
              <h3>Alert Sourcing Status</h3>
              <div className={styles.alertItemsList}>
                {products.filter(p => p.stock < 5).slice(0, 5).map(p => (
                  <div className={styles.alertItem} key={p._id}>
                    <div className={styles.alertItemInfo}>
                      <span className={styles.alertItemName}>{p.name}</span>
                      <span className={styles.alertItemStock}>Stock: {p.stock} units</span>
                    </div>
                    <button onClick={() => { startEditProduct(p); setActiveTab("products"); }} className={styles.alertEditBtn}>
                      Restock
                    </button>
                  </div>
                ))}
                {products.filter(p => p.stock < 5).length === 0 && (
                  <p className={styles.emptyAlertText}>✓ All inventory items have adequate stock levels.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MANAGE PRODUCTS ── */}
      {activeTab === "products" && (
        <div className={styles.tabContent}>
          
          {/* Sourcing / Editing Form Drawer (Sticks on top for high visibility) */}
          <div className={`${styles.productFormSection} glass-card`}>
            <h3>{isEditingProduct ? `✏️ Edit Sourcing: ${productForm.name}` : "📥 Add New Robotics Component"}</h3>
            
            <form onSubmit={handleProductSubmit} className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Component Name *</label>
                <input 
                  required 
                  type="text" 
                  value={productForm.name} 
                  onChange={e => setProductForm({...productForm, name: e.target.value})} 
                  placeholder="e.g. Raspberry Pi 5 8GB" 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Sourcing Category *</label>
                <select 
                  required
                  value={productForm.category}
                  onChange={e => setProductForm({...productForm, category: e.target.value})}
                >
                  <option value="" disabled>Select Sourcing Area</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
                <label>Component Overview & Specs *</label>
                <RichTextEditor
                  value={productForm.description}
                  onChange={html => setProductForm(prev => ({ ...prev, description: html }))}
                  placeholder="Provide pinouts, voltage details, sensor data, or general description..."
                />
              </div>

              <div className={styles.formGroup}>
                <label>Base Price ($) *</label>
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  value={productForm.price} 
                  onChange={e => setProductForm({...productForm, price: e.target.value})} 
                  placeholder="0.00" 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Discount Rate (%)</label>
                <input 
                  type="number" 
                  min="0"
                  max="99"
                  value={productForm.discount} 
                  onChange={e => setProductForm({...productForm, discount: e.target.value})} 
                  placeholder="0" 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Stock Level *</label>
                <input 
                  required 
                  type="number" 
                  min="0"
                  value={productForm.stock} 
                  onChange={e => setProductForm({...productForm, stock: e.target.value})} 
                  placeholder="10" 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Product Thumbnail Image URL *</label>
                <input 
                  required 
                  type="url" 
                  value={productForm.image} 
                  onChange={e => setProductForm({...productForm, image: e.target.value})} 
                  placeholder="https://example.com/component.jpg" 
                />
              </div>

              <div className={`${styles.formGroup} ${styles.checkboxGroup}`} style={{ gridColumn: "span 2" }}>
                <label className={styles.switchLabel}>
                  <input 
                    type="checkbox" 
                    checked={productForm.featured} 
                    onChange={e => setProductForm({...productForm, featured: e.target.checked})} 
                  />
                  <span>Feature component on Storefront Homepage</span>
                </label>
              </div>

              <div className={styles.formActions} style={{ gridColumn: "span 2" }}>
                <button type="submit" className="btn-primary" disabled={productActionLoading}>
                  {productActionLoading ? "Processing..." : isEditingProduct ? "Update Component" : "Publish Component"}
                </button>
                {isEditingProduct && (
                  <button type="button" onClick={resetProductForm} className="btn-secondary">
                    Cancel Editing
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Search, Filter and Sourcing Listing */}
          <div className={`${styles.listingSection} glass-card`}>
            <div className={styles.searchRow}>
              <h3>Active Store Inventory</h3>
              
              <div className={styles.filtersWrapper}>
                <div className={styles.searchInputWrapper}>
                  <MagnifyingGlassIcon width={18} height={18} className={styles.searchIcon} />
                  <input 
                    type="text" 
                    placeholder="Search components..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                <select 
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className={styles.filterDropdown}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Interactive Table */}
            {dataLoading ? (
              <div className={styles.tableSkeleton}>
                <div className={styles.skeletonRow}></div>
                <div className={styles.skeletonRow}></div>
                <div className={styles.skeletonRow}></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className={styles.emptyTable}>
                <p>No components match the active sourcing filters.</p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Discount</th>
                      <th>Stock</th>
                      <th>Featured</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => {
                      const discountPrice = p.price - (p.price * (p.discount / 100));
                      const catName = typeof p.category === "object" ? p.category.name : 
                                      categories.find(c => c._id === p.category)?.name || "Component";

                      // Stock status classes
                      let stockBadgeClass = styles.badgeHigh;
                      let stockLabel = "In Stock";
                      if (p.stock === 0) {
                        stockBadgeClass = styles.badgeZero;
                        stockLabel = "Out of Stock";
                      } else if (p.stock < 10) {
                        stockBadgeClass = styles.badgeLow;
                        stockLabel = `Low (${p.stock})`;
                      } else {
                        stockLabel = `OK (${p.stock})`;
                      }

                      return (
                        <tr key={p._id}>
                          <td>
                            <div className={styles.tableThumb}>
                              <Image
                                src={p.image}
                                alt={p.name}
                                width={36}
                                height={36}
                                style={{ objectFit: "contain", flexShrink: 0 }}
                                unoptimized
                              />
                            </div>
                          </td>
                          <td className={styles.tableNameCell} title={p.name}>
                            <Link href={`/products/${p._id}`} className={styles.tableLink} target="_blank">
                              {p.name}
                            </Link>
                          </td>
                          <td><span className={styles.tableCatBadge}>{catName}</span></td>
                          <td>
                            <div className={styles.priceCell}>
                              <span className={styles.currentPrice}>৳{discountPrice.toFixed(2)}</span>
                              {p.discount > 0 && <span className={styles.originalPrice}>৳{p.price.toFixed(2)}</span>}
                            </div>
                          </td>
                          <td>
                            {p.discount > 0 ? (
                              <span className="badge badge-orange">-{p.discount}%</span>
                            ) : (
                              <span className={styles.grayText}>—</span>
                            )}
                          </td>
                          <td>
                            <span className={`${styles.stockStatusBadge} ${stockBadgeClass}`}>
                              {stockLabel}
                            </span>
                          </td>
                          <td>
                            {p.featured ? (
                              <span className={styles.featuredBadge}>Yes</span>
                            ) : (
                              <span className={styles.grayText}>No</span>
                            )}
                          </td>
                          <td>
                            <div className={styles.actionBtns}>
                              <button 
                                onClick={() => startEditProduct(p)} 
                                className={styles.editBtn} 
                                title="Edit product parameters"
                              >
                                <PencilSquareIcon width={16} height={16} />
                              </button>
                              
                              {deleteProductConfirm === p._id ? (
                                <div className={styles.confirmDeleteWrapper}>
                                  <button onClick={() => deleteProduct(p._id)} className={styles.deleteConfirmBtn}>Yes</button>
                                  <button onClick={() => setDeleteProductConfirm(null)} className={styles.deleteCancelBtn}>No</button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setDeleteProductConfirm(p._id)} 
                                  className={styles.deleteBtn} 
                                  title="Delete product"
                                >
                                  <TrashIcon width={16} height={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: CATEGORY SOURCING ── */}
      {activeTab === "categories" && (
        <div className={styles.tabContent}>
          <div className={styles.categoriesSplitGrid}>
            
            {/* Category Sourcing Add / Edit Form */}
            <div className={`${styles.categoryFormPanel} glass-card`}>
              <h3>{isEditingCategory ? `✏️ Edit Area: ${categoryForm.name}` : "📂 Create Sourcing Category"}</h3>
              {categoryMessage.text && (
                <div className={`${styles.alert} ${categoryMessage.isError ? styles.alertError : styles.alertSuccess}`} style={{ margin: "1rem 0" }}>
                  <span>{categoryMessage.text}</span>
                </div>
              )}
              
              <form onSubmit={handleCategorySubmit} style={{ marginTop: "1rem" }}>
                <div className={styles.formGroup}>
                  <label>Category Title *</label>
                  <input 
                    required 
                    type="text" 
                    value={categoryForm.name} 
                    onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} 
                    placeholder="e.g. Embedded Controllers" 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea 
                    rows={3} 
                    value={categoryForm.description} 
                    onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} 
                    placeholder="Provide keywords or describe components grouped under this category..." 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Icon Identifier (Heroicon Name / Slug)</label>
                  <input 
                    type="text" 
                    value={categoryForm.icon} 
                    onChange={e => setCategoryForm({...categoryForm, icon: e.target.value})} 
                    placeholder="e.g. cpu-chip" 
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
                  <label className={styles.switchLabel}>
                    <input 
                      type="checkbox" 
                      checked={categoryForm.featured} 
                      onChange={e => setCategoryForm({...categoryForm, featured: e.target.checked})} 
                    />
                    <span>Highlight in filter categories</span>
                  </label>
                </div>

                <div className={styles.formActions} style={{ marginTop: "1.5rem" }}>
                  <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={categoryActionLoading}>
                    {categoryActionLoading ? "Processing..." : isEditingCategory ? "Save Category Area" : "Build Category"}
                  </button>
                  {isEditingCategory && (
                    <button type="button" onClick={resetCategoryForm} className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                      Cancel Customization
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Categories Listing Grid */}
            <div className={`${styles.categoriesListPanel} glass-card`}>
              <h3>Active Sourcing Categories</h3>
              
              {dataLoading ? (
                <div style={{ padding: "2rem", textAlign: "center" }}>Loading categories...</div>
              ) : categories.length === 0 ? (
                <p style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>No categories exist. Create one using the form on the left.</p>
              ) : (
                <div className={styles.categoriesPillsGrid}>
                  {categories.map(c => {
                    const relativeProducts = products.filter(p => {
                      const catId = typeof p.category === "object" ? p.category._id : p.category;
                      return catId === c._id;
                    });

                    return (
                      <div className={styles.categoryManageCard} key={c._id}>
                        <div className={styles.categoryCardHeader}>
                          <div>
                            <h4>{c.name}</h4>
                            <span className={styles.categoryCardSlug}>Slug: {c.slug}</span>
                          </div>
                          <span className={styles.categoryProductBadge}>
                            {relativeProducts.length} items
                          </span>
                        </div>

                        {c.description && <p className={styles.categoryCardDesc}>{c.description}</p>}

                        <div className={styles.categoryCardActions}>
                          <button onClick={() => startEditCategory(c)} className={styles.categoryCardEditBtn}>
                            Configure Area
                          </button>
                          
                          {deleteCategoryConfirm === c._id ? (
                            <div className={styles.confirmDeleteWrapper}>
                              <button onClick={() => deleteCategory(c._id)} className={styles.deleteConfirmBtn}>Yes</button>
                              <button onClick={() => setDeleteCategoryConfirm(null)} className={styles.deleteCancelBtn}>No</button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setDeleteCategoryConfirm(c._id)} 
                              className={styles.categoryCardDeleteBtn}
                              disabled={relativeProducts.length > 0}
                              title={relativeProducts.length > 0 ? "Cannot delete category containing components." : "Remove category"}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── TAB 4: ORDERS ── */}
      {activeTab === "orders" && (
        <div className={styles.tabContent}>
          <div className={`${styles.listingSection} glass-card`}>
            <div className={styles.searchRow}>
              <h3>
                All Orders{" "}
                <span className={styles.grayText} style={{ fontSize: "0.9rem", fontWeight: 400 }}>
                  ({ordersTotal})
                </span>
              </h3>
              <div className={styles.filtersWrapper}>
                <select
                  value={orderStatusFilter}
                  onChange={e => { setOrderStatusFilter(e.target.value); setOrdersPage(1); }}
                  className={styles.filterDropdown}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {ordersLoading ? (
              <div className={styles.tableSkeleton}>
                {[...Array(5)].map((_, i) => <div key={i} className={styles.skeletonRow} />)}
              </div>
            ) : orders.length === 0 ? (
              <div className={styles.emptyTable}><p>No orders found.</p></div>
            ) : (
              <div className={styles.orderList}>
                {orders.map(o => {
                  const isExpanded = expandedOrderId === o._id;
                  const subtotal = o.items.reduce((s, i) => s + i.priceAtPurchase * i.quantity, 0);

                  return (
                    <div key={o._id} className={`${styles.orderCard} ${isExpanded ? styles.orderCardExpanded : ""}`}>
                      {/* Clickable summary row */}
                      <div
                        className={styles.orderCardHeader}
                        onClick={() => setExpandedOrderId(isExpanded ? null : o._id)}
                        role="button"
                        aria-expanded={isExpanded}
                      >
                        <span className={styles.orderIdCell}>#{o._id.slice(-8).toUpperCase()}</span>
                        <div className={styles.orderCustomerCell}>
                          <span className={styles.alertItemName}>{o.buyerDetails?.name ?? "—"}</span>
                          <span className={styles.adminRowEmail}>{o.buyerDetails?.phone ?? "—"}</span>
                        </div>
                        <span className={styles.tableCatBadge}>
                          {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                        </span>
                        <span className={styles.currentPrice}>৳{o.total.toFixed(2)}</span>
                        <span className={styles.grayText} style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                          {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        <select
                          value={o.status}
                          disabled={updatingOrderId === o._id}
                          onChange={e => updateOrderStatus(o._id, e.target.value)}
                          className={styles.orderStatusSelect}
                          data-status={o.status}
                          onClick={e => e.stopPropagation()}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <ChevronDownIcon
                          width={16}
                          height={16}
                          className={`${styles.expandIcon} ${isExpanded ? styles.expandIconOpen : ""}`}
                        />
                      </div>

                      {/* Expanded detail body */}
                      {isExpanded && (
                        <div className={styles.orderCardBody}>
                          <div className={styles.orderDetailsGrid}>
                            {/* Customer details */}
                            <div className={styles.orderSection}>
                              <h4 className={styles.orderSectionTitle}>Customer Details</h4>
                              {(
                                [
                                  ["Name",     o.buyerDetails?.name],
                                  ["Email",    o.buyerDetails?.email],
                                  ["Phone",    o.buyerDetails?.phone],
                                  ["Address",  o.buyerDetails?.address],
                                  ["District", o.buyerDetails?.city],
                                ] as [string, string | undefined][]
                              ).map(([label, value]) => (
                                <div key={label} className={styles.orderDetailRow}>
                                  <span className={styles.orderDetailLabel}>{label}</span>
                                  <span className={styles.orderDetailValue}>{value ?? "—"}</span>
                                </div>
                              ))}
                            </div>

                            {/* Shipping & meta */}
                            <div className={styles.orderSection}>
                              <h4 className={styles.orderSectionTitle}>Delivery & Payment</h4>
                              <div className={styles.orderDetailRow}>
                                <span className={styles.orderDetailLabel}>Zone</span>
                                <span className={o.shippingZone === "inside" ? styles.zoneBadgeInside : styles.zoneBadgeOutside}>
                                  {o.shippingZone === "inside" ? "Inside CTG" : "Outside CTG"}
                                </span>
                              </div>
                              <div className={styles.orderDetailRow}>
                                <span className={styles.orderDetailLabel}>Shipping Fee</span>
                                <span className={styles.orderDetailValue}>৳{(o.shippingFee ?? 0).toFixed(2)}</span>
                              </div>
                              <div className={styles.orderDetailRow}>
                                <span className={styles.orderDetailLabel}>Payment</span>
                                <span className={styles.orderDetailValue}>Cash on Delivery</span>
                              </div>
                              <div className={styles.orderDetailRow}>
                                <span className={styles.orderDetailLabel}>Date</span>
                                <span className={styles.orderDetailValue}>
                                  {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                                </span>
                              </div>
                              <div className={styles.orderDetailRow}>
                                <span className={styles.orderDetailLabel}>Order ID</span>
                                <span className={styles.orderDetailMono}>{o._id}</span>
                              </div>
                            </div>
                          </div>

                          {/* Items table */}
                          <div className={styles.orderItemsSection}>
                            <h4 className={styles.orderSectionTitle}>Ordered Items</h4>
                            <table className={styles.orderItemsTable}>
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>Qty</th>
                                  <th>Unit Price</th>
                                  <th>Line Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {o.items.map((item, idx) => (
                                  <tr key={idx}>
                                    <td>{item.productName}</td>
                                    <td>{item.quantity}</td>
                                    <td>৳{item.priceAtPurchase.toFixed(2)}</td>
                                    <td>৳{(item.priceAtPurchase * item.quantity).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <td colSpan={3} className={styles.orderDetailLabel}>Items Subtotal</td>
                                  <td>৳{subtotal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                  <td colSpan={3} className={styles.orderDetailLabel}>Shipping</td>
                                  <td>৳{(o.shippingFee ?? 0).toFixed(2)}</td>
                                </tr>
                                <tr className={styles.orderTotalRow}>
                                  <td colSpan={3}>Grand Total</td>
                                  <td>৳{o.total.toFixed(2)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {ordersPages > 1 && (
              <div className={styles.paginationRow}>
                <button
                  className="btn-secondary"
                  disabled={ordersPage <= 1}
                  onClick={() => setOrdersPage(p => p - 1)}
                >
                  Previous
                </button>
                <span className={styles.grayText}>Page {ordersPage} of {ordersPages}</span>
                <button
                  className="btn-secondary"
                  disabled={ordersPage >= ordersPages}
                  onClick={() => setOrdersPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 5: SETTINGS ── */}
      {activeTab === "settings" && (
        <div className={styles.tabContent}>
          {adminsLoading ? (
            <div className={styles.loadingContainer} style={{ minHeight: "30vh" }}>
              <div className={styles.spinner}></div>
              <p>Loading settings...</p>
            </div>
          ) : (
            <div className={styles.settingsGrid}>

              {/* Shipping Fees */}
              <div className={`${styles.settingsCard} glass-card`}>
                <div className={styles.settingsCardHeader}>
                  <Cog6ToothIcon width={22} height={22} />
                  <h3>Shipping Fees (COD)</h3>
                </div>
                <p className={styles.settingsCardDesc}>
                  Set delivery charges for each zone. Currently: Inside ৳{shippingFeeInside} / Outside ৳{shippingFeeOutside}.
                </p>

                {shippingFeeMessage.text && (
                  <div className={`${styles.alert} ${shippingFeeMessage.isError ? styles.alertError : styles.alertSuccess}`} style={{ marginBottom: "1rem" }}>
                    {shippingFeeMessage.isError
                      ? <ExclamationTriangleIcon width={18} height={18} />
                      : <CheckIcon width={18} height={18} />}
                    <span>{shippingFeeMessage.text}</span>
                    <button onClick={() => setShippingFeeMessage({ text: "", isError: false })} className={styles.alertClose}>
                      <XMarkIcon width={14} height={14} />
                    </button>
                  </div>
                )}

                <form onSubmit={handleShippingFeeSave} className={styles.settingsForm}>
                  <div className={styles.formGroup}>
                    <label>Inside Chottogram (৳)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={shippingFeeInsideInput}
                      onChange={e => setShippingFeeInsideInput(e.target.value)}
                      placeholder="50"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Outside Chottogram (৳)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={shippingFeeOutsideInput}
                      onChange={e => setShippingFeeOutsideInput(e.target.value)}
                      placeholder="150"
                    />
                  </div>
                  <button type="submit" className="btn-primary" disabled={shippingFeeLoading}>
                    {shippingFeeLoading ? "Saving..." : "Save Fees"}
                  </button>
                </form>
              </div>

              {/* From Email */}
              <div className={`${styles.settingsCard} glass-card`}>
                <div className={styles.settingsCardHeader}>
                  <EnvelopeIcon width={22} height={22} />
                  <h3>Outgoing Email Address</h3>
                </div>
                <p className={styles.settingsCardDesc}>
                  Emails sent by the system (order digests, contact replies) will use this address as the sender.
                  {fromEmail && <> Currently: <strong>{fromEmail}</strong></>}
                </p>

                {fromEmailMessage.text && (
                  <div className={`${styles.alert} ${fromEmailMessage.isError ? styles.alertError : styles.alertSuccess}`} style={{ marginBottom: "1rem" }}>
                    {fromEmailMessage.isError
                      ? <ExclamationTriangleIcon width={18} height={18} />
                      : <CheckIcon width={18} height={18} />}
                    <span>{fromEmailMessage.text}</span>
                    <button onClick={() => setFromEmailMessage({ text: "", isError: false })} className={styles.alertClose}>
                      <XMarkIcon width={14} height={14} />
                    </button>
                  </div>
                )}

                <form onSubmit={handleFromEmailSave} className={styles.settingsForm}>
                  <div className={styles.formGroup}>
                    <label>From Email *</label>
                    <input
                      required
                      type="email"
                      value={fromEmailInput}
                      onChange={e => setFromEmailInput(e.target.value)}
                      placeholder="noreply@roboticsshopctg.com"
                    />
                  </div>
                  <button type="submit" className="btn-primary" disabled={fromEmailLoading}>
                    {fromEmailLoading ? "Saving..." : "Save Email"}
                  </button>
                </form>
              </div>

              {/* Manage Admins */}
              <div className={`${styles.settingsCard} glass-card`}>
                <div className={styles.settingsCardHeader}>
                  <ShieldCheckIcon width={22} height={22} />
                  <h3>Admin Users</h3>
                </div>
                <p className={styles.settingsCardDesc}>
                  Grant admin access to existing registered users. The user must have an account before being promoted.
                </p>

                {addAdminMessage.text && (
                  <div className={`${styles.alert} ${addAdminMessage.isError ? styles.alertError : styles.alertSuccess}`} style={{ marginBottom: "1rem" }}>
                    {addAdminMessage.isError
                      ? <ExclamationTriangleIcon width={18} height={18} />
                      : <CheckIcon width={18} height={18} />}
                    <span>{addAdminMessage.text}</span>
                    <button onClick={() => setAddAdminMessage({ text: "", isError: false })} className={styles.alertClose}>
                      <XMarkIcon width={14} height={14} />
                    </button>
                  </div>
                )}

                <form onSubmit={handleAddAdmin} className={styles.settingsForm}>
                  <div className={styles.formGroup}>
                    <label>User Email *</label>
                    <input
                      required
                      type="email"
                      value={addAdminEmail}
                      onChange={e => setAddAdminEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                  <button type="submit" className="btn-primary" disabled={addAdminLoading}>
                    {addAdminLoading ? "Adding..." : "Grant Admin"}
                  </button>
                </form>

                {admins.length > 0 && (
                  <div className={styles.adminsList}>
                    <h4>Current Admins</h4>
                    {admins.map(a => (
                      <div className={styles.adminRow} key={a._id}>
                        <div className={styles.adminRowInfo}>
                          <span className={styles.adminRowName}>{a.name}</span>
                          <span className={styles.adminRowEmail}>{a.email}</span>
                        </div>
                        {removeAdminConfirm === a.email ? (
                          <div className={styles.confirmDeleteWrapper}>
                            <button onClick={() => handleRemoveAdmin(a.email)} className={styles.deleteConfirmBtn}>Yes</button>
                            <button onClick={() => setRemoveAdminConfirm(null)} className={styles.deleteCancelBtn}>No</button>
                          </div>
                        ) : (
                          a.email !== sessionUser?.email && (
                            <button
                              onClick={() => setRemoveAdminConfirm(a.email)}
                              className={styles.deleteBtn}
                              title="Remove admin role"
                            >
                              <TrashIcon width={15} height={15} />
                            </button>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* ── Coupons Tab ── */}
      {activeTab === "coupons" && (
        <div className={styles.tabContent}>
          <div className={styles.settingsGrid}>

            {/* Create coupons card */}
            <div className={`${styles.settingsCard} glass-card`}>
              <div className={styles.settingsCardHeader}>
                <TagIcon width={22} height={22} />
                <h3>Create Coupon Codes</h3>
              </div>
              <p className={styles.settingsCardDesc}>
                Enter one or more codes (comma or newline separated). All codes in a batch share the same discount percentage.
              </p>

              {couponMessage.text && (
                <div className={`${styles.alert} ${couponMessage.isError ? styles.alertError : styles.alertSuccess}`} style={{ marginBottom: "1rem" }}>
                  {couponMessage.isError ? <ExclamationTriangleIcon width={18} height={18} /> : <CheckIcon width={18} height={18} />}
                  <span>{couponMessage.text}</span>
                  <button onClick={() => setCouponMessage({ text: "", isError: false })} className={styles.alertClose}>
                    <XMarkIcon width={14} height={14} />
                  </button>
                </div>
              )}

              <form onSubmit={handleCreateCoupons} className={styles.settingsForm}>
                <div className={styles.formGroup}>
                  <label>Discount Percentage *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={100}
                    value={couponDiscountInput}
                    onChange={e => setCouponDiscountInput(e.target.value)}
                    placeholder="e.g. 15"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Coupon Codes * <span style={{ fontWeight: 400, color: "#94a3b8" }}>(one per line or comma-separated)</span></label>
                  <textarea
                    required
                    rows={4}
                    value={couponCodesInput}
                    onChange={e => setCouponCodesInput(e.target.value.toUpperCase())}
                    placeholder={"SUMMER20\nWELCOME10\nFLASH50"}
                    style={{ resize: "vertical", fontFamily: "monospace", letterSpacing: "0.04em" }}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={couponCreateLoading}>
                  {couponCreateLoading ? "Creating…" : "Create Coupons"}
                </button>
              </form>
            </div>

            {/* Coupon list card */}
            <div className={`${styles.settingsCard} glass-card`}>
              <div className={styles.settingsCardHeader}>
                <TagIcon width={22} height={22} />
                <h3>All Coupons</h3>
              </div>

              {couponsLoading ? (
                <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Loading…</p>
              ) : coupons.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No coupons yet.</p>
              ) : (
                <table className={styles.adminTable} style={{ marginTop: "0.5rem" }}>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Discount</th>
                      <th>Used</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map(c => (
                      <tr key={c._id}>
                        <td><code style={{ letterSpacing: "0.05em", fontWeight: 700 }}>{c.code}</code></td>
                        <td>{c.discountPercent}%</td>
                        <td>{c.usedBy.length}</td>
                        <td>
                          <button
                            onClick={() => handleToggleCoupon(c._id, !c.isActive)}
                            className={c.isActive ? styles.badgeHigh : styles.badgeZero}
                            style={{ border: "none", cursor: "pointer", borderRadius: "999px", padding: "2px 10px", fontSize: "0.75rem", fontWeight: 700 }}
                            title={c.isActive ? "Click to deactivate" : "Click to activate"}
                          >
                            {c.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td>
                          {deleteCouponConfirm === c._id ? (
                            <div className={styles.confirmDeleteWrapper}>
                              <button onClick={() => handleDeleteCoupon(c._id)} className={styles.deleteConfirmBtn}>Yes</button>
                              <button onClick={() => setDeleteCouponConfirm(null)} className={styles.deleteCancelBtn}>No</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteCouponConfirm(c._id)} className={styles.deleteBtn} title="Delete coupon">
                              <TrashIcon width={15} height={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
