'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { SessionProvider } from 'next-auth/react';
import { DatasetProvider, useDataset } from '@/context/DatasetContext';

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
  chevronDown: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
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
  const { datasets, activeDatasetId, activeDataset, selectDataset, analyzing, loadDemoIfEmpty } = useDataset();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [datasetDropdownOpen, setDatasetDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDatasetDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Desktop Sidebar */}
      <aside
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--surface-card)',
          borderRight: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 'var(--z-sticky)',
        }}
        className="sidebar-desktop"
      >
        {/* Logo */}
        <div
          style={{
            padding: 'var(--space-5)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            borderBottom: '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
          onClick={() => router.push('/overview')}
        >
          <img
            src="/logo.png"
            alt="BOB Data Analyzer"
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-md)',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--dark-blue)', lineHeight: 1.2 }}>
              BOB Data Analyzer
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
              ENTERPRISE AI
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--dark-blue)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--cream)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 120ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.target as HTMLElement).style.background = 'var(--cream-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.target as HTMLElement).style.background = 'transparent';
                }}
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
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              color: pathname === '/settings' ? 'var(--dark-blue)' : 'var(--text-secondary)',
              background: pathname === '/settings' ? 'var(--cream)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
            }}
          >
            {icons.settings} Settings
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
            }}
          >
            {icons.logout} Sign Out
          </button>
          {session?.user && (
            <div
              style={{
                padding: 'var(--space-3)',
                marginTop: 'var(--space-2)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                borderTop: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {session.user.name || session.user.email}
            </div>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div
        style={{
          flex: 1,
          marginLeft: 'var(--sidebar-width)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
        className="main-container"
      >
        {/* Top Header Bar with Dataset Switcher */}
        <header
          style={{
            height: '60px',
            background: 'var(--surface-card)',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--space-6)',
            position: 'sticky',
            top: 0,
            zIndex: 'var(--z-sticky)',
          }}
          className="app-topbar"
        >
          {/* Left: Mobile hamburger + Active Dataset Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <button
              className="mobile-hamburger"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              style={{
                display: 'none',
                padding: 'var(--space-1)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--dark-blue)',
              }}
              aria-label="Toggle navigation"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>

            {/* Dataset Selector Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setDatasetDropdownOpen(!datasetDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--cream)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: 'var(--dark-blue)',
                  transition: 'all 120ms ease',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
                <span
                  style={{
                    maxWidth: '180px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {activeDataset?.name || 'Select Dataset'}
                </span>
                {activeDataset && (
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-tertiary)',
                      background: 'var(--surface-card)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 400,
                    }}
                  >
                    {activeDataset.rowCount?.toLocaleString()} rows
                  </span>
                )}
                {icons.chevronDown}
              </button>

              {/* Dropdown Menu */}
              {datasetDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    width: '320px',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                    zIndex: 'var(--z-modal)',
                    padding: 'var(--space-2)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-tertiary)',
                      padding: 'var(--space-2) var(--space-3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Available Datasets ({datasets.length})
                  </div>

                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    {datasets.length === 0 ? (
                      <div
                        style={{
                          padding: 'var(--space-4)',
                          textAlign: 'center',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        No datasets uploaded yet
                      </div>
                    ) : (
                      datasets.map((ds) => {
                        const isSelected = ds.id === activeDatasetId;
                        return (
                          <div
                            key={ds.id}
                            onClick={() => {
                              selectDataset(ds.id);
                              setDatasetDropdownOpen(false);
                            }}
                            style={{
                              padding: 'var(--space-2) var(--space-3)',
                              borderRadius: 'var(--radius-sm)',
                              background: isSelected ? 'var(--cream)' : 'transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              marginBottom: '2px',
                              transition: 'background 100ms ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--cream-hover)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 'var(--text-sm)', fontWeight: isSelected ? 600 : 500, color: 'var(--dark-blue)' }}>
                                {ds.name}
                              </span>
                              {ds.source === 'DEMO' && (
                                <span className="badge badge-outline" style={{ fontSize: '10px' }}>Demo</span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                              {ds.rowCount?.toLocaleString()} rows · {ds.source} · {new Date(ds.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)' }}>
                    <button
                      onClick={() => {
                        router.push('/data');
                        setDatasetDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--dark-blue)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {icons.plus} Upload New Dataset
                    </button>
                    {datasets.length === 0 && (
                      <button
                        onClick={() => {
                          loadDemoIfEmpty();
                          setDatasetDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: 'var(--space-2) var(--space-3)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          fontSize: 'var(--text-xs)',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        Load Demo Dataset
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Status and Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {analyzing && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--dark-blue)',
                  background: 'var(--cream)',
                  padding: 'var(--space-1) var(--space-3)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    border: '2px solid var(--silver)',
                    borderTopColor: 'var(--dark-blue)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Analyzing...
              </div>
            )}

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => router.push('/data')}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Data
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => router.push('/analyst')}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Ask AI
            </button>
          </div>
        </header>

        {/* Mobile Nav Overlay */}
        {mobileNavOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 'var(--z-modal)',
              background: 'var(--surface-overlay)',
            }}
            onClick={() => setMobileNavOpen(false)}
          >
            <div
              style={{
                background: 'var(--surface-card)',
                width: '280px',
                height: '100%',
                padding: 'var(--space-6) var(--space-4)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <img
                  src="/logo.png"
                  alt="BOB Data Analyzer"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 'var(--radius-md)',
                    objectFit: 'contain',
                  }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--dark-blue)', lineHeight: 1.2 }}>
                    BOB Data Analyzer
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                    Enterprise AI Platform
                  </div>
                </div>
              </div>

              {NAV_ITEMS.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setMobileNavOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-base)',
                    color: pathname === item.href ? 'var(--dark-blue)' : 'var(--text-secondary)',
                    background: pathname === item.href ? 'var(--cream)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    marginBottom: '2px',
                  }}
                >
                  {icons[item.icon]} {item.label}
                </button>
              ))}

              <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)' }}>
                <button
                  onClick={() => {
                    router.push('/settings');
                    setMobileNavOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-secondary)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  {icons.settings} Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main style={{ flex: 1 }}>{children}</main>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .sidebar-desktop { display: none !important; }
          .main-container { margin-left: 0 !important; }
          .mobile-hamburger { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DatasetProvider>
        <AppShellInner>{children}</AppShellInner>
      </DatasetProvider>
    </SessionProvider>
  );
}
