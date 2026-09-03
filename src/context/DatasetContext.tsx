'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface DatasetListItem {
  id: string;
  name: string;
  source: 'UPLOAD' | 'GOOGLE_SHEET' | 'DEMO';
  rowCount: number;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR';
  createdAt: string;
  latestAnalysis?: {
    status: string;
    completedAt?: string;
  } | null;
}

export interface ActiveDatasetDetail {
  id: string;
  name: string;
  source: string;
  rowCount: number;
  status: string;
  columns: { name: string; type: string }[] | string[];
  createdAt: string;
  previewRows: Record<string, unknown>[];
  analysis: {
    status: string;
    completedAt?: string;
    profile: {
      columns: {
        name: string;
        type: string;
        mean?: number;
        median?: number;
        min?: number;
        max?: number;
        uniqueCount: number;
        nullCount: number;
        completeness: number;
      }[];
      rowCount: number;
      columnCount: number;
    } | null;
    quality: {
      overall: number;
      completeness: number;
      consistency: number;
      validity: number;
      uniqueness: number;
      issues: {
        column: string;
        type: string;
        severity: 'high' | 'medium' | 'low';
        description: string;
        affectedRows: number;
        percentage: number;
      }[];
    } | null;
    kpis: {
      label: string;
      value: number;
      formattedValue: string;
      change?: number;
      changeLabel?: string;
      unit?: string;
      column: string;
    }[] | null;
    trends: {
      column: string;
      direction: 'up' | 'down' | 'flat';
      changePercent: number;
      description: string;
      dataPoints: { x: string; y: number }[];
      movingAverage?: { x: string; y: number }[];
    }[] | null;
    correlations: {
      matrix: Record<string, number>[];
      strongCorrelations: {
        column1: string;
        column2: string;
        coefficient: number;
        strength: string;
        direction: string;
      }[];
    } | null;
    executiveSummary?: string;
  } | null;
  insights: {
    id: string;
    title: string;
    explanation: string;
    importance: 'HIGH' | 'MEDIUM' | 'LOW';
    metric?: string;
    timeframe?: string;
    affectedDimension?: string;
  }[];
  anomalies: {
    id: string;
    title: string;
    metric: string;
    actualValue: string;
    expectedValue?: string;
    deviation: number;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    detectionMethod: string;
    explanation: string;
    contributingDimensions?: string;
  }[];
}

interface DatasetContextType {
  datasets: DatasetListItem[];
  activeDatasetId: string | null;
  activeDataset: ActiveDatasetDetail | null;
  loading: boolean;
  analyzing: boolean;
  selectDataset: (id: string) => Promise<void>;
  refreshDatasets: () => Promise<DatasetListItem[]>;
  runAnalysis: (id?: string) => Promise<void>;
  deleteDataset: (id: string) => Promise<void>;
  loadDemoIfEmpty: () => Promise<void>;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export function DatasetProvider({ children }: { children: React.ReactNode }) {
  const [datasets, setDatasets] = useState<DatasetListItem[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [activeDataset, setActiveDataset] = useState<ActiveDatasetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Fetch single dataset details
  const fetchDatasetDetails = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/datasets/${id}`);
      const result = await res.json();
      if (result.success && result.data) {
        setActiveDataset(result.data);
        return result.data;
      }
    } catch (err) {
      console.error('Failed to load dataset details:', err);
    }
    return null;
  }, []);

  // Run analysis on a dataset
  const runAnalysis = useCallback(async (idToAnalyze?: string) => {
    const targetId = idToAnalyze || activeDatasetId;
    if (!targetId) return;

    setAnalyzing(true);
    try {
      const res = await fetch(`/api/datasets/${targetId}/analyze`, { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        await fetchDatasetDetails(targetId);
        // Refresh list to update latestAnalysis status
        const listRes = await fetch('/api/datasets');
        const listResult = await listRes.json();
        if (listResult.success) setDatasets(listResult.data || []);
      }
    } catch (err) {
      console.error('Analysis execution failed:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [activeDatasetId, fetchDatasetDetails]);

  // Select dataset and persist in localStorage
  const selectDataset = useCallback(async (id: string) => {
    setActiveDatasetId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ar_active_dataset_id', id);
    }
    const details = await fetchDatasetDetails(id);
    if (details && !details.analysis) {
      await runAnalysis(id);
    }
  }, [fetchDatasetDetails, runAnalysis]);

  // Refresh dataset list
  const refreshDatasets = useCallback(async () => {
    try {
      const res = await fetch('/api/datasets');
      const result = await res.json();
      if (result.success && result.data) {
        setDatasets(result.data);
        return result.data as DatasetListItem[];
      }
    } catch (err) {
      console.error('Failed to fetch datasets list:', err);
    }
    return [];
  }, []);

  // Load demo dataset if none exist
  const loadDemoIfEmpty = useCallback(async () => {
    try {
      setAnalyzing(true);
      await fetch('/api/datasets/demo/analyze', { method: 'POST' });
      const refreshed = await refreshDatasets();
      if (refreshed.length > 0) {
        await selectDataset(refreshed[0].id);
      }
    } catch (err) {
      console.error('Failed to load demo:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [refreshDatasets, selectDataset]);

  // Delete dataset
  const deleteDataset = useCallback(async (id: string) => {
    try {
      await fetch(`/api/datasets/${id}`, { method: 'DELETE' });
      const remaining = await refreshDatasets();
      if (activeDatasetId === id) {
        if (remaining.length > 0) {
          await selectDataset(remaining[0].id);
        } else {
          setActiveDatasetId(null);
          setActiveDataset(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('ar_active_dataset_id');
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete dataset:', err);
    }
  }, [activeDatasetId, refreshDatasets, selectDataset]);

  // Initial load
  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);
      try {
        const list = await refreshDatasets();
        if (!mounted) return;

        if (list.length > 0) {
          const savedId = typeof window !== 'undefined' ? localStorage.getItem('ar_active_dataset_id') : null;
          const target = list.find(d => d.id === savedId) || list[0];
          await selectDataset(target.id);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => { mounted = false; };
  }, [refreshDatasets, selectDataset]);

  return (
    <DatasetContext.Provider
      value={{
        datasets,
        activeDatasetId,
        activeDataset,
        loading,
        analyzing,
        selectDataset,
        refreshDatasets,
        runAnalysis,
        deleteDataset,
        loadDemoIfEmpty,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
}
