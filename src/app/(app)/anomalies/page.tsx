'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/context/DatasetContext';

export default function AnomaliesPage() {
  const { activeDataset, loading, analyzing } = useDataset();
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  const anomalies = activeDataset?.anomalies || [];
  const filtered = severityFilter === 'all'
    ? anomalies
    : anomalies.filter((a) => a.severity === severityFilter.toUpperCase());

  return (
    <div className="page" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Anomaly Detection</h1>
          <p className="page-subtitle">
            {activeDataset
              ? `Unusual patterns and statistical outliers detected across ${activeDataset.name}`
              : 'Select or upload a dataset to review detected anomalies.'}
          </p>
        </div>
        {activeDataset && (
          <button className="btn btn-secondary btn-sm" onClick={() => router.push('/visualize')}>
            Inspect in Visualizer
          </button>
        )}
      </div>

      {/* Severity Filter Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {['all', 'high', 'medium', 'low'].map((f) => {
          const count = f === 'all' ? anomalies.length : anomalies.filter((a) => a.severity === f.toUpperCase()).length;
          return (
            <button key={f} className={`tab ${severityFilter === f ? 'active' : ''}`} onClick={() => setSeverityFilter(f)}>
              {f === 'all' ? 'All Anomalies' : `${f.charAt(0).toUpperCase() + f.slice(1)} Severity`}
              <span
                style={{
                  marginLeft: 6,
                  fontSize: '11px',
                  background: severityFilter === f ? 'var(--dark-blue)' : 'var(--border-default)',
                  color: severityFilter === f ? 'var(--cream)' : 'var(--text-tertiary)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading || analyzing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 140 }} />
          ))}
        </div>
      ) : !activeDataset ? (
        <div className="empty-state">
          <h3>No dataset selected</h3>
          <p>Please select an active dataset to inspect statistical anomalies.</p>
          <button className="btn btn-primary" onClick={() => router.push('/data')}>
            Go to Data Management
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <h3>No anomalies found</h3>
          <p>The statistical checks found no abnormal values matching this filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {filtered.map((anomaly) => {
            const isExpanded = expandedId === anomaly.id;
            let parsedDims: { dimension: string; value: string; contribution: number }[] = [];
            if (anomaly.contributingDimensions) {
              try {
                parsedDims = JSON.parse(anomaly.contributingDimensions);
              } catch {}
            }

            return (
              <div
                key={anomaly.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  border: isExpanded ? '1px solid var(--dark-blue)' : '1px solid var(--border-default)',
                  transition: 'all 120ms ease',
                }}
                onClick={() => setExpandedId(isExpanded ? null : anomaly.id)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      <span className={`insight-importance insight-importance-${anomaly.severity.toLowerCase()}`} />
                      <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--dark-blue)', margin: 0 }}>
                        {anomaly.title}
                      </h4>
                      <span className="badge badge-default" style={{ marginLeft: 'auto' }}>
                        {anomaly.severity} SEVERITY
                      </span>
                    </div>

                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-3)' }}>
                      {anomaly.explanation}
                    </p>

                    <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Metric: </span>
                        <strong style={{ fontSize: 'var(--text-xs)' }}>{anomaly.metric}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Actual: </span>
                        <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-blue)' }}>{anomaly.actualValue}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Expected Baseline: </span>
                        <strong style={{ fontSize: 'var(--text-xs)' }}>{anomaly.expectedValue || 'Range Mean'}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Deviation: </span>
                        <strong
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: anomaly.severity === 'HIGH' ? 'var(--error)' : 'var(--dark-blue)',
                          }}
                        >
                          {anomaly.deviation > 0 ? `+${anomaly.deviation.toFixed(1)}%` : `${anomaly.deviation.toFixed(1)}%`}
                        </strong>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        Method: {anomaly.detectionMethod}
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      marginTop: 'var(--space-4)',
                      paddingTop: 'var(--space-4)',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--dark-blue)', marginBottom: 'var(--space-2)' }}>
                      Contributing Breakdown & Context
                    </div>
                    {parsedDims.length > 0 ? (
                      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                        {parsedDims.map((dim, dIdx) => (
                          <div
                            key={dIdx}
                            style={{
                              background: 'var(--cream)',
                              padding: 'var(--space-2) var(--space-3)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '11px',
                            }}
                          >
                            <span style={{ color: 'var(--text-tertiary)' }}>{dim.dimension}: </span>
                            <strong>{dim.value}</strong>
                            {dim.contribution && (
                              <span style={{ marginLeft: 4, color: 'var(--dark-blue)' }}>
                                ({dim.contribution > 0 ? `+${dim.contribution}%` : `${dim.contribution}%`})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
                        No specific sub-dimension breakdown available. Outlier detected based on global distribution variance.
                      </p>
                    )}

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/analyst?q=${encodeURIComponent(`Explain why ${anomaly.title} occurred in metric ${anomaly.metric} with actual value ${anomaly.actualValue}.`)}`);
                      }}
                    >
                      Investigate Root Cause with AI
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
