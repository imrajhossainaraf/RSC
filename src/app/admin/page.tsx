"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

type Category = {
  _id: string;
  name: string;
};

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
    category: '',
    featured: false
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0) {
            setProduct(prev => ({ ...prev, category: data[0]._id }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (status === 'authenticated' && sessionUser?.role === 'admin') {
      void fetchCategories();
    }
  }, [status, sessionUser]);

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
        setProduct({
          name: '',
          description: '',
          price: '',
          discount: '',
          image: '',
          stock: '',
          category: categories[0]?._id || '',
          featured: false
        });
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
          <div className={styles.statValue}>{categories.length}</div>
          <div className={styles.statLabel}>Active Categories</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>1</div>
          <div className={styles.statLabel}>Admins</div>
        </div>
      </div>

      <div className={`${styles.adminSection} glass-card`}>
        <h2>Add New Component / Product</h2>
        {message && <div style={{ marginBottom: '1rem', fontWeight: 'bold', color: message.includes('successfully') ? '#10b981' : 'var(--accent)' }}>{message}</div>}
        
        <form onSubmit={handleAddProduct}>
          <div className={styles.formGroup}>
            <label>Product Name</label>
            <input required type="text" value={product.name} onChange={e => setProduct({...product, name: e.target.value})} placeholder="e.g. ESP32 Dev Module" />
          </div>
          
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea required rows={4} value={product.description} onChange={e => setProduct({...product, description: e.target.value})} placeholder="Add datasheet snippets, pinout specifications..." />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label>Price ($)</label>
              <input required type="number" step="0.01" value={product.price} onChange={e => setProduct({...product, price: e.target.value})} placeholder="0.00" />
            </div>
            
            <div className={styles.formGroup}>
              <label>Discount (%)</label>
              <input type="number" value={product.discount} onChange={e => setProduct({...product, discount: e.target.value})} placeholder="0" />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label>Stock Quantity</label>
              <input required type="number" value={product.stock} onChange={e => setProduct({...product, stock: e.target.value})} placeholder="10" />
            </div>
            
            <div className={styles.formGroup}>
              <label>Select Category</label>
              <select 
                required 
                value={product.category} 
                onChange={e => setProduct({...product, category: e.target.value})}
                className={styles.selectDropdown}
              >
                <option value="" disabled>Choose Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
            <div className={styles.formGroup}>
              <label>Image URL</label>
              <input required type="url" value={product.image} onChange={e => setProduct({...product, image: e.target.value})} placeholder="https://example.com/image.png" />
            </div>

            <div className={styles.formGroup} style={{ flexDirection: 'row', gap: '10px', alignItems: 'center', marginTop: '1.2rem' }}>
              <input 
                type="checkbox" 
                id="featured" 
                checked={product.featured} 
                onChange={e => setProduct({...product, featured: e.target.checked})}
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              <label htmlFor="featured" style={{ cursor: 'pointer' }}>Feature on Homepage</label>
            </div>
          </div>
          
          <button type="submit" className="btn-orange" style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Adding Product...' : 'Add Component'}
          </button>
        </form>
      </div>
    </div>
  );
}
