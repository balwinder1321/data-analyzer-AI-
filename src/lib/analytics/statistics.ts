// Statistical calculations engine

import { DataRow } from '@/types';
import { parseNumeric, mean, median, stdDev, variance, percentile, getNumericValues, groupBy } from '@/lib/utils';

export interface AggregationResult {
  dimension: string;
  values: { key: string; value: number }[];
}

export function sum(values: number[]): number {
  return values.reduce((s, v) => s + v, 0);
}

export function rollingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const windowValues = values.slice(start, i + 1);
    result.push(mean(windowValues));
  }
  return result;
}

export function growthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function periodComparison(
  rows: DataRow[],
  dateColumn: string,
  metricColumn: string,
  splitDate: Date
): { current: number; previous: number; change: number; changePercent: number } {
  const current: number[] = [];
  const previous: number[] = [];

  for (const row of rows) {
    const date = new Date(String(row[dateColumn]));
    const value = parseNumeric(row[metricColumn]);
    if (value === null || isNaN(date.getTime())) continue;

    if (date >= splitDate) {
      current.push(value);
    } else {
      previous.push(value);
    }
  }

  const currentSum = sum(current);
  const previousSum = sum(previous);
  const change = currentSum - previousSum;
  const changePercent = growthRate(currentSum, previousSum);

  return { current: currentSum, previous: previousSum, change, changePercent };
}

export function aggregate(
  rows: DataRow[],
  groupColumn: string,
  metricColumn: string,
  aggFunc: 'sum' | 'avg' | 'count' | 'min' | 'max' = 'sum'
): AggregationResult {
  const groups = groupBy(rows, groupColumn);
  const values: { key: string; value: number }[] = [];

  for (const [key, groupRows] of groups) {
    const nums = getNumericValues(groupRows, metricColumn);
    if (nums.length === 0) continue;

    let value: number;
    switch (aggFunc) {
      case 'sum': value = sum(nums); break;
      case 'avg': value = mean(nums); break;
      case 'count': value = nums.length; break;
      case 'min': value = Math.min(...nums); break;
      case 'max': value = Math.max(...nums); break;
    }
    values.push({ key, value });
  }

  values.sort((a, b) => b.value - a.value);
  return { dimension: groupColumn, values };
}

export function descriptiveStats(values: number[]): {
  count: number;
  sum: number;
  mean: number;
  median: number;
  mode: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
} {
  if (values.length === 0) {
    return { count: 0, sum: 0, mean: 0, median: 0, mode: 0, stdDev: 0, variance: 0, min: 0, max: 0, range: 0, q1: 0, q3: 0, iqr: 0, skewness: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const m = mean(values);
  const s = stdDev(values);
  const v = variance(values);
  const med = median(values);
  const q1Val = percentile(values, 25);
  const q3Val = percentile(values, 75);

  // Mode
  const freq = new Map<number, number>();
  for (const val of values) freq.set(val, (freq.get(val) || 0) + 1);
  let maxFreq = 0;
  let modeVal = values[0];
  for (const [val, count] of freq) {
    if (count > maxFreq) { maxFreq = count; modeVal = val; }
  }

  // Skewness
  let skewness = 0;
  if (s > 0) {
    skewness = values.reduce((acc, val) => acc + ((val - m) / s) ** 3, 0) / values.length;
  }

  return {
    count: values.length,
    sum: sum(values),
    mean: m,
    median: med,
    mode: modeVal,
    stdDev: s,
    variance: v,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    range: sorted[sorted.length - 1] - sorted[0],
    q1: q1Val,
    q3: q3Val,
    iqr: q3Val - q1Val,
    skewness,
  };
}

export function linearRegression(xValues: number[], yValues: number[]): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  const n = xValues.length;
  if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 };

  const sumX = sum(xValues);
  const sumY = sum(yValues);
  const sumXY = xValues.reduce((s, x, i) => s + x * yValues[i], 0);
  const sumX2 = xValues.reduce((s, x) => s + x * x, 0);
  const sumY2 = yValues.reduce((s, y) => s + y * y, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: mean(yValues), rSquared: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const yMean = mean(yValues);
  const ssRes = yValues.reduce((s, y, i) => s + (y - (slope * xValues[i] + intercept)) ** 2, 0);
  const ssTot = yValues.reduce((s, y) => s + (y - yMean) ** 2, 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, rSquared };
}
