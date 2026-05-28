"use client";

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';
import { ShoppingCartIcon } from '@heroicons/react/24/solid';
import { toast } from 'sonner';

type ClientAddToCartProps = {
  product: {
    productId: string;
    name: string;
    price: number;
    image: string;
    stock: number;
  }
};

export default function ClientAddToCart({ product }: ClientAddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const handleAdd = () => {
    addToCart({
      productId: product.productId,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
    });
    toast.success(`${product.name} added to cart`);
  };

  if (product.stock <= 0) {
    return <button className="btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>Out of Stock</button>;
  }

  return (
    <div className={styles.actionArea}>
      <div className={styles.quantitySelector}>
        <button 
          className={styles.quantityBtn} 
          onClick={() => setQuantity(q => Math.max(1, q - 1))}
        >
          -
        </button>
        <input 
          type="number" 
          value={quantity} 
          readOnly 
          className={styles.quantityInput}
        />
        <button 
          className={styles.quantityBtn} 
          onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
        >
          +
        </button>
      </div>
      <button 
        className="btn-primary" 
        onClick={handleAdd}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
      >
        <ShoppingCartIcon width={20} height={20} />
        Add to Cart
      </button>
    </div>
  );
}
