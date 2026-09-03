// KPI Inference Engine
// Intelligently identifies meaningful KPIs from dataset columns

import { KPI, DataRow, DataProfile, ColumnProfile } from '@/types';
import { METRIC_KEYWORDS, DATE_KEYWORDS, MAX_KPI_COUNT } from '@/lib/constants';
import { getNumericValues, formatNumber, mean, parseDate } from '@/lib/utils';
import { sum, growthRate } from './statistics';

export function inferKPIs(
  rows: DataRow[],
  profile: DataProfile
): KPI[] {
  const numericColumns = profile.columns.filter(c => c.type === 'number');
  const dateColumn = findDateColumn(profile.columns);
  const candidates: KPI[] = [];

  for (const col of numericColumns) {
    const score = scoreColumn(col);
    const values = getNumericValues(rows, col.name);
    if (values.length === 0) continue;

    // Determine best aggregation
    const agg = chooseAggregation(col);
    let value: number;
    let formattedValue: string;

    switch (agg) {
      case 'sum':
        value = sum(values);
        formattedValue = formatNumber(value);
        break;
      case 'avg':
        value = mean(values);
        formattedValue = formatNumber(value);
        break;
      case 'count':
        value = values.length;
        formattedValue = formatNumber(value);
        break;
      case 'latest':
        value = values[values.length - 1];
        formattedValue = formatNumber(value);
        break;
      default:
        value = sum(values);
        formattedValue = formatNumber(value);
    }

    // Calculate period-over-period change if date column exists
    let change: number | undefined;
    let changeLabel: string | undefined;

    if (dateColumn && rows.length >= 10) {
      const periodChange = calculatePeriodChange(rows, col.name, dateColumn, agg);
      if (periodChange !== null) {
        change = periodChange.changePercent;
        changeLabel = periodChange.label;
      }
    }

    // Detect unit
    const unit = detectUnit(col.name);

    candidates.push({
      label: humanizeColumnName(col.name),
      value,
      formattedValue: unit === '%' ? value.toFixed(1) + '%' : formattedValue,
      change,
      changeLabel,
      unit,
      column: col.name,
      aggregation: agg,
    });
  }

  // Sort by importance score and take top N
  candidates.sort((a, b) => {
    const scoreA = scoreColumn(numericColumns.find(c => c.name === a.column)!);
    const scoreB = scoreColumn(numericColumns.find(c => c.name === b.column)!);
    return scoreB - scoreA;
  });

  return candidates.slice(0, MAX_KPI_COUNT);
}

function scoreColumn(col: ColumnProfile): number {
  let score = 0;
  const nameLower = col.name.toLowerCase();

  // Name-based scoring
  for (const keyword of METRIC_KEYWORDS) {
    if (nameLower.includes(keyword)) {
      score += 10;
      break;
    }
  }

  // Penalize ID-like columns
  if (nameLower.includes('id') || nameLower === 'index') score -= 20;

  // Higher variance = more interesting
  if (col.stdDev && col.mean && col.mean !== 0) {
    const cv = Math.abs(col.stdDev / col.mean);
    if (cv > 0.1 && cv < 2) score += 5;
  }

  // Higher completeness = more reliable
  score += col.completeness / 20;

  // Non-negative values suggest a metric
  if (col.min !== undefined && col.min >= 0) score += 3;

  return score;
}

function chooseAggregation(col: ColumnProfile): 'sum' | 'avg' | 'count' | 'latest' {
  const nameLower = col.name.toLowerCase();

  // Rates and percentages should be averaged
  if (nameLower.includes('rate') || nameLower.includes('percent') ||
      nameLower.includes('ratio') || nameLower.includes('conversion') ||
      nameLower.includes('score') || nameLower.includes('rating') ||
      nameLower.includes('average') || nameLower.includes('avg')) {
    return 'avg';
  }

  // Counts and quantities should be summed
  if (nameLower.includes('revenue') || nameLower.includes('sales') ||
      nameLower.includes('amount') || nameLower.includes('total') ||
      nameLower.includes('cost') || nameLower.includes('profit') ||
      nameLower.includes('units') || nameLower.includes('quantity') ||
      nameLower.includes('count') || nameLower.includes('orders')) {
    return 'sum';
  }

  // Default: if values are large, sum; if small, average
  if (col.mean !== undefined && col.mean > 100) return 'sum';
  return 'avg';
}

function findDateColumn(columns: ColumnProfile[]): string | undefined {
  // First check explicit date types
  const dateCol = columns.find(c => c.type === 'date');
  if (dateCol) return dateCol.name;

  // Check name heuristics
  for (const col of columns) {
    const nameLower = col.name.toLowerCase();
    for (const keyword of DATE_KEYWORDS) {
      if (nameLower.includes(keyword)) return col.name;
    }
  }

  return undefined;
}

function calculatePeriodChange(
  rows: DataRow[],
  column: string,
  dateColumn: string,
  agg: 'sum' | 'avg' | 'count' | 'latest'
): { changePercent: number; label: string } | null {
  // Sort by date
  const sorted = [...rows].sort((a, b) => {
    const da = parseDate(a[dateColumn]);
    const db = parseDate(b[dateColumn]);
    if (!da || !db) return 0;
    return da.getTime() - db.getTime();
  });

  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  const firstValues = getNumericValues(firstHalf, column);
  const secondValues = getNumericValues(secondHalf, column);

  if (firstValues.length === 0 || secondValues.length === 0) return null;

  let first: number, second: number;
  switch (agg) {
    case 'sum': first = sum(firstValues); second = sum(secondValues); break;
    case 'avg': first = mean(firstValues); second = mean(secondValues); break;
    case 'count': first = firstValues.length; second = secondValues.length; break;
    case 'latest': first = firstValues[firstValues.length - 1]; second = secondValues[secondValues.length - 1]; break;
    default: first = sum(firstValues); second = sum(secondValues);
  }

  const changePercent = growthRate(second, first);
  return { changePercent, label: 'vs previous period' };
}

function detectUnit(columnName: string): string | undefined {
  const name = columnName.toLowerCase();
  if (name.includes('rate') || name.includes('percent') || name.includes('conversion')) return '%';
  if (name.includes('revenue') || name.includes('price') || name.includes('cost') ||
      name.includes('amount') || name.includes('profit') || name.includes('income')) return '₹';
  return undefined;
}

function humanizeColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

// Re-export for statistics
function sum2(values: number[]): number {
  return values.reduce((s, v) => s + v, 0);
}
