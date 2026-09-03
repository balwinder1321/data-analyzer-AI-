'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadAnomalies();
  }, []);

  const loadAnomalies = async () => {
    try {
      const res = await fetch('/api/datasets');
      const result = await res.json();
      if (result.data?.[0]) {
        const detailRes = await fetch(`/api/datasets/${result.data[0].id}`);
        const detail = await detailRes.json();
        if (detail.success) setAnomalies(detail.data.anomalies || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Anomaly Detection</h1>
        <p className="page-subtitle">Unusual patterns and outliers detected in your data using statistical methods.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 140 }} />)}
        </div>
      ) : anomalies.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <h3>No anomalies detected</h3>
          <p>Your data appears to be within normal ranges. Upload and analyze a dataset to check for anomalies.</p>
          <button className="btn btn-primary" onClick={() => router.push('/data')}>Upload Data</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {anomalies.map(anomaly => (
            <div key={anomaly.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === anomaly.id ? null : anomaly.id)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <span className={`insight-importance insight-importance-${anomaly.severity.toLowerCase()}`} />
                    <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 500 }}>{anomaly.title}</h4>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                    {anomaly.expectedValue && (
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>Expected</div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }} className="tabular-nums">{anomaly.expectedValue}</div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>Actual</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }} className="tabular-nums">{anomaly.actualValue}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>Deviation</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }} className="tabular-nums">{anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>Confidence</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{anomaly.confidence}</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-1)' }}>
                  <span className="badge badge-default">{anomaly.severity}</span>
                  <span className="badge badge-outline">{anomaly.metric}</span>
                </div>
              </div>

              {/* Expanded Details */}
              {expanded === anomaly.id && (
                <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-default)' }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-3)' }}>
                    {anomaly.explanation}
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    <span>Method: {anomaly.detectionMethod}</span>
                    {anomaly.timestamp && <span>Date: {anomaly.timestamp}</span>}
                  </div>
                  {anomaly.technicalDetails && (
                    <details style={{ marginTop: 'var(--space-3)' }}>
                      <summary style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', cursor: 'pointer' }}>Technical details</summary>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)', fontFamily: 'var(--font-mono)', background: 'var(--cream)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                        {anomaly.technicalDetails}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
