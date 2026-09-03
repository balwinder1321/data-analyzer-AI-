import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDemoDataset } from '../src/lib/demo/dataset';
import { profileDataset, profileColumn } from '../src/lib/analytics/profiler';
import { descriptiveStats, aggregate, periodComparison } from '../src/lib/analytics/statistics';
import { detectAnomalies } from '../src/lib/analytics/anomaly';
import { detectTrends } from '../src/lib/analytics/trends';
import { calculateCorrelations } from '../src/lib/analytics/correlations';
import { inferKPIs } from '../src/lib/analytics/kpi';
import { assessQuality } from '../src/lib/analytics/quality';

test('Demo Dataset Generator produces realistic data', () => {
  const { rows } = generateDemoDataset();
  assert.ok(rows.length >= 300, `Expected at least 300 rows, got ${rows.length}`);
  const firstRow = rows[0];
  assert.ok('Date' in firstRow, 'Missing Date column');
  assert.ok('Revenue' in firstRow, 'Missing Revenue column');
  assert.ok('Region' in firstRow, 'Missing Region column');
  assert.ok('Profit' in firstRow, 'Missing Profit column');
});

test('Profiler correctly detects types and summaries', () => {
  const { rows } = generateDemoDataset();
  const profile = profileDataset(rows);
  
  assert.ok(profile.columns.length > 0, 'No columns profiled');
  const revCol = profile.columns.find(c => c.name === 'Revenue');
  assert.ok(revCol, 'Revenue column not found');
  assert.equal(revCol?.type, 'number');
  assert.ok(revCol && revCol.mean !== undefined && revCol.mean > 0, 'Revenue mean should be positive');
  
  const regionCol = profile.columns.find(c => c.name === 'Region');
  assert.ok(regionCol, 'Region column not found');
  assert.equal(regionCol?.type, 'string');
  assert.ok(regionCol && regionCol.uniqueCount > 1, 'Region should have multiple unique values');
});

test('Descriptive statistics computes correct values', () => {
  const values = [10, 20, 30, 40, 50];
  const stats = descriptiveStats(values);
  assert.equal(stats.count, 5);
  assert.equal(stats.mean, 30);
  assert.equal(stats.median, 30);
  assert.equal(stats.min, 10);
  assert.equal(stats.max, 50);
});

test('Anomaly detection finds outliers in demo data', () => {
  const { rows } = generateDemoDataset();
  const profile = profileDataset(rows);
  const numCols = profile.columns.filter(c => c.type === 'number');
  const anomalies = detectAnomalies(rows, numCols, 'Date');
  
  assert.ok(Array.isArray(anomalies), 'Anomalies should be an array');
  assert.ok(anomalies.length > 0, 'Expected to detect built-in anomalies in demo dataset');
  assert.ok(anomalies[0].title, 'Anomaly should have a title');
  assert.ok(anomalies[0].severity, 'Anomaly should have severity');
});

test('Trend detection identifies direction', () => {
  const { rows } = generateDemoDataset();
  const profile = profileDataset(rows);
  const numCols = profile.columns.filter(c => c.type === 'number');
  const trends = detectTrends(rows, numCols, 'Date');
  
  assert.ok(trends.length > 0, 'Expected at least one trend');
  assert.ok(['up', 'down', 'flat'].includes(trends[0].direction), 'Invalid trend direction');
});

test('Correlation calculation computes valid Pearson coefficients', () => {
  const { rows } = generateDemoDataset();
  const profile = profileDataset(rows);
  const numCols = profile.columns.filter(c => c.type === 'number');
  const correlations = calculateCorrelations(rows, numCols);
  
  assert.ok(correlations.matrix.length > 0, 'Empty correlation matrix');
  for (const row of correlations.matrix) {
    for (const val of Object.values(row)) {
      if (typeof val === 'number') {
        assert.ok(val >= -1.01 && val <= 1.01, `Invalid correlation value: ${val}`);
      }
    }
  }
});

test('KPI inference identifies key business metrics', () => {
  const { rows } = generateDemoDataset();
  const profile = profileDataset(rows);
  const kpis = inferKPIs(rows, profile);
  
  assert.ok(kpis.length > 0, 'No KPIs inferred');
  assert.ok(kpis.some(k => k.label.toLowerCase().includes('revenue') || k.label.toLowerCase().includes('profit')), 'Revenue or Profit KPI should be inferred');
});

test('Data quality assessment evaluates completeness and validity', () => {
  const { rows } = generateDemoDataset();
  const profile = profileDataset(rows);
  const quality = assessQuality(rows, profile);
  
  assert.ok(quality.overall >= 0 && quality.overall <= 100, 'Quality score out of range');
  assert.ok(quality.completeness >= 0 && quality.completeness <= 100, 'Completeness out of range');
});
