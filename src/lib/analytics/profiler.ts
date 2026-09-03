// Data Profiling Engine
// Analyzes each column to determine types, statistics, and distributions

import { ColumnProfile, DataProfile, DataRow, ColumnType } from '@/types';
import {
  inferColumnType, parseNumeric, parseDate,
  mean, median, stdDev, variance, percentile, mode,
  getColumnValues, sortNumbers
} from '@/lib/utils';

export function profileDataset(rows: DataRow[]): DataProfile {
  if (!rows.length) {
    return { columns: [], rowCount: 0, columnCount: 0 };
  }

  const columnNames = Object.keys(rows[0]);
  const columns: ColumnProfile[] = columnNames.map(name => profileColumn(name, rows));

  return {
    columns,
    rowCount: rows.length,
    columnCount: columnNames.length,
  };
}

export function profileColumn(name: string, rows: DataRow[]): ColumnProfile {
  const values = getColumnValues(rows, name);
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  const type = inferColumnType(values);
  const totalCount = values.length;
  const nullCount = totalCount - nonNullValues.length;
  const uniqueValues = new Set(nonNullValues.map(v => String(v)));

  const profile: ColumnProfile = {
    name,
    type,
    totalCount,
    nullCount,
    uniqueCount: uniqueValues.size,
    completeness: totalCount > 0 ? ((totalCount - nullCount) / totalCount) * 100 : 0,
    sampleValues: nonNullValues.slice(0, 5).map(v => v as string | number | boolean | null),
  };

  if (type === 'number') {
    profileNumericColumn(profile, values);
  } else if (type === 'date') {
    profileDateColumn(profile, values);
  } else if (type === 'string') {
    profileCategoricalColumn(profile, nonNullValues);
  }

  return profile;
}

function profileNumericColumn(profile: ColumnProfile, values: unknown[]): void {
  const nums = values
    .map(v => parseNumeric(v))
    .filter((v): v is number => v !== null);

  if (nums.length === 0) return;

  const sorted = sortNumbers(nums);

  profile.min = sorted[0];
  profile.max = sorted[sorted.length - 1];
  profile.mean = mean(nums);
  profile.median = median(nums);
  profile.stdDev = stdDev(nums);
  profile.variance = variance(nums);
  profile.q1 = percentile(nums, 25);
  profile.q3 = percentile(nums, 75);
  profile.mode = mode(nums);

  // Skewness (Fisher-Pearson)
  if (profile.stdDev && profile.stdDev > 0) {
    const n = nums.length;
    const m = profile.mean!;
    const s = profile.stdDev;
    const skew = nums.reduce((sum, v) => sum + ((v - m) / s) ** 3, 0) / n;
    profile.skewness = skew;
  }
}

function profileDateColumn(profile: ColumnProfile, values: unknown[]): void {
  const dates = values
    .map(v => parseDate(v))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) return;

  profile.minDate = dates[0].toISOString().split('T')[0];
  profile.maxDate = dates[dates.length - 1].toISOString().split('T')[0];

  const diffMs = dates[dates.length - 1].getTime() - dates[0].getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 31) profile.dateRange = `${diffDays} days`;
  else if (diffDays < 365) profile.dateRange = `${Math.round(diffDays / 30)} months`;
  else profile.dateRange = `${(diffDays / 365).toFixed(1)} years`;
}

function profileCategoricalColumn(profile: ColumnProfile, values: unknown[]): void {
  const freq = new Map<string, number>();
  for (const v of values) {
    const str = String(v);
    freq.set(str, (freq.get(str) || 0) + 1);
  }

  const sorted = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  profile.topValues = sorted.map(([value, count]) => ({
    value,
    count,
    percentage: (count / values.length) * 100,
  }));

  if (sorted.length > 0) {
    profile.mode = sorted[0][0];
  }
}

export function getNumericColumns(profile: DataProfile): ColumnProfile[] {
  return profile.columns.filter(c => c.type === 'number');
}

export function getDateColumns(profile: DataProfile): ColumnProfile[] {
  return profile.columns.filter(c => c.type === 'date');
}

export function getCategoricalColumns(profile: DataProfile): ColumnProfile[] {
  return profile.columns.filter(c => c.type === 'string' && c.uniqueCount <= 50);
}
