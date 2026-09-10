import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to render inline markdown (bold, italic, code)
  const renderInline = (text: string) => {
    // Regex for bold **text**
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-slate-600 dark:text-slate-300">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-black/40 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] border border-slate-200 dark:border-emerald-900/50">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  // Split lines and parse blocks (headers, lists, tables, code)
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks ```
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        const fullCode = codeBuffer.join('\n');
        const blockIdx = i;
        elements.push(
          <div key={`code-${i}`} className="my-2.5 rounded-xl overflow-hidden bg-slate-900 text-slate-100 text-[11px] font-mono border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between px-3 py-1 bg-slate-800 text-[10px] text-slate-400 font-semibold uppercase">
              <span>{codeLang || 'Code'}</span>
              <button
                onClick={() => handleCopy(fullCode, blockIdx)}
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {copiedIndex === blockIdx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedIndex === blockIdx ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 overflow-x-auto whitespace-pre-wrap">{fullCode}</pre>
          </div>
        );
        inCodeBlock = false;
        codeBuffer = [];
        codeLang = '';
      } else {
        inCodeBlock = true;
        codeLang = line.replace('```', '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="font-extrabold text-xs text-slate-900 dark:text-emerald-200 mt-2 mb-1">
          {renderInline(line.replace('### ', ''))}
        </h4>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="font-extrabold text-sm text-slate-900 dark:text-white mt-2.5 mb-1">
          {renderInline(line.replace('## ', ''))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={i} className="font-black text-base text-slate-900 dark:text-white mt-3 mb-1.5">
          {renderInline(line.replace('# ', ''))}
        </h2>
      );
      continue;
    }

    // Lists (bullets and numbered)
    if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
      const cleanLine = line.replace(/^[•\-\*]\s*/, '');
      elements.push(
        <div key={i} className="flex items-start gap-2 pl-1 my-0.5">
          <span className="text-emerald-500 font-bold leading-relaxed">•</span>
          <span className="flex-1">{renderInline(cleanLine)}</span>
        </div>
      );
      continue;
    }

    // Empty lines / Paragraph breaks
    if (!line.trim()) {
      elements.push(<div key={i} className="h-1.5" />);
      continue;
    }

    // Normal Paragraph
    elements.push(
      <p key={i} className="leading-relaxed my-0.5">
        {renderInline(line)}
      </p>
    );
  }

  return <div className="space-y-0.5 text-xs font-sans leading-relaxed">{elements}</div>;
};
