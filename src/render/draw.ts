import type { Ball } from '../physics/types';
import type { Vec3 } from '../physics/vec';
import { type PocketId, SIGHT_OFFSET, type TableGeometry } from '../table/geometry';
import type { GuideDraw } from './guides';
import { RAIL_WIDTH, type Viewport, worldToScreen } from './viewport';

const COLORS = {
  railEdge: '#1a0f09', rail: '#3b2417', cushion: '#0c5544', felt: '#12755d', feltEdge: '#0a4b3c',
  pocket: '#030303', sight: '#e8dcc0', spot: 'rgba(255,255,255,0.35)', guide: 'rgba(255,255,255,0.8)',
  ghost: 'rgba(255,255,255,0.75)', cue: '#d9b07a', cueTip: '#2c6fb5',
};
const BALL_COLORS: Record<string, string> = {
  '1': '#f2c230', '2': '#1f4fc7', '3': '#d62828', '4': '#5b2a86',
  '5': '#f07c1b', '6': '#1c7c3f', '7': '#7a1f1f', '8': '#111111',
};

export function ballStyle(id: string): { color: string; stripe: boolean; label: string } {
  if (id === 'cue') return { color: '#f5f3ea', stripe: false, label: '' };
  const n = Number(id);
  if (n >= 9 && n <= 15) return { color: BALL_COLORS[String(n - 8)], stripe: true, label: id };
  return { color: BALL_COLORS[id] ?? '#999999', stripe: false, label: id };
}

type Ctx = CanvasRenderingContext2D;

function rect(ctx: Ctx, vp: Viewport, x0: number, y0: number, x1: number, y1: number) {
  const pts: Vec3[] = [[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]];
  ctx.beginPath();
  pts.forEach((p, i) => {
    const [x, y] = worldToScreen(vp, p);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function drawTable(ctx: Ctx, g: TableGeometry, vp: Viewport) {
  const { length: L, width: W, diamond: d } = g;
  const r = RAIL_WIDTH;
  ctx.fillStyle = COLORS.railEdge;
  rect(ctx, vp, -r, -r, L + r, W + r);
  ctx.fill();
  ctx.fillStyle = COLORS.rail;
  rect(ctx, vp, -r + 0.008, -r + 0.008, L + r - 0.008, W + r - 0.008);
  ctx.fill();
  ctx.fillStyle = COLORS.cushion;
  rect(ctx, vp, -0.045, -0.045, L + 0.045, W + 0.045);
  ctx.fill();

  const [cx, cy] = worldToScreen(vp, [L / 2, W / 2, 0]);
  const felt = ctx.createRadialGradient(cx, cy, 0, cx, cy, L * vp.scale * 0.6);
  felt.addColorStop(0, COLORS.felt);
  felt.addColorStop(1, COLORS.feltEdge);
  ctx.fillStyle = felt;
  rect(ctx, vp, 0, 0, L, W);
  ctx.fill();

  ctx.fillStyle = COLORS.pocket;
  for (const m of g.boundary.pockets) {
    const id = m.id as PocketId;
    const mouth = id.startsWith('s') ? g.spec.sideMouth : g.spec.cornerMouth;
    const c = g.pocketCenters[id];
    const [x, y] = worldToScreen(vp, [c[0] - m.n[0] * mouth * 0.25, c[1] - m.n[1] * mouth * 0.25, 0]);
    ctx.beginPath();
    ctx.arc(x, y, mouth * 0.55 * vp.scale, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.fillStyle = COLORS.sight;
  const s = 0.009 * vp.scale;
  const sight = (p: Vec3) => {
    const [x, y] = worldToScreen(vp, p);
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s, y);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x - s, y);
    ctx.closePath();
    ctx.fill();
  };
  for (let i = 1; i < 8; i++) {
    if (i === 4) continue;
    sight([i * d, -SIGHT_OFFSET, 0]);
    sight([i * d, W + SIGHT_OFFSET, 0]);
  }
  for (let j = 1; j < 4; j++) {
    sight([-SIGHT_OFFSET, j * d, 0]);
    sight([L + SIGHT_OFFSET, j * d, 0]);
  }

  ctx.fillStyle = COLORS.spot;
  for (const x of [2, 6]) {
    const [sx, sy] = worldToScreen(vp, [x * d, 2 * d, 0]);
    ctx.beginPath();
    ctx.arc(sx, sy, 0.006 * vp.scale, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function drawBall(ctx: Ctx, vp: Viewport, b: Ball, R: number) {
  if (b.motion === 'pocketed') return;
  const h = Math.max(0, b.r[2] - R);
  const [x, y] = worldToScreen(vp, b.r);
  const rad = R * vp.scale * (1 + h * 4);
  const off = (0.004 + h * 0.8) * vp.scale;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x + off, y + off, R * vp.scale, R * vp.scale * 0.9, 0, 0, 2 * Math.PI);
  ctx.fill();

  const st = ballStyle(b.id);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, 2 * Math.PI);
  ctx.clip();
  ctx.fillStyle = st.stripe ? '#f5f3ea' : st.color;
  ctx.fillRect(x - rad, y - rad, 2 * rad, 2 * rad);
  if (st.stripe) {
    ctx.fillStyle = st.color;
    ctx.fillRect(x - rad, y - rad * 0.55, 2 * rad, rad * 1.1);
  }
  const shine = ctx.createRadialGradient(x - rad * 0.35, y - rad * 0.35, rad * 0.1, x, y, rad);
  shine.addColorStop(0, 'rgba(255,255,255,0.55)');
  shine.addColorStop(0.4, 'rgba(255,255,255,0)');
  shine.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = shine;
  ctx.fillRect(x - rad, y - rad, 2 * rad, 2 * rad);
  ctx.restore();

  if (st.label) {
    ctx.fillStyle = '#f5f3ea';
    ctx.beginPath();
    ctx.arc(x, y, rad * 0.45, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#111111';
    ctx.font = `bold ${Math.max(7, rad * 0.6)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.label, x, y + 0.5);
  }
}

function drawGuide(ctx: Ctx, vp: Viewport, gd: GuideDraw, R: number) {
  if (gd.kind === 'line') {
    const [x0, y0] = worldToScreen(vp, gd.from);
    const [x1, y1] = worldToScreen(vp, gd.to);
    ctx.strokeStyle = gd.color ?? COLORS.guide;
    ctx.lineWidth = 1.5;
    ctx.setLineDash(gd.dashed ? [6, 5] : []);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (gd.kind === 'ghost') {
    const [x, y] = worldToScreen(vp, gd.at);
    ctx.strokeStyle = gd.color ?? COLORS.ghost;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(x, y, R * vp.scale, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = gd.color ?? COLORS.ghost;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
    ctx.fill();
  } else {
    const dir: Vec3 = [Math.cos(gd.azimuth), Math.sin(gd.azimuth), 0];
    const at = (dist: number): [number, number] =>
      worldToScreen(vp, [gd.at[0] - dir[0] * dist, gd.at[1] - dir[1] * dist, 0]);
    const back = R * 1.6 + (gd.pull ?? 0) * 0.18; // el taco retrocede al cargar la fuerza
    const [tx, ty] = at(back);
    const [jx, jy] = at(back + 0.015);
    const [bx, by] = at(back + 1.3);
    ctx.lineCap = 'round';
    ctx.strokeStyle = COLORS.cue;
    ctx.lineWidth = Math.max(3, R * 0.45 * vp.scale);
    ctx.beginPath();
    ctx.moveTo(jx, jy);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.strokeStyle = COLORS.cueTip;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(jx, jy);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }
}

export function drawScene(ctx: Ctx, g: TableGeometry, vp: Viewport, balls: Ball[], guides: GuideDraw[], R: number) {
  drawTable(ctx, g, vp);
  for (const gd of guides) if (gd.kind !== 'cue') drawGuide(ctx, vp, gd, R);
  for (const b of balls) drawBall(ctx, vp, b, R);
  for (const gd of guides) if (gd.kind === 'cue') drawGuide(ctx, vp, gd, R);
}
