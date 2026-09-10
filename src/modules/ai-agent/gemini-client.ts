import { ENV } from '../../config/env.config';
import { logger } from '../../common/utils/logger';

export interface GeminiAttachment {
  name: string;
  type: string;
  size?: number;
  data: string; // Base64 or plain string
}

export interface GeminiMessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: GeminiMessagePart[];
}

export class GeminiClient {
  private apiKey: string | undefined = ENV.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  // Models to try in priority order (Google Gemini 3.x Flash series)
  private models = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-2.5-flash',
    'gemini-flash-latest'
  ];

  /**
   * Call Gemini generateContent API with multimodal file support & fallback
   */
  async generateResponse(
    systemInstruction: string,
    history: Array<{ role: string; content: string }>,
    userMessage: string,
    attachments?: GeminiAttachment[]
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
      } else if (h.role === 'assistant' || h.role === 'model') {
        contents.push({ role: 'model', parts: [{ text: h.content }] });
      }
    }

    // Build user message parts (text + attachments)
    const userParts: GeminiMessagePart[] = [];
    let textPayload = userMessage;

    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        // Strip data:image/...;base64, header if present
        const base64Data = att.data.includes('base64,') ? att.data.split('base64,')[1] : att.data;

        if (
          att.type.startsWith('image/') ||
          att.type === 'application/pdf'
        ) {
          userParts.push({
            inlineData: {
              mimeType: att.type,
              data: base64Data
            }
          });
        } else {
          // If text or json, append as contextual block
          try {
            const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
            textPayload += `\n\n[Attached File: ${att.name}]\n${decoded.slice(0, 4000)}`;
          } catch {
            textPayload += `\n\n[Attached File: ${att.name} (${att.type})]`;
          }
        }
      }
    }

    userParts.unshift({ text: textPayload });
    contents.push({ role: 'user', parts: userParts });

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
            maxOutputTokens: 1200
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
