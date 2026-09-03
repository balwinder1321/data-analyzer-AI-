// Anomaly Detection Engine
// Implements multiple detection methods, chosen based on data characteristics

import { DetectedAnomaly, DataRow, ColumnProfile } from '@/types';
import { parseNumeric, parseDate, mean, median, stdDev, percentile, getNumericValues, formatNumber } from '@/lib/utils';
import { rollingAverage, descriptiveStats } from './statistics';

interface AnomalyConfig {
  zScoreThreshold?: number;
  iqrMultiplier?: number;
  rollingWindow?: number;
  minDataPoints?: number;
}

const DEFAULT_CONFIG: AnomalyConfig = {
  zScoreThreshold: 2.5,
  iqrMultiplier: 1.5,
  rollingWindow: 7,
  minDataPoints: 10,
};

export function detectAnomalies(
  rows: DataRow[],
  numericColumns: ColumnProfile[],
  dateColumn?: string,
  config: AnomalyConfig = {}
): DetectedAnomaly[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const anomalies: DetectedAnomaly[] = [];

  for (const col of numericColumns) {
    const values = getNumericValues(rows, col.name);
    if (values.length < (cfg.minDataPoints || 10)) continue;

    // Choose method based on data characteristics
    if (dateColumn && values.length >= 14) {
      // Time-series: use rolling statistics
      const tsAnomalies = detectRollingAnomalies(rows, col.name, dateColumn, cfg);
      anomalies.push(...tsAnomalies);
    }

    // Distribution-based detection
    const stats = descriptiveStats(values);
    if (Math.abs(stats.skewness) < 1) {
      // Roughly normal → Z-score
      const zAnomalies = detectZScoreAnomalies(rows, col.name, dateColumn, cfg);
      anomalies.push(...zAnomalies);
    } else {
      // Skewed → Modified Z-score (MAD) or IQR
      const iqrAnomalies = detectIQRAnomalies(rows, col.name, dateColumn, cfg);
      anomalies.push(...iqrAnomalies);
    }
  }

  // Change-point detection for time series
  if (dateColumn) {
    for (const col of numericColumns) {
      const values = getNumericValues(rows, col.name);
      if (values.length >= 20) {
        const cpAnomalies = detectChangePoints(rows, col.name, dateColumn);
        anomalies.push(...cpAnomalies);
      }
    }
  }

  // Deduplicate by similar anomalies on same row/metric
  const unique = deduplicateAnomalies(anomalies);

  // Sort by severity then deviation
  unique.sort((a, b) => {
    const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return Math.abs(b.deviation) - Math.abs(a.deviation);
  });

  return unique.slice(0, 20); // Cap at 20 most important
}

function detectZScoreAnomalies(
  rows: DataRow[],
  column: string,
  dateColumn?: string,
  config: AnomalyConfig = DEFAULT_CONFIG
): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];
  const values = getNumericValues(rows, column);
  const m = mean(values);
  const s = stdDev(values);

  if (s === 0) return anomalies;

  for (let i = 0; i < rows.length; i++) {
    const val = parseNumeric(rows[i][column]);
    if (val === null) continue;

    const zScore = Math.abs((val - m) / s);
    if (zScore >= (config.zScoreThreshold || 2.5)) {
      const deviation = ((val - m) / m) * 100;
      const severity = zScore >= 3.5 ? 'HIGH' : zScore >= 3 ? 'MEDIUM' : 'LOW';

      anomalies.push({
        title: `Unusual ${column} value`,
        metric: column,
        expectedValue: `${formatNumber(m - s * 2)} – ${formatNumber(m + s * 2)}`,
        actualValue: formatNumber(val),
        deviation,
        severity,
        confidence: zScore >= 3 ? 'HIGH' : 'MEDIUM',
        timestamp: dateColumn ? String(rows[i][dateColumn]) : undefined,
        rowIndex: i,
        detectionMethod: 'Z-score analysis',
        explanation: `This value is ${zScore.toFixed(1)} standard deviations from the mean (${formatNumber(m)}). Values outside ±${config.zScoreThreshold} standard deviations are flagged as unusual.`,
        technicalDetails: `Z-score: ${zScore.toFixed(2)}, Mean: ${formatNumber(m)}, StdDev: ${formatNumber(s)}`,
      });
    }
  }

  return anomalies;
}

function detectIQRAnomalies(
  rows: DataRow[],
  column: string,
  dateColumn?: string,
  config: AnomalyConfig = DEFAULT_CONFIG
): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];
  const values = getNumericValues(rows, column);

  const q1 = percentile(values, 25);
  const q3 = percentile(values, 75);
  const iqr = q3 - q1;
  if (iqr === 0) return anomalies;

  const lowerBound = q1 - (config.iqrMultiplier || 1.5) * iqr;
  const upperBound = q3 + (config.iqrMultiplier || 1.5) * iqr;
  const m = mean(values);

  for (let i = 0; i < rows.length; i++) {
    const val = parseNumeric(rows[i][column]);
    if (val === null) continue;

    if (val < lowerBound || val > upperBound) {
      const deviation = m !== 0 ? ((val - m) / Math.abs(m)) * 100 : 0;
      const distanceFromBound = val < lowerBound
        ? (lowerBound - val) / iqr
        : (val - upperBound) / iqr;
      const severity = distanceFromBound >= 3 ? 'HIGH' : distanceFromBound >= 1.5 ? 'MEDIUM' : 'LOW';

      anomalies.push({
        title: `${column} outlier detected`,
        metric: column,
        expectedValue: `${formatNumber(lowerBound)} – ${formatNumber(upperBound)}`,
        actualValue: formatNumber(val),
        deviation,
        severity,
        confidence: distanceFromBound >= 2 ? 'HIGH' : 'MEDIUM',
        timestamp: dateColumn ? String(rows[i][dateColumn]) : undefined,
        rowIndex: i,
        detectionMethod: 'IQR (Interquartile Range) method',
        explanation: `This value falls outside the expected range based on the data distribution. The normal range is ${formatNumber(lowerBound)} to ${formatNumber(upperBound)}.`,
        technicalDetails: `Q1: ${formatNumber(q1)}, Q3: ${formatNumber(q3)}, IQR: ${formatNumber(iqr)}, Bounds: [${formatNumber(lowerBound)}, ${formatNumber(upperBound)}]`,
      });
    }
  }

  return anomalies;
}

function detectRollingAnomalies(
  rows: DataRow[],
  column: string,
  dateColumn: string,
  config: AnomalyConfig = DEFAULT_CONFIG
): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];
  const window = config.rollingWindow || 7;

  // Sort by date
  const sorted = [...rows].sort((a, b) => {
    const da = parseDate(a[dateColumn]);
    const db = parseDate(b[dateColumn]);
    if (!da || !db) return 0;
    return da.getTime() - db.getTime();
  });

  const values = sorted.map(r => parseNumeric(r[column])).filter((v): v is number => v !== null);
  if (values.length < window * 2) return anomalies;

  const rollingMean = rollingAverage(values, window);
  
  // Calculate rolling std dev
  for (let i = window; i < values.length; i++) {
    const windowSlice = values.slice(Math.max(0, i - window), i);
    const wMean = mean(windowSlice);
    const wStd = stdDev(windowSlice);
    
    if (wStd === 0) continue;

    const zScore = Math.abs((values[i] - wMean) / wStd);
    if (zScore >= 2.5) {
      const deviation = wMean !== 0 ? ((values[i] - wMean) / Math.abs(wMean)) * 100 : 0;
      const severity = zScore >= 3.5 ? 'HIGH' : zScore >= 3 ? 'MEDIUM' : 'LOW';

      anomalies.push({
        title: `${deviation > 0 ? 'Spike' : 'Drop'} in ${column}`,
        metric: column,
        expectedValue: `${formatNumber(wMean - wStd * 2)} – ${formatNumber(wMean + wStd * 2)}`,
        actualValue: formatNumber(values[i]),
        deviation,
        severity,
        confidence: zScore >= 3 ? 'HIGH' : 'MEDIUM',
        timestamp: String(sorted[i][dateColumn]),
        rowIndex: i,
        detectionMethod: 'Rolling window analysis',
        explanation: `Compared to the ${window}-period rolling average (${formatNumber(wMean)}), this value deviates by ${Math.abs(deviation).toFixed(1)}%. This is significantly outside the recent trend.`,
        technicalDetails: `Rolling Z-score: ${zScore.toFixed(2)}, Window: ${window}, Rolling Mean: ${formatNumber(wMean)}, Rolling StdDev: ${formatNumber(wStd)}`,
      });
    }
  }

  return anomalies;
}

function detectChangePoints(
  rows: DataRow[],
  column: string,
  dateColumn: string
): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];

  // Sort by date
  const sorted = [...rows].sort((a, b) => {
    const da = parseDate(a[dateColumn]);
    const db = parseDate(b[dateColumn]);
    if (!da || !db) return 0;
    return da.getTime() - db.getTime();
  });

  const values = sorted.map(r => parseNumeric(r[column])).filter((v): v is number => v !== null);
  if (values.length < 20) return anomalies;

  // Simple CUSUM-based change detection
  const m = mean(values);
  const s = stdDev(values);
  if (s === 0) return anomalies;

  const threshold = 4 * s;
  let cusumPos = 0;
  let cusumNeg = 0;

  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - m;
    cusumPos = Math.max(0, cusumPos + diff - s * 0.5);
    cusumNeg = Math.min(0, cusumNeg + diff + s * 0.5);

    if (cusumPos > threshold) {
      const preMean = mean(values.slice(Math.max(0, i - 10), i));
      const postMean = mean(values.slice(i, Math.min(values.length, i + 10)));
      const deviation = preMean !== 0 ? ((postMean - preMean) / Math.abs(preMean)) * 100 : 0;

      anomalies.push({
        title: `Trend change detected in ${column}`,
        metric: column,
        expectedValue: `Trend around ${formatNumber(preMean)}`,
        actualValue: `Shifted to ${formatNumber(postMean)}`,
        deviation,
        severity: Math.abs(deviation) >= 30 ? 'HIGH' : Math.abs(deviation) >= 15 ? 'MEDIUM' : 'LOW',
        confidence: 'MEDIUM',
        timestamp: String(sorted[i]?.[dateColumn]),
        rowIndex: i,
        detectionMethod: 'CUSUM change-point detection',
        explanation: `A significant shift in the ${column} trend was detected around this point. The average changed from approximately ${formatNumber(preMean)} to ${formatNumber(postMean)}.`,
        technicalDetails: `CUSUM statistic exceeded threshold (${formatNumber(threshold)}). Pre-change mean: ${formatNumber(preMean)}, Post-change mean: ${formatNumber(postMean)}`,
      });
      cusumPos = 0; // Reset after detection
    }

    if (cusumNeg < -threshold) {
      const preMean = mean(values.slice(Math.max(0, i - 10), i));
      const postMean = mean(values.slice(i, Math.min(values.length, i + 10)));
      const deviation = preMean !== 0 ? ((postMean - preMean) / Math.abs(preMean)) * 100 : 0;

      anomalies.push({
        title: `Downward shift in ${column}`,
        metric: column,
        expectedValue: `Trend around ${formatNumber(preMean)}`,
        actualValue: `Dropped to ${formatNumber(postMean)}`,
        deviation,
        severity: Math.abs(deviation) >= 30 ? 'HIGH' : Math.abs(deviation) >= 15 ? 'MEDIUM' : 'LOW',
        confidence: 'MEDIUM',
        timestamp: String(sorted[i]?.[dateColumn]),
        rowIndex: i,
        detectionMethod: 'CUSUM change-point detection',
        explanation: `A significant downward shift in ${column} was detected. The trend dropped from approximately ${formatNumber(preMean)} to ${formatNumber(postMean)}.`,
      });
      cusumNeg = 0;
    }
  }

  return anomalies;
}

function deduplicateAnomalies(anomalies: DetectedAnomaly[]): DetectedAnomaly[] {
  const seen = new Set<string>();
  return anomalies.filter(a => {
    const key = `${a.metric}-${a.rowIndex ?? a.timestamp}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
