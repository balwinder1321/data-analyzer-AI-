// Correlation Detection Engine

import { CorrelationResult, CorrelationMatrix, ColumnProfile, DataRow } from '@/types';
import { getNumericValues, mean } from '@/lib/utils';

export function calculateCorrelations(
  rows: DataRow[],
  numericColumns: ColumnProfile[]
): CorrelationMatrix {
  const columns = numericColumns.map(c => c.name);
  const n = columns.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const strongCorrelations: CorrelationResult[] = [];

  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1; // Self-correlation
    for (let j = i + 1; j < n; j++) {
      const coeff = pearsonCorrelation(rows, columns[i], columns[j]);
      matrix[i][j] = coeff;
      matrix[j][i] = coeff;

      const absCoeff = Math.abs(coeff);
      let strength: 'strong' | 'moderate' | 'weak' | 'none';
      if (absCoeff >= 0.7) strength = 'strong';
      else if (absCoeff >= 0.4) strength = 'moderate';
      else if (absCoeff >= 0.2) strength = 'weak';
      else strength = 'none';

      if (strength === 'strong' || strength === 'moderate') {
        strongCorrelations.push({
          column1: columns[i],
          column2: columns[j],
          coefficient: coeff,
          strength,
          direction: coeff >= 0 ? 'positive' : 'negative',
        });
      }
    }
  }

  strongCorrelations.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));

  return { columns, matrix, strongCorrelations };
}

function pearsonCorrelation(rows: DataRow[], col1: string, col2: string): number {
  const pairs: [number, number][] = [];

  for (const row of rows) {
    const v1 = typeof row[col1] === 'number' ? row[col1] as number : parseFloat(String(row[col1]));
    const v2 = typeof row[col2] === 'number' ? row[col2] as number : parseFloat(String(row[col2]));
    if (!isNaN(v1) && !isNaN(v2)) {
      pairs.push([v1, v2]);
    }
  }

  if (pairs.length < 3) return 0;

  const xVals = pairs.map(p => p[0]);
  const yVals = pairs.map(p => p[1]);
  const xMean = mean(xVals);
  const yMean = mean(yVals);

  let sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (const [x, y] of pairs) {
    const dx = x - xMean;
    const dy = y - yMean;
    sumXY += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }

  const denom = Math.sqrt(sumX2 * sumY2);
  if (denom === 0) return 0;

  return sumXY / denom;
}
