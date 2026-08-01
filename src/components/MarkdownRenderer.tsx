import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let currentList: React.ReactNode[] = [];
  let currentListType: 'ul' | 'ol' | null = null;

  const parseInlineStyles = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let keyIndex = 0;
    
    // Split by markdown bold markers (**), code markers (`), and italic markers (*)
    const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    const segments = text.split(regex);
    
    segments.forEach((seg) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        parts.push(
          <strong key={keyIndex++} className="font-bold text-white">
            {seg.slice(2, -2)}
          </strong>
        );
      } else if (seg.startsWith('`') && seg.endsWith('`')) {
        parts.push(
          <code key={keyIndex++} className="bg-slate-950/80 px-1.5 py-0.5 rounded font-mono text-xs text-[#38BDF8]">
            {seg.slice(1, -1)}
          </code>
        );
      } else if (seg.startsWith('*') && seg.endsWith('*')) {
        parts.push(
          <em key={keyIndex++} className="italic text-slate-200">
            {seg.slice(1, -1)}
          </em>
        );
      } else {
        parts.push(seg);
      }
    });

    return parts;
  };

  const flushList = () => {
    if (currentListType === 'ul' && currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 space-y-1 pl-5 list-disc text-slate-300">
          {currentList}
        </ul>
      );
      currentList = [];
      currentListType = null;
    } else if (currentListType === 'ol' && currentList.length > 0) {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-2 space-y-1 pl-5 list-decimal text-slate-300">
          {currentList}
        </ol>
      );
      currentList = [];
      currentListType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Headers
    if (trimmedLine.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={i} className="text-xl font-bold text-white mt-4 mb-2">
          {parseInlineStyles(trimmedLine.slice(2))}
        </h1>
      );
      continue;
    }
    if (trimmedLine.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={i} className="text-lg font-bold text-white mt-3 mb-2">
          {parseInlineStyles(trimmedLine.slice(3))}
        </h2>
      );
      continue;
    }
    if (trimmedLine.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={i} className="text-base font-bold text-white mt-2 mb-1">
          {parseInlineStyles(trimmedLine.slice(4))}
        </h3>
      );
      continue;
    }

    // Blockquotes
    if (trimmedLine.startsWith('>')) {
      flushList();
      const quoteText = line.substring(line.indexOf('>') + 1).trim();
      elements.push(
        <blockquote key={i} className="border-l-4 border-[#5B5FFF] pl-4 italic text-slate-300 my-3 bg-slate-900/40 py-2 px-3.5 rounded-r-xl">
          {parseInlineStyles(quoteText)}
        </blockquote>
      );
      continue;
    }

    // Bullet Lists (supporting *, -, and •)
    const isBullet = trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('• ');
    if (isBullet) {
      if (currentListType !== 'ul') {
        flushList();
        currentListType = 'ul';
      }
      const listContent = trimmedLine.substring(2).trim();
      currentList.push(
        <li key={i} className="leading-relaxed">
          {parseInlineStyles(listContent)}
        </li>
      );
      continue;
    }

    // Numbered Lists
    const matchNumber = trimmedLine.match(/^(\d+)\.\s+(.*)/);
    if (matchNumber) {
      if (currentListType !== 'ol') {
        flushList();
        currentListType = 'ol';
      }
      const listContent = matchNumber[2].trim();
      currentList.push(
        <li key={i} className="leading-relaxed">
          {parseInlineStyles(listContent)}
        </li>
      );
      continue;
    }

    // If it's empty line
    if (trimmedLine === '') {
      flushList();
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Default paragraph
    flushList();
    elements.push(
      <p key={i} className="mb-2 leading-relaxed text-slate-300">
        {parseInlineStyles(line)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1 font-sans">{elements}</div>;
};

export default MarkdownRenderer;
