'use client';

import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/context/DatasetContext';

export default function DataPage() {
  const { datasets, activeDataset, activeDatasetId, selectDataset, deleteDataset, refreshDatasets, runAnalysis, analyzing } = useDataset();
  const [importMode, setImportMode] = useState<'file' | 'sheets'>('file');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [sheetsName, setSheetsName] = useState('');
  const [importError, setImportError] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle File Upload
  const handleUpload = async (file: File) => {
    setUploading(true);
    setImportError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await res.json();
      if (result.success) {
        await refreshDatasets();
        await selectDataset(result.data.id);
        await runAnalysis(result.data.id);
        router.push('/overview');
      } else {
        setImportError(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      setImportError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle Google Sheets Import
  const handleSheetsImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetsUrl.trim()) return;

    setUploading(true);
    setImportError('');
    try {
      const res = await fetch('/api/sheets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sheetsUrl.trim(), sheetName: sheetsName.trim() }),
      });
      const result = await res.json();
      if (result.success) {
        setSheetsUrl('');
        setSheetsName('');
        await refreshDatasets();
        await selectDataset(result.data.id);
        await runAnalysis(result.data.id);
        router.push('/overview');
      } else {
        setImportError(result.error || 'Failed to import Google Sheet');
      }
    } catch (err) {
      console.error(err);
      setImportError('Google Sheets import failed. Please verify the URL.');
    } finally {
      setUploading(false);
    }
  };

  // Preview rows and columns
  const previewRows = activeDataset?.previewRows || [];
  const columns = useMemo(() => {
    if (!activeDataset?.columns) return [];
    if (typeof activeDataset.columns[0] === 'string') {
      return (activeDataset.columns as string[]).map((name) => ({ name, type: 'string' }));
    }
    return activeDataset.columns as { name: string; type: string }[];
  }, [activeDataset]);

  // Filtered rows for Data Table Explorer
  const filteredRows = useMemo(() => {
    if (!tableSearch.trim()) return previewRows;
    const q = tableSearch.toLowerCase();
    return previewRows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(q))
    );
  }, [previewRows, tableSearch]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const quality = activeDataset?.analysis?.quality;

  return (
    <div className="page" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Data Management</h1>
          <p className="page-subtitle">Upload files, connect Google Sheets, and explore your raw dataset records.</p>
        </div>
        {activeDataset && (
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => runAnalysis(activeDataset.id)} disabled={analyzing}>
              {analyzing ? 'Analyzing...' : 'Re-run Analysis'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => router.push('/overview')}>
              View Dashboard
            </button>
          </div>
        )}
      </div>

      {importError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--error)',
            color: 'var(--error)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-5)',
            fontSize: 'var(--text-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{importError}</span>
          <button
            onClick={() => setImportError('')}
            style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Import Section with Tabs */}
      <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: 'var(--space-5)' }}>
          <button
            className={`tab ${importMode === 'file' ? 'active' : ''}`}
            onClick={() => setImportMode('file')}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            File Upload (CSV / Excel)
          </button>
          <button
            className={`tab ${importMode === 'sheets' ? 'active' : ''}`}
            onClick={() => setImportMode('sheets')}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Google Sheets Import
          </button>
        </div>

        {importMode === 'file' ? (
          <div
            className={`upload-zone ${dragActive ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const file = e.dataTransfer.files[0];
              if (file) handleUpload(file);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg
              className="upload-zone-icon"
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--dark-blue)', marginBottom: 'var(--space-1)' }}>
              {uploading ? 'Processing and Analyzing Data...' : 'Drop your CSV or Excel file here, or click to browse'}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              Supports .csv, .xlsx, .xls formats. Maximum size 50MB. Auto-profiles upon upload.
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }}
            />
          </div>
        ) : (
          <form onSubmit={handleSheetsImport} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                Google Sheet URL
              </label>
              <input
                className="input"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                value={sheetsUrl}
                onChange={(e) => setSheetsUrl(e.target.value)}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                Tip: Ensure link sharing on the Google Sheet is set to <strong>&ldquo;Anyone with the link can view&rdquo;</strong>.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                Dataset Name (Optional)
              </label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Q4 Financials — Client Report"
                value={sheetsName}
                onChange={(e) => setSheetsName(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading || !sheetsUrl.trim()}
              style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              {uploading ? 'Importing & Analyzing...' : 'Import Google Sheet'}
            </button>
          </form>
        )}
      </div>

      {/* Active Dataset Overview & Data Quality */}
      {activeDataset && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          {/* Active Info Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                Active Dataset Details
              </span>
              <span className="badge badge-default">{activeDataset.source}</span>
            </div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--dark-blue)', marginBottom: 'var(--space-2)' }}>
              {activeDataset.name}
            </h2>
            <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--dark-blue)' }}>
                  {activeDataset.rowCount.toLocaleString()}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Total Rows</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--dark-blue)' }}>
                  {columns.length}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Columns</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--dark-blue)' }}>
                  {activeDataset.anomalies?.length || 0}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Anomalies Detected</div>
              </div>
            </div>
          </div>

          {/* Quality Scorecard */}
          {quality && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Data Health Score
                </span>
                <span
                  className="badge"
                  style={{
                    background: quality.overall >= 80 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: quality.overall >= 80 ? '#16a34a' : 'var(--error)',
                    fontWeight: 600,
                  }}
                >
                  {quality.overall >= 80 ? 'Good Condition' : 'Needs Review'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--dark-blue)', lineHeight: 1 }}>
                  {quality.overall}
                  <span style={{ fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--text-tertiary)' }}>/100</span>
                </div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Completeness</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{quality.completeness}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Consistency</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{quality.consistency}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Validity</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{quality.validity}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Uniqueness</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{quality.uniqueness}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Data Table Explorer */}
      {previewRows.length > 0 && (
        <section className="section" style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--dark-blue)' }}>
                Data Table Explorer
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                Showing preview records ({previewRows.length} sample rows loaded in memory)
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <input
                className="input"
                type="text"
                placeholder="Search values in table..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: '220px', padding: 'var(--space-1) var(--space-3)' }}
              />
              <select
                className="input"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ width: '100px', padding: 'var(--space-1) var(--space-2)' }}
              >
                <option value={10}>10 rows</option>
                <option value={15}>15 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
              </select>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--cream)', borderBottom: '2px solid var(--border-default)' }}>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontSize: '11px', color: 'var(--text-tertiary)' }}>#</th>
                    {columns.map((col) => (
                      <th key={col.name} style={{ padding: 'var(--space-3)', textAlign: 'left', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--dark-blue)' }}>{col.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{col.type}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      {columns.map((col) => {
                        const val = row[col.name];
                        return (
                          <td key={col.name} style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                            {val === null || val === undefined ? (
                              <span style={{ color: 'var(--silver-dark)', fontStyle: 'italic' }}>null</span>
                            ) : typeof val === 'number' ? (
                              val.toLocaleString()
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                borderTop: '1px solid var(--border-default)',
                background: 'var(--surface-card)',
              }}
            >
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} entries
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Datasets Library */}
      <section className="section">
        <div className="section-title">All Saved Datasets ({datasets.length})</div>
        {datasets.length === 0 ? (
          <div className="empty-state" style={{ minHeight: 180 }}>
            <h3>No datasets yet</h3>
            <p>Upload a CSV file or connect a Google Sheet to begin analyzing.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {datasets.map((ds) => {
              const isActive = ds.id === activeDatasetId;
              return (
                <div
                  key={ds.id}
                  className="card card-compact"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: isActive ? '2px solid var(--dark-blue)' : '1px solid var(--border-default)',
                    background: isActive ? 'rgba(11, 31, 51, 0.02)' : 'var(--surface-card)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--dark-blue)' }}>
                        {ds.name}
                      </span>
                      {isActive && <span className="badge badge-default" style={{ background: 'var(--dark-blue)', color: 'var(--cream)' }}>Active</span>}
                      {ds.source === 'DEMO' && <span className="badge badge-outline">Demo</span>}
                      <span className="badge badge-default">{ds.status}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
                      {ds.rowCount?.toLocaleString()} rows · {ds.source} · Created {new Date(ds.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {!isActive && (
                      <button className="btn btn-secondary btn-sm" onClick={() => selectDataset(ds.id)}>
                        Select
                      </button>
                    )}
                    <button className="btn btn-primary btn-sm" onClick={() => { selectDataset(ds.id); router.push('/overview'); }}>
                      Overview
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        if (confirm(`Delete dataset "${ds.name}"?`)) {
                          deleteDataset(ds.id);
                        }
                      }}
                      style={{ color: 'var(--error)' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
