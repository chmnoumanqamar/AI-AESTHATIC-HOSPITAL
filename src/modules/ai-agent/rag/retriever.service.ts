import { STATIC_KNOWLEDGE_BASE, RagDocument } from './vector-store';

const COMMON_STOPWORDS = new Set([
  'es', 'iss', 'is', 'mein', 'me', 'mai', 'main', 'ko', 'ka', 'ke', 'ki', 'kuch', 'kerna', 'karna',
  'karni', 'hai', 'hain', 'ho', 'hoga', 'hogi', 'do', 'dal', 'daal', 'dalo', 'data', 'check', 'batao',
  'btao', 'karo', 'kar', 'aur', 'or', 'and', 'the', 'for', 'with', 'from', 'this', 'that', 'have',
  'has', 'had', 'manay', 'mene', 'maine', 'hum', 'humein', 'mujhe', 'aap', 'ap', 'who', 'what', 'when',
  'where', 'why', 'how', 'can', 'you', 'please', 'daily', 'aaj', 'kal', 'ab', 'to', 'in', 'on', 'at'
]);

export class RagRetrieverService {
  /**
   * SEPARATION OF RAG AND TRANSACTIONAL DATA (Part 6):
   * Queries static documents only. Never queries transactional databases.
   */
  search(query: string, topK: number = 3): RagDocument[] {
    const rawTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const tokens = rawTokens.filter(t => !COMMON_STOPWORDS.has(t));
    if (tokens.length === 0) return [];

    const scoredDocs = STATIC_KNOWLEDGE_BASE.map(doc => {
      let score = 0;
      const fullText = (doc.title + ' ' + doc.content + ' ' + doc.keywords.join(' ')).toLowerCase();

      for (const token of tokens) {
        if (doc.title.toLowerCase().includes(token)) score += 5;
        if (doc.keywords.some(k => k.includes(token))) score += 4;
        if (fullText.includes(token)) score += 2;
      }

      return { doc, score };
    });

    return scoredDocs
      .filter(item => item.score >= 8)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.doc);
  }
}

export const ragRetrieverService = new RagRetrieverService();

