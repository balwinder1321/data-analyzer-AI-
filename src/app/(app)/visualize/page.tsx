'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

export default function VisualizePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch('/api/datasets');
      const result = await res.json();
      if (result.data?.[0]) {
        const detailRes = await fetch(`/api/datasets/${result.data[0].id}`);
        const detail = await detailRes.json();
        if (detail.success) setData(detail.data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header"><h1 className="page-title">Visualize</h1></div>
        <div className="grid-2">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-chart" />)}</div>
      </div>
    );
  }

  if (!data?.analysis) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>No analysis data</h3>
          <p>Analyze a dataset first to see auto-generated visualizations.</p>
          <button className="btn btn-primary" onClick={() => router.push('/overview')}>Go to Overview</button>
        </div>
      </div>
    );
  }

  const trends = data.analysis.trends || [];
  const kpis = data.analysis.kpis || [];
  const correlations = data.analysis.correlations;
  const previewRows = data.previewRows || [];

  // Build bar chart data from first categorical + numeric
  const columns = data.columns || [];
  const numericCols = data.analysis.profile?.columns?.filter((c: any) => c.type === 'number') || [];
  const catCols = data.analysis.profile?.columns?.filter((c: any) => c.type === 'string' && c.uniqueCount <= 15) || [];

  let barData: any[] = [];
  if (catCols.length > 0 && numericCols.length > 0) {
    const catCol = catCols[0].name;
    const numCol = numericCols[0].name;
    const groups = new Map<string, number>();
    for (const row of previewRows) {
      const key = String(row[catCol]);
      groups.set(key, (groups.get(key) || 0) + (Number(row[numCol]) || 0));
    }
    barData = [...groups.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }

  const COLORS = ['#0B1F33', '#132D45', '#1A3A57', '#B8BDC5', '#9EA3AB', '#D4D7DC'];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Visualizations</h1>
        <p className="page-subtitle">Auto-generated charts based on your dataset structure and content.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Trend Line Charts */}
        {trends.slice(0, 3).map((trend: any, i: number) => (
          <div key={i} className="card">
            <div className="chart-title">{trend.column} Over Time</div>
            <div className="chart-subtitle">{trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {Math.abs(trend.changePercent).toFixed(1)}%</div>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={trend.dataPoints.filter((_: any, idx: number) => idx % Math.max(1, Math.floor(trend.dataPoints.length / 50)) === 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--silver-lighter)" />
                  <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#9EA3AB' }} interval="preserveStartEnd" tickFormatter={(v: string) => typeof v === 'string' && v.includes('-') ? v.slice(5) : v} />
                  <YAxis tick={{ fontSize: 10, fill: '#9EA3AB' }} width={60} tickFormatter={(v: number) => v >= 1000 ? (v / 1000).toFixed(0) + 'K' : String(Math.round(v))} />
                  <Tooltip contentStyle={{ background: '#0B1F33', border: 'none', borderRadius: 6, color: '#F5F0E6', fontSize: 12 }} />
                  <Line type="monotone" dataKey="y" stroke="#0B1F33" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}

        {/* Bar Chart */}
        {barData.length > 0 && (
          <div className="card">
            <div className="chart-title">{numericCols[0]?.name} by {catCols[0]?.name}</div>
            <div className="chart-subtitle">Top {barData.length} categories</div>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--silver-lighter)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9EA3AB' }} tickFormatter={(v: number) => v >= 1000 ? (v / 1000).toFixed(0) + 'K' : String(Math.round(v))} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#111' }} width={100} />
                  <Tooltip contentStyle={{ background: '#0B1F33', border: 'none', borderRadius: 6, color: '#F5F0E6', fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {barData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Correlation Heatmap Table */}
        {correlations?.strongCorrelations?.length > 0 && (
          <div className="card">
            <div className="chart-title">Strong Correlations</div>
            <div className="chart-subtitle">Columns that move together</div>
            <div style={{ marginTop: 'var(--space-4)' }}>
              {correlations.strongCorrelations.slice(0, 6).map((c: any, i: number) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border-subtle)',
                  fontSize: 'var(--text-sm)',
                }}>
                  <span>{c.column1} × {c.column2}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span className="badge badge-default">{c.strength}</span>
                    <span className="tabular-nums" style={{ fontWeight: 500 }}>{c.coefficient.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
