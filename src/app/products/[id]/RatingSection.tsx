"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import styles from './RatingSection.module.css';

type Review = {
  _id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className={styles.starDisplay}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= Math.round(rating) ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className={styles.starPicker}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          className={star <= (hovered || value) ? styles.starPickerFilled : styles.starPickerEmpty}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <span className={styles.ratingLabel}>{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][value]}</span>
      )}
    </div>
  );
}

export default function RatingSection({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/reviews?product=${productId}`)
      .then(res => res.json())
      .then(data => { setReviews(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { setError('Please select a star rating'); return; }
    if (!comment.trim()) { setError('Please write a comment'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to submit review');
      } else {
        setReviews(prev => [data, ...prev]);
        setRating(0);
        setComment('');
        toast.success('Review submitted successfully!');
      }
    } catch {
      toast.error('Failed to submit review. Please try again.');
      setError('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.ratingSection}>
      <h2 className={styles.sectionTitle}>Customer Reviews</h2>

      {session?.user ? (
        <form onSubmit={handleSubmit} className={styles.reviewForm}>
          <h3 className={styles.formTitle}>Write a Review</h3>
          <div className={styles.formGroup}>
            <label>Your Rating</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="review-comment">Your Review</label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              className={styles.commentInput}
              rows={4}
            />
          </div>
          {error && <p className={styles.errorMsg}>{error}</p>}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      ) : (
        <div className={styles.loginPrompt}>
          <p>Please <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}>sign in</Link> to write a review.</p>
        </div>
      )}

      <div className={styles.reviewsList}>
        {loading ? (
          <p className={styles.emptyText}>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className={styles.emptyText}>No reviews yet. Be the first to review this product!</p>
        ) : (
          reviews.map(review => (
            <div key={review._id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <StarDisplay rating={review.rating} />
                <span className={styles.reviewerName}>{review.userName}</span>
                <span className={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className={styles.reviewComment}>{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
