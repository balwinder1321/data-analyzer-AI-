'use client';

import { useSession, signOut } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account, integrations, and preferences.</p>
      </div>

      <div style={{ maxWidth: 600 }}>
        {/* Account */}
        <section className="section">
          <div className="section-title">Account</div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--dark-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--cream)', fontWeight: 600, fontSize: 'var(--text-lg)',
              }}>
                {(session?.user?.name?.[0] || session?.user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>{session?.user?.name || 'User'}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{session?.user?.email}</div>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => signOut({ callbackUrl: '/' })}>
              Sign Out
            </button>
          </div>
        </section>

        {/* Integrations */}
        <section className="section">
          <div className="section-title">Integrations</div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>Google Sheets</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  {process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ENABLED === 'true' ? 'Connected' : 'Not configured'}
                </div>
              </div>
              <span className="badge badge-outline">
                {process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ENABLED === 'true' ? 'Active' : 'Setup Required'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>AI Analysis (Gemini)</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  {process.env.NEXT_PUBLIC_DEMO_MODE === 'false' ? 'Active' : 'Demo mode — using computed analytics'}
                </div>
              </div>
              <span className="badge badge-outline">
                {process.env.NEXT_PUBLIC_DEMO_MODE === 'false' ? 'Active' : 'Demo Mode'}
              </span>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="section">
          <div className="section-title">Data Management</div>
          <div className="card">
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              Your data is stored securely and processed only for your analysis. You can delete all your data at any time.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button className="btn btn-secondary btn-sm">Export All Data</button>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>Delete All Data</button>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="section">
          <div className="section-title">About</div>
          <div className="card" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
            <p>AR Analytics v1.0.0</p>
            <p>Turn raw data into decisions.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
