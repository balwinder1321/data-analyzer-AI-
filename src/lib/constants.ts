// App-wide constants

export const APP_NAME = 'BOB Data Analyzer';
export const APP_VERSION = '1.0.0';
export const APP_TAGLINE = 'Turn raw data into decisions.';
export const APP_DESCRIPTION = 'Connect your spreadsheets and datasets. BOB Data Analyzer automatically discovers trends, anomalies, relationships and opportunities — and explains them in plain language.';

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_FILE_TYPES = ['.csv', '.xlsx', '.xls'];
export const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const MAX_ROWS_DISPLAY = 100;
export const MAX_ROWS_PROCESSING = 100000;
export const MAX_KPI_COUNT = 6;
export const MAX_CHART_RECOMMENDATIONS = 8;

export const CHART_COLORS = {
  primary: '#0B1F33',
  secondary: '#B8BDC5',
  tertiary: '#9EA3AB',
  quaternary: '#D4D7DC',
  line: '#0B1F33',
  area: 'rgba(11, 31, 51, 0.1)',
  grid: '#E8EAED',
  tooltip: '#0B1F33',
} as const;

export const SEVERITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

export const NAV_ITEMS = [
  { label: 'Overview', href: '/overview', icon: 'home' },
  { label: 'Data', href: '/data', icon: 'database' },
  { label: 'Insights', href: '/insights', icon: 'lightbulb' },
  { label: 'Anomalies', href: '/anomalies', icon: 'alert' },
  { label: 'Visualize', href: '/visualize', icon: 'chart' },
  { label: 'AI Analyst', href: '/analyst', icon: 'message' },
  { label: 'Reports', href: '/reports', icon: 'file' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
] as const;

// Column name heuristics for KPI detection
export const METRIC_KEYWORDS = [
  'revenue', 'sales', 'amount', 'total', 'profit', 'cost', 'price',
  'count', 'quantity', 'units', 'orders', 'customers', 'users',
  'conversion', 'rate', 'growth', 'retention', 'churn',
  'score', 'rating', 'value', 'income', 'expense', 'margin',
];

export const DATE_KEYWORDS = [
  'date', 'time', 'timestamp', 'created', 'updated', 'month', 'year',
  'day', 'week', 'period', 'quarter',
];

export const DIMENSION_KEYWORDS = [
  'region', 'country', 'city', 'state', 'area', 'zone',
  'category', 'type', 'group', 'segment', 'department',
  'product', 'brand', 'channel', 'source', 'medium',
  'customer', 'user', 'name', 'id', 'status',
];
