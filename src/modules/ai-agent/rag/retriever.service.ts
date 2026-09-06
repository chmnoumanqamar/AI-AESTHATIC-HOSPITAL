import { STATIC_KNOWLEDGE_BASE, RagDocument } from './vector-store';

export class RagRetrieverService {
  /**
   * SEPARATION OF RAG AND TRANSACTIONAL DATA (Part 6):
   * Queries static documents only. Never queries transactional databases.
   */
  search(query: string, topK: number = 3): RagDocument[] {
    const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
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
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.doc);
  }
}

export const ragRetrieverService = new RagRetrieverService();
