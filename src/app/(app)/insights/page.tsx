'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDataset } from '@/context/DatasetContext';

export default function InsightsPage() {
  const { activeDataset, loading, analyzing } = useDataset();
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  const insights = activeDataset?.insights || [];
  const filtered = filter === 'all' ? insights : insights.filter((i) => i.importance === filter.toUpperCase());

  return (
    <div className="page" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">AI Insights</h1>
          <p className="page-subtitle">
            {activeDataset
              ? `Automated findings and strategic observations for ${activeDataset.name}`
              : 'Select or upload a dataset to view AI insights.'}
          </p>
        </div>
        {activeDataset && (
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/analyst')}>
            Ask AI Analyst About These
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {['all', 'high', 'medium', 'low'].map((f) => {
          const count = f === 'all' ? insights.length : insights.filter((i) => i.importance === f.toUpperCase()).length;
          return (
            <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All Insights' : `${f.charAt(0).toUpperCase() + f.slice(1)} Priority`}
              <span
                style={{
                  marginLeft: 6,
                  fontSize: '11px',
                  background: filter === f ? 'var(--dark-blue)' : 'var(--border-default)',
                  color: filter === f ? 'var(--cream)' : 'var(--text-tertiary)',
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
            <div key={i} className="skeleton" style={{ height: 120 }} />
          ))}
        </div>
      ) : !activeDataset ? (
        <div className="empty-state">
          <h3>No dataset selected</h3>
          <p>Please select a dataset from the top navigation or upload new data.</p>
          <button className="btn btn-primary" onClick={() => router.push('/data')}>
            Go to Data Management
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
          </svg>
          <h3>No insights found for this filter</h3>
          <p>There are no {filter} priority insights detected in this dataset.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {filtered.map((insight) => {
            const isExpanded = expandedId === insight.id;
            return (
              <div
                key={insight.id}
                className="insight-card"
                style={{
                  cursor: 'pointer',
                  border: isExpanded ? '1px solid var(--dark-blue)' : '1px solid var(--border-default)',
                  transition: 'all 120ms ease',
                }}
                onClick={() => setExpandedId(isExpanded ? null : insight.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <span className={`insight-importance insight-importance-${insight.importance.toLowerCase()}`} />
                  <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--dark-blue)', margin: 0 }}>
                    {insight.title}
                  </h4>
                  <span className="badge badge-default" style={{ marginLeft: 'auto' }}>
                    {insight.importance} PRIORITY
                  </span>
                </div>

                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-3)' }}>
                  {insight.explanation}
                </p>

                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                  {insight.metric && (
                    <span className="badge badge-outline">
                      Metric: <strong>{insight.metric}</strong>
                    </span>
                  )}
                  {insight.timeframe && (
                    <span className="badge badge-outline">
                      Timeframe: <strong>{insight.timeframe}</strong>
                    </span>
                  )}
                  {insight.affectedDimension && (
                    <span className="badge badge-outline">
                      Dimension: <strong>{insight.affectedDimension}</strong>
                    </span>
                  )}
                  <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {isExpanded ? 'Click to collapse' : 'Click to explore'}
                  </span>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      marginTop: 'var(--space-4)',
                      paddingTop: 'var(--space-4)',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      Identified via automated pattern clustering & statistical correlation
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/analyst?q=${encodeURIComponent(`Explain this insight in detail: ${insight.title}. ${insight.explanation}`)}`);
                      }}
                    >
                      Deep Dive with AI
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
