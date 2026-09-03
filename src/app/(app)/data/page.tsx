'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function DataPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const res = await fetch('/api/datasets');
      const result = await res.json();
      if (result.success) setDatasets(result.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await res.json();
      if (result.success) {
        await fetchDatasets();
        // Trigger analysis
        await fetch(`/api/datasets/${result.data.id}/analyze`, { method: 'POST' });
        router.push('/overview');
      } else {
        alert(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this dataset and all its analysis?')) return;
    await fetch(`/api/datasets/${id}`, { method: 'DELETE' });
    fetchDatasets();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Data</h1>
        <p className="page-subtitle">Manage your datasets and upload new data sources.</p>
      </div>

      {/* Upload Zone */}
      <section className="section">
        <div
          className={`upload-zone ${dragActive ? 'dragging' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <svg className="upload-zone-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>
            {uploading ? 'Uploading...' : 'Drop your file here or click to browse'}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            Supports CSV, Excel (.xlsx). Maximum 50MB.
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }}
          />
        </div>
      </section>

      {/* Dataset List */}
      <section className="section">
        <div className="section-title">Your Datasets</div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[1, 2].map(i => <div key={i} className="skeleton skeleton-card" />)}
          </div>
        ) : datasets.length === 0 ? (
          <div className="empty-state" style={{ minHeight: 200 }}>
            <h3 style={{ fontSize: 'var(--text-lg)' }}>No datasets yet</h3>
            <p>Upload a CSV or Excel file to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {datasets.map(ds => (
              <div key={ds.id} className="card card-compact" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ cursor: 'pointer' }} onClick={() => router.push('/overview')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-base)', fontWeight: 500 }}>{ds.name}</span>
                    {ds.source === 'DEMO' && <span className="badge badge-outline">Demo</span>}
                    <span className="badge badge-default">{ds.status}</span>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
                    {ds.rowCount?.toLocaleString()} rows · {ds.source} · Created {new Date(ds.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => router.push('/overview')}>View</button>
                  {ds.source !== 'DEMO' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(ds.id)} style={{ color: 'var(--error)' }}>Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
