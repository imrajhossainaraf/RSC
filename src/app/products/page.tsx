"use client";

import { Suspense, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  image: string;
};

function ProductsContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const fetchProducts = useCallback(async (searchQuery = '') => {
    setLoading(true);
    let url = '/api/products?';
    if (category) url += `category=${category}&`;
    if (searchQuery) url += `search=${searchQuery}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    const loadProducts = async () => {
      await fetchProducts();
    };

    void loadProducts();
  }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void fetchProducts(search);
  };

  return (
    <div className={styles.productsContainer}>
      <div className={styles.header}>
        <h1>{category ? `${category.charAt(0).toUpperCase() + category.slice(1)}` : 'All Products'}</h1>
        <form onSubmit={handleSearch} className={styles.searchBar}>
          <input 
            type="text" 
            placeholder="Search components..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : products.length > 0 ? (
        <div className={styles.grid}>
          {products.map((product) => (
            <Link href={`/products/${product._id}`} key={product._id} className={styles.card}>
              <div className={styles.imagePlaceholder}>
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className={styles.imageFallback}>Image Placeholder</div>
                )}
                {product.discount > 0 && (
                  <span className={styles.discountBadge}>-{product.discount}% OFF</span>
                )}
              </div>
              <div className={styles.content}>
                <h2 className={styles.title}>{product.name}</h2>
                <div className={styles.priceRow}>
                  <div>
                    <span className={styles.price}>
                      ${(product.price - (product.price * (product.discount / 100))).toFixed(2)}
                    </span>
                    {product.discount > 0 && (
                      <span className={styles.originalPrice}>${product.price.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p style={{ color: '#a0aec0' }}>No products found.</p>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ProductsContent />
    </Suspense>
  );
}
