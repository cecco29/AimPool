import { useMemo, useState } from 'react';
import type { TheoryBlock } from '../../content/types';
import { layoutToBalls } from '../../content/layout';
import type { PhysicsParams } from '../../physics/params';
import { RichText } from '../../exercises/RichText';
import { TableCanvas } from '../../render/TableCanvas';
import { ghostGuides } from '../../render/guides';
import type { TableGeometry, TableSpec } from '../../table/geometry';
import { DemoView } from './DemoView';

type Props = { block: TheoryBlock; geometry: TableGeometry; params: PhysicsParams; tableSpec: TableSpec; showGuides: boolean };

function DiagramBlock({ block, geometry, R, showGuides }: { block: Extract<TheoryBlock, { kind: 'diagram' }>; geometry: TableGeometry; R: number; showGuides: boolean }) {
  const balls = useMemo(() => layoutToBalls(block.setup, geometry, R), [block.setup, geometry, R]);
  const guides = useMemo(() => {
    if (!block.target || !block.showGhost || !showGuides) return [];
    const ob = balls.find((b) => b.id === block.target!.ball);
    const cue = balls.find((b) => b.id === 'cue');
    return ob ? ghostGuides(ob.r, geometry.pocketCenters[block.target.pocket], cue?.r, R) : [];
  }, [block, balls, geometry, R, showGuides]);
  return (
    <figure>
      <TableCanvas geometry={geometry} balls={balls} R={R} guides={guides} label={block.caption} />
      <figcaption>{block.caption}</figcaption>
    </figure>
  );
}

function ImageBlock({ block }: { block: Extract<TheoryBlock, { kind: 'image' }> }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="theory-image">
      {failed ? <p className="image-fallback">{block.alt}</p> : <img src={block.src} alt={block.alt} loading="lazy" onError={() => setFailed(true)} />}
      <figcaption>
        {block.caption}
        {block.credit && (
          <> · <a href={block.credit.url} target="_blank" rel="noreferrer">{block.credit.author} · {block.credit.license}</a></>
        )}
      </figcaption>
    </figure>
  );
}

export function TheoryBlockView({ block, geometry, params, tableSpec, showGuides }: Props) {
  switch (block.kind) {
    case 'text':
      return <div className="theory"><RichText md={block.md} /></div>;
    case 'table':
      return (
        <table className="theory">
          {block.caption && <caption>{block.caption}</caption>}
          <thead><tr>{block.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{block.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
        </table>
      );
    case 'image':
      return <ImageBlock block={block} />;
    case 'demo':
      return <DemoView block={block} geometry={geometry} params={params} tableSpec={tableSpec} />;
    case 'diagram':
      return <DiagramBlock block={block} geometry={geometry} R={params.R} showGuides={showGuides} />;
  }
}
