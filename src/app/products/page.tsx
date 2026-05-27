"use client";

import { Suspense, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './page.module.css';

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  image: string;
  rating: number;
  reviewCount: number;
};

type Category = {
  _id: string;
  name: string;
  slug: string;
  productCount: number;
};

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategorySlug = searchParams.get('category') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Filters State
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('500');
  const [inStock, setInStock] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchProducts = useCallback(async (searchQuery = '') => {
    setLoading(true);
    let url = `/api/products?sort=${sort}&minPrice=${minPrice}&maxPrice=${maxPrice}&`;
    if (activeCategorySlug) url += `category=${activeCategorySlug}&`;
    if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
    if (inStock) url += `inStock=true`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error(error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategorySlug, sort, minPrice, maxPrice, inStock]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (active && Array.isArray(data)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCategories(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      let url = `/api/products?sort=${sort}&minPrice=${minPrice}&maxPrice=${maxPrice}&`;
      if (activeCategorySlug) url += `category=${activeCategorySlug}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (inStock) url += `inStock=true`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        if (active) {
          if (Array.isArray(data)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setProducts(data);
          } else {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setProducts([]);
          }
        }
      } catch (error) {
        console.error(error);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (active) setProducts([]);
      } finally {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [activeCategorySlug, sort, minPrice, maxPrice, inStock, search]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void fetchProducts(search);
  };

  const handleCategoryClick = (slug: string) => {
    if (slug) {
      router.push(`/products?category=${slug}`);
    } else {
      router.push('/products');
    }
  };

  return (
    <div className={styles.productsContainer}>
      <div className={styles.header}>
        <div>
          <h1 className="gradient-text">
            {activeCategorySlug
              ? categories.find((c) => c.slug === activeCategorySlug)?.name || 'Products'
              : 'All Products'}
          </h1>
          <p className={styles.subtext}>Explore top-tier hardware modules and kits.</p>
        </div>
        <form onSubmit={handleSearchSubmit} className={styles.searchBar}>
          <input 
            type="text" 
            placeholder="Search components, modules..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      <div className={styles.layoutGrid}>
        {/* Sidebar Filters */}
        <aside className={`${styles.filterPanel} glass-card`}>
          <div className={styles.filterSection}>
            <h3>Filter by Category</h3>
            <div className={styles.categoryFilterList}>
              <button
                onClick={() => handleCategoryClick('')}
                className={`${styles.filterCatButton} ${!activeCategorySlug ? styles.activeCat : ''}`}
              >
                <span>All Categories</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`${styles.filterCatButton} ${activeCategorySlug === cat.slug ? styles.activeCat : ''}`}
                >
                  <span>{cat.name}</span>
                  <span className={styles.catBadge}>{cat.productCount || 0}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3>Sort By</h3>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className={styles.filterSelect}>
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          <div className={styles.filterSection}>
            <h3>Price Range ($)</h3>
            <div className={styles.priceRangeInputs}>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span style={{ color: '#64748b' }}>to</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.filterSection}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Product Cards Grid */}
        <div className={styles.mainGridContent}>
          {loading ? (
            <div className={styles.skeletonsGrid}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`${styles.skeletonCard} skeleton`} style={{ height: '360px' }}></div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className={styles.grid}>
              {products.map((product) => (
                <div key={product._id} className={styles.card}>
                  <Link href={`/products/${product._id}`} className={styles.cardImageLink}>
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
                        <div className={styles.imageFallback}>No Image Available</div>
                      )}
                      {product.discount > 0 && (
                        <span className={styles.discountBadge}>-{product.discount}% OFF</span>
                      )}
                    </div>
                  </Link>

                  <div className={styles.content}>
                    <Link href={`/products/${product._id}`} className={styles.titleLink}>
                      <h2 className={styles.title}>{product.name}</h2>
                    </Link>

                    {product.reviewCount > 0 && (
                      <div className={styles.ratingRow}>
                        <span style={{ color: '#fbbf24' }}>★ {product.rating.toFixed(1)}</span>
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>({product.reviewCount} reviews)</span>
                      </div>
                    )}

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

                    <div className={styles.cardFooter}>
                      <Link href={`/products/${product._id}`} className="btn-orange" style={{ width: '100%', justifyContent: 'center' }}>
                        Order Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No products match your criteria. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: '500px' }}></div>}>
      <ProductsContent />
    </Suspense>
  );
}
