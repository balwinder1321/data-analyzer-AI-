'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/context/DatasetContext';

export default function ReportsPage() {
  const { activeDataset, loading, analyzing } = useDataset();
  const router = useRouter();

  const [reportTitle, setReportTitle] = useState('');
  const [clientName, setClientName] = useState('Executive Leadership & Stakeholders');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeKPIs, setIncludeKPIs] = useState(true);
  const [includeTrends, setIncludeTrends] = useState(true);
  const [includeAnomalies, setIncludeAnomalies] = useState(true);
  const [includeInsights, setIncludeInsights] = useState(true);
  const [includeQuality, setIncludeQuality] = useState(true);
  const [copied, setCopied] = useState(false);

  if (loading || analyzing) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-tertiary)' }}>Compiling report assets...</p>
      </div>
    );
  }

  if (!activeDataset) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="empty-state">
          <h3>No dataset selected</h3>
          <p>Select or upload a dataset to generate a formal executive report.</p>
          <button className="btn btn-primary" onClick={() => router.push('/data')}>
            Upload Data
          </button>
        </div>
      </div>
    );
  }

  const analysis = activeDataset.analysis;
  const kpis = analysis?.kpis || [];
  const trends = analysis?.trends || [];
  const quality = analysis?.quality;
  const anomalies = activeDataset.anomalies || [];
  const insights = activeDataset.insights || [];

  const title = reportTitle.trim() || `${activeDataset.name} — Executive Intelligence Report`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `
${title}
Prepared For: ${clientName}
Generated: ${new Date().toLocaleDateString()}
Dataset: ${activeDataset.name} (${activeDataset.rowCount.toLocaleString()} rows)

EXECUTIVE SUMMARY:
${analysis?.executiveSummary || 'N/A'}

KEY PERFORMANCE INDICATORS:
${kpis.map((k) => `- ${k.label}: ${k.formattedValue} (${k.change ? (k.change > 0 ? `+${k.change}%` : `${k.change}%`) : 'Stable'})`).join('\n')}

TOP INSIGHTS:
${insights.slice(0, 3).map((i) => `- [${i.importance}] ${i.title}: ${i.explanation}`).join('\n')}

DETECTED ANOMALIES:
${anomalies.slice(0, 3).map((a) => `- [${a.severity}] ${a.title} (Actual: ${a.actualValue}, Expected: ${a.expectedValue || 'N/A'})`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Configuration & Action Bar (Hidden when printing) */}
      <div className="no-print" style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1 className="page-title">Executive Report Generator</h1>
            <p className="page-subtitle">Compile, customize, and export executive-ready intelligence dossiers.</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleCopySummary}>
              {copied ? '✓ Copied to Clipboard' : '📋 Copy Brief Text'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Customization Options */}
        <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--cream)', border: '1px solid var(--border-default)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--dark-blue)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
            Report Configuration
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>
                Report Header Title
              </label>
              <input
                className="input"
                type="text"
                placeholder={title}
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>
                Target Recipient / Audience
              </label>
              <input
                className="input"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: 'var(--text-xs)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', cursor: 'pointer' }}>
              <input type="checkbox" checked={includeSummary} onChange={(e) => setIncludeSummary(e.target.checked)} />
              Executive Summary
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', cursor: 'pointer' }}>
              <input type="checkbox" checked={includeKPIs} onChange={(e) => setIncludeKPIs(e.target.checked)} />
              Key Metrics (KPIs)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', cursor: 'pointer' }}>
              <input type="checkbox" checked={includeTrends} onChange={(e) => setIncludeTrends(e.target.checked)} />
              Trends & Trajectory
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', cursor: 'pointer' }}>
              <input type="checkbox" checked={includeAnomalies} onChange={(e) => setIncludeAnomalies(e.target.checked)} />
              Anomalies Table
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', cursor: 'pointer' }}>
              <input type="checkbox" checked={includeInsights} onChange={(e) => setIncludeInsights(e.target.checked)} />
              Strategic Insights
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', cursor: 'pointer' }}>
              <input type="checkbox" checked={includeQuality} onChange={(e) => setIncludeQuality(e.target.checked)} />
              Data Health Scorecard
            </label>
          </div>
        </div>
      </div>

      {/* Printable Report Document (The actual deliverable PDF layout) */}
      <div
        className="printable-document card"
        style={{
          padding: 'var(--space-8)',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Document Masthead */}
        <div style={{ borderBottom: '2px solid var(--dark-blue)', paddingBottom: 'var(--space-6)', marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <div style={{ width: 28, height: 28, background: 'var(--dark-blue)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
                AR
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dark-blue)' }}>
                AR Analytics Executive Intelligence
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--dark-blue)', marginBottom: 'var(--space-2)', lineHeight: 1.2 }}>
              {title}
            </h1>
            <div style={{ fontSize: 'var(--text-xs)', color: '#6B7280' }}>
              Prepared For: <strong>{clientName}</strong> · Dataset: <strong>{activeDataset.name}</strong> ({activeDataset.rowCount.toLocaleString()} records)
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase' }}>Date Generated</div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--dark-blue)' }}>
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            {quality && (
              <div style={{ marginTop: 'var(--space-2)', fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                Health Score: {quality.overall}/100
              </div>
            )}
          </div>
        </div>

        {/* 1. Executive Summary */}
        {includeSummary && analysis?.executiveSummary && (
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--dark-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>
              1. Executive Summary
            </h3>
            <div style={{ padding: 'var(--space-4)', background: '#F9FAFB', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--dark-blue)' }}>
              <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, color: '#1F2937', margin: 0 }}>
                {analysis.executiveSummary}
              </p>
            </div>
          </div>
        )}

        {/* 2. Key Metrics Grid */}
        {includeKPIs && kpis.length > 0 && (
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--dark-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>
              2. Key Performance Indicators
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
              {kpis.map((kpi, idx) => (
                <div key={idx} style={{ padding: 'var(--space-3)', background: '#F9FAFB', borderRadius: 'var(--radius-md)', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>{kpi.label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--dark-blue)', margin: '4px 0' }}>
                    {kpi.formattedValue}
                  </div>
                  {kpi.change !== undefined && (
                    <div style={{ fontSize: '11px', color: kpi.change >= 0 ? '#16a34a' : '#DC2626', fontWeight: 600 }}>
                      {kpi.change >= 0 ? '↑' : '↓'} {Math.abs(kpi.change).toFixed(1)}% {kpi.changeLabel || 'change'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Trend Trajectories */}
        {includeTrends && trends.length > 0 && (
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--dark-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>
              3. Trend Analysis & Velocity
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
              {trends.map((trend, idx) => (
                <div key={idx} style={{ padding: 'var(--space-3)', background: '#F9FAFB', borderRadius: 'var(--radius-md)', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--dark-blue)' }}>{trend.column}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: trend.direction === 'up' ? '#16a34a' : trend.direction === 'down' ? '#DC2626' : '#6B7280' }}>
                      {trend.direction === 'up' ? '↑ Increasing' : trend.direction === 'down' ? '↓ Decreasing' : '→ Stable'} ({Math.abs(trend.changePercent).toFixed(1)}%)
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
                    {trend.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Strategic Insights */}
        {includeInsights && insights.length > 0 && (
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--dark-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>
              4. Actionable Strategic Findings
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {insights.map((insight, idx) => (
                <div key={idx} style={{ padding: 'var(--space-3)', background: '#F9FAFB', borderRadius: 'var(--radius-md)', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 4, background: insight.importance === 'HIGH' ? '#FEF2F2' : '#EFF6FF', color: insight.importance === 'HIGH' ? '#DC2626' : 'var(--dark-blue)', fontWeight: 700 }}>
                      {insight.importance} PRIORITY
                    </span>
                    <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-blue)' }}>{insight.title}</strong>
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: '#4B5563', lineHeight: 1.6, margin: 0 }}>
                    {insight.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Statistical Outliers / Anomalies */}
        {includeAnomalies && anomalies.length > 0 && (
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--dark-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>
              5. Detected Outliers & Anomalies ({anomalies.length})
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ background: '#F3F4F6', borderBottom: '1px solid #D1D5DB' }}>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'left' }}>Severity</th>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'left' }}>Observation</th>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'left' }}>Metric</th>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'right' }}>Actual</th>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'right' }}>Expected</th>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'right' }}>Variance</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: 'var(--space-2)' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: a.severity === 'HIGH' ? '#DC2626' : '#D97706' }}>
                        {a.severity}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-2)', fontWeight: 500, color: 'var(--dark-blue)' }}>{a.title}</td>
                    <td style={{ padding: 'var(--space-2)', color: '#6B7280' }}>{a.metric}</td>
                    <td style={{ padding: 'var(--space-2)', textAlign: 'right', fontWeight: 600 }}>{a.actualValue}</td>
                    <td style={{ padding: 'var(--space-2)', textAlign: 'right', color: '#6B7280' }}>{a.expectedValue || 'Baseline'}</td>
                    <td style={{ padding: 'var(--space-2)', textAlign: 'right', fontWeight: 600, color: a.severity === 'HIGH' ? '#DC2626' : '#4B5563' }}>
                      {a.deviation > 0 ? `+${a.deviation.toFixed(1)}%` : `${a.deviation.toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Data Quality & Certification */}
        {includeQuality && quality && (
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#6B7280' }}>
            <div>
              Data Completeness: <strong>{quality.completeness}%</strong> · Consistency: <strong>{quality.consistency}%</strong> · Validity: <strong>{quality.validity}%</strong>
            </div>
            <div>
              Audited by AR Analytics Engine v1.0
            </div>
          </div>
        )}
      </div>

      {/* Global Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .sidebar-desktop,
          .app-topbar,
          .mobile-topbar,
          .no-print {
            display: none !important;
          }
          .main-container {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          .page {
            padding: 0 !important;
            max-width: 100% !important;
          }
          .printable-document {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
