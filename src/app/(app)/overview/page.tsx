'use client';

import { useRouter } from 'next/navigation';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useDataset } from '@/context/DatasetContext';

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
  </svg>
);

export default function OverviewPage() {
  const { activeDataset, activeDatasetId, loading, analyzing, runAnalysis, loadDemoIfEmpty, datasets } = useDataset();
  const router = useRouter();

  if (loading || analyzing) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: '2px solid var(--silver-lighter)',
            borderTopColor: 'var(--dark-blue)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: 'var(--space-6)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', textAlign: 'center' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--dark-blue)' }}>
            {analyzing ? 'Computing Statistical Analytics & AI Insights...' : 'Loading Active Dataset...'}
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
            Profiling distributions, running anomaly detection algorithms, and synthesizing metrics.
          </p>
        </div>
      </div>
    );
  }

  if (!activeDataset) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="empty-state" style={{ maxWidth: 500 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: 'var(--dark-blue)',
              borderRadius: 'var(--radius-lg)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cream)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--dark-blue)', marginBottom: 'var(--space-2)' }}>
            Welcome to AR Analytics
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', lineHeight: 1.6 }}>
            Upload your client dataset in CSV or Excel format, or import directly from Google Sheets to generate an executive intelligence dashboard.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-primary" onClick={() => router.push('/data')}>
              Upload Your Dataset
            </button>
            <button className="btn btn-secondary" onClick={() => loadDemoIfEmpty()}>
              Explore With Demo Data
            </button>
          </div>
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

  return (
    <div className="page" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
            <h1 className="page-title">{activeDataset.name}</h1>
            <span className="badge badge-default">{activeDataset.source}</span>
          </div>
          <p className="page-subtitle">
            {activeDataset.rowCount.toLocaleString()} rows · Last analyzed{' '}
            {analysis?.completedAt ? new Date(analysis.completedAt).toLocaleString() : 'Just now'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => runAnalysis(activeDataset.id)}>
            <RefreshIcon /> Refresh Analysis
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/reports')}>
            Generate Report
          </button>
        </div>
      </div>

      {/* Executive Summary Card */}
      {analysis?.executiveSummary && (
        <section className="section">
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, var(--surface-card) 0%, rgba(184, 189, 197, 0.08) 100%)',
              borderLeft: '4px solid var(--dark-blue)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
                <path d="M9 18h6M10 22h4" />
              </svg>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--dark-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Executive Intelligence Summary
              </h3>
            </div>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', lineHeight: 1.7 }}>
              {analysis.executiveSummary}
            </p>
          </div>
        </section>
      )}

      {/* KPI Cards Grid */}
      {kpis.length > 0 && (
        <section className="section">
          <div className="section-title">Key Performance Indicators</div>
          <div
            className="grid-kpi"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {kpis.map((kpi, idx) => (
              <div key={idx} className="kpi-card">
                <div className="kpi-label">{kpi.label}</div>
                <div className="kpi-value">{kpi.formattedValue}</div>
                {kpi.change !== undefined && (
                  <div className={`kpi-change ${kpi.change >= 0 ? 'kpi-change-positive' : 'kpi-change-negative'}`}>
                    <span>{kpi.change >= 0 ? '↑' : '↓'}</span>
                    <span>{Math.abs(kpi.change).toFixed(1)}% {kpi.changeLabel || 'vs prev period'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Trends and Charts */}
      {trends.length > 0 && (
        <section className="section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Trend Velocity</div>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/visualize')}>
              Explore All Visualizations →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 'var(--space-4)' }}>
            {trends.slice(0, 2).map((trend, i) => (
              <div key={i} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <div>
                    <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--dark-blue)' }}>
                      {trend.column} Progression
                    </h4>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{trend.description}</p>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: trend.direction === 'up' ? 'rgba(34, 197, 94, 0.15)' : trend.direction === 'down' ? 'rgba(239, 68, 68, 0.15)' : 'var(--cream)',
                      color: trend.direction === 'up' ? '#16a34a' : trend.direction === 'down' ? 'var(--error)' : 'var(--dark-blue)',
                    }}
                  >
                    {trend.direction === 'up' ? '↑ Increasing' : trend.direction === 'down' ? '↓ Decreasing' : '→ Stable'}
                  </span>
                </div>

                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <AreaChart data={trend.dataPoints.filter((_, idx) => idx % Math.max(1, Math.floor(trend.dataPoints.length / 45)) === 0)}>
                      <defs>
                        <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--dark-blue)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="var(--dark-blue)" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                      <XAxis
                        dataKey="x"
                        tick={{ fontSize: 10, fill: '#9EA3AB' }}
                        interval="preserveStartEnd"
                        tickFormatter={(v: string) => (typeof v === 'string' && v.includes('-') ? v.slice(5) : v)}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#9EA3AB' }}
                        width={60}
                        tickFormatter={(v: number) => (v >= 1000 ? (v / 1000).toFixed(0) + 'K' : String(Math.round(v)))}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--dark-blue)',
                          border: 'none',
                          borderRadius: 6,
                          color: 'var(--cream)',
                          fontSize: 12,
                        }}
                      />
                      <Area type="monotone" dataKey="y" stroke="var(--dark-blue)" strokeWidth={2} fillOpacity={1} fill={`url(#grad-${i})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Side-by-side Highlights: High Severity Anomalies & Top Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {/* Top Anomalies */}
        <section className="section" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>
              Statistical Anomalies ({anomalies.length})
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/anomalies')}>
              View All →
            </button>
          </div>

          {anomalies.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No statistical outliers detected.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {anomalies.slice(0, 3).map((anomaly) => (
                <div key={anomaly.id} className="card card-compact">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <span className={`insight-importance insight-importance-${anomaly.severity.toLowerCase()}`} />
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--dark-blue)' }}>
                      {anomaly.title}
                    </span>
                    <span className="badge badge-default" style={{ marginLeft: 'auto', fontSize: '10px' }}>
                      {anomaly.severity}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {anomaly.explanation}
                  </p>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
                    Actual: <strong>{anomaly.actualValue}</strong> · Expected: <strong>{anomaly.expectedValue || 'N/A'}</strong> ({anomaly.deviation.toFixed(1)}% deviation)
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top AI Insights */}
        <section className="section" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>
              Actionable AI Insights ({insights.length})
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/insights')}>
              View All →
            </button>
          </div>

          {insights.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No insights generated yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {insights.slice(0, 3).map((insight) => (
                <div key={insight.id} className="card card-compact">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <span className={`insight-importance insight-importance-${insight.importance.toLowerCase()}`} />
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--dark-blue)' }}>
                      {insight.title}
                    </span>
                    <span className="badge badge-outline" style={{ marginLeft: 'auto', fontSize: '10px' }}>
                      {insight.importance}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {insight.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
