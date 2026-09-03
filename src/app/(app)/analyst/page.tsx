'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDataset } from '@/context/DatasetContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: { name: string; status: string }[];
  timestamp: Date;
}

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

function AnalystContent() {
  const { activeDataset, activeDatasetId, loading } = useDataset();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-fill query parameter if routed with ?q=...
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setInput(query);
      inputRef.current?.focus();
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Dynamic suggestions tailored to active dataset columns
  const dynamicSuggestions = useMemo(() => {
    if (!activeDataset) {
      return ['Give me an overview of this dataset', 'What are the main anomalies?'];
    }
    const cols = activeDataset.analysis?.profile?.columns || [];
    const numCols = cols.filter((c) => c.type === 'number').map((c) => c.name);
    const catCols = cols.filter((c) => c.type === 'string').map((c) => c.name);

    const list = [`Give me an executive summary of ${activeDataset.name}`];
    if (numCols.length > 0) {
      list.push(`What are the key statistics and distribution of ${numCols[0]}?`);
    }
    if (catCols.length > 0 && numCols.length > 0) {
      list.push(`Calculate average ${numCols[0]} grouped by ${catCols[0]}`);
    }
    if (activeDataset.anomalies && activeDataset.anomalies.length > 0) {
      list.push(`What caused the biggest anomaly detected in this dataset?`);
    }
    list.push(`What actionable opportunities can be found in this data?`);
    return list;
  }, [activeDataset]);

  const sendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend || sending || !activeDatasetId) return;

    const userMessage: Message = { role: 'user', content: textToSend, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('ar_gemini_api_key') : null;

      const res = await fetch('/api/ai/analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-key': apiKey } : {}),
        },
        body: JSON.stringify({
          message: textToSend,
          datasetId: activeDatasetId,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: result.data.response,
            toolCalls: result.data.toolCalls,
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: result.error || 'I encountered an issue computing the statistical answer. Please retry.',
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err) {
      console.error('Analyst query error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Unable to connect to analysis server. Please check your network.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-tertiary)' }}>Loading AI Analyst interface...</p>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 'var(--text-xl)', marginBottom: 2 }}>
            AI Data Analyst
          </h1>
          <p className="page-subtitle" style={{ fontSize: 'var(--text-xs)' }}>
            {activeDataset ? (
              <>Grounded analysis active on <strong>{activeDataset.name}</strong> ({activeDataset.rowCount.toLocaleString()} rows)</>
            ) : (
              'Select a dataset to begin natural language inquiry'
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setMessages([])}>
            Clear Chat
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push('/settings')}>
            Configure API
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-4)',
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-4)',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: 'var(--space-6)' }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: 'var(--dark-blue)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cream)',
                marginBottom: 'var(--space-3)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--dark-blue)', marginBottom: 'var(--space-2)' }}>
              Ask Questions Grounded in Your Dataset
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', maxWidth: 440, marginBottom: 'var(--space-6)', lineHeight: 1.6 }}>
              The AI Analyst calculates actual statistics, aggregates measures, and verifies hypotheses directly from your data without hallucinating figures.
            </p>

            {/* Suggestions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center', maxWidth: 600 }}>
              {dynamicSuggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(prompt)}
                  style={{
                    background: 'var(--cream)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-full)',
                    padding: 'var(--space-2) var(--space-4)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--dark-blue)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 120ms ease',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--dark-blue)'; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--border-default)'; }}
                >
                  💬 {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: msg.role === 'user' ? 'var(--dark-blue)' : 'var(--cream)',
                  color: msg.role === 'user' ? 'var(--cream)' : 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content}
              </div>

              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: 'var(--space-1)', flexWrap: 'wrap' }}>
                  {msg.toolCalls.map((t, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '10px',
                        background: 'rgba(11, 31, 51, 0.06)',
                        color: 'var(--dark-blue)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'monospace',
                      }}
                    >
                      ⚡ executed {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {sending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
            <div style={{ width: 12, height: 12, border: '2px solid var(--silver)', borderTopColor: 'var(--dark-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span>Computing analytics tools and formulating grounded answer...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', position: 'relative' }}>
        <textarea
          ref={inputRef}
          className="input"
          placeholder={activeDataset ? `Ask anything about ${activeDataset.name}... (Enter to send)` : 'Select a dataset first...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!activeDatasetId || sending}
          rows={2}
          style={{ resize: 'none', padding: 'var(--space-3)', paddingRight: '50px', fontSize: 'var(--text-sm)' }}
        />
        <button
          className="btn btn-primary"
          onClick={() => sendMessage()}
          disabled={!input.trim() || sending || !activeDatasetId}
          style={{
            position: 'absolute',
            right: 8,
            bottom: 8,
            width: 36,
            height: 36,
            padding: 0,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Send query"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

export default function AnalystPage() {
  return (
    <Suspense fallback={<div className="page" style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading Analyst...</div>}>
      <AnalystContent />
    </Suspense>
  );
}
