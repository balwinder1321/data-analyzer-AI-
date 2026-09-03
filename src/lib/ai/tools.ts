// AI Tool Definitions for Gemini Function Calling

import { DataRow } from '@/types';
import { profileDataset, profileColumn } from '@/lib/analytics/profiler';
import { detectAnomalies } from '@/lib/analytics/anomaly';
import { detectTrends } from '@/lib/analytics/trends';
import { calculateCorrelations } from '@/lib/analytics/correlations';
import { aggregate, descriptiveStats, periodComparison } from '@/lib/analytics/statistics';
import { getNumericValues, getColumnValues, parseNumeric, formatNumber, groupBy } from '@/lib/utils';

// Tool function declarations for Gemini
export const TOOL_DECLARATIONS = [
  {
    name: 'get_dataset_schema',
    description: 'Get the column names, data types, and basic statistics for the dataset',
    parameters: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_column_profile',
    description: 'Get detailed profile for a specific column including statistics, distribution, and top values',
    parameters: {
      type: 'object' as const,
      properties: {
        column: { type: 'string' as const, description: 'The column name to profile' },
      },
      required: ['column'],
    },
  },
  {
    name: 'query_dataset',
    description: 'Filter and retrieve rows from the dataset matching specific conditions',
    parameters: {
      type: 'object' as const,
      properties: {
        column: { type: 'string' as const, description: 'Column to filter on' },
        operator: { type: 'string' as const, enum: ['equals', 'contains', 'greater_than', 'less_than', 'between'], description: 'Filter operator' },
        value: { type: 'string' as const, description: 'Filter value' },
        value2: { type: 'string' as const, description: 'Second value for between operator' },
        limit: { type: 'number' as const, description: 'Max rows to return (default 20)' },
      },
      required: ['column', 'operator', 'value'],
    },
  },
  {
    name: 'aggregate_data',
    description: 'Group data by a dimension column and aggregate a metric column (sum, avg, count, min, max)',
    parameters: {
      type: 'object' as const,
      properties: {
        groupBy: { type: 'string' as const, description: 'Column to group by' },
        metric: { type: 'string' as const, description: 'Column to aggregate' },
        aggregation: { type: 'string' as const, enum: ['sum', 'avg', 'count', 'min', 'max'], description: 'Aggregation function' },
      },
      required: ['groupBy', 'metric', 'aggregation'],
    },
  },
  {
    name: 'calculate_statistics',
    description: 'Compute descriptive statistics for a numeric column (mean, median, std dev, quartiles, etc.)',
    parameters: {
      type: 'object' as const,
      properties: {
        column: { type: 'string' as const, description: 'The numeric column to analyze' },
      },
      required: ['column'],
    },
  },
  {
    name: 'detect_anomalies',
    description: 'Find anomalies and outliers in a specific metric column',
    parameters: {
      type: 'object' as const,
      properties: {
        metric: { type: 'string' as const, description: 'The metric column to check for anomalies' },
      },
      required: ['metric'],
    },
  },
  {
    name: 'calculate_trends',
    description: 'Analyze trends over time for numeric columns',
    parameters: {
      type: 'object' as const,
      properties: {
        column: { type: 'string' as const, description: 'The numeric column to analyze trends for' },
      },
      required: ['column'],
    },
  },
  {
    name: 'compare_periods',
    description: 'Compare a metric between two time periods',
    parameters: {
      type: 'object' as const,
      properties: {
        metric: { type: 'string' as const, description: 'The metric column to compare' },
        splitDate: { type: 'string' as const, description: 'The date to split periods (YYYY-MM-DD)' },
      },
      required: ['metric', 'splitDate'],
    },
  },
  {
    name: 'retrieve_supporting_rows',
    description: 'Get the raw data rows that match specific criteria, useful for drilling into insights',
    parameters: {
      type: 'object' as const,
      properties: {
        filters: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              column: { type: 'string' as const },
              value: { type: 'string' as const },
            },
          },
          description: 'Array of column-value pairs to filter by',
        },
        limit: { type: 'number' as const, description: 'Max rows to return' },
      },
      required: ['filters'],
    },
  },
];

// Tool execution functions
export function executeTool(
  name: string,
  args: Record<string, unknown>,
  rows: DataRow[],
  dateColumn?: string
): unknown {
  switch (name) {
    case 'get_dataset_schema': {
      const profile = profileDataset(rows);
      return profile.columns.map(c => ({
        name: c.name,
        type: c.type,
        nullCount: c.nullCount,
        uniqueCount: c.uniqueCount,
        completeness: c.completeness.toFixed(1) + '%',
        sample: c.sampleValues.slice(0, 3),
      }));
    }

    case 'get_column_profile': {
      const col = String(args.column);
      const profile = profileColumn(col, rows);
      return profile;
    }

    case 'query_dataset': {
      const col = String(args.column);
      const op = String(args.operator);
      const val = String(args.value);
      const val2 = args.value2 ? String(args.value2) : undefined;
      const limit = Number(args.limit) || 20;

      let filtered: DataRow[];
      switch (op) {
        case 'equals':
          filtered = rows.filter(r => String(r[col]) === val);
          break;
        case 'contains':
          filtered = rows.filter(r => String(r[col]).toLowerCase().includes(val.toLowerCase()));
          break;
        case 'greater_than':
          filtered = rows.filter(r => parseNumeric(r[col]) !== null && parseNumeric(r[col])! > Number(val));
          break;
        case 'less_than':
          filtered = rows.filter(r => parseNumeric(r[col]) !== null && parseNumeric(r[col])! < Number(val));
          break;
        case 'between':
          filtered = rows.filter(r => {
            const v = parseNumeric(r[col]);
            return v !== null && v >= Number(val) && v <= Number(val2);
          });
          break;
        default:
          filtered = [];
      }
      return { count: filtered.length, rows: filtered.slice(0, limit) };
    }

    case 'aggregate_data': {
      const groupByCol = String(args.groupBy);
      const metric = String(args.metric);
      const agg = (args.aggregation || 'sum') as 'sum' | 'avg' | 'count' | 'min' | 'max';
      const result = aggregate(rows, groupByCol, metric, agg);
      return result;
    }

    case 'calculate_statistics': {
      const col = String(args.column);
      const values = getNumericValues(rows, col);
      return descriptiveStats(values);
    }

    case 'detect_anomalies': {
      const metric = String(args.metric);
      const profile = profileDataset(rows);
      const numCols = profile.columns.filter(c => c.name === metric && c.type === 'number');
      const anomalies = detectAnomalies(rows, numCols, dateColumn);
      return anomalies.slice(0, 10);
    }

    case 'calculate_trends': {
      const col = String(args.column);
      const profile = profileDataset(rows);
      const numCols = profile.columns.filter(c => c.name === col && c.type === 'number');
      const trends = detectTrends(rows, numCols, dateColumn);
      return trends.map(t => ({
        column: t.column,
        direction: t.direction,
        changePercent: t.changePercent.toFixed(1) + '%',
        description: t.description,
      }));
    }

    case 'compare_periods': {
      const metric = String(args.metric);
      const splitDate = new Date(String(args.splitDate));
      if (!dateColumn) return { error: 'No date column found in dataset' };
      return periodComparison(rows, dateColumn, metric, splitDate);
    }

    case 'retrieve_supporting_rows': {
      const filters = (args.filters || []) as { column: string; value: string }[];
      const limit = Number(args.limit) || 20;
      let filtered = rows;
      for (const f of filters) {
        filtered = filtered.filter(r => String(r[f.column]).toLowerCase().includes(f.value.toLowerCase()));
      }
      return { count: filtered.length, rows: filtered.slice(0, limit) };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
