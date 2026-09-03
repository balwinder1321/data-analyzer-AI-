import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV } from '../src/lib/parsers/csv';
import { parseXLSX } from '../src/lib/parsers/xlsx';
import * as XLSX from 'xlsx';

test('CSV Parser handles comma-separated data', () => {
  const csvContent = `Name,Age,Active,Score\nAlice,30,true,95.5\nBob,25,false,82.0\nCharlie,35,true,88.3`;
  const result = parseCSV(csvContent);

  assert.equal(result.rowCount, 3);
  assert.equal(result.columns.length, 4);
  assert.equal(result.columns.find(c => c.name === 'Name')?.type, 'string');
  assert.equal(result.columns.find(c => c.name === 'Age')?.type, 'number');
  assert.equal(result.rows[0]['Name'], 'Alice');
  assert.equal(result.rows[0]['Age'], 30);
});

test('CSV Parser recovers gracefully with empty lines or quoted commas', () => {
  const csvContent = `Item,"Description, with comma",Price\nA,"Great, cheap item",19.99\n\nB,"Another, luxury item",99.99\n`;
  const result = parseCSV(csvContent);

  assert.equal(result.rowCount, 2);
  assert.equal(result.rows[0]['Description, with comma'], 'Great, cheap item');
  assert.equal(result.rows[1]['Price'], 99.99);
});

test('XLSX Parser parses workbook buffer correctly', () => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['Product', 'Sales', 'Target'],
    ['Widget', 500, 450],
    ['Gadget', 300, 350],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const result = parseXLSX(buffer);
  assert.equal(result.rowCount, 2);
  assert.equal(result.columns.length, 3);
  assert.equal(result.columns.find(c => c.name === 'Sales')?.type, 'number');
  assert.equal(result.rows[0]['Product'], 'Widget');
  assert.equal(result.rows[0]['Sales'], '500');
});
