"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import styles from './page.module.css';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('quote');
  const [message, setMessage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });

      if (res.ok) {
        setStatus('success');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.contactContainer}>
      <header className={styles.header}>
        <span className="badge badge-orange">Get in Touch</span>
        <h1>Contact Our Engineering Division</h1>
        <p className={styles.subtext}>
          Have inquiries regarding order status, component datasheets, or custom assembly projects? Drop us a line.
        </p>
      </header>

      <div className={styles.layoutGrid}>
        {/* Contact Form */}
        <section className={`${styles.formSection} glass-card`}>
          <h2>Send a Message</h2>
          <form onSubmit={handleSubmit} className={styles.contactForm}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Your Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="subject">Subject / Inquiry Type</label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="quote">Request for Custom Quote (PCB / Harnesses)</option>
                <option value="sales">Sales & Bulk Orders Inquiry</option>
                <option value="support">Technical & Datasheet Support</option>
                <option value="other">General Feedback / Other</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message">Message / Details</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your project, custom schematics info, or general questions..."
                rows={5}
                required
              ></textarea>
            </div>

            <button type="submit" className="btn-orange" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Sending Message...' : 'Send Message'}
            </button>

            {status === 'success' && (
              <p className={styles.successMsg}>✓ Message sent successfully! Our engineering team will review it.</p>
            )}
            {status === 'error' && (
              <p className={styles.errorMsg}>✗ Failed to dispatch message. Please verify network connections.</p>
            )}
          </form>
        </section>

        {/* Contact info */}
        <aside className={styles.infoAside}>
          <div className={`${styles.infoCard} glass-card`}>
            <h3>Robotics Shop CTG</h3>

            <a href="https://maps.google.com/?q=Dewanhat+Chittagong" target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
              <MapPinIcon width={18} height={18} className={styles.contactIcon} />
              <span>Dewanhat, Chittagong 4100</span>
            </a>

            <a href="mailto:roboticsshopctg@gmail.com" className={styles.contactLink}>
              <EnvelopeIcon width={18} height={18} className={styles.contactIcon} />
              <span>roboticsshopctg@gmail.com</span>
            </a>

            <a href="https://wa.me/8801870643378" target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
              <PhoneIcon width={18} height={18} className={styles.contactIcon} />
              <span>+880 1870-643378 (WhatsApp)</span>
            </a>

            <a href="https://www.facebook.com/profile.php?id=61585433094374" target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
              <GlobeAltIcon width={18} height={18} className={styles.contactIcon} />
              <span>Facebook Page</span>
            </a>

            <div className={styles.divider}></div>
            <p className={styles.hours}><strong>Hours:</strong> Saturday – Thursday, 9 AM – 6 PM</p>
          </div>

          {/* Quick-reach buttons */}
          <div className={`${styles.quickCard} glass-card`}>
            <h4>Reach Us Instantly</h4>
            <Link
              href="https://wa.me/8801870643378"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.quickBtn}
              style={{ background: '#25d366', color: '#fff' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.534 5.845L.054 23.399a.75.75 0 0 0 .931.918l5.746-1.505A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.72 9.72 0 0 1-4.964-1.362l-.356-.213-3.69.967.984-3.594-.233-.37A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
              </svg>
              Chat on WhatsApp
            </Link>
            <Link
              href="https://www.facebook.com/profile.php?id=61585433094374"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.quickBtn}
              style={{ background: '#1877f2', color: '#fff' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
              Message on Facebook
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
