// Type definitions for the analytics platform

// ---- Dataset Types ----
export interface ColumnDefinition {
  name: string;
  type: ColumnType;
  nullable: boolean;
  sampleValues: string[];
  uniqueCount: number;
  nullCount: number;
  totalCount: number;
}

export type ColumnType = 'number' | 'string' | 'date' | 'boolean' | 'unknown';

export interface DataRow {
  [key: string]: string | number | boolean | null;
}

export interface ParsedDataset {
  columns: ColumnDefinition[];
  rows: DataRow[];
  rowCount: number;
}

// ---- Analysis Types ----
export interface ColumnProfile {
  name: string;
  type: ColumnType;
  totalCount: number;
  nullCount: number;
  uniqueCount: number;
  completeness: number;
  // Numeric stats
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  mode?: number | string;
  stdDev?: number;
  variance?: number;
  q1?: number;
  q3?: number;
  skewness?: number;
  // Categorical stats
  topValues?: { value: string; count: number; percentage: number }[];
  // Date stats
  minDate?: string;
  maxDate?: string;
  dateRange?: string;
  // Sample
  sampleValues: (string | number | boolean | null)[];
}

export interface DataProfile {
  columns: ColumnProfile[];
  rowCount: number;
  columnCount: number;
  datasetSizeBytes?: number;
}

// ---- Quality Types ----
export interface QualityScore {
  overall: number; // 0-100
  completeness: number;
  consistency: number;
  validity: number;
  uniqueness: number;
  issues: QualityIssue[];
}

export interface QualityIssue {
  column: string;
  type: 'missing' | 'duplicate' | 'invalid' | 'inconsistent' | 'constant' | 'empty';
  severity: 'high' | 'medium' | 'low';
  description: string;
  affectedRows: number;
  percentage: number;
}

// ---- KPI Types ----
export interface KPI {
  label: string;
  value: number;
  formattedValue: string;
  change?: number;
  changeLabel?: string;
  unit?: string;
  column: string;
  aggregation: 'sum' | 'avg' | 'count' | 'max' | 'min' | 'latest';
}

// ---- Trend Types ----
export interface TrendResult {
  column: string;
  direction: 'up' | 'down' | 'stable';
  slope: number;
  changePercent: number;
  significance: number;
  dataPoints: { x: string | number; y: number }[];
  movingAverage?: { x: string | number; y: number }[];
  description: string;
}

// ---- Correlation Types ----
export interface CorrelationResult {
  column1: string;
  column2: string;
  coefficient: number;
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative';
}

export interface CorrelationMatrix {
  columns: string[];
  matrix: number[][];
  strongCorrelations: CorrelationResult[];
}

// ---- Anomaly Types ----
export interface DetectedAnomaly {
  title: string;
  metric: string;
  expectedValue: string;
  actualValue: string;
  deviation: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp?: string;
  rowIndex?: number;
  contributingDimensions?: { dimension: string; value: string; contribution: number }[];
  detectionMethod: string;
  explanation: string;
  technicalDetails?: string;
}

// ---- Insight Types ----
export interface GeneratedInsight {
  title: string;
  explanation: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  metric?: string;
  timeframe?: string;
  affectedDimension?: string;
  visualization?: ChartSpec;
  supportingData?: DataRow[];
}

// ---- Chart Types ----
export type ChartType = 'line' | 'bar' | 'area' | 'scatter' | 'histogram' | 'heatmap' | 'kpi';

export interface ChartSpec {
  type: ChartType;
  title: string;
  subtitle?: string;
  xAxis: string;
  yAxis: string;
  xLabel?: string;
  yLabel?: string;
  data: DataRow[];
  series?: string[];
  color?: string;
  showGrid?: boolean;
  showLegend?: boolean;
}

export interface ChartRecommendation {
  type: ChartType;
  title: string;
  xAxis: string;
  yAxis: string;
  groupBy?: string;
  reasoning: string;
  priority: number;
}

// ---- AI Types ----
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: AIToolCall[];
  charts?: ChartSpec[];
  timestamp: Date;
}

export interface AIToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'running' | 'complete' | 'error';
}

// ---- Report Types ----
export interface ReportSection {
  id: string;
  type: 'summary' | 'kpi' | 'chart' | 'insight' | 'anomaly' | 'quality' | 'table';
  title: string;
  data: unknown;
  order: number;
}

export interface ReportConfig {
  name: string;
  sections: ReportSection[];
  datasetId: string;
}

// ---- API Types ----
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
