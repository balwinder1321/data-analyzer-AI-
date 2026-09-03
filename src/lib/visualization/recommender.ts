// Chart Type Recommendation Engine

import { ChartRecommendation, ColumnProfile, DataProfile, DataRow } from '@/types';
import { DIMENSION_KEYWORDS, DATE_KEYWORDS, METRIC_KEYWORDS } from '@/lib/constants';

export function recommendCharts(profile: DataProfile, rows: DataRow[]): ChartRecommendation[] {
  const recommendations: ChartRecommendation[] = [];
  const numericCols = profile.columns.filter(c => c.type === 'number');
  const dateCols = profile.columns.filter(c => c.type === 'date');
  const categoricalCols = profile.columns.filter(c => c.type === 'string' && c.uniqueCount <= 20);
  const dateCol = dateCols[0];

  // 1. Time-series charts (if date column exists)
  if (dateCol) {
    for (const numCol of numericCols.slice(0, 3)) {
      if (isIdColumn(numCol.name)) continue;
      recommendations.push({
        type: 'line',
        title: `${humanize(numCol.name)} Over Time`,
        xAxis: dateCol.name,
        yAxis: numCol.name,
        reasoning: `Shows how ${numCol.name} changes over time`,
        priority: isMetricColumn(numCol.name) ? 10 : 5,
      });
    }

    // Area chart for cumulative metrics
    const revenueCol = numericCols.find(c => isMetricColumn(c.name));
    if (revenueCol) {
      recommendations.push({
        type: 'area',
        title: `${humanize(revenueCol.name)} Trend`,
        xAxis: dateCol.name,
        yAxis: revenueCol.name,
        reasoning: `Area chart emphasizes the volume of ${revenueCol.name} over time`,
        priority: 8,
      });
    }
  }

  // 2. Bar charts (categorical + numeric)
  for (const catCol of categoricalCols.slice(0, 2)) {
    for (const numCol of numericCols.slice(0, 2)) {
      if (isIdColumn(numCol.name) || isIdColumn(catCol.name)) continue;
      recommendations.push({
        type: 'bar',
        title: `${humanize(numCol.name)} by ${humanize(catCol.name)}`,
        xAxis: catCol.name,
        yAxis: numCol.name,
        groupBy: catCol.name,
        reasoning: `Compares ${numCol.name} across different ${catCol.name} values`,
        priority: isDimensionColumn(catCol.name) && isMetricColumn(numCol.name) ? 9 : 4,
      });
    }
  }

  // 3. Scatter plots (2 numeric columns)
  if (numericCols.length >= 2) {
    const pairs = getInterestingPairs(numericCols);
    for (const [col1, col2] of pairs.slice(0, 2)) {
      recommendations.push({
        type: 'scatter',
        title: `${humanize(col1.name)} vs ${humanize(col2.name)}`,
        xAxis: col1.name,
        yAxis: col2.name,
        reasoning: `Shows relationship between ${col1.name} and ${col2.name}`,
        priority: 3,
      });
    }
  }

  // 4. Histogram for numeric distribution
  for (const numCol of numericCols.slice(0, 2)) {
    if (isIdColumn(numCol.name)) continue;
    if (numCol.uniqueCount > 10) {
      recommendations.push({
        type: 'histogram',
        title: `${humanize(numCol.name)} Distribution`,
        xAxis: numCol.name,
        yAxis: 'Count',
        reasoning: `Shows the distribution pattern of ${numCol.name}`,
        priority: 2,
      });
    }
  }

  // 5. Heatmap (if categorical + date + numeric)
  if (dateCol && categoricalCols.length > 0 && numericCols.length > 0) {
    const mainMetric = numericCols.find(c => isMetricColumn(c.name)) || numericCols[0];
    recommendations.push({
      type: 'heatmap',
      title: `${humanize(mainMetric.name)} Heatmap`,
      xAxis: dateCol.name,
      yAxis: categoricalCols[0].name,
      reasoning: `Shows intensity of ${mainMetric.name} across time and ${categoricalCols[0].name}`,
      priority: 4,
    });
  }

  // Sort by priority and return top recommendations
  recommendations.sort((a, b) => b.priority - a.priority);
  return recommendations.slice(0, 8);
}

function humanize(name: string): string {
  return name.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/\b\w/g, l => l.toUpperCase()).trim();
}

function isMetricColumn(name: string): boolean {
  const lower = name.toLowerCase();
  return METRIC_KEYWORDS.some(k => lower.includes(k));
}

function isDimensionColumn(name: string): boolean {
  const lower = name.toLowerCase();
  return DIMENSION_KEYWORDS.some(k => lower.includes(k));
}

function isIdColumn(name: string): boolean {
  const lower = name.toLowerCase();
  return lower === 'id' || lower.endsWith('_id') || lower.endsWith('id');
}

function getInterestingPairs(cols: ColumnProfile[]): [ColumnProfile, ColumnProfile][] {
  const pairs: [ColumnProfile, ColumnProfile][] = [];
  for (let i = 0; i < cols.length; i++) {
    for (let j = i + 1; j < cols.length; j++) {
      if (!isIdColumn(cols[i].name) && !isIdColumn(cols[j].name)) {
        pairs.push([cols[i], cols[j]]);
      }
    }
  }
  return pairs;
}
