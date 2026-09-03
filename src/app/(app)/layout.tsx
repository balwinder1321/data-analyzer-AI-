'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { SessionProvider } from 'next-auth/react';

/* ── Navigation Icons ── */
const icons: Record<string, React.ReactNode> = {
  home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  database: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  lightbulb: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/></svg>,
  alert: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  chart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 5-6"/></svg>,
  message: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  file: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  logout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const NAV_ITEMS = [
  { label: 'Overview', href: '/overview', icon: 'home' },
  { label: 'Data', href: '/data', icon: 'database' },
  { label: 'Insights', href: '/insights', icon: 'lightbulb' },
  { label: 'Anomalies', href: '/anomalies', icon: 'alert' },
  { label: 'Visualize', href: '/visualize', icon: 'chart' },
  { label: 'AI Analyst', href: '/analyst', icon: 'message' },
  { label: 'Reports', href: '/reports', icon: 'file' },
];

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: 'var(--sidebar-width)', background: 'var(--surface-card)',
        borderRight: '1px solid var(--border-default)', display: 'flex',
        flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 'var(--z-sticky)',
      }} className="sidebar-desktop">
        {/* Logo */}
        <div style={{
          padding: 'var(--space-5) var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            width: 28, height: 28, background: 'var(--dark-blue)', borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--cream)', fontSize: '11px', fontWeight: 700,
          }}>AR</div>
          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--dark-blue)' }}>Analytics</span>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)', fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--dark-blue)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--cream)' : 'transparent',
                  border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                  transition: 'all 120ms ease',
                }}
                onMouseEnter={e => { if (!isActive) (e.target as HTMLElement).style.background = 'var(--cream-hover)'; }}
                onMouseLeave={e => { if (!isActive) (e.target as HTMLElement).style.background = 'transparent'; }}
              >
                {icons[item.icon]}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User + Settings */}
        <div style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => router.push('/settings')}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
              background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
            }}
          >
            {icons.settings} Settings
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
              background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
            }}
          >
            {icons.logout} Sign Out
          </button>
          {session?.user && (
            <div style={{
              padding: 'var(--space-3)', marginTop: 'var(--space-2)',
              fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-subtle)',
            }}>
              {session.user.name || session.user.email}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1, marginLeft: 'var(--sidebar-width)', minHeight: '100vh',
        transition: 'margin-left var(--transition-normal)',
      }} className="main-content">
        {/* Mobile Top Bar */}
        <div className="mobile-topbar" style={{
          display: 'none', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)', background: 'var(--surface-card)',
          borderBottom: '1px solid var(--border-default)', position: 'sticky', top: 0,
          zIndex: 'var(--z-sticky)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div style={{
              width: 24, height: 24, background: 'var(--dark-blue)', borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cream)', fontSize: '9px', fontWeight: 700,
            }}>AR</div>
            <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Analytics</span>
          </div>
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            style={{ padding: 'var(--space-1)', background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label="Toggle navigation"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {mobileNavOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 'var(--z-modal)',
            background: 'var(--surface-overlay)',
          }} onClick={() => setMobileNavOpen(false)}>
            <div style={{
              background: 'var(--surface-card)', width: '280px', height: '100%',
              padding: 'var(--space-6) var(--space-4)',
            }} onClick={e => e.stopPropagation()}>
              {NAV_ITEMS.map(item => (
                <button
                  key={item.href}
                  onClick={() => { router.push(item.href); setMobileNavOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-3)', borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-base)', color: pathname === item.href ? 'var(--dark-blue)' : 'var(--text-secondary)',
                    background: pathname === item.href ? 'var(--cream)' : 'transparent',
                    border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                    marginBottom: '2px',
                  }}
                >
                  {icons[item.icon]} {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {children}
      </main>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .sidebar-desktop { display: none !important; }
          .main-content { margin-left: 0 !important; }
          .mobile-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppShellInner>{children}</AppShellInner>
    </SessionProvider>
  );
}
