// XLSX Parser

import * as XLSX from 'xlsx';
import { DataRow, ParsedDataset, ColumnDefinition } from '@/types';
import { inferColumnType, getColumnValues } from '@/lib/utils';

export function parseXLSX(buffer: ArrayBuffer): ParsedDataset {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  if (workbook.SheetNames.length === 0) {
    throw new Error('The Excel file contains no worksheets.');
  }

  // Use the first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<DataRow>(worksheet, {
    defval: null,
    raw: false,
  });

  if (rows.length === 0) {
    throw new Error('The worksheet contains no data rows.');
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

export function getSheetNames(buffer: ArrayBuffer): string[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  return workbook.SheetNames;
}
