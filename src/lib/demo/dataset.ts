// Demo Dataset Generator
// Creates a realistic sales/revenue dataset with built-in patterns

import { DataRow } from '@/types';

export function generateDemoDataset(): { rows: DataRow[]; name: string; description: string } {
  const rows: DataRow[] = [];
  const regions = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune'];
  const products = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E', 'Product F'];
  const categories = ['Enterprise', 'SMB', 'Consumer'];
  const channels = ['Direct', 'Online', 'Partner'];

  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-12-31');

  // Base values per region
  const regionBase: Record<string, number> = {
    'Mumbai': 180000, 'Delhi': 150000, 'Bangalore': 200000,
    'Hyderabad': 120000, 'Chennai': 100000, 'Pune': 90000,
  };

  // Product multipliers
  const productMult: Record<string, number> = {
    'Product A': 1.3, 'Product B': 1.0, 'Product C': 0.8,
    'Product D': 0.6, 'Product E': 0.5, 'Product F': 0.4,
  };

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfYear = Math.floor((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const month = d.getMonth();
    const dayOfWeek = d.getDay();

    // Skip ~40% of days to create ~220 rows (realistic daily data)
    // But ensure we have data for every month
    const region = regions[dayOfYear % regions.length];
    const product = products[(dayOfYear + month) % products.length];
    const category = categories[dayOfYear % categories.length];
    const channel = channels[(dayOfYear + 1) % channels.length];

    const baseRevenue = regionBase[region] * productMult[product];

    // Seasonal pattern: higher in Q4, lower in Q1
    const seasonalFactor = 1 + 0.15 * Math.sin((month - 3) * Math.PI / 6);

    // Growth trend: ~18% annual growth
    const growthFactor = 1 + (dayOfYear / 365) * 0.18;

    // Weekend dip
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1;

    // Random noise
    const noise = 0.85 + Math.random() * 0.3;

    let revenue = baseRevenue * seasonalFactor * growthFactor * weekendFactor * noise / 30;

    // === BUILT-IN ANOMALIES ===

    // Anomaly 1: Revenue spike on Aug 18
    if (month === 7 && d.getDate() === 18) {
      revenue *= 2.4;
    }

    // Anomaly 2: Hyderabad drop in last 2 weeks of November
    if (region === 'Hyderabad' && month === 10 && d.getDate() >= 17) {
      revenue *= 0.35;
    }

    // Anomaly 3: Product B unusual spike in October
    if (product === 'Product B' && month === 9 && d.getDate() >= 10 && d.getDate() <= 15) {
      revenue *= 1.8;
    }

    const units = Math.max(1, Math.round(revenue / (500 + Math.random() * 1500)));
    const customers = Math.max(1, Math.round(units * (0.4 + Math.random() * 0.4)));
    const conversionRate = parseFloat((2 + Math.random() * 8).toFixed(1));
    const costRatio = 0.55 + Math.random() * 0.15;
    const cost = revenue * costRatio;
    const profit = revenue - cost;

    // Introduce some missing values (~3%)
    const hasMissing = Math.random() < 0.03;

    rows.push({
      'Date': d.toISOString().split('T')[0],
      'Region': region,
      'Product': product,
      'Category': category,
      'Channel': channel,
      'Revenue': Math.round(revenue * 100) / 100,
      'Units': units,
      'Customers': customers,
      'Conversion Rate': hasMissing ? null : conversionRate,
      'Cost': Math.round(cost * 100) / 100,
      'Profit': Math.round(profit * 100) / 100,
    });
  }

  // Add a few duplicate rows (~1%)
  for (let i = 0; i < Math.floor(rows.length * 0.01); i++) {
    const idx = Math.floor(Math.random() * rows.length);
    rows.push({ ...rows[idx] });
  }

  // Shuffle slightly to make duplicates less obvious
  rows.sort((a, b) => {
    const da = String(a['Date']);
    const db = String(b['Date']);
    return da.localeCompare(db);
  });

  return {
    rows,
    name: 'Sales Performance — Demo Dataset',
    description: 'A sample sales dataset spanning 12 months across 6 regions and 6 products. Contains built-in trends, seasonal patterns, and anomalies for demonstration.',
  };
}
