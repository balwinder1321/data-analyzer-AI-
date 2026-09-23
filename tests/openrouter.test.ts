import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Load .env.local for standalone test runner if not already in environment
if (!process.env.OPENROUTER_API_KEY) {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        process.env[key] = val;
      }
    }
  }
}

import { generateOpenRouterAnalysis, generateOpenRouterExecutiveSummary } from '../src/lib/ai/openrouter';
import { profileDataset } from '../src/lib/analytics/profiler';

const sampleData = [
  { Date: '2025-01-01', Region: 'North', Sales: 500, Units: 10 },
  { Date: '2025-01-02', Region: 'South', Sales: 750, Units: 15 },
  { Date: '2025-01-03', Region: 'East', Sales: 620, Units: 12 },
  { Date: '2025-01-04', Region: 'West', Sales: 980, Units: 20 },
  { Date: '2025-01-05', Region: 'North', Sales: 450, Units: 9 },
  { Date: '2025-01-06', Region: 'South', Sales: 1100, Units: 22 },
];

test('OpenRouter AI Analyst executes data queries with tool calling', async () => {
  const profile = profileDataset(sampleData);
  const result = await generateOpenRouterAnalysis(
    'What is the total and average Sales in this dataset? Show the numbers.',
    sampleData,
    profile,
    'Date'
  );

  assert.ok(result.text, 'Expected non-empty response text');
  assert.ok(result.text.length > 20, 'Expected detailed response');
  assert.ok(result.toolCalls.length > 0, 'Expected at least one tool call to be executed');

  console.log('\n--- Tool Calls Executed ---');
  console.log(result.toolCalls.map(tc => tc.name).join(', '));
  console.log('\n--- OpenRouter AI Response ---');
  console.log(result.text);
});

test('OpenRouter generates factual executive summary', async () => {
  const profile = profileDataset(sampleData);
  const summary = await generateOpenRouterExecutiveSummary(
    sampleData,
    profile,
    [{ metric: 'Sales', total: 4400, avg: 733.33 }],
    [{ column: 'Sales', direction: 'up', changePercent: 15 }],
    0
  );

  assert.ok(summary, 'Expected executive summary');
  assert.ok(summary.length > 20, 'Expected meaningful executive summary length');
  console.log('\n--- OpenRouter Executive Summary ---');
  console.log(summary);
});
