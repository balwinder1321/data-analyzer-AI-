'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
  const router = useRouter();

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Create, save, and export analysis reports.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => {/* TODO: Create report */}}>
          New Report
        </button>
      </div>

      <div className="empty-state">
        <svg className="empty-state-icon" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
        <h3>No reports yet</h3>
        <p>Build your first report by combining KPIs, charts, and insights from your analysis.</p>
        <button className="btn btn-primary" onClick={() => router.push('/overview')}>View Analysis First</button>
      </div>
    </div>
  );
}
