# BOB Data Analyzer — Enterprise AI Analytics Platform

**Turn raw data into decisions.**

BOB Data Analyzer is an AI-powered data analytics web application built with Next.js 16 (Turbopack), TypeScript, and a custom design system. It allows users to upload CSV/Excel files or connect Google Sheets, then automatically profiles, cleans, analyzes, visualizes, and explains the data with plain-language executive summaries and an interactive AI analyst.

---

## Key Features

- **Automated Data Profiling**: Detects column data types (numeric, categorical, date, boolean), completeness, unique value counts, and descriptive statistics (mean, median, mode, standard deviation, quartiles, skewness).
- **Multi-Method Anomaly Detection**:
  - **Z-score & Modified Z-score (MAD)** for normal and outlier-heavy distributions.
  - **IQR (Interquartile Range)** for skewed data.
  - **Rolling Window & Moving Average Deviation** for time-series datasets.
  - Contributing dimensions and severity categorization (High, Medium, Low).
- **Trend & Correlation Discovery**: Linear regression slope analysis, direction classification, moving averages, and Pearson correlation matrices with strong-relationship flags.
- **Intelligent KPI Inference**: Automatically identifies business-critical metrics (Revenue, Units, Customers, Profit) and calculates period-over-period performance.
- **Data Quality Scoring**: Evaluates completeness, consistency, validity, and uniqueness on a 0–100 scale with actionable remediation steps.
- **Conversational AI Analyst**: Powered by Google Gemini 2.0 Flash with function-calling capabilities. Operates in grounded tool-use mode so numbers are verified against actual data.
- **Interactive Visualizations**: Recharts-powered interactive line, bar, area, scatter, and KPI visualizations designed with the custom color palette (`#F5F0E6` cream, `#0B1F33` dark blue, `#B8BDC5` silver).
- **Interactive Report Builder & PDF Export**: Compile dashboards, KPIs, and AI insights into shareable reports with one-click PDF export.
- **Turnkey Demo Mode**: Built-in 12-month synthetic sales dataset allowing immediate testing without external API keys or Google Cloud configurations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.3 (App Router, Turbopack, TypeScript) |
| **Styling** | Vanilla CSS custom design system (Tokens, Glassmorphism, Micro-animations) |
| **Charts** | Recharts 3.x |
| **Authentication** | Auth.js (NextAuth v5) with Google OAuth + Demo Credentials provider |
| **AI Integration** | Google Gemini API (`@google/genai`) with function-calling tool loop |
| **Data Ingestion** | PapaParse (CSV), SheetJS/XLSX (Excel), Google Sheets API (`googleapis`) |
| **Database** | Embedded JSON storage with Prisma schema ready for PostgreSQL |
| **Testing** | Node.js built-in test runner via `tsx` |
| **Containerization** | Multi-stage Docker image with health check |

---

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later

### Installation

```bash
# Clone or navigate to the repository
cd ar-analytics

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Configuration (`.env.local`)

```env
# Authentication
AUTH_SECRET=your_nextauth_secret_key_here

# Google OAuth (Optional - required for live Google Sheets integration)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google Gemini AI (Optional - required for live AI Analyst chat)
GEMINI_API_KEY=

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Demo Mode (Enabled by default when credentials are absent)
DEMO_MODE=true
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- Landing page: `/`
- Login page: `/login` (Click "Try Demo Mode" for instant access without credentials)
- Overview dashboard: `/overview`
- Data management: `/data`
- AI Insights: `/insights`
- Anomalies: `/anomalies`
- Visualizations: `/visualize`
- AI Analyst: `/analyst`
- Reports: `/reports`
- Settings: `/settings`

---

## Testing & Verification

Run the automated test suite (profiler, statistics, anomaly detection, trends, correlations, KPIs, quality, and parsers):

```bash
npm test
```

Run production type-checking and build:

```bash
npm run build
```

---

## Docker Deployment

Build and run using the multi-stage Docker container:

```bash
# Build image
docker build -t ar-analytics .

# Run container
docker run -p 3000:3000 --env-file .env.local ar-analytics
```

Health check endpoint: `GET /api/health`

---

## Project Structure

```
src/
├── app/
│   ├── (app)/               # Protected application shell & pages
│   │   ├── analyst/         # AI conversational interface
│   │   ├── anomalies/       # Outlier detection & diagnostics
│   │   ├── data/            # Ingestion, tables, quality metrics
│   │   ├── insights/        # Auto-generated findings
│   │   ├── overview/        # Executive dashboard
│   │   ├── reports/         # Report creator & PDF export
│   │   ├── settings/        # App & integration preferences
│   │   └── visualize/       # Dynamic chart builder
│   ├── api/                 # Next.js route handlers
│   │   ├── ai/analyst/      # Gemini function-calling route
│   │   ├── auth/            # Auth.js handlers
│   │   ├── datasets/        # Dataset CRUD & analytics execution
│   │   ├── health/          # System health check
│   │   └── upload/          # CSV/XLSX multipart upload
│   ├── login/               # Authentication page
│   ├── globals.css          # Design tokens, variables & typography
│   └── page.tsx             # Marketing landing page
├── lib/
│   ├── ai/                  # Gemini client, tool declarations, system prompts
│   ├── analytics/           # Profiler, anomaly, trends, correlations, KPIs, quality
│   ├── demo/                # Synthetic 12-month sales dataset generator
│   ├── parsers/             # CSV & XLSX file parsers
│   ├── auth.ts              # NextAuth configuration
│   └── db.ts                # Storage adapter & schema definitions
└── types/                   # Shared TypeScript interfaces
```
