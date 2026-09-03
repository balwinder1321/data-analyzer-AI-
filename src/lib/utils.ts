// Utility functions
import { ColumnType, DataRow } from '@/types';

export function formatNumber(value: number, decimals: number = 1): string {
  if (Math.abs(value) >= 1e9) return (value / 1e9).toFixed(decimals) + 'B';
  if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(decimals) + 'M';
  if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(decimals) + 'K';
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toFixed(decimals);
}

export function formatCurrency(value: number, currency: string = '₹'): string {
  return currency + formatNumber(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return (value >= 0 ? '+' : '') + value.toFixed(decimals) + '%';
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function parseNumeric(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : Number(String(value).replace(/[₹$€£,\s]/g, ''));
  return isNaN(num) ? null : num;
}

export function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const str = String(value).trim();
  // Try ISO
  let d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  // Try DD/MM/YYYY
  const parts = str.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    if (a > 31) { d = new Date(a, b - 1, c); } // YYYY-MM-DD
    else if (c > 31) { d = new Date(c, b - 1, a); } // DD-MM-YYYY
    else { d = new Date(c + 2000, b - 1, a); } // DD-MM-YY
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export function inferColumnType(values: unknown[]): ColumnType {
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'unknown';

  let numCount = 0;
  let dateCount = 0;
  let boolCount = 0;
  const sample = nonNull.slice(0, Math.min(100, nonNull.length));

  for (const val of sample) {
    const str = String(val).trim().toLowerCase();
    if (str === 'true' || str === 'false' || str === '1' || str === '0' || str === 'yes' || str === 'no') {
      boolCount++;
    }
    if (parseNumeric(val) !== null && str !== '' && !/^(true|false|yes|no)$/i.test(str)) {
      numCount++;
    }
    if (parseDate(val) !== null && str.length > 4 && isNaN(Number(str))) {
      dateCount++;
    }
  }

  const threshold = sample.length * 0.7;
  if (boolCount >= threshold) return 'boolean';
  if (dateCount >= threshold) return 'date';
  if (numCount >= threshold) return 'number';
  return 'string';
}

export function getUniqueValues(values: unknown[]): Set<string> {
  const set = new Set<string>();
  for (const v of values) {
    if (v !== null && v !== undefined) set.add(String(v));
  }
  return set;
}

export function sortNumbers(arr: number[]): number[] {
  return [...arr].sort((a, b) => a - b);
}

export function median(arr: number[]): number {
  const sorted = sortNumbers(arr);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function percentile(arr: number[], p: number): number {
  const sorted = sortNumbers(arr);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

export function mean(arr: number[]): number {
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

export function variance(arr: number[]): number {
  const m = mean(arr);
  return arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length;
}

export function stdDev(arr: number[]): number {
  return Math.sqrt(variance(arr));
}

export function mode(arr: (string | number)[]): string | number {
  const freq = new Map<string | number, number>();
  for (const v of arr) {
    freq.set(v, (freq.get(v) || 0) + 1);
  }
  let maxFreq = 0;
  let modeVal = arr[0];
  for (const [v, count] of freq) {
    if (count > maxFreq) { maxFreq = count; modeVal = v; }
  }
  return modeVal;
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function isNumericColumn(values: unknown[]): boolean {
  return inferColumnType(values) === 'number';
}

export function isDateColumn(values: unknown[]): boolean {
  return inferColumnType(values) === 'date';
}

export function getColumnValues(rows: DataRow[], column: string): unknown[] {
  return rows.map(row => row[column]);
}

export function getNumericValues(rows: DataRow[], column: string): number[] {
  return rows
    .map(row => parseNumeric(row[column]))
    .filter((v): v is number => v !== null);
}

export function groupBy(rows: DataRow[], column: string): Map<string, DataRow[]> {
  const groups = new Map<string, DataRow[]>();
  for (const row of rows) {
    const key = String(row[column] ?? 'null');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return groups;
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true' || !process.env.GEMINI_API_KEY;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
