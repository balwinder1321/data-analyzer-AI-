// Trend Analysis Engine

import { TrendResult, DataRow, ColumnProfile } from '@/types';
import { parseDate, parseNumeric, getNumericValues, formatNumber, mean } from '@/lib/utils';
import { rollingAverage, linearRegression, growthRate } from './statistics';

export function detectTrends(
  rows: DataRow[],
  numericColumns: ColumnProfile[],
  dateColumn?: string
): TrendResult[] {
  const trends: TrendResult[] = [];

  if (!dateColumn) {
    // Without dates, just analyze overall distribution direction
    for (const col of numericColumns) {
      const values = getNumericValues(rows, col.name);
      if (values.length < 5) continue;

      // Split into halves and compare
      const mid = Math.floor(values.length / 2);
      const firstHalf = mean(values.slice(0, mid));
      const secondHalf = mean(values.slice(mid));
      const change = growthRate(secondHalf, firstHalf);

      if (Math.abs(change) >= 2) {
        trends.push({
          column: col.name,
          direction: change > 0 ? 'up' : 'down',
          slope: change / values.length,
          changePercent: change,
          significance: Math.min(Math.abs(change) / 10, 1),
          dataPoints: values.map((v, i) => ({ x: i, y: v })),
          description: `${col.name} ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% from the first half to the second half of the dataset.`,
        });
      }
    }
    return trends;
  }

  // Sort by date
  const sorted = [...rows].sort((a, b) => {
    const da = parseDate(a[dateColumn]);
    const db = parseDate(b[dateColumn]);
    if (!da || !db) return 0;
    return da.getTime() - db.getTime();
  });

  for (const col of numericColumns) {
    const dataPoints: { x: string | number; y: number }[] = [];
    const xValues: number[] = [];
    const yValues: number[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const val = parseNumeric(sorted[i][col.name]);
      const dateVal = String(sorted[i][dateColumn]);
      if (val === null) continue;
      dataPoints.push({ x: dateVal, y: val });
      xValues.push(i);
      yValues.push(val);
    }

    if (dataPoints.length < 5) continue;

    // Linear regression
    const regression = linearRegression(xValues, yValues);
    
    // Calculate overall change
    const firstQuarter = mean(yValues.slice(0, Math.ceil(yValues.length * 0.25)));
    const lastQuarter = mean(yValues.slice(Math.floor(yValues.length * 0.75)));
    const changePercent = growthRate(lastQuarter, firstQuarter);

    // Determine significance
    const significance = Math.min(Math.abs(regression.rSquared), 1);

    // Only include if there's a meaningful trend
    if (Math.abs(changePercent) < 1 && significance < 0.1) continue;

    // Moving average
    const ma = rollingAverage(yValues, Math.min(7, Math.floor(yValues.length / 3)));
    const movingAverage = ma.map((v, i) => ({
      x: dataPoints[i]?.x ?? i,
      y: v,
    }));

    let direction: 'up' | 'down' | 'stable';
    if (Math.abs(changePercent) < 2) direction = 'stable';
    else direction = changePercent > 0 ? 'up' : 'down';

    const directionWord = direction === 'up' ? 'increased' : direction === 'down' ? 'decreased' : 'remained stable';

    trends.push({
      column: col.name,
      direction,
      slope: regression.slope,
      changePercent,
      significance,
      dataPoints,
      movingAverage,
      description: `${col.name} ${directionWord} by ${Math.abs(changePercent).toFixed(1)}% over the observed period.${significance > 0.5 ? ' This is a strong and consistent trend.' : significance > 0.2 ? ' The trend shows moderate consistency.' : ' The trend has high variability.'}`,
    });
  }

  // Sort by significance (strongest trends first)
  trends.sort((a, b) => b.significance - a.significance);

  return trends;
}
