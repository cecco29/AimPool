import { useMemo } from 'react';
import type { TheoryBlock } from '../../content/types';
import { layoutToBalls } from '../../content/layout';
import { RichText } from '../../exercises/RichText';
import { TableCanvas } from '../../render/TableCanvas';
import { ghostGuides } from '../../render/guides';
import type { TableGeometry } from '../../table/geometry';

export function TheoryBlockView({ block, geometry, R, showGuides }: {
  block: TheoryBlock; geometry: TableGeometry; R: number; showGuides: boolean;
}) {
  const diagram = block.kind === 'diagram' ? block : null;
  const balls = useMemo(() => (diagram ? layoutToBalls(diagram.setup, geometry, R) : []), [diagram, geometry, R]);
  const guides = useMemo(() => {
    if (!diagram?.target || !diagram.showGhost || !showGuides) return [];
    const ob = balls.find((b) => b.id === diagram.target!.ball);
    const cue = balls.find((b) => b.id === 'cue');
    return ob ? ghostGuides(ob.r, geometry.pocketCenters[diagram.target.pocket], cue?.r, R) : [];
  }, [diagram, balls, geometry, R, showGuides]);

  if (block.kind === 'text') return <div className="theory"><RichText md={block.md} /></div>;
  if (block.kind === 'table') {
    return (
      <table className="theory">
        {block.caption && <caption>{block.caption}</caption>}
        <thead><tr>{block.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{block.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    );
  }
  return (
    <figure>
      <TableCanvas geometry={geometry} balls={balls} R={R} guides={guides} label={block.caption} />
      <figcaption>{block.caption}</figcaption>
    </figure>
  );
}
