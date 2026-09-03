// CSV Parser

import Papa from 'papaparse';
import { DataRow, ParsedDataset, ColumnDefinition } from '@/types';
import { inferColumnType, getColumnValues } from '@/lib/utils';

export function parseCSV(content: string): ParsedDataset {
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (result.errors.length > 0) {
    // Filter out non-critical errors
    const criticalErrors = result.errors.filter(e => e.type === 'FieldMismatch' || e.type === 'Quotes');
    if (criticalErrors.length > 0 && result.data.length === 0) {
      throw new Error(`CSV parsing failed: ${criticalErrors[0].message}`);
    }
  }

  const rows = result.data as DataRow[];
  if (rows.length === 0) {
    throw new Error('The CSV file contains no data rows.');
  }

  const columnNames = Object.keys(rows[0]);
  const columns: ColumnDefinition[] = columnNames.map(name => {
    const values = getColumnValues(rows, name);
    const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
    return {
      name,
      type: inferColumnType(values),
      nullable: nonNull.length < values.length,
      sampleValues: nonNull.slice(0, 5).map(String),
      uniqueCount: new Set(nonNull.map(String)).size,
      nullCount: values.length - nonNull.length,
      totalCount: values.length,
    };
  });

  return { columns, rows, rowCount: rows.length };
}
