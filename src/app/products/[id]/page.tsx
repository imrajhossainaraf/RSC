import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import ClientAddToCart from './ClientAddToCart';
import styles from './page.module.css';

export const revalidate = 60; // revalidate every 60 seconds

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  await dbConnect();
  
  let product = null;
  try {
    product = await Product.findById(params.id).lean();
  } catch (e) {
    // Invalid ObjectId format
    return notFound();
  }

  if (!product) {
    return notFound();
  }

  const discountedPrice = product.price - (product.price * (product.discount / 100));

  return (
    <div className={styles.detailContainer}>
      <div className={styles.imageSection}>
        {product.image ? (
           /* eslint-disable-next-line @next/next/no-img-element */
          <img src={product.image} alt={product.name} className={styles.image} />
        ) : (
          <div className={styles.placeholder}>No Image Available</div>
        )}
      </div>
      
      <div className={styles.infoSection}>
        <h1 className={styles.title}>{product.name}</h1>
        
        <div className={styles.priceArea}>
          <span className={styles.price}>${discountedPrice.toFixed(2)}</span>
          {product.discount > 0 && (
            <>
              <span className={styles.originalPrice}>${product.price.toFixed(2)}</span>
              <span className={styles.badge}>Save {product.discount}%</span>
            </>
          )}
        </div>
        
        <p className={styles.stock}>
          {product.stock > 0 ? (
            <span style={{ color: '#34A853' }}>In Stock ({product.stock} available)</span>
          ) : (
            <span style={{ color: 'var(--accent)' }}>Out of Stock</span>
          )}
        </p>
        
        <div className={styles.description}>
          <h3>Description</h3>
          <p>{product.description}</p>
        </div>

        <ClientAddToCart product={{
          productId: product._id.toString(),
          name: product.name,
          price: discountedPrice,
          image: product.image,
          stock: product.stock
        }} />
      </div>
    </div>
  );
}
