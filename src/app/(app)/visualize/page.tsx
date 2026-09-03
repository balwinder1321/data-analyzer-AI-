'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { useDataset } from '@/context/DatasetContext';

export default function VisualizePage() {
  const { activeDataset, loading, analyzing } = useDataset();
  const router = useRouter();

  // Custom Chart Builder State
  const [xAxisCol, setXAxisCol] = useState<string>('');
  const [yAxisCol, setYAxisCol] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [aggregation, setAggregation] = useState<'sum' | 'avg' | 'count' | 'max' | 'min'>('sum');

  const previewRows = activeDataset?.previewRows || [];
  const profileColumns = activeDataset?.analysis?.profile?.columns || [];

  // Available column groups
  const numericColumns = useMemo(() => {
    return profileColumns.filter((c) => c.type === 'number').map((c) => c.name);
  }, [profileColumns]);

  const categoricalColumns = useMemo(() => {
    return profileColumns.filter((c) => c.type === 'string' || c.type === 'date').map((c) => c.name);
  }, [profileColumns]);

  // Set default builder fields when active dataset loads
  useMemo(() => {
    if (!xAxisCol && categoricalColumns.length > 0) {
      setXAxisCol(categoricalColumns[0]);
    }
    if (!yAxisCol && numericColumns.length > 0) {
      setYAxisCol(numericColumns[0]);
    }
  }, [categoricalColumns, numericColumns, xAxisCol, yAxisCol]);

  // Compute Custom Chart Data
  const customChartData = useMemo(() => {
    if (!xAxisCol || !yAxisCol || previewRows.length === 0) return [];

    const map = new Map<string, { sum: number; count: number; max: number; min: number }>();

    for (const row of previewRows) {
      const xKey = String(row[xAxisCol] ?? 'Unspecified');
      const yVal = Number(row[yAxisCol]);
      if (isNaN(yVal)) continue;

      if (!map.has(xKey)) {
        map.set(xKey, { sum: yVal, count: 1, max: yVal, min: yVal });
      } else {
        const item = map.get(xKey)!;
        item.sum += yVal;
        item.count += 1;
        item.max = Math.max(item.max, yVal);
        item.min = Math.min(item.min, yVal);
      }
    }

    const results = Array.from(map.entries()).map(([x, stat]) => {
      let finalVal = 0;
      if (aggregation === 'sum') finalVal = stat.sum;
      else if (aggregation === 'avg') finalVal = stat.sum / stat.count;
      else if (aggregation === 'count') finalVal = stat.count;
      else if (aggregation === 'max') finalVal = stat.max;
      else if (aggregation === 'min') finalVal = stat.min;

      return {
        x,
        y: Math.round(finalVal * 100) / 100,
      };
    });

    // Sort by value descending if categorical, or date order if dates
    return results.sort((a, b) => b.y - a.y).slice(0, 25);
  }, [xAxisCol, yAxisCol, aggregation, previewRows]);

  const trends = activeDataset?.analysis?.trends || [];
  const correlations = activeDataset?.analysis?.correlations?.strongCorrelations || [];

  if (loading || analyzing) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 40, height: 40, border: '2px solid var(--silver)', borderTopColor: 'var(--dark-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 'var(--space-4)' }} />
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Rendering visual charts...</p>
      </div>
    );
  }

  if (!activeDataset) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="empty-state">
          <h3>No dataset selected</h3>
          <p>Select or upload a dataset to generate visual charts and dashboards.</p>
          <button className="btn btn-primary" onClick={() => router.push('/data')}>
            Upload Data
          </button>
        </div>
      </div>
    );
  }

  const COLORS = ['#0B1F33', '#132D45', '#1A3A57', '#254A6F', '#B8BDC5', '#9EA3AB', '#707784'];

  return (
    <div className="page" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Interactive Visualizations</h1>
          <p className="page-subtitle">Custom query builder and auto-generated analytical charts for {activeDataset.name}.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => router.push('/reports')}>
          Add to Report
        </button>
      </div>

      {/* Interactive Chart Builder Section */}
      <section className="section" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="card" style={{ border: '2px solid var(--dark-blue)', background: 'var(--surface-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--dark-blue)' }}>
                Custom Chart Builder
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                Select dimensions, metrics, and aggregation rules to create live visualizations.
              </p>
            </div>
            <span className="badge badge-default">Dynamic Engine</span>
          </div>

          {/* Builder Controls */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-6)',
              background: 'var(--cream)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                X-Axis Dimension
              </label>
              <select className="input" value={xAxisCol} onChange={(e) => setXAxisCol(e.target.value)} style={{ padding: 'var(--space-2)' }}>
                {categoricalColumns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                Y-Axis Metric
              </label>
              <select className="input" value={yAxisCol} onChange={(e) => setYAxisCol(e.target.value)} style={{ padding: 'var(--space-2)' }}>
                {numericColumns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                Aggregation
              </label>
              <select className="input" value={aggregation} onChange={(e) => setAggregation(e.target.value as any)} style={{ padding: 'var(--space-2)' }}>
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="count">Count of Rows</option>
                <option value="max">Maximum</option>
                <option value="min">Minimum</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                Chart Type
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                {(['bar', 'line', 'area'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`btn btn-sm ${chartType === t ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setChartType(t)}
                    style={{ flex: 1, textTransform: 'capitalize', padding: 'var(--space-2)' }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Builder Chart Display */}
          <div style={{ width: '100%', height: 320 }}>
            {customChartData.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                Select an X and Y column to generate chart
              </div>
            ) : (
              <ResponsiveContainer>
                {chartType === 'bar' ? (
                  <BarChart data={customChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                    <XAxis dataKey="x" tick={{ fontSize: 11, fill: '#6B7280' }} interval={0} angle={-25} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} width={65} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)} />
                    <Tooltip
                      contentStyle={{ background: '#0B1F33', borderRadius: 8, color: '#ffffff', fontSize: 12, border: '1px solid rgba(255, 255, 255, 0.15)', padding: '8px 12px' }}
                      labelStyle={{ color: '#ffffff', fontWeight: 600, marginBottom: 4 }}
                      itemStyle={{ color: '#ffffff' }}
                      formatter={(val: any) => [Number(val).toLocaleString(), `${aggregation.toUpperCase()} of ${yAxisCol}`]}
                    />
                    <Bar dataKey="y" radius={[4, 4, 0, 0]}>
                      {customChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : chartType === 'line' ? (
                  <LineChart data={customChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                    <XAxis dataKey="x" tick={{ fontSize: 11, fill: '#6B7280' }} interval="preserveStartEnd" angle={-25} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} width={65} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)} />
                    <Tooltip
                      contentStyle={{ background: '#0B1F33', borderRadius: 8, color: '#ffffff', fontSize: 12, border: '1px solid rgba(255, 255, 255, 0.15)', padding: '8px 12px' }}
                      labelStyle={{ color: '#ffffff', fontWeight: 600, marginBottom: 4 }}
                      itemStyle={{ color: '#ffffff' }}
                    />
                    <Line type="monotone" dataKey="y" stroke="var(--dark-blue)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--dark-blue)' }} />
                  </LineChart>
                ) : (
                  <AreaChart data={customChartData}>
                    <defs>
                      <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--dark-blue)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--dark-blue)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                    <XAxis dataKey="x" tick={{ fontSize: 11, fill: '#6B7280' }} interval="preserveStartEnd" angle={-25} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} width={65} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)} />
                    <Tooltip
                      contentStyle={{ background: '#0B1F33', borderRadius: 8, color: '#ffffff', fontSize: 12, border: '1px solid rgba(255, 255, 255, 0.15)', padding: '8px 12px' }}
                      labelStyle={{ color: '#ffffff', fontWeight: 600, marginBottom: 4 }}
                      itemStyle={{ color: '#ffffff' }}
                    />
                    <Area type="monotone" dataKey="y" stroke="var(--dark-blue)" strokeWidth={2} fillOpacity={1} fill="url(#area-grad)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* Auto-Generated Analytical Charts */}
      <section className="section">
        <div className="section-title">Automated Analytical Chart Discovery</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 'var(--space-6)' }}>
          {/* Trend Lines */}
          {trends.map((t, idx) => (
            <div key={idx} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--dark-blue)' }}>
                  {t.column} Trend Trajectory
                </h4>
                <span className="badge badge-outline">
                  {t.direction === 'up' ? '↑' : t.direction === 'down' ? '↓' : '→'} {Math.abs(t.changePercent).toFixed(1)}%
                </span>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>
                {t.description}
              </p>

              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={t.dataPoints.filter((_, i) => i % Math.max(1, Math.floor(t.dataPoints.length / 40)) === 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                    <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#9EA3AB' }} interval="preserveStartEnd" tickFormatter={(v) => (typeof v === 'string' && v.includes('-') ? v.slice(5) : v)} />
                    <YAxis tick={{ fontSize: 10, fill: '#9EA3AB' }} width={55} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)} />
                    <Tooltip
                      contentStyle={{ background: '#0B1F33', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, color: '#ffffff', fontSize: 12, padding: '8px 12px' }}
                      labelStyle={{ color: '#ffffff', fontWeight: 600, marginBottom: 4 }}
                      itemStyle={{ color: '#ffffff' }}
                    />
                    <Line type="monotone" dataKey="y" stroke="var(--dark-blue)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}

          {/* Correlation Highlights */}
          {correlations.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--dark-blue)' }}>
                  Strong Metric Correlations
                </h4>
                <span className="badge badge-default">Pearson r</span>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>
                Co-dependent variables with high statistical significance (|r| &gt; 0.70).
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {correlations.map((c, cIdx) => (
                  <div key={cIdx} style={{ padding: 'var(--space-3)', background: 'var(--cream)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                      <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-blue)' }}>
                        {c.column1} & {c.column2}
                      </strong>
                      <span className="badge badge-default" style={{ fontSize: '11px' }}>
                        r = {c.coefficient.toFixed(2)}
                      </span>
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                      Displays a {c.strength} {c.direction} relationship. When {c.column1} increases, {c.column2} tends to {c.direction === 'positive' ? 'increase' : 'decrease'}.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
