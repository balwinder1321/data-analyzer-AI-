'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface AnalysisData {
  id: string;
  name: string;
  source: string;
  rowCount: number;
  status: string;
  analysis: {
    executiveSummary: string;
    completedAt?: string;
    kpis: { label: string; value: number; formattedValue: string; change?: number; changeLabel?: string; unit?: string; column: string }[];
    trends: { column: string; direction: string; changePercent: number; description: string; dataPoints: { x: string; y: number }[]; movingAverage?: { x: string; y: number }[] }[];
    quality: { overall: number; completeness: number; consistency: number; validity: number; uniqueness: number };
    correlations: { strongCorrelations: { column1: string; column2: string; coefficient: number; strength: string; direction: string }[] };
  } | null;
  insights: { id: string; title: string; explanation: string; importance: string; metric?: string }[];
  anomalies: { id: string; title: string; metric: string; severity: string; deviation: number; actualValue: string; expectedValue?: string; explanation: string }[];
}

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
);

export default function OverviewPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const loadDataset = useCallback(async () => {
    try {
      setLoading(true);
      // Try to get existing datasets
      const res = await fetch('/api/datasets');
      const result = await res.json();
      
      if (result.data && result.data.length > 0) {
        // Load the most recent dataset
        const latest = result.data[0];
        const detailRes = await fetch(`/api/datasets/${latest.id}`);
        const detailResult = await detailRes.json();
        if (detailResult.success) {
          setData(detailResult.data);
          // If no analysis yet, trigger it
          if (!detailResult.data.analysis) {
            await runAnalysis(latest.id);
          }
        }
      } else {
        // No datasets — create demo
        await createAndAnalyzeDemo();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAndAnalyzeDemo = async () => {
    try {
      setAnalyzing(true);
      // Create demo dataset
      const createRes = await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sales Performance — Demo Dataset',
          source: 'DEMO',
          data: null, // Will be generated server-side
        }),
      });
      const createResult = await createRes.json();
      
      if (createResult.success) {
        await runAnalysis(createResult.data.id);
      } else {
        // Directly analyze demo
        await runAnalysis('demo');
      }
    } catch (err) {
      console.error(err);
      // Try demo fallback
      await runAnalysis('demo');
    }
  };

  const runAnalysis = async (datasetId: string) => {
    try {
      setAnalyzing(true);
      const res = await fetch(`/api/datasets/${datasetId}/analyze`, { method: 'POST' });
      const result = await res.json();
      
      if (result.success) {
        // Reload dataset with analysis
        const detailRes = await fetch(`/api/datasets/${datasetId}`);
        const detailResult = await detailRes.json();
        if (detailResult.success) {
          setData(detailResult.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => { loadDataset(); }, [loadDataset]);

  if (loading || analyzing) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{
          width: 48, height: 48, border: '2px solid var(--silver-lighter)',
          borderTopColor: 'var(--dark-blue)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', marginBottom: 'var(--space-6)',
        }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', textAlign: 'center' }}>
          {['Reading dataset…', 'Profiling columns…', 'Finding patterns…', 'Checking anomalies…', 'Building insights…', 'Preparing dashboard…'].map((step, i) => (
            <div key={step} className={`processing-step ${analyzing ? (i <= 3 ? 'complete' : 'active') : ''}`}>
              <div className="processing-indicator" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page">
        <div className="empty-state">
          <svg className="empty-state-icon" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 5-6"/></svg>
          <h3>No datasets yet</h3>
          <p>Connect your first Google Sheet or upload a CSV to start discovering insights.</p>
          <button className="btn btn-primary" onClick={() => router.push('/data')}>Connect Data</button>
        </div>
      </div>
    );
  }

  const analysis = data.analysis;
  const kpis = analysis?.kpis || [];
  const trends = analysis?.trends || [];
  const quality = analysis?.quality;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
            <h1 className="page-title">{data.name}</h1>
            {data.source === 'DEMO' && <span className="badge badge-outline">Demo Dataset</span>}
          </div>
          <p className="page-subtitle">
            {data.rowCount.toLocaleString()} rows · {data.source === 'DEMO' ? 'Sample data' : data.source} · Last analyzed {analysis?.completedAt ? new Date(analysis.completedAt).toLocaleDateString() : 'now'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => runAnalysis(data.id)}>
            <RefreshIcon /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/analyst')}>
            Ask AI
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      {analysis?.executiveSummary && (
        <section className="section">
          <div className="card" style={{ borderLeft: '3px solid var(--dark-blue)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <span className="section-title" style={{ margin: 0 }}>Executive Summary</span>
              <span className="badge badge-default" style={{ fontSize: '10px' }}>AI Generated</span>
            </div>
            <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)' }}>
              {analysis.executiveSummary}
            </p>
          </div>
        </section>
      )}

      {/* KPIs */}
      {kpis.length > 0 && (
        <section className="section">
          <div className="section-title">Key Metrics</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`, gap: 'var(--space-4)' }}>
            {kpis.map((kpi, i) => (
              <div key={i} className="kpi-card">
                <div className="kpi-label">{kpi.label}</div>
                <div className="kpi-value">{kpi.unit === '₹' ? '₹' : ''}{kpi.formattedValue}</div>
                {kpi.change !== undefined && (
                  <div className={`kpi-change ${kpi.change >= 0 ? 'kpi-change-positive' : 'kpi-change-negative'}`}>
                    {kpi.change >= 0 ? '↑' : '↓'} {Math.abs(kpi.change).toFixed(1)}% {kpi.changeLabel || ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trend Charts */}
      {trends.length > 0 && (
        <section className="section">
          <div className="section-title">Trends</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-4)' }}>
            {trends.slice(0, 4).map((trend, i) => (
              <div key={i} className="card">
                <div className="chart-title">{trend.column}</div>
                <div className="chart-subtitle">
                  {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {Math.abs(trend.changePercent).toFixed(1)}% {trend.direction === 'up' ? 'increase' : trend.direction === 'down' ? 'decrease' : 'stable'}
                </div>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend.dataPoints.filter((_, idx) => idx % Math.max(1, Math.floor(trend.dataPoints.length / 60)) === 0)}>
                      <defs>
                        <linearGradient id={`area-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0B1F33" stopOpacity={0.1} />
                          <stop offset="100%" stopColor="#0B1F33" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--silver-lighter)" />
                      <XAxis
                        dataKey="x"
                        tick={{ fontSize: 10, fill: 'var(--silver-dark)' }}
                        tickFormatter={(v: string) => {
                          if (typeof v === 'string' && v.includes('-')) return v.split('-').slice(1).join('/');
                          return String(v);
                        }}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--silver-dark)' }} width={60} tickFormatter={(v: number) => v >= 1000 ? (v / 1000).toFixed(0) + 'K' : String(v)} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--dark-blue)', border: 'none', borderRadius: 6,
                          color: 'var(--cream)', fontSize: 12, padding: '8px 12px',
                        }}
                      />
                      <Area type="monotone" dataKey="y" stroke="#0B1F33" strokeWidth={1.5} fill={`url(#area-${i})`} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom Grid: Anomalies + Insights + Quality */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Anomalies Summary */}
        {data.anomalies.length > 0 && (
          <section>
            <div className="section-title">Top Anomalies</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {data.anomalies.slice(0, 3).map(anomaly => (
                <div key={anomaly.id} className="card card-compact" style={{ cursor: 'pointer' }} onClick={() => router.push('/anomalies')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <span className={`insight-importance insight-importance-${anomaly.severity.toLowerCase()}`} />
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{anomaly.title}</span>
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                    Expected: {anomaly.expectedValue} · Actual: {anomaly.actualValue}
                  </p>
                </div>
              ))}
              {data.anomalies.length > 3 && (
                <button className="btn btn-ghost btn-sm" onClick={() => router.push('/anomalies')}>
                  View all {data.anomalies.length} anomalies →
                </button>
              )}
            </div>
          </section>
        )}

        {/* Insights Summary */}
        {data.insights.length > 0 && (
          <section>
            <div className="section-title">AI Insights</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {data.insights.slice(0, 3).map(insight => (
                <div key={insight.id} className="card card-compact" style={{ cursor: 'pointer' }} onClick={() => router.push('/insights')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <span className={`insight-importance insight-importance-${insight.importance.toLowerCase()}`} />
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{insight.title}</span>
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                    {insight.explanation.substring(0, 120)}...
                  </p>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={() => router.push('/insights')}>
                View all insights →
              </button>
            </div>
          </section>
        )}

        {/* Data Quality */}
        {quality && (
          <section>
            <div className="section-title">Data Health</div>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
              <div className="quality-meter">{quality.overall}</div>
              <div style={{ flex: 1 }}>
                {[
                  { label: 'Completeness', value: quality.completeness },
                  { label: 'Consistency', value: quality.consistency },
                  { label: 'Validity', value: quality.validity },
                  { label: 'Uniqueness', value: quality.uniqueness },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 2 }}>
                      <span>{item.label}</span>
                      <span className="tabular-nums">{item.value}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
