'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: { name: string; status: string }[];
  timestamp: Date;
}

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
);

export default function AnalystPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [datasetId, setDatasetId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadDataset();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadDataset = async () => {
    try {
      const res = await fetch('/api/datasets');
      const result = await res.json();
      if (result.data?.[0]) {
        setDatasetId(result.data[0].id);
      }
    } catch (err) { console.error(err); }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !datasetId) return;

    const userMessage: Message = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content, datasetId }),
      });

      const result = await res.json();
      if (result.success) {
        const aiMessage: Message = {
          role: 'assistant',
          content: result.data.response,
          toolCalls: result.data.toolCalls,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I encountered an error processing your request. Please try again.',
          timestamp: new Date(),
        }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Please check your network and try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestions = [
    'Give me a summary of this dataset',
    'What are the biggest anomalies?',
    'How has Revenue changed over time?',
    'Which region is performing best?',
    'Show me the top 5 products by revenue',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-height, 0px))' }}>
      {/* Header */}
      <div style={{ padding: 'var(--space-6) var(--space-8) var(--space-4)', borderBottom: '1px solid var(--border-default)' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>AI Analyst</h1>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          Ask questions about your data in plain language. All answers are grounded in your actual dataset.
        </p>
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{ flex: 1, overflow: 'auto' }}>
        {messages.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            flex: 1, minHeight: '300px', textAlign: 'center',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--silver)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 'var(--space-4)' }}>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>Ask anything about your data</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-6)', maxWidth: 400 }}>
              The AI analyst uses your actual dataset to compute answers. It never fabricates numbers.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center', maxWidth: 500 }}>
              {suggestions.map(s => (
                <button
                  key={s}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 'var(--text-xs)' }}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role === 'user' ? 'chat-message-user' : 'chat-message-ai'}`}>
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div style={{
                display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap',
                marginBottom: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--silver-dark)',
              }}>
                {msg.toolCalls.map((tc, j) => (
                  <span key={j} className="badge badge-outline" style={{ fontSize: '10px' }}>
                    ✓ {tc.name.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
          </div>
        ))}

        {loading && (
          <div className="chat-message chat-message-ai">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{
                width: 16, height: 16, border: '2px solid var(--silver-lighter)',
                borderTopColor: 'var(--dark-blue)', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Analyzing your data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask anything about your data…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading || !datasetId}
          />
          <button
            className="btn btn-primary"
            onClick={sendMessage}
            disabled={!input.trim() || loading || !datasetId}
            style={{ height: 44, width: 44, padding: 0, flexShrink: 0 }}
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)', textAlign: 'center' }}>
          AI responses are computed from your actual data. Press Enter to send, Shift+Enter for new line.
        </div>
      </div>
    </div>
  );
}
