import type { ReactNode } from 'react';

function inline(s: string): ReactNode[] {
  return s
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
      return part;
    });
}

/** Markdown mínimo: párrafos, **negrita**, *itálica*, listas "- " y "1. ". */
export function RichText({ md }: { md: string }) {
  const blocks = md.trim().split(/\n\s*\n/);
  return (
    <>
      {blocks.map((blk, i) => {
        const lines = blk.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.every((l) => l.startsWith('- '))) {
          return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}</ul>;
        }
        if (lines.every((l) => /^\d+\.\s/.test(l))) {
          return <ol key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\d+\.\s/, ''))}</li>)}</ol>;
        }
        return <p key={i}>{inline(lines.join(' '))}</p>;
      })}
    </>
  );
}
