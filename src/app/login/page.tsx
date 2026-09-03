'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const hasGoogleAuth = false; // Will be true when GOOGLE_CLIENT_ID is set

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: email || 'demo@aranalytics.com',
        name: name || 'Demo User',
        redirect: false,
      });
      if (result?.ok) {
        router.push('/overview');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/overview' });
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--cream)', padding: 'var(--space-8)',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <img
            src="/logo.png"
            alt="BOB Data Analyzer"
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-lg)',
              objectFit: 'contain',
              display: 'inline-block',
              marginBottom: 'var(--space-3)',
            }}
          />
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)', color: 'var(--dark-blue)' }}>
            Welcome to BOB Data Analyzer
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
            Sign in to start analyzing your data
          </p>
        </div>

        <div className="card card-elevated" style={{ padding: 'var(--space-8)' }}>
          {/* Google Sign In */}
          {hasGoogleAuth && (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleGoogleLogin}
                style={{ width: '100%', marginBottom: 'var(--space-4)', height: 48 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                margin: 'var(--space-4) 0', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)',
              }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
                or
                <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
              </div>
            </>
          )}

          {/* Demo / Email Login */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                Name
              </label>
              <input
                className="input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                Email
              </label>
              <input
                className="input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleDemoLogin}
              disabled={loading}
              style={{ width: '100%', height: 48, marginTop: 'var(--space-2)' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <div style={{
            marginTop: 'var(--space-4)', padding: 'var(--space-3)',
            background: 'var(--cream)', borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center',
          }}>
            Demo mode — enter any email to explore the platform with sample data.
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          By signing in, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
