'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'signin' | 'register'>('signin');

  // Sign In fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await signIn('credentials', {
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword.trim(),
        redirect: false,
      });

      if (res?.error) {
        // NextAuth passes the thrown message or generic credentials error
        if (res.error.toLowerCase().includes('awaiting approval') || res.error.toLowerCase().includes('pending')) {
          setErrorMsg('Your account is awaiting approval by the administrator (admin@bob.com).');
        } else if (res.error.toLowerCase().includes('revoked') || res.error.toLowerCase().includes('rejected')) {
          setErrorMsg('Your account access has been revoked by the administrator.');
        } else {
          setErrorMsg('Invalid email or password. Please check your credentials.');
        }
      } else if (res?.ok) {
        if (loginEmail.trim().toLowerCase() === 'admin@bob.com') {
          router.push('/admin');
        } else {
          router.push('/overview');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Unable to sign in. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMsg('All registration fields are required.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setRegSuccess('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRegSuccess(data.message);
        setRegName('');
        setRegEmail('');
        setRegPassword('');
      } else {
        setErrorMsg(data.error || 'Failed to submit registration request.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process registration. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--cream)',
        padding: 'var(--space-6)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Brand Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <img
            src="/logo.png"
            alt="BOB Data Analyzer"
            style={{
              width: 58,
              height: 58,
              borderRadius: 'var(--radius-lg)',
              objectFit: 'contain',
              display: 'inline-block',
              marginBottom: 'var(--space-3)',
            }}
          />
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-1)', color: 'var(--dark-blue)' }}>
            BOB Data Analyzer
          </h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            Authorized Enterprise Analytics & Intelligence
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            borderBottom: 'none',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => { setTab('signin'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: 'var(--space-3)',
              fontSize: 'var(--text-sm)',
              fontWeight: tab === 'signin' ? 700 : 500,
              background: tab === 'signin' ? 'var(--surface-card)' : 'var(--cream)',
              color: tab === 'signin' ? 'var(--dark-blue)' : 'var(--text-tertiary)',
              borderBottom: tab === 'signin' ? '2px solid var(--dark-blue)' : '1px solid var(--border-default)',
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg(''); setRegSuccess(''); }}
            style={{
              flex: 1,
              padding: 'var(--space-3)',
              fontSize: 'var(--text-sm)',
              fontWeight: tab === 'register' ? 700 : 500,
              background: tab === 'register' ? 'var(--surface-card)' : 'var(--cream)',
              color: tab === 'register' ? 'var(--dark-blue)' : 'var(--text-tertiary)',
              borderBottom: tab === 'register' ? '2px solid var(--dark-blue)' : '1px solid var(--border-default)',
              cursor: 'pointer',
            }}
          >
            Request Access
          </button>
        </div>

        {/* Form Card */}
        <div className="card card-elevated" style={{ padding: 'var(--space-6)', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
          {errorMsg && (
            <div
              style={{
                padding: 'var(--space-3)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--error)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--error)',
                fontSize: 'var(--text-xs)',
                marginBottom: 'var(--space-4)',
                lineHeight: 1.5,
              }}
            >
              {errorMsg}
            </div>
          )}

          {regSuccess && (
            <div
              style={{
                padding: 'var(--space-3)',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid #16a34a',
                borderRadius: 'var(--radius-md)',
                color: '#15803d',
                fontSize: 'var(--text-xs)',
                marginBottom: 'var(--space-4)',
                lineHeight: 1.5,
              }}
            >
              {regSuccess}
            </div>
          )}

          {tab === 'signin' ? (
            <form onSubmit={handleCredentialsLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                  Email Address
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                  Password
                </label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', height: 44, marginTop: 'var(--space-2)' }}
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
              </button>

              {/* Authorized Credentials Guide */}
              <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                  Authorized System Accounts
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: '11px' }}>
                  <div
                    onClick={() => { setLoginEmail('balwindersinghsardar1@gmail.com'); setLoginPassword('123123'); }}
                    style={{
                      background: 'var(--cream)',
                      padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--dark-blue)' }}>Data Analyst Login:</div>
                    <div style={{ color: 'var(--text-secondary)' }}>balwindersinghsardar1@gmail.com (pass: 123123)</div>
                  </div>

                  <div
                    onClick={() => { setLoginEmail('admin@bob.com'); setLoginPassword('admin123'); }}
                    style={{
                      background: 'var(--cream)',
                      padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--dark-blue)' }}>Administrator Portal:</div>
                    <div style={{ color: 'var(--text-secondary)' }}>admin@bob.com (pass: admin123)</div>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                  Full Name
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                  Email Address
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="jane@company.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                  Choose Password (min 6 characters)
                </label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', height: 44, marginTop: 'var(--space-2)' }}
              >
                {loading ? 'Submitting Request...' : 'Submit Request for Admin Approval'}
              </button>

              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1.5, marginTop: 'var(--space-2)', textAlign: 'center' }}>
                New accounts require verification by the system administrator (admin@bob.com) before login access is granted.
              </p>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          BOB Data Analyzer &copy; {new Date().getFullYear()} &middot; Secured Access
        </p>
      </div>
    </div>
  );
}
