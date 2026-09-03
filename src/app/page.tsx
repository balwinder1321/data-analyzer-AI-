'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

/* ── Icon Components (SVG, no emoji) ── */
const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 5-6"/></svg>
);
const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const SparkleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>
);
const TableIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
);
const AlertIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      {/* Navigation */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--space-4) var(--space-8)',
        maxWidth: '1200px', margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <img
            src="/logo.png"
            alt="BOB Data Analyzer"
            style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', objectFit: 'contain' }}
          />
          <span style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--dark-blue)', letterSpacing: '-0.02em' }}>
            BOB Data Analyzer
          </span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" onClick={() => router.push('/login')}>Sign In</button>
          <button className="btn btn-primary" onClick={() => router.push('/login')}>
            Start Analyzing <ArrowRight />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        textAlign: 'center', padding: 'var(--space-24) var(--space-8) var(--space-16)',
        maxWidth: '800px', margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: 'var(--space-1) var(--space-3)', background: 'rgba(11,31,51,0.06)',
          borderRadius: '20px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)',
          fontWeight: 500, marginBottom: 'var(--space-6)',
        }}>
          <SparkleIcon /> AI-Powered Analytics Platform
        </div>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 700, lineHeight: 1.1,
          color: 'var(--dark-blue)', letterSpacing: '-0.03em', marginBottom: 'var(--space-6)',
        }}>
          Your data has answers.<br />Let AI find them.
        </h1>
        <p style={{
          fontSize: 'var(--text-lg)', color: 'var(--text-secondary)', lineHeight: 1.6,
          maxWidth: '600px', margin: '0 auto var(--space-8)',
        }}>
          Connect your spreadsheets and datasets. BOB Data Analyzer automatically discovers trends, anomalies, relationships and opportunities — and explains them in plain language.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => router.push('/login')}>
            Start Analyzing <ArrowRight />
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => {
            document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            See How It Works
          </button>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section style={{
        maxWidth: '1000px', margin: '0 auto var(--space-24)', padding: '0 var(--space-8)',
      }}>
        <div style={{
          background: 'var(--surface-card)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-lg)',
        }}>
          {/* Mini dashboard mockup */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Executive Summary</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginTop: 'var(--space-1)' }}>
                Revenue increased 18.4% compared with the previous period, primarily driven by enterprise customers.
              </div>
            </div>
            <div className="badge badge-primary">AI Generated</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
            {[
              { label: 'Revenue', value: '₹24.8M', change: '+18.4%' },
              { label: 'Customers', value: '12,847', change: '+8.2%' },
              { label: 'Conversion', value: '4.7%', change: '-1.2%' },
              { label: 'Avg Order', value: '₹1,932', change: '+5.1%' },
            ].map(kpi => (
              <div key={kpi.label} className="kpi-card">
                <div className="kpi-label">{kpi.label}</div>
                <div className="kpi-value" style={{ fontSize: 'var(--text-2xl)' }}>{kpi.value}</div>
                <div className={`kpi-change ${kpi.change.startsWith('+') ? 'kpi-change-positive' : 'kpi-change-negative'}`}>{kpi.change} vs prev period</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{
        maxWidth: '1000px', margin: '0 auto', padding: 'var(--space-16) var(--space-8)',
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-3)', color: 'var(--dark-blue)' }}>How It Works</h2>
        <p style={{ textAlign: 'center', marginBottom: 'var(--space-12)', color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
          Three steps to transform your data into actionable intelligence.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-8)' }}>
          {[
            { step: '01', title: 'Connect Your Data', desc: 'Upload a CSV/Excel file or connect a Google Sheet. Your data is encrypted and never shared.' },
            { step: '02', title: 'AI Analyzes Everything', desc: 'Our engine profiles your data, detects anomalies, finds trends, and identifies correlations — automatically.' },
            { step: '03', title: 'Get Actionable Insights', desc: 'View AI-generated summaries, interactive charts, and drill into the data that matters most.' },
          ].map(item => (
            <div key={item.step}>
              <div style={{
                fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--silver)',
                marginBottom: 'var(--space-3)', fontVariantNumeric: 'tabular-nums',
              }}>{item.step}</div>
              <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>{item.title}</h3>
              <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, color: 'var(--text-tertiary)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section style={{
        maxWidth: '1000px', margin: '0 auto', padding: 'var(--space-16) var(--space-8)',
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-3)', color: 'var(--dark-blue)' }}>Intelligent Analytics</h2>
        <p style={{ textAlign: 'center', marginBottom: 'var(--space-12)', color: 'var(--text-secondary)' }}>
          Real statistical analysis, not just pretty charts.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
          {[
            { icon: <ChartIcon />, title: 'Automatic Visualization', desc: 'The right chart for the right data. Line charts, bar charts, scatter plots, heatmaps — selected intelligently.' },
            { icon: <AlertIcon />, title: 'Anomaly Detection', desc: 'Z-score, IQR, rolling window, and change-point detection. Find unusual values, spikes, and sudden shifts.' },
            { icon: <SparkleIcon />, title: 'AI-Powered Insights', desc: 'Ask questions in plain English. Get answers grounded in your actual data — never hallucinated.' },
            { icon: <TableIcon />, title: 'Data Quality Scoring', desc: 'Completeness, consistency, validity, uniqueness. Know the health of your data before making decisions.' },
            { icon: <ShieldIcon />, title: 'Enterprise Security', desc: 'OAuth authentication, encrypted storage, secure API design. Your data stays private.' },
            { icon: <ChartIcon />, title: 'Google Sheets Integration', desc: 'Connect directly to Google Sheets. Auto-sync your data and keep analytics up to date.' },
          ].map(item => (
            <div key={item.title} className="card">
              <div style={{ color: 'var(--dark-blue)', marginBottom: 'var(--space-4)' }}>{item.icon}</div>
              <h4 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-2)' }}>{item.title}</h4>
              <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, color: 'var(--text-tertiary)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        textAlign: 'center', padding: 'var(--space-20) var(--space-8)',
        maxWidth: '600px', margin: '0 auto',
      }}>
        <h2 style={{ marginBottom: 'var(--space-4)', color: 'var(--dark-blue)' }}>Ready to start?</h2>
        <p style={{ marginBottom: 'var(--space-6)', color: 'var(--text-secondary)' }}>
          Upload your first dataset and discover what your data has been trying to tell you.
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => router.push('/login')}>
          Start Analyzing — Free <ArrowRight />
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-default)', padding: 'var(--space-8)',
        textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <img
            src="/logo.png"
            alt="BOB Data Analyzer"
            style={{ width: 22, height: 22, borderRadius: 'var(--radius-sm)', objectFit: 'contain' }}
          />
          <span style={{ fontWeight: 600 }}>BOB Data Analyzer</span>
        </div>
        © {new Date().getFullYear()} BOB Data Analyzer. Turn raw data into decisions.
      </footer>
    </div>
  );
}
