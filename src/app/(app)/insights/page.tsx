'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InsightsPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const res = await fetch('/api/datasets');
      const result = await res.json();
      if (result.data?.[0]) {
        const detailRes = await fetch(`/api/datasets/${result.data[0].id}`);
        const detail = await detailRes.json();
        if (detail.success) setInsights(detail.data.insights || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all' ? insights : insights.filter(i => i.importance === filter.toUpperCase());

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">AI Insights</h1>
        <p className="page-subtitle">Automatically generated insights from your data analysis.</p>
      </div>

      {/* Filter Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {['all', 'high', 'medium', 'low'].map(f => (
          <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} Priority
            {f !== 'all' && <span style={{ marginLeft: 4, fontSize: '10px', color: 'var(--silver-dark)' }}>
              ({insights.filter(i => i.importance === f.toUpperCase()).length})
            </span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/></svg>
          <h3>No insights yet</h3>
          <p>Upload and analyze a dataset to generate AI insights.</p>
          <button className="btn btn-primary" onClick={() => router.push('/data')}>Upload Data</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {filtered.map(insight => (
            <div key={insight.id} className="insight-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <span className={`insight-importance insight-importance-${insight.importance.toLowerCase()}`} />
                <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 500 }}>{insight.title}</h4>
                <span className="badge badge-default" style={{ marginLeft: 'auto' }}>{insight.importance}</span>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-3)' }}>
                {insight.explanation}
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {insight.metric && <span className="badge badge-outline">{insight.metric}</span>}
                {insight.timeframe && <span className="badge badge-outline">{insight.timeframe}</span>}
                {insight.affectedDimension && <span className="badge badge-outline">{insight.affectedDimension}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
