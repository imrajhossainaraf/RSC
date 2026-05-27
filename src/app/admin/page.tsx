"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const sessionUser = session?.user as { role?: string } | undefined;
  const router = useRouter();
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    discount: '',
    image: '',
    stock: '',
    category: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className={styles.loadingState}>Loading admin dashboard...</div>;
  }

  if (status === 'authenticated' && sessionUser?.role !== 'admin') {
    return (
      <div className={styles.emptyState}>
        <h2>Access denied</h2>
        <p>You do not have permission to access the admin dashboard.</p>
      </div>
    );
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          price: parseFloat(product.price),
          discount: parseFloat(product.discount) || 0,
          stock: parseInt(product.stock) || 0
        })
      });
      
      if (res.ok) {
        setMessage('Product added successfully!');
        setProduct({ name: '', description: '', price: '', discount: '', image: '', stock: '', category: '' });
      } else {
        const data = await res.json();
        setMessage(data.message || 'Error adding product');
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.adminContainer}>
      <h1 className={styles.header}>Admin Dashboard</h1>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>12</div>
          <div className={styles.statLabel}>Total Orders</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>45</div>
          <div className={styles.statLabel}>Products</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>3</div>
          <div className={styles.statLabel}>Admins</div>
        </div>
      </div>

      <div className={styles.adminSection}>
        <h2>Add New Product</h2>
        {message && <div style={{ marginBottom: '1rem', color: message.includes('success') ? '#34A853' : 'var(--accent)' }}>{message}</div>}
        
        <form onSubmit={handleAddProduct}>
          <div className={styles.formGroup}>
            <label>Product Name</label>
            <input required type="text" value={product.name} onChange={e => setProduct({...product, name: e.target.value})} />
          </div>
          
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea required rows={4} value={product.description} onChange={e => setProduct({...product, description: e.target.value})} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label>Price ($)</label>
              <input required type="number" step="0.01" value={product.price} onChange={e => setProduct({...product, price: e.target.value})} />
            </div>
            
            <div className={styles.formGroup}>
              <label>Discount (%)</label>
              <input type="number" value={product.discount} onChange={e => setProduct({...product, discount: e.target.value})} />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label>Stock</label>
              <input required type="number" value={product.stock} onChange={e => setProduct({...product, stock: e.target.value})} />
            </div>
            
            <div className={styles.formGroup}>
              <label>Category (Object ID or Name)</label>
              <input required type="text" value={product.category} onChange={e => setProduct({...product, category: e.target.value})} />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label>Image URL</label>
            <input required type="url" value={product.image} onChange={e => setProduct({...product, image: e.target.value})} />
          </div>
          
          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Adding...' : 'Add Product'}
          </button>
        </form>
      </div>
      
      {/* Additional sections for Order Management and Admin Management can be added here */}
    </div>
  );
}
