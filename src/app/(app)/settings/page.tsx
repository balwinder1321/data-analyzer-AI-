'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useDataset } from '@/context/DatasetContext';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { datasets, refreshDatasets } = useDataset();

  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [clientCompany, setClientCompany] = useState('');
  const [savedStatus, setSavedStatus] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('ar_gemini_api_key') || '';
      const savedCompany = localStorage.getItem('ar_client_company') || '';
      setGeminiApiKey(savedKey);
      setClientCompany(savedCompany);
    }
  }, []);

  const handleSaveSettings = () => {
    if (typeof window !== 'undefined') {
      if (geminiApiKey.trim()) {
        localStorage.setItem('ar_gemini_api_key', geminiApiKey.trim());
      } else {
        localStorage.removeItem('ar_gemini_api_key');
      }
      localStorage.setItem('ar_client_company', clientCompany.trim());
    }
    setSavedStatus('Settings saved successfully!');
    setTimeout(() => setSavedStatus(''), 3000);
  };

  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to delete all uploaded datasets and analyses? This cannot be undone.')) {
      return;
    }
    try {
      for (const ds of datasets) {
        if (ds.source !== 'DEMO') {
          await fetch(`/api/datasets/${ds.id}`, { method: 'DELETE' });
        }
      }
      await refreshDatasets();
      setSavedStatus('Uploaded datasets deleted.');
      setTimeout(() => setSavedStatus(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Client & Platform Settings</h1>
        <p className="page-subtitle">Configure AI API access, report branding, and data storage settings.</p>
      </div>

      {savedStatus && (
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid #16a34a',
            color: '#16a34a',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
          }}
        >
          ✓ {savedStatus}
        </div>
      )}

      {/* AI Intelligence Key Configuration */}
      <section className="section">
        <div className="section-title">AI Engine Configuration (Google Gemini)</div>
        <div className="card">
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
            Configure your own <strong>Google Gemini API key</strong> for live, conversational analysis with tool execution. If left blank, the system operates with pre-computed mathematical analytics and built-in heuristics.
          </p>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
              Gemini API Key
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                className="input"
                type={showKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
              Your API key is stored securely in browser storage and only transmitted for server-side Gemini function calls.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={handleSaveSettings}>
              Save Key & Preferences
            </button>
            {geminiApiKey && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setGeminiApiKey('');
                  localStorage.removeItem('ar_gemini_api_key');
                  setSavedStatus('API Key removed.');
                }}
                style={{ color: 'var(--error)' }}
              >
                Remove Key
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Client Report Branding */}
      <section className="section">
        <div className="section-title">Client Report Defaults</div>
        <div className="card">
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
              Default Client / Organization Name
            </label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Acme Corporation"
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
              Appears automatically as the default audience in all generated PDF and executive dossiers.
            </span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleSaveSettings}>
            Update Report Defaults
          </button>
        </div>
      </section>

      {/* Account & Storage */}
      <section className="section">
        <div className="section-title">Active Session & Data Storage</div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--dark-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--cream)',
                  fontWeight: 700,
                  fontSize: 'var(--text-base)',
                }}
              >
                {(session?.user?.name?.[0] || session?.user?.email?.[0] || 'C').toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--dark-blue)' }}>
                  {session?.user?.name || 'Client User'}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  {session?.user?.email || 'Active Client Session'}
                </div>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => signOut({ callbackUrl: '/' })}>
              Sign Out
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--dark-blue)' }}>
                {datasets.length} Datasets in Storage
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                Total records: {datasets.reduce((acc, d) => acc + (d.rowCount || 0), 0).toLocaleString()} rows
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleClearAllData} style={{ color: 'var(--error)' }}>
              Purge Uploaded Data
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
