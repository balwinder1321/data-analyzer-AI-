// Data Quality Scoring Engine

import { QualityScore, QualityIssue, DataRow, DataProfile, ColumnProfile } from '@/types';

export function assessQuality(rows: DataRow[], profile: DataProfile): QualityScore {
  const issues: QualityIssue[] = [];

  // 1. Completeness — % of non-null values
  let totalCells = 0;
  let nullCells = 0;
  for (const col of profile.columns) {
    totalCells += col.totalCount;
    nullCells += col.nullCount;

    if (col.nullCount > 0) {
      const pct = (col.nullCount / col.totalCount) * 100;
      issues.push({
        column: col.name,
        type: 'missing',
        severity: pct > 30 ? 'high' : pct > 10 ? 'medium' : 'low',
        description: `${col.nullCount} missing values (${pct.toFixed(1)}%)`,
        affectedRows: col.nullCount,
        percentage: pct,
      });
    }
  }
  const completeness = totalCells > 0 ? ((totalCells - nullCells) / totalCells) * 100 : 100;

  // 2. Uniqueness — duplicate rows
  const rowStrings = new Set<string>();
  let duplicateCount = 0;
  for (const row of rows) {
    const key = JSON.stringify(row);
    if (rowStrings.has(key)) {
      duplicateCount++;
    } else {
      rowStrings.add(key);
    }
  }
  const uniqueness = rows.length > 0 ? ((rows.length - duplicateCount) / rows.length) * 100 : 100;
  if (duplicateCount > 0) {
    issues.push({
      column: '(all)',
      type: 'duplicate',
      severity: duplicateCount > rows.length * 0.1 ? 'high' : duplicateCount > rows.length * 0.02 ? 'medium' : 'low',
      description: `${duplicateCount} duplicate rows detected`,
      affectedRows: duplicateCount,
      percentage: (duplicateCount / rows.length) * 100,
    });
  }

  // 3. Consistency — type consistency within columns
  let consistentCols = 0;
  for (const col of profile.columns) {
    // Check if column has consistent types
    const hasTypeIssues = checkTypeConsistency(rows, col);
    if (!hasTypeIssues) {
      consistentCols++;
    } else {
      issues.push({
        column: col.name,
        type: 'inconsistent',
        severity: 'medium',
        description: `Mixed data types detected in column`,
        affectedRows: 0, // Hard to count precisely
        percentage: 0,
      });
    }
  }
  const consistency = profile.columns.length > 0 ? (consistentCols / profile.columns.length) * 100 : 100;

  // 4. Validity — values within expected ranges
  let validCols = 0;
  for (const col of profile.columns) {
    const validityIssues = checkValidity(rows, col);
    if (validityIssues.length === 0) {
      validCols++;
    } else {
      issues.push(...validityIssues);
    }
  }
  const validity = profile.columns.length > 0 ? (validCols / profile.columns.length) * 100 : 100;

  // 5. Check for constant/empty columns
  for (const col of profile.columns) {
    if (col.uniqueCount <= 1 && col.nullCount < col.totalCount) {
      issues.push({
        column: col.name,
        type: 'constant',
        severity: 'low',
        description: `Column contains only one unique value`,
        affectedRows: col.totalCount,
        percentage: 100,
      });
    }
    if (col.nullCount === col.totalCount) {
      issues.push({
        column: col.name,
        type: 'empty',
        severity: 'high',
        description: `Column is entirely empty`,
        affectedRows: col.totalCount,
        percentage: 100,
      });
    }
  }

  // Calculate overall score
  const overall = Math.round(
    completeness * 0.35 +
    uniqueness * 0.2 +
    consistency * 0.25 +
    validity * 0.2
  );

  return {
    overall: Math.min(100, Math.max(0, overall)),
    completeness: Math.round(completeness),
    consistency: Math.round(consistency),
    validity: Math.round(validity),
    uniqueness: Math.round(uniqueness),
    issues: issues.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
  };
}

function checkTypeConsistency(rows: DataRow[], col: ColumnProfile): boolean {
  if (col.type !== 'number') return false;

  // For numeric columns, check if some values are clearly non-numeric
  let inconsistentCount = 0;
  for (const row of rows.slice(0, 100)) {
    const val = row[col.name];
    if (val === null || val === undefined || val === '') continue;
    const num = Number(String(val).replace(/[₹$€£,\s]/g, ''));
    if (isNaN(num) && String(val).trim() !== '') {
      inconsistentCount++;
    }
  }

  return inconsistentCount > rows.slice(0, 100).length * 0.1;
}

function checkValidity(rows: DataRow[], col: ColumnProfile): QualityIssue[] {
  const issues: QualityIssue[] = [];

  if (col.type === 'number' && col.min !== undefined && col.max !== undefined) {
    // Check for potential negative values in columns that should be positive
    const nameLower = col.name.toLowerCase();
    const shouldBePositive = ['revenue', 'price', 'count', 'quantity', 'units', 'age', 'population']
      .some(k => nameLower.includes(k));

    if (shouldBePositive && col.min < 0) {
      let negCount = 0;
      for (const row of rows) {
        const val = Number(row[col.name]);
        if (!isNaN(val) && val < 0) negCount++;
      }
      if (negCount > 0) {
        issues.push({
          column: col.name,
          type: 'invalid',
          severity: 'medium',
          description: `${negCount} negative values in a column that typically contains positive numbers`,
          affectedRows: negCount,
          percentage: (negCount / rows.length) * 100,
        });
      }
    }
  }

  return issues;
}
