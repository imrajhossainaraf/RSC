"use client";

import { useState } from 'react';
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
    } catch (error) {
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

        {/* Contact info cards & maps placeholder */}
        <aside className={styles.infoAside}>
          <div className={`${styles.infoCard} glass-card`}>
            <h3>Robotics Shop CTG Office</h3>
            <p>Chittagong Industrial Center, Zone 3</p>
            <p>Chittagong, Bangladesh</p>
            <div className={styles.divider}></div>
            <p><strong>Email:</strong> support@roboticsshopctg.com</p>
            <p><strong>Phone:</strong> +880-1700-000000</p>
            <p><strong>Hours:</strong> Saturday - Thursday (9 AM - 6 PM)</p>
          </div>

          <div className={`${styles.mapPlaceholder} glass-card`}>
            <span>Chittagong Operations Map Center</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
