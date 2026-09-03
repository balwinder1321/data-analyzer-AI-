// Dataset Analysis API — Full pipeline
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, COLLECTIONS, DBDataset, DBAnalysisRun, DBInsight, DBAnomaly } from '@/lib/db';
import { profileDataset, getNumericColumns, getDateColumns } from '@/lib/analytics/profiler';
import { assessQuality } from '@/lib/analytics/quality';
import { inferKPIs } from '@/lib/analytics/kpi';
import { detectTrends } from '@/lib/analytics/trends';
import { detectAnomalies } from '@/lib/analytics/anomaly';
import { calculateCorrelations } from '@/lib/analytics/correlations';
import { generateExecutiveSummary } from '@/lib/ai/gemini';
import { DataRow } from '@/types';
import { generateDemoDataset } from '@/lib/demo/dataset';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    let dataset = db.findById<DBDataset>(COLLECTIONS.DATASETS, id);

    // Handle demo dataset
    if (!dataset && id === 'demo') {
      const demo = generateDemoDataset();
      dataset = db.create<DBDataset>(COLLECTIONS.DATASETS, {
        id: 'demo',
        name: demo.name,
        source: 'DEMO',
        rowCount: demo.rows.length,
        status: 'READY',
        data: JSON.stringify(demo.rows),
        columns: JSON.stringify(demo.rows.length > 0 ? Object.keys(demo.rows[0]) : []),
        userId: session.user.id,
      });
    }

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Parse data
    const rows: DataRow[] = dataset.data ? JSON.parse(dataset.data) : [];
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Dataset has no data' }, { status: 400 });
    }

    // Create analysis run
    const run = db.create<DBAnalysisRun>(COLLECTIONS.ANALYSIS_RUNS, {
      datasetId: id,
      status: 'PROFILING',
      startedAt: new Date().toISOString(),
    });

    // Step 1: Profile
    const profile = profileDataset(rows);
    db.update<DBAnalysisRun>(COLLECTIONS.ANALYSIS_RUNS, run.id, {
      status: 'ANALYZING',
      profile: JSON.stringify(profile),
    });

    // Step 2: Quality
    const quality = assessQuality(rows, profile);
    db.update<DBAnalysisRun>(COLLECTIONS.ANALYSIS_RUNS, run.id, {
      quality: JSON.stringify(quality),
    });

    // Step 3: KPIs
    const kpis = inferKPIs(rows, profile);
    db.update<DBAnalysisRun>(COLLECTIONS.ANALYSIS_RUNS, run.id, {
      kpis: JSON.stringify(kpis),
    });

    // Step 4: Trends
    const numericCols = getNumericColumns(profile);
    const dateCols = getDateColumns(profile);
    const dateColumn = dateCols.length > 0 ? dateCols[0].name : undefined;
    const trends = detectTrends(rows, numericCols, dateColumn);
    db.update<DBAnalysisRun>(COLLECTIONS.ANALYSIS_RUNS, run.id, {
      trends: JSON.stringify(trends),
    });

    // Step 5: Anomalies
    const anomalies = detectAnomalies(rows, numericCols, dateColumn);
    // Store each anomaly
    db.deleteMany<DBAnomaly>(COLLECTIONS.ANOMALIES, (a) => a.datasetId === id);
    for (const anomaly of anomalies) {
      db.create<DBAnomaly>(COLLECTIONS.ANOMALIES, {
        ...anomaly,
        datasetId: id,
        analysisRunId: run.id,
        contributingDimensions: anomaly.contributingDimensions ? JSON.stringify(anomaly.contributingDimensions) : undefined,
        createdAt: new Date().toISOString(),
      });
    }

    // Step 6: Correlations
    const correlations = calculateCorrelations(rows, numericCols);
    db.update<DBAnalysisRun>(COLLECTIONS.ANALYSIS_RUNS, run.id, {
      correlations: JSON.stringify(correlations),
    });

    // Step 7: Generate insights
    db.deleteMany<DBInsight>(COLLECTIONS.INSIGHTS, (i) => i.datasetId === id);
    const insights = generateInsightsFromAnalysis(id, run.id, profile, quality, kpis, trends, anomalies, correlations);
    for (const insight of insights) {
      db.create<DBInsight>(COLLECTIONS.INSIGHTS, insight);
    }

    // Step 8: Executive summary
    const summary = await generateExecutiveSummary(rows, profile, kpis, trends, anomalies.length);
    db.update<DBAnalysisRun>(COLLECTIONS.ANALYSIS_RUNS, run.id, {
      status: 'COMPLETE',
      completedAt: new Date().toISOString(),
      executiveSummary: summary,
    });

    // Update dataset status
    db.update<DBDataset>(COLLECTIONS.DATASETS, id, { status: 'READY' });

    return NextResponse.json({
      success: true,
      data: {
        runId: run.id,
        profile,
        quality,
        kpis,
        trends: trends.slice(0, 5),
        anomalyCount: anomalies.length,
        insightCount: insights.length,
        correlations: correlations.strongCorrelations.slice(0, 5),
        executiveSummary: summary,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({
      error: 'Analysis failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    }, { status: 500 });
  }
}

function generateInsightsFromAnalysis(
  datasetId: string,
  runId: string,
  profile: ReturnType<typeof profileDataset>,
  quality: ReturnType<typeof assessQuality>,
  kpis: ReturnType<typeof inferKPIs>,
  trends: ReturnType<typeof detectTrends>,
  anomalies: ReturnType<typeof detectAnomalies>,
  correlations: ReturnType<typeof calculateCorrelations>
): Omit<DBInsight, 'id'>[] {
  const insights: Omit<DBInsight, 'id'>[] = [];

  // Trend insights
  for (const trend of trends.slice(0, 3)) {
    insights.push({
      datasetId,
      analysisRunId: runId,
      title: `${trend.column} is ${trend.direction === 'up' ? 'trending upward' : trend.direction === 'down' ? 'trending downward' : 'relatively stable'}`,
      explanation: trend.description,
      importance: Math.abs(trend.changePercent) > 20 ? 'HIGH' : Math.abs(trend.changePercent) > 10 ? 'MEDIUM' : 'LOW',
      metric: trend.column,
      createdAt: new Date().toISOString(),
    });
  }

  // Anomaly insights
  if (anomalies.length > 0) {
    const highAnomalies = anomalies.filter(a => a.severity === 'HIGH');
    if (highAnomalies.length > 0) {
      insights.push({
        datasetId,
        analysisRunId: runId,
        title: `${highAnomalies.length} high-severity anomalies detected`,
        explanation: `Significant outliers were found in ${[...new Set(highAnomalies.map(a => a.metric))].join(', ')}. The most notable is: ${highAnomalies[0].title} — ${highAnomalies[0].explanation}`,
        importance: 'HIGH',
        metric: highAnomalies[0].metric,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Correlation insights
  for (const corr of correlations.strongCorrelations.slice(0, 2)) {
    insights.push({
      datasetId,
      analysisRunId: runId,
      title: `Strong ${corr.direction} correlation: ${corr.column1} and ${corr.column2}`,
      explanation: `There is a ${corr.strength} ${corr.direction} correlation (r=${corr.coefficient.toFixed(2)}) between ${corr.column1} and ${corr.column2}. This means they tend to ${corr.direction === 'positive' ? 'increase together' : 'move in opposite directions'}.`,
      importance: corr.strength === 'strong' ? 'HIGH' : 'MEDIUM',
      metric: corr.column1,
      createdAt: new Date().toISOString(),
    });
  }

  // Quality insight
  if (quality.overall < 80) {
    insights.push({
      datasetId,
      analysisRunId: runId,
      title: `Data quality needs attention (Score: ${quality.overall}/100)`,
      explanation: `${quality.issues.length} quality issues were found. Key areas: completeness ${quality.completeness}%, consistency ${quality.consistency}%, validity ${quality.validity}%, uniqueness ${quality.uniqueness}%.`,
      importance: quality.overall < 60 ? 'HIGH' : 'MEDIUM',
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}
