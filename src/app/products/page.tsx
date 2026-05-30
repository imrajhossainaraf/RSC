"use client";

import { Suspense, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import WishlistButton from '@/components/WishlistButton';
import { FunnelIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
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
  stock: number;
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
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('99999');
  const [inStock, setInStock] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (active && Array.isArray(data)) setCategories(data);
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
      setLoading(true);
      let url = `/api/products?sort=${sort}&minPrice=${minPrice}&maxPrice=${maxPrice}&`;
      if (activeCategorySlug) url += `category=${activeCategorySlug}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (inStock) url += `inStock=true`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (active) setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [activeCategorySlug, sort, minPrice, maxPrice, inStock, search]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleCategoryClick = (slug: string) => {
    router.push(slug ? `/products?category=${slug}` : '/products');
  };

  const clearFilters = () => {
    setSort('newest');
    setMinPrice('0');
    setMaxPrice('99999');
    setInStock(false);
    handleCategoryClick('');
    setFilterOpen(false);
  };

  const activeFilterCount = [
    !!activeCategorySlug,
    inStock,
    sort !== 'newest',
    minPrice !== '0' || maxPrice !== '99999',
  ].filter(Boolean).length;

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

      {/* Compact Filter Bar */}
      <div className={styles.filterBar} ref={filterRef}>
        <div className={styles.filterBarRow}>
          <div className={styles.activeChips}>
            {activeCategorySlug && (
              <span className={styles.chip}>
                {categories.find(c => c.slug === activeCategorySlug)?.name}
                <button onClick={() => handleCategoryClick('')} className={styles.chipRemove}>×</button>
              </span>
            )}
            {inStock && (
              <span className={styles.chip}>
                In Stock
                <button onClick={() => setInStock(false)} className={styles.chipRemove}>×</button>
              </span>
            )}
            {sort !== 'newest' && (
              <span className={styles.chip}>
                {sort === 'price_asc' ? 'Price ↑' : sort === 'price_desc' ? 'Price ↓' : 'Top Rated'}
                <button onClick={() => setSort('newest')} className={styles.chipRemove}>×</button>
              </span>
            )}
          </div>

          <button
            className={`${styles.filterToggleBtn} ${filterOpen ? styles.filterToggleBtnOpen : ''}`}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <FunnelIcon width={15} height={15} />
            Filter your choice
            {activeFilterCount > 0 && (
              <span className={styles.filterBadge}>{activeFilterCount}</span>
            )}
            <ChevronDownIcon
              width={13}
              height={13}
              className={filterOpen ? styles.chevronUp : ''}
            />
          </button>
        </div>

        {filterOpen && (
          <div className={styles.filterDropdown}>
            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Category</label>
              <select
                value={activeCategorySlug}
                onChange={(e) => handleCategoryClick(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Sort by</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Price (৳)</label>
              <div className={styles.priceRangeInputs}>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span className={styles.priceSep}>–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <label className={`${styles.checkboxLabel} ${styles.filterItem}`}>
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
              />
              <span>In Stock Only</span>
            </label>

            <button className={styles.clearBtn} onClick={clearFilters}>
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Product Grid */}
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
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className={styles.imageFallback}>No Image</div>
                    )}
                    {product.discount > 0 && (
                      <span className={styles.discountBadge}>-{product.discount}%</span>
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
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>({product.reviewCount})</span>
                    </div>
                  )}

                  <div className={styles.priceRow}>
                    <span className={styles.price}>
                      ৳{(product.price - (product.price * (product.discount / 100))).toFixed(2)}
                    </span>
                    {product.discount > 0 && (
                      <span className={styles.originalPrice}>৳{product.price.toFixed(2)}</span>
                    )}
                  </div>

                  <div className={styles.cardFooter}>
                    <Link
                      href={`/products/${product._id}`}
                      className="btn-orange"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Order Now
                    </Link>
                    <WishlistButton
                      productId={product._id}
                      name={product.name}
                      price={product.price - (product.price * (product.discount / 100))}
                      image={product.image}
                      stock={product.stock}
                    />
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
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: '500px' }}></div>}>
      <ProductsContent />
    </Suspense>
  );
}
