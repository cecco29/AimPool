export function evalPoly(c: readonly number[], t: number): number {
  let s = 0;
  for (const k of c) s = s * t + k;
  return s;
}

function derivative(c: readonly number[]): number[] {
  const n = c.length - 1;
  return c.slice(0, -1).map((k, i) => k * (n - i));
}

function trimLeading(c: readonly number[]): number[] {
  const max = Math.max(0, ...c.map(Math.abs));
  if (max === 0) return [];
  let i = 0;
  while (i < c.length - 1 && Math.abs(c[i]) <= 1e-14 * max) i++;
  return c.slice(i);
}

export function quadraticRoots(a: number, b: number, c: number): number[] {
  const disc = b * b - 4 * a * c;
  if (disc < 0) return [];
  const q = -0.5 * (b + (b >= 0 ? 1 : -1) * Math.sqrt(disc));
  if (q === 0) return [0];
  return [q / a, c / q].sort((x, y) => x - y);
}

function bisect(c: readonly number[], lo: number, hi: number, flo: number): number {
  for (let i = 0; i < 200; i++) {
    const mid = 0.5 * (lo + hi);
    if (mid <= lo || mid >= hi) break;
    const fm = evalPoly(c, mid);
    if (fm === 0) return mid;
    if (fm < 0 === flo < 0) {
      lo = mid;
      flo = fm;
    } else {
      hi = mid;
    }
  }
  return 0.5 * (lo + hi);
}

/** Raíces reales en (lo, hi], ascendentes. Coeficientes de mayor a menor grado. */
export function realRootsInRange(coeffs: readonly number[], lo: number, hi: number): number[] {
  const c = trimLeading(coeffs);
  const deg = c.length - 1;
  if (deg < 1) return [];
  const bound = 1 + Math.max(...c.slice(1).map((k) => Math.abs(k / c[0])));
  const top = Math.min(hi, bound);
  if (top <= lo) return [];
  if (deg === 1) {
    const t = -c[1] / c[0];
    return t > lo && t <= top ? [t] : [];
  }
  if (deg === 2) return quadraticRoots(c[0], c[1], c[2]).filter((t) => t > lo && t <= top);

  const pts = [lo, ...realRootsInRange(derivative(c), lo, top), top];
  const roots: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const fa = evalPoly(c, a);
    const fb = evalPoly(c, b);
    if (fb === 0) roots.push(b);
    else if (fa !== 0 && fa * fb < 0) roots.push(bisect(c, a, b, fa));
  }
  return roots.filter((t, i) => i === 0 || t - roots[i - 1] > 1e-12);
}
