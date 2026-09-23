// OpenRouter AI Client for Multi-Model Intelligence & Analytical Tool Calling

import { SYSTEM_PROMPT, DATA_CONTEXT_TEMPLATE } from './system-prompt';
import { TOOL_DECLARATIONS, executeTool } from './tools';
import { DataRow, DataProfile } from '@/types';

export const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.5-flash';

// Convert tool declarations to standard OpenAI / OpenRouter function calling schema
const OPENROUTER_TOOLS = TOOL_DECLARATIONS.map((tool) => ({
  type: 'function' as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  },
}));

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_calls?: {
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }[];
  tool_call_id?: string;
}

export function getOpenRouterApiKey(overrideKey?: string): string | null {
  const key = overrideKey || process.env.OPENROUTER_API_KEY;
  if (!key || key.trim() === '') return null;
  return key.trim();
}

export async function generateOpenRouterAnalysis(
  prompt: string,
  rows: DataRow[],
  profile: DataProfile,
  dateColumn?: string,
  conversationHistory?: Array<{
    role: 'user' | 'model' | 'assistant';
    parts?: { text: string }[];
    content?: string;
  }>,
  overrideApiKey?: string,
  overrideModel?: string
): Promise<{ text: string; toolCalls: { name: string; result: unknown }[] }> {
  const apiKey = getOpenRouterApiKey(overrideApiKey);
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured.');
  }

  const model = overrideModel || process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;

  const columnList = profile.columns.map((c) => `${c.name} (${c.type})`).join(', ');
  const dataContext = DATA_CONTEXT_TEMPLATE(
    'Dataset',
    columnList,
    rows.length,
    `${profile.columns.length} columns, ${rows.length} rows`
  );

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: `${SYSTEM_PROMPT}\n\n${dataContext}`,
    },
  ];

  // Map conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    for (const msg of conversationHistory) {
      const text = msg.content || msg.parts?.map((p) => p.text).join('\n') || '';
      if (!text) continue;
      messages.push({
        role: msg.role === 'model' ? 'assistant' : (msg.role as 'user' | 'assistant'),
        content: text,
      });
    }
  }

  // Add current user prompt
  messages.push({
    role: 'user',
    content: prompt,
  });

  const toolCalls: { name: string; result: unknown }[] = [];
  let iterations = 0;
  const maxIterations = 5;

  while (iterations < maxIterations) {
    iterations++;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'BOB Data Analyzer',
      },
      body: JSON.stringify({
        model,
        messages,
        tools: OPENROUTER_TOOLS,
        tool_choice: 'auto',
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error (${response.status}):`, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error?.message || `OpenRouter returned status ${response.status}`);
      } catch (err: any) {
        throw new Error(err.message || `OpenRouter request failed with status ${response.status}`);
      }
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    if (!choice || !choice.message) {
      throw new Error('No valid response choices returned from OpenRouter.');
    }

    const message = choice.message;
    const requestedToolCalls = message.tool_calls;

    // If no tool calls requested, we have the final answer!
    if (!requestedToolCalls || requestedToolCalls.length === 0) {
      return {
        text: message.content || 'Analysis complete.',
        toolCalls,
      };
    }

    // Record the assistant's request for tools in the conversation history
    messages.push({
      role: 'assistant',
      content: message.content || null,
      tool_calls: requestedToolCalls,
    });

    // Execute each tool and return the output
    for (const tc of requestedToolCalls) {
      const toolName = tc.function.name;
      let toolArgs: Record<string, unknown> = {};
      try {
        toolArgs = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
      } catch (e) {
        console.warn(`Failed to parse arguments for tool ${toolName}:`, tc.function.arguments);
      }

      const result = executeTool(toolName, toolArgs, rows, dateColumn);
      toolCalls.push({ name: toolName, result });

      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result).substring(0, 4000),
      });
    }
  }

  // If max iterations reached, do a final non-tool completion to synthesize
  const finalResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'BOB Data Analyzer',
    },
    body: JSON.stringify({
      model,
      messages: [
        ...messages,
        {
          role: 'user',
          content: 'Please synthesize the findings from all computed tool results above into a clear, direct answer.',
        },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    }),
  });

  if (finalResponse.ok) {
    const finalData = await finalResponse.json();
    return {
      text: finalData.choices?.[0]?.message?.content || 'Analysis complete.',
      toolCalls,
    };
  }

  return {
    text: 'Completed tool analysis.',
    toolCalls,
  };
}

export async function generateOpenRouterExecutiveSummary(
  rows: DataRow[],
  profile: DataProfile,
  kpis: unknown[],
  trends: unknown[],
  anomalyCount: number,
  overrideApiKey?: string,
  overrideModel?: string
): Promise<string> {
  const apiKey = getOpenRouterApiKey(overrideApiKey);
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured.');
  }

  const model = overrideModel || process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;

  const columnInfo = profile.columns
    .map((c) => `${c.name} (${c.type}${c.mean !== undefined ? `, avg=${c.mean.toFixed(1)}` : ''})`)
    .join(', ');

  const prompt = `Generate a concise, professional executive summary (2-3 sentences) for this dataset.
Dataset Details:
- Total Records: ${rows.length} rows
- Columns: ${columnInfo}
- Key KPIs: ${JSON.stringify(kpis).substring(0, 600)}
- Detected Anomalies: ${anomalyCount}
- Trends Detected: ${JSON.stringify(trends).substring(0, 600)}

Guidelines:
1. Cite precise statistics, averages, and metrics from the data.
2. Highlight any critical anomalies or notable trends.
3. Be purely factual — never fabricate or speculate beyond what is provided.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'BOB Data Analyzer',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a senior data analyst and executive advisor. Write high-level, precise, factual executive summaries based strictly on provided data.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter Executive Summary error:', errorText);
    throw new Error(`OpenRouter returned status ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'Executive summary unavailable.';
}
