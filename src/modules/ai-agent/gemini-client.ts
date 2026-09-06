import { ENV } from '../../config/env.config';
import { logger } from '../../common/utils/logger';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export class GeminiClient {
  private apiKey: string | undefined = ENV.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  // Models to try in priority order
  private models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];

  /**
   * Call Gemini generateContent API with fallback
   */
  async generateResponse(
    systemInstruction: string,
    history: Array<{ role: string; content: string }>,
    userMessage: string
  ): Promise<string | null> {
    if (!this.apiKey || this.apiKey === 'mock-development-key') {
      return null;
    }

    // Build chat contents
    const contents: GeminiMessage[] = [];

    // Include last few history turns
    const recentHistory = history.slice(-6);
    for (const h of recentHistory) {
      if (h.role === 'user') {
        contents.push({ role: 'user', parts: [{ text: h.content }] });
      } else if (h.role === 'assistant') {
        contents.push({ role: 'model', parts: [{ text: h.content }] });
      }
    }

    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    for (const model of this.models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        const body = {
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 800
          }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const errText = await res.text();
          logger.warn(`[Gemini API] Model ${model} returned status ${res.status}: ${errText.slice(0, 150)}`);
          continue;
        }

        const data: any = await res.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText && candidateText.trim()) {
          return candidateText.trim();
        }
      } catch (err: any) {
        logger.warn(`[Gemini API] Network/call failed for ${model}: ${err.message}`);
      }
    }

    return null;
  }
}

export const geminiClient = new GeminiClient();
