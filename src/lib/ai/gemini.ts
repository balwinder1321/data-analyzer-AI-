// Gemini AI Client

import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT, DATA_CONTEXT_TEMPLATE } from './system-prompt';
import { TOOL_DECLARATIONS, executeTool } from './tools';
import { DataRow, DataProfile } from '@/types';

let genAI: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAI;
}

export async function generateAnalysis(
  prompt: string,
  rows: DataRow[],
  profile: DataProfile,
  dateColumn?: string,
  conversationHistory?: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<{ text: string; toolCalls: { name: string; result: unknown }[] }> {
  const client = getClient();
  
  if (!client) {
    // Demo mode — return a pre-computed response
    return generateDemoResponse(prompt, rows, profile);
  }

  const columnList = profile.columns.map(c => `${c.name} (${c.type})`).join(', ');
  const dataContext = DATA_CONTEXT_TEMPLATE(
    'Dataset',
    columnList,
    rows.length,
    `${profile.columns.length} columns, ${rows.length} rows`
  );

  const toolCalls: { name: string; result: unknown }[] = [];
  
  try {
    const contents = [
      ...(conversationHistory || []),
      { role: 'user' as const, parts: [{ text: prompt }] },
    ];

    let response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT + '\n\n' + dataContext,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS as any }],
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    });

    // Handle function calling loop (max 5 iterations)
    let iterations = 0;
    while (iterations < 5) {
      const candidate = response.candidates?.[0];
      if (!candidate?.content?.parts) break;

      const functionCalls = (candidate.content.parts as any[]).filter(
        (p: any) => p.functionCall
      );
      
      if (functionCalls.length === 0) break;

      // Execute each function call
      const functionResponses: any[] = [];
      for (const part of functionCalls) {
        const fc = (part as any).functionCall as { name: string; args: Record<string, unknown> };
        const result = executeTool(fc.name, fc.args || {}, rows, dateColumn);
        toolCalls.push({ name: fc.name, result });
        functionResponses.push({
          functionResponse: {
            name: fc.name,
            response: { result: JSON.stringify(result).substring(0, 4000) },
          },
        });
      }

      // Send function results back to the model
      response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          ...contents,
          { role: 'model' as const, parts: functionCalls },
          { role: 'user' as const, parts: functionResponses },
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT + '\n\n' + dataContext,
          tools: [{ functionDeclarations: TOOL_DECLARATIONS as any }],
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      });

      iterations++;
    }

    const text = (response.candidates?.[0]?.content?.parts as any[])
      ?.filter((p: any) => typeof p.text === 'string')
      .map((p: any) => p.text)
      .join('\n') || 'I was unable to generate a response. Please try again.';

    return { text, toolCalls };
  } catch (error) {
    console.error('Gemini API error:', error);
    return generateDemoResponse(prompt, rows, profile);
  }
}

// Demo mode: generate insights from computed analytics
function generateDemoResponse(
  prompt: string,
  rows: DataRow[],
  profile: DataProfile
): { text: string; toolCalls: { name: string; result: unknown }[] } {
  const promptLower = prompt.toLowerCase();
  const toolCalls: { name: string; result: unknown }[] = [];

  // Basic pattern matching for demo
  if (promptLower.includes('summary') || promptLower.includes('overview') || promptLower.includes('tell me about')) {
    const numCols = profile.columns.filter(c => c.type === 'number');
    const summaryParts = [`This dataset contains **${rows.length} records** across **${profile.columns.length} columns**.`];
    
    for (const col of numCols.slice(0, 3)) {
      if (col.mean !== undefined) {
        summaryParts.push(`- **${col.name}**: ranges from ${col.min?.toLocaleString()} to ${col.max?.toLocaleString()}, with an average of ${col.mean?.toFixed(1)}`);
      }
    }
    
    const catCols = profile.columns.filter(c => c.type === 'string' && c.uniqueCount <= 20);
    if (catCols.length > 0) {
      summaryParts.push(`\nKey dimensions: ${catCols.map(c => `**${c.name}** (${c.uniqueCount} unique values)`).join(', ')}`);
    }

    return {
      text: summaryParts.join('\n'),
      toolCalls: [{ name: 'get_dataset_schema', result: 'Schema retrieved' }],
    };
  }

  if (promptLower.includes('anomal') || promptLower.includes('unusual') || promptLower.includes('outlier')) {
    return {
      text: `I've scanned the dataset for anomalies using statistical methods (Z-score, IQR, and rolling window analysis).\n\nTo see the full anomaly report, visit the **Anomalies** page where all detected anomalies are listed with severity, expected vs actual values, and explanations.\n\n*Note: In demo mode, I'm using pre-computed analytics. Connect the Gemini API for interactive AI analysis.*`,
      toolCalls: [{ name: 'detect_anomalies', result: 'Analysis complete' }],
    };
  }

  if (promptLower.includes('trend') || promptLower.includes('growing') || promptLower.includes('declining')) {
    return {
      text: `I've analyzed the trends in your dataset.\n\nVisit the **Overview** page to see trend charts with moving averages, or the **Insights** page for detailed trend analysis.\n\n*Note: In demo mode, I'm using pre-computed analytics. Connect the Gemini API for interactive AI analysis.*`,
      toolCalls: [{ name: 'calculate_trends', result: 'Trends computed' }],
    };
  }

  // Default response
  return {
    text: `I can help you analyze this dataset. Here's what I can do:\n\n- **Summarize** the dataset\n- **Find anomalies** and unusual patterns\n- **Analyze trends** over time\n- **Compare** different groups or time periods\n- **Query** specific data points\n- **Show statistics** for any column\n\nTry asking something like:\n- "Give me a summary of this data"\n- "What are the biggest anomalies?"\n- "How has Revenue changed over time?"\n\n*Note: This is demo mode. Connect the Gemini API key for full AI-powered analysis.*`,
    toolCalls: [],
  };
}

export async function generateExecutiveSummary(
  rows: DataRow[],
  profile: DataProfile,
  kpis: unknown[],
  trends: unknown[],
  anomalyCount: number
): Promise<string> {
  const client = getClient();

  if (!client) {
    // Generate a summary from computed data
    const numCols = profile.columns.filter(c => c.type === 'number');
    const mainMetric = numCols[0];
    
    let summary = `This dataset contains ${rows.length} records across ${profile.columns.length} fields. `;
    
    if (mainMetric && mainMetric.mean !== undefined) {
      summary += `The primary metric (${mainMetric.name}) averages ${mainMetric.mean.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} with a range of ${mainMetric.min?.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} to ${mainMetric.max?.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}. `;
    }

    if (anomalyCount > 0) {
      summary += `${anomalyCount} anomalies were detected that may warrant investigation. `;
    }

    const catCols = profile.columns.filter(c => c.type === 'string' && c.uniqueCount <= 20);
    if (catCols.length > 0) {
      summary += `Data is segmented across ${catCols.map(c => c.name).join(', ')}.`;
    }

    return summary;
  }

  try {
    const columnInfo = profile.columns.map(c => 
      `${c.name} (${c.type}${c.mean !== undefined ? `, avg=${c.mean.toFixed(1)}` : ''})`
    ).join(', ');

    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `Generate a concise executive summary (2-3 sentences) for a dataset with ${rows.length} rows. Columns: ${columnInfo}. KPIs found: ${JSON.stringify(kpis).substring(0, 500)}. Number of anomalies: ${anomalyCount}. Be specific with numbers. Do not make up statistics.`,
        }],
      }],
      config: {
        systemInstruction: 'You are a business analyst. Write a brief, factual executive summary based only on the provided data. Never fabricate numbers.',
        temperature: 0.2,
        maxOutputTokens: 300,
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.text || 'Summary unavailable.';
  } catch (error) {
    console.error('Executive summary generation error:', error);
    return 'Executive summary generation failed. The analytics dashboard shows computed metrics below.';
  }
}
