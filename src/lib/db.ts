// Lightweight JSON-file database for development
// In production, replace with PostgreSQL/Prisma/Drizzle

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DB_DIR = path.join(process.cwd(), '.data');

export interface DBRecord {
  id: string;
}

function ensureDir(): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function getFilePath(collection: string): string {
  ensureDir();
  return path.join(DB_DIR, `${collection}.json`);
}

function readCollection<T extends DBRecord>(collection: string): T[] {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeCollection<T extends DBRecord>(collection: string, data: T[]): void {
  const filePath = getFilePath(collection);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export const db = {
  // Create a record
  create<T extends DBRecord>(collection: string, data: Omit<T, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): T {
    const records = readCollection<T>(collection);
    const record = {
      id: data.id || randomUUID(),
      createdAt: data.createdAt || new Date().toISOString(),
      ...data,
    } as unknown as T;
    records.push(record);
    writeCollection(collection, records);
    return record;
  },

  // Find one record
  findOne<T extends DBRecord>(collection: string, predicate: (item: T) => boolean): T | null {
    const records = readCollection<T>(collection);
    return records.find(predicate) || null;
  },

  // Find by ID
  findById<T extends DBRecord>(collection: string, id: string): T | null {
    return db.findOne<T>(collection, (item) => item.id === id);
  },

  // Find many records
  findMany<T extends DBRecord>(collection: string, predicate?: (item: T) => boolean): T[] {
    const records = readCollection<T>(collection);
    return predicate ? records.filter(predicate) : records;
  },

  // Update a record
  update<T extends DBRecord>(collection: string, id: string, data: Partial<T>): T | null {
    const records = readCollection<T>(collection);
    const index = records.findIndex(r => r.id === id);
    if (index === -1) return null;
    records[index] = { ...records[index], ...data, updatedAt: new Date().toISOString() };
    writeCollection(collection, records);
    return records[index];
  },

  // Delete a record
  delete(collection: string, id: string): boolean {
    const records = readCollection(collection);
    const filtered = records.filter(r => r.id !== id);
    if (filtered.length === records.length) return false;
    writeCollection(collection, filtered);
    return true;
  },

  // Delete many records
  deleteMany<T extends DBRecord = DBRecord>(collection: string, predicate: (item: T) => boolean): number {
    const records = readCollection<T>(collection);
    const filtered = records.filter(r => !predicate(r));
    const deleted = records.length - filtered.length;
    writeCollection(collection, filtered);
    return deleted;
  },

  // Count records
  count<T extends DBRecord = DBRecord>(collection: string, predicate?: (item: T) => boolean): number {
    const records = readCollection<T>(collection);
    return predicate ? records.filter(predicate).length : records.length;
  },
};

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  DATASETS: 'datasets',
  ANALYSIS_RUNS: 'analysis_runs',
  INSIGHTS: 'insights',
  ANOMALIES: 'anomalies',
  REPORTS: 'reports',
  AUDIT_LOGS: 'audit_logs',
} as const;

// Type-safe wrappers
export interface DBUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: string;
}

export interface DBDataset {
  id: string;
  name: string;
  source: 'UPLOAD' | 'GOOGLE_SHEET' | 'DEMO';
  sourceMetadata?: string;
  columns?: string;
  rowCount: number;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR';
  errorMessage?: string;
  data?: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DBAnalysisRun {
  id: string;
  datasetId: string;
  status: 'PENDING' | 'PROFILING' | 'ANALYZING' | 'COMPLETE' | 'ERROR';
  startedAt: string;
  completedAt?: string;
  profile?: string;
  quality?: string;
  kpis?: string;
  executiveSummary?: string;
  trends?: string;
  correlations?: string;
  errorMessage?: string;
}

export interface DBInsight {
  id: string;
  datasetId: string;
  analysisRunId?: string;
  title: string;
  explanation: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  metric?: string;
  timeframe?: string;
  affectedDimension?: string;
  visualization?: string;
  supportingData?: string;
  createdAt: string;
}

export interface DBAnomaly {
  id: string;
  datasetId: string;
  analysisRunId?: string;
  title: string;
  metric: string;
  expectedValue?: string;
  actualValue: string;
  deviation: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp?: string;
  rowIndex?: number;
  contributingDimensions?: string;
  detectionMethod: string;
  explanation: string;
  technicalDetails?: string;
  createdAt: string;
}

export interface DBReport {
  id: string;
  userId: string;
  datasetId?: string;
  name: string;
  sections: string;
  shareToken?: string;
  createdAt: string;
  updatedAt?: string;
}
