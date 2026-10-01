# AimPool — Sub-proyecto 1 (Base + motor físico) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PWA instalable (React + Vite + TS) con un motor de física de pool por eventos, mesa 2D en Canvas, motor de contenido (3 tipos de ejercicio), progreso en IndexedDB y una lección de muestra (Ghost ball) funcionando de punta a punta.

**Architecture:** `physics/` es un motor puro TS (sin DOM) por eventos analíticos: cada estado de bola tiene forma cerrada y los choques se encuentran como raíces de polinomios de grado ≤ 4. Corre en un Web Worker (`sim/`) y devuelve un `Timeline` que `render/` muestrea por frame. `table/` da geometría y diamantes; `content/` define lecciones como datos; `progress/` persiste; `app/` arma pantallas con hash routing.

**Tech Stack:** Node 24, React 19, Vite, TypeScript strict, Vitest + Testing Library + jsdom, fake-indexeddb, idb, motion (`motion/react`), vite-plugin-pwa, @vite-pwa/assets-generator, Playwright, GitHub Actions + GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-01-aimpool-base-motor-design.md`. Referencias: `docs/research/physics-models.md` (ecuaciones y valores de validación, citados como §N), `docs/research/aiming-systems-curriculum.md` (contenido de lecciones).

## Global Constraints

- Idioma de la UI: español rioplatense (voseo), con el término en inglés entre paréntesis la primera vez que aparece.
- Animación de UI: paquete `motion`, import desde `motion/react`. Nunca `framer-motion`, GSAP ni anime.js.
- Unidades internas SI (metros, segundos, radianes). Solo `render/` convierte a píxeles; solo `content/` usa diamantes.
- `src/physics/**` no importa nada fuera de `src/physics/` (sin DOM, sin React).
- `src/table/**` solo importa *tipos* y `vec` desde `src/physics/` (excepción documentada a "table no depende de nadie": los tipos de `Boundary` viven en physics).
- Coordenadas de mesa: x a lo largo de la banda larga (0 = banda de cabecera, L = banda de pie), y a lo largo de la corta (0 = banda larga inferior), z hacia arriba; centro de bola en reposo a z = R. Diamantes: x ∈ [0, 8], y ∈ [0, 4]. Troneras: `c00 c04 c80 c84` (esquinas) y `s40 s44` (medias), nombradas por su coordenada en diamantes.
- Mesa por defecto 9 pies (2,540 × 1,270 m), boca de esquina 4,5" (0,1143 m), boca de media 5" (0,127 m). También 8 pies (2,3368 × 1,1684) y 7 pies (1,9812 × 0,9906).
- Física por defecto: R = 0,028575 m, m = 0,170097 kg, μ deslizamiento 0,2, μ rodadura 0,01, desaceleración de giro 10,9 rad/s², e bola-bola 0,95, μ bola-bola dependiente de velocidad `9.951e-3 + 0.108·e^(−1.088·v)`, e banda 0,85, μ banda 0,2, altura de banda 0,635·2R, e paño 0,5, límite de miscue 0,5R.
- Criterio de aprobación por defecto: ≥ 70 % en simulador y ≥ 60 % en mesa real.
- Persistencia: IndexedDB vía `idb`; cada registro lleva `id` (UUID) y `schemaVersion`. Si no hay IndexedDB → store en memoria + aviso visible.
- Routing por hash (`#/...`) y `base: './'` en Vite (funciona en cualquier subruta de GitHub Pages).
- Cada commit termina con la línea `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Bolas pegadas (frozen) entre sí o contra la banda:** si una bola empuja a otra que ya está en contacto (distancia exactamente 2R) o a una banda (distancia R), el choque tiene que ocurrir en t = 0 y no atravesarse. → Task 8, test "frozen contacts".
2. **Ninguna bola puede escaparse de la mesa** por huecos entre bandas, mandíbulas y líneas de captura de las troneras. → Task 9, test aleatorio "balls never leave the table".
3. **Posiciones de lecciones en diamantes** no deben solaparse entre bolas ni con la banda en mesas de 7, 8 y 9 pies (R no escala con la mesa). → Task 12, validación con las tres medidas.
4. **Entradas extremas:** fuerza 0, efecto más allá del límite de miscue y elevación alta del taco deben terminar sin colgarse ni romper. → Task 9, tests "zero power", "miscue", "jump".
5. **Salir a mitad de una sesión en la mesa real** no debe perder los tiros ya marcados. → Task 15, test "partial session".

---

### Task 1: Scaffold del proyecto + matemática vectorial

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/main.tsx`, `src/test/setup.ts`
- Create: `src/physics/vec.ts`
- Test: `src/physics/vec.test.ts`

**Interfaces:**
- Produces: `Vec3`, `ZERO`, `Z`, `add`, `sub`, `scale`, `dot`, `cross`, `norm`, `unit`, `xy`, `rotZ`, `angleXY` desde `src/physics/vec.ts`.

- [ ] **Step 1: Crear `package.json`**

```json
{
  "name": "aimpool",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  }
}
```

- [ ] **Step 2: Instalar dependencias**

Run:
```bash
npm i react react-dom motion idb
npm i -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/node vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event fake-indexeddb vite-plugin-pwa @vite-pwa/assets-generator @playwright/test
```
Expected: instala sin errores. Si `vite-plugin-pwa` reporta conflicto de peer con la major de Vite, reinstalar Vite en la última major que el plugin soporte (`npm i -D vite@<major>`).

- [ ] **Step 3: Crear `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "e2e", "vite.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 4: Crear `vite.config.ts`, `index.html`, `.gitignore`, `src/main.tsx`, `src/test/setup.ts`**

`vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  worker: { format: 'es' },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
  },
});
```

`index.html`:
```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0b0f0e" />
    <title>AimPool</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`.gitignore`:
```
node_modules
dist
dev-dist
test-results
playwright-report
```

`src/main.tsx` (provisorio, se reemplaza en Task 16):
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <h1>AimPool</h1>
  </StrictMode>,
);
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';

if (typeof globalThis.requestAnimationFrame !== 'function') {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16) as unknown as number;
  globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);
}
```

- [ ] **Step 5: Escribir el test que falla `src/physics/vec.test.ts`**

```ts
import { describe, expect, test } from 'vitest';
import { add, angleXY, cross, dot, norm, rotZ, scale, sub, unit, xy, ZERO } from './vec';

describe('vec', () => {
  test('basic arithmetic', () => {
    expect(add([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9]);
    expect(sub([4, 5, 6], [1, 2, 3])).toEqual([3, 3, 3]);
    expect(scale([1, -2, 3], 2)).toEqual([2, -4, 6]);
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
  });
  test('cross follows the right-hand rule', () => {
    expect(cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
    expect(cross([0, 0, 1], [1, 0, 0])).toEqual([0, 1, 0]);
  });
  test('unit of a zero vector is zero (guarded)', () => {
    expect(unit(ZERO)).toEqual(ZERO);
    expect(norm(unit([3, 4, 0]))).toBeCloseTo(1, 12);
  });
  test('rotZ rotates counter-clockwise and keeps z', () => {
    const r = rotZ([1, 0, 5], Math.PI / 2);
    expect(r[0]).toBeCloseTo(0, 12);
    expect(r[1]).toBeCloseTo(1, 12);
    expect(r[2]).toBe(5);
  });
  test('xy drops z and angleXY measures azimuth', () => {
    expect(xy([1, 2, 3])).toEqual([1, 2, 0]);
    expect(angleXY([0, 1, 0])).toBeCloseTo(Math.PI / 2, 12);
  });
});
```

- [ ] **Step 6: Correr el test y verificar que falla**

Run: `npx vitest run src/physics/vec.test.ts`
Expected: FAIL ("Failed to resolve import ./vec").

- [ ] **Step 7: Implementar `src/physics/vec.ts`**

```ts
export type Vec3 = readonly [number, number, number];

export const ZERO: Vec3 = [0, 0, 0];
export const Z: Vec3 = [0, 0, 1];

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const norm = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
export const unit = (a: Vec3): Vec3 => {
  const n = norm(a);
  return n < 1e-12 ? ZERO : scale(a, 1 / n);
};
export const xy = (a: Vec3): Vec3 => [a[0], a[1], 0];
export const rotZ = (a: Vec3, angle: number): Vec3 => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c * a[0] - s * a[1], s * a[0] + c * a[1], a[2]];
};
export const angleXY = (a: Vec3): number => Math.atan2(a[1], a[0]);
```

- [ ] **Step 8: Correr tests y build**

Run: `npx vitest run src/physics/vec.test.ts && npx tsc --noEmit`
Expected: PASS, sin errores de tipos.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html .gitignore src
git commit -m "chore: scaffold Vite + React + TS project with vector math" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Tipos, parámetros y movimiento de una bola (estados y transiciones)

Referencia: physics-models §2 y §9 filas 3, 8 y 9.

**Files:**
- Create: `src/physics/types.ts`, `src/physics/params.ts`, `src/physics/motion.ts`
- Test: `src/physics/motion.test.ts`

**Interfaces:**
- Consumes: `vec.ts` (Task 1).
- Produces:
  - `types.ts`: `Motion`, `Ball`, `Segment`, `Circle`, `PocketMouth`, `Boundary`, `Shot`, `EventKind`, `SimEvent`, `Timeline`.
  - `params.ts`: `PhysicsParams`, `DEFAULT_PARAMS`, `ballBallFriction(p, slipSpeed): number`.
  - `motion.ts`: `slip(b, R): Vec3`, `classify(b, p): Motion`, `withMotion(b, p): Ball`, `Quad`, `trajectory(b, p): Quad`, `transitionTime(b, p): number`, `evolve(b, dt, p): Ball`, `applyTransition(b, p): Ball`, `energy(b, p): number`.

- [ ] **Step 1: Crear `src/physics/types.ts`**

```ts
import type { Vec3 } from './vec';

export type Motion = 'stationary' | 'spinning' | 'sliding' | 'rolling' | 'airborne' | 'pocketed';

export interface Ball {
  id: string; // 'cue' = blanca; '1'..'15' = bolas objetivo
  r: Vec3; // posición del centro (m)
  v: Vec3; // velocidad (m/s)
  w: Vec3; // velocidad angular (rad/s)
  motion: Motion;
  pocket?: string; // id de tronera si motion === 'pocketed'
}

/** Banda recta: la nariz va de p1 a p2; n es la normal unitaria que apunta hacia la superficie de juego. */
export interface Segment { id: string; p1: Vec3; p2: Vec3; n: Vec3 }
/** Mandíbula redondeada de tronera (círculo en el plano xy). */
export interface Circle { id: string; c: Vec3; radius: number }
/** Línea de captura: la bola cuyo centro la cruza moviéndose contra n queda embocada. */
export interface PocketMouth { id: string; p1: Vec3; p2: Vec3; n: Vec3 }
export interface Boundary { segments: Segment[]; jaws: Circle[]; pockets: PocketMouth[] }

export interface Shot {
  cueBallId: string;
  azimuth: number; // dirección del taco en el plano (rad)
  elevation: number; // elevación del taco (rad), 0 = nivelado
  a: number; // punto de contacto lateral, normalizado por R (+ = derecha)
  b: number; // punto de contacto vertical, normalizado por R (+ = arriba)
  cueSpeed: number; // velocidad del taco (m/s)
}

export type EventKind = 'strike' | 'ballBall' | 'cushion' | 'jaw' | 'pocket' | 'table' | 'transition';
export interface SimEvent { t: number; kind: EventKind; ids: string[]; target?: string; balls: Ball[] }
export interface Timeline { events: SimEvent[]; duration: number; truncated: boolean; miscue: boolean }
```

- [ ] **Step 2: Crear `src/physics/params.ts`**

```ts
export interface PhysicsParams {
  R: number; m: number; g: number;
  muSlide: number; muRoll: number; spinDecel: number;
  eBall: number; muBall: number | 'speed';
  eCushion: number; muCushion: number; cushionHeight: number;
  eTable: number; minBounceHeight: number;
  cueMass: number; cueEndMass: number; tipRestitution: number;
  miscueLimit: number;
}

const R = 0.028575;
const M = 0.170097;

export const DEFAULT_PARAMS: PhysicsParams = {
  R, m: M, g: 9.81,
  muSlide: 0.2, muRoll: 0.01, spinDecel: 10.9,
  eBall: 0.95, muBall: 'speed',
  eCushion: 0.85, muCushion: 0.2, cushionHeight: 0.635 * 2 * R,
  eTable: 0.5, minBounceHeight: 0.005,
  cueMass: 0.567, cueEndMass: M / 30, tipRestitution: 0.75,
  miscueLimit: 0.5,
};

/** Fricción bola-bola; ajuste de Dr. Dave a Marlow (TP A.14) en función de la velocidad de deslizamiento. */
export function ballBallFriction(p: PhysicsParams, slipSpeed: number): number {
  return p.muBall === 'speed' ? 9.951e-3 + 0.108 * Math.exp(-1.088 * slipSpeed) : p.muBall;
}
```

- [ ] **Step 3: Escribir el test que falla `src/physics/motion.test.ts`**

```ts
import { describe, expect, test } from 'vitest';
import type { Ball } from './types';
import { DEFAULT_PARAMS as p } from './params';
import { applyTransition, classify, evolve, slip, transitionTime, withMotion } from './motion';
import { add, cross, norm, scale, type Vec3, Z } from './vec';

const ball = (over: Partial<Ball>): Ball => ({
  id: 'b', r: [0, 0, p.R], v: [0, 0, 0], w: [0, 0, 0], motion: 'stationary', ...over,
});

describe('classify', () => {
  test('states', () => {
    expect(classify(ball({}), p)).toBe('stationary');
    expect(classify(ball({ v: [1, 0, 0] }), p)).toBe('sliding');
    expect(classify(ball({ v: [1, 0, 0], w: [0, 1 / p.R, 0] }), p)).toBe('rolling');
    expect(classify(ball({ w: [0, 0, 5] }), p)).toBe('spinning');
    expect(classify(ball({ r: [0, 0, p.R + 0.01] }), p)).toBe('airborne');
    expect(classify(ball({ motion: 'pocketed', v: [1, 0, 0] }), p)).toBe('pocketed');
  });
});

describe('stun shot (§2.5, §9 row 3)', () => {
  test('1 m/s slides 0.146 s over 0.125 m, then rolls at 5/7 v for 2.60 m', () => {
    const b = withMotion(ball({ v: [1, 0, 0] }), p);
    expect(b.motion).toBe('sliding');
    const tau = transitionTime(b, p);
    expect(tau).toBeCloseTo(0.1456, 3);
    const end = evolve(b, tau, p);
    expect(end.r[0]).toBeCloseTo(0.1248, 3);
    expect(end.v[0]).toBeCloseTo(5 / 7, 6);
    const rolling = applyTransition(end, p);
    expect(rolling.motion).toBe('rolling');
    const tauRoll = transitionTime(rolling, p);
    expect(tauRoll).toBeCloseTo(7.28, 2);
    const stop = applyTransition(evolve(rolling, tauRoll, p), p);
    expect(stop.motion).toBe('stationary');
    expect(stop.r[0] - end.r[0]).toBeCloseTo(2.6, 2);
  });
});

describe('masse/swerve final direction (§9 row 8)', () => {
  test.each([0.1, 0.3])('end-of-slide velocity is independent of μs = %s', (mu) => {
    const q = { ...p, muSlide: mu };
    const v0: Vec3 = [1.2, 0.3, 0];
    const w0: Vec3 = [12, -30, 40];
    const b = withMotion(ball({ v: v0, w: w0 }), q);
    const end = evolve(b, transitionTime(b, q), q);
    const expected = add(scale(v0, 5 / 7), scale(cross(w0, Z), (2 / 7) * q.R));
    expect(end.v[0]).toBeCloseTo(expected[0], 6);
    expect(end.v[1]).toBeCloseTo(expected[1], 6);
    expect(norm(slip(end, q.R))).toBeLessThan(1e-9);
  });
});

describe('spin decay (§9 row 9)', () => {
  test('z-spin of 10.9 rad/s stops after 1 s and never flips sign', () => {
    const b = withMotion(ball({ w: [0, 0, 10.9] }), p);
    expect(transitionTime(b, p)).toBeCloseTo(1, 6);
    expect(evolve(b, 2, p).w[2]).toBe(0);
  });
});

describe('airborne', () => {
  test('parabolic flight', () => {
    const b = withMotion(ball({ v: [1, 0, 2] }), p);
    expect(b.motion).toBe('airborne');
    const later = evolve(b, 0.1, p);
    expect(later.r[2]).toBeCloseTo(p.R + 0.2 - 0.5 * p.g * 0.01, 9);
    expect(later.v[2]).toBeCloseTo(2 - p.g * 0.1, 9);
  });
});
```

- [ ] **Step 4: Correr el test y verificar que falla**

Run: `npx vitest run src/physics/motion.test.ts`
Expected: FAIL ("Failed to resolve import ./motion").

- [ ] **Step 5: Implementar `src/physics/motion.ts`**

```ts
import type { Ball, Motion } from './types';
import type { PhysicsParams } from './params';
import { add, cross, dot, norm, scale, sub, unit, type Vec3, xy, Z, ZERO } from './vec';

const SLIP_EPS = 1e-9;
const SPEED_EPS = 1e-9;
const SPIN_EPS = 1e-9;
const HEIGHT_EPS = 1e-9;

/** Velocidad del punto de contacto con el paño: v + ω × (−R ẑ). */
export function slip(b: Ball, R: number): Vec3 {
  return [b.v[0] - R * b.w[1], b.v[1] + R * b.w[0], 0];
}

export function classify(b: Ball, p: PhysicsParams): Motion {
  if (b.motion === 'pocketed') return 'pocketed';
  if (b.r[2] > p.R + HEIGHT_EPS || b.v[2] > SPEED_EPS) return 'airborne';
  if (norm(slip(b, p.R)) > SLIP_EPS) return 'sliding';
  if (norm(xy(b.v)) > SPEED_EPS) return 'rolling';
  if (Math.abs(b.w[2]) > SPIN_EPS) return 'spinning';
  return 'stationary';
}

export const withMotion = (b: Ball, p: PhysicsParams): Ball => ({ ...b, motion: classify(b, p) });

/** r(t) = a t² + b t + c, válido hasta la próxima transición de la bola. */
export interface Quad { a: Vec3; b: Vec3; c: Vec3 }

export function trajectory(ball: Ball, p: PhysicsParams): Quad {
  switch (ball.motion) {
    case 'sliding': {
      const u = unit(slip(ball, p.R));
      return { a: scale(u, -0.5 * p.muSlide * p.g), b: ball.v, c: ball.r };
    }
    case 'rolling': {
      const d = unit(xy(ball.v));
      return { a: scale(d, -0.5 * p.muRoll * p.g), b: ball.v, c: ball.r };
    }
    case 'airborne':
      return { a: [0, 0, -0.5 * p.g], b: ball.v, c: ball.r };
    default:
      return { a: ZERO, b: ZERO, c: ball.r };
  }
}

export function transitionTime(ball: Ball, p: PhysicsParams): number {
  switch (ball.motion) {
    case 'sliding':
      return (2 * norm(slip(ball, p.R))) / (7 * p.muSlide * p.g);
    case 'rolling':
      return norm(xy(ball.v)) / (p.muRoll * p.g);
    case 'spinning':
      return Math.abs(ball.w[2]) / p.spinDecel;
    default:
      return Infinity;
  }
}

function decaySpin(wz: number, dt: number, p: PhysicsParams): number {
  const d = p.spinDecel * dt;
  return Math.abs(wz) <= d ? 0 : wz - Math.sign(wz) * d;
}

export function evolve(ball: Ball, dt: number, p: PhysicsParams): Ball {
  if (dt <= 0) return ball;
  switch (ball.motion) {
    case 'sliding': {
      const u = unit(slip(ball, p.R));
      const k = p.muSlide * p.g;
      const r = add(add(ball.r, scale(ball.v, dt)), scale(u, -0.5 * k * dt * dt));
      const v = sub(ball.v, scale(u, k * dt));
      const wxy = add([ball.w[0], ball.w[1], 0], scale(cross(Z, u), ((5 * k) / (2 * p.R)) * dt));
      return { ...ball, r, v, w: [wxy[0], wxy[1], decaySpin(ball.w[2], dt, p)] };
    }
    case 'rolling': {
      const speed = norm(xy(ball.v));
      const d = unit(xy(ball.v));
      const k = p.muRoll * p.g;
      if (k * dt >= speed) {
        const r = add(ball.r, scale(d, (speed * speed) / (2 * k)));
        return { ...ball, r, v: ZERO, w: [0, 0, decaySpin(ball.w[2], dt, p)] };
      }
      const r = add(add(ball.r, scale(ball.v, dt)), scale(d, -0.5 * k * dt * dt));
      const v = sub(ball.v, scale(d, k * dt));
      const wxy = scale(cross(Z, v), 1 / p.R);
      return { ...ball, r, v, w: [wxy[0], wxy[1], decaySpin(ball.w[2], dt, p)] };
    }
    case 'spinning':
      return { ...ball, w: [0, 0, decaySpin(ball.w[2], dt, p)] };
    case 'airborne': {
      const r = add(add(ball.r, scale(ball.v, dt)), [0, 0, -0.5 * p.g * dt * dt]);
      const v = sub(ball.v, [0, 0, p.g * dt]);
      return { ...ball, r, v };
    }
    default:
      return ball;
  }
}

/** Fija exactamente el estado de llegada de una transición (elimina residuos numéricos) y reclasifica. */
export function applyTransition(b: Ball, p: PhysicsParams): Ball {
  let out: Ball = b;
  if (b.motion === 'sliding') {
    const w = scale(cross(Z, xy(b.v)), 1 / p.R);
    out = { ...b, v: xy(b.v), w: [w[0], w[1], b.w[2]] };
  } else if (b.motion === 'rolling') {
    out = { ...b, v: ZERO, w: [0, 0, b.w[2]] };
  } else if (b.motion === 'spinning') {
    out = { ...b, w: ZERO };
  }
  return withMotion(out, p);
}

/** Energía cinética (traslación + rotación) + potencial sobre el paño. */
export function energy(b: Ball, p: PhysicsParams): number {
  if (b.motion === 'pocketed') return 0;
  const I = 0.4 * p.m * p.R * p.R;
  return 0.5 * p.m * dot(b.v, b.v) + 0.5 * I * dot(b.w, b.w) + p.m * p.g * Math.max(0, b.r[2] - p.R);
}
```

- [ ] **Step 6: Correr tests**

Run: `npx vitest run src/physics/motion.test.ts`
Expected: PASS (todos).

- [ ] **Step 7: Commit**

```bash
git add src/physics
git commit -m "feat(physics): ball motion states, closed-form evolution and transitions" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Raíces reales de polinomios (grado ≤ 4)

Referencia: physics-models §8.4. Método: recursión por derivadas (los puntos críticos parten el intervalo en tramos monótonos) + bisección. Es determinista y robusto. Las raíces dobles tangenciales (roce sin cruce) se ignoran a propósito.

**Files:**
- Create: `src/physics/roots.ts`
- Test: `src/physics/roots.test.ts`

**Interfaces:**
- Produces: `evalPoly(c, t)`, `quadraticRoots(a, b, c): number[]`, `realRootsInRange(coeffs, lo, hi): number[]` (coeficientes de mayor a menor grado; devuelve las raíces en (lo, hi], ascendentes).

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, expect, test } from 'vitest';
import { quadraticRoots, realRootsInRange } from './roots';

describe('realRootsInRange', () => {
  test('quartic with four roots', () => {
    const r = realRootsInRange([1, -10, 35, -50, 24], 0, 10);
    expect(r).toHaveLength(4);
    [1, 2, 3, 4].forEach((x, i) => expect(r[i]).toBeCloseTo(x, 9));
  });
  test('filters by range (lo exclusive, hi inclusive)', () => {
    const r = realRootsInRange([1, -10, 35, -50, 24], 1.5, 3.5);
    expect(r.map((x) => Math.round(x * 1e9) / 1e9)).toEqual([2, 3]);
  });
  test('no real roots', () => {
    expect(realRootsInRange([1, 0, 0, 0, 1], -10, 10)).toEqual([]);
  });
  test('leading zeros reduce the degree', () => {
    const r = realRootsInRange([0, 0, 1, -3, 2], 0, Infinity);
    expect(r[0]).toBeCloseTo(1, 12);
    expect(r[1]).toBeCloseTo(2, 12);
  });
  test('cubic', () => {
    const r = realRootsInRange([1, -6, 11, -6], 0, Infinity);
    expect(r.map((x) => +x.toFixed(9))).toEqual([1, 2, 3]);
  });
  test('infinite hi uses the Cauchy bound', () => {
    expect(realRootsInRange([1, 0, -1e6], 0, Infinity)[0]).toBeCloseTo(1000, 9);
  });
});

describe('quadraticRoots', () => {
  test('stable for widely separated roots', () => {
    const r = quadraticRoots(1, -1e8, 1);
    expect(r[0]).toBeCloseTo(1e-8, 15);
    expect(r[1]).toBeCloseTo(1e8, 0);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/physics/roots.test.ts`
Expected: FAIL ("Failed to resolve import ./roots").

- [ ] **Step 3: Implementar `src/physics/roots.ts`**

```ts
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
```

- [ ] **Step 4: Correr tests**

Run: `npx vitest run src/physics/roots.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/physics/roots.ts src/physics/roots.test.ts
git commit -m "feat(physics): robust real polynomial root finder" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Golpe del taco (strike), squirt y miscue

Referencia: physics-models §3 y §9 filas 4, 5 y 6. Convención: `a > 0` = efecto derecho, que produce ωz < 0 (giro horario visto desde arriba). El squirt desvía la blanca **al lado contrario** del efecto: con efecto derecho, la velocidad rota en sentido antihorario.

**Files:**
- Create: `src/physics/strike.ts`
- Test: `src/physics/strike.test.ts`

**Interfaces:**
- Consumes: `Ball`, `Shot` (Task 2), `PhysicsParams`, `classify`, `vec`.
- Produces: `squirtAngle(a, p): number` (rad, ≥ 0 para a ≥ 0), `strike(ball, shot, p): { ball: Ball; miscue: boolean }`. La bola devuelta puede tener `v[2] < 0` si el taco está elevado; el simulador (Task 9) resuelve ese rebote contra el paño.

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, expect, test } from 'vitest';
import type { Ball, Shot } from './types';
import { DEFAULT_PARAMS as p } from './params';
import { squirtAngle, strike } from './strike';
import { classify } from './motion';
import { angleXY, norm, xy } from './vec';

const cue: Ball = { id: 'cue', r: [0, 0, p.R], v: [0, 0, 0], w: [0, 0, 0], motion: 'stationary' };
const shot = (over: Partial<Shot>): Shot => ({ cueBallId: 'cue', azimuth: 0, elevation: 0, a: 0, b: 0, cueSpeed: 1, ...over });

describe('strike', () => {
  test('center hit efficiency is 1.5 with m/M = 1/3 and an elastic tip (§9 row 5)', () => {
    const q = { ...p, tipRestitution: 1, cueMass: 3 * p.m };
    const { ball } = strike(cue, shot({}), q);
    expect(ball.v[0]).toBeCloseTo(1.5, 9);
    expect(norm(ball.w)).toBeCloseTo(0, 9);
  });
  test('b = 0.4 gives natural roll immediately (§9 row 4)', () => {
    const { ball } = strike(cue, shot({ b: 0.4 }), p);
    expect(classify(ball, p)).toBe('rolling');
  });
  test('b = 0.5 gives 1.25× natural roll', () => {
    const { ball } = strike(cue, shot({ b: 0.5 }), p);
    expect((p.R * Math.abs(ball.w[1])) / ball.v[0]).toBeCloseTo(1.25, 6);
  });
  test('azimuth sets the travel direction', () => {
    const { ball } = strike(cue, shot({ azimuth: Math.PI / 3 }), p);
    expect(angleXY(ball.v)).toBeCloseTo(Math.PI / 3, 9);
  });
  test('right english spins clockwise and squirts left', () => {
    const { ball } = strike(cue, shot({ a: 0.3 }), p);
    expect(ball.w[2]).toBeLessThan(0);
    expect(angleXY(ball.v)).toBeGreaterThan(0);
  });
  test('squirt angle values with m/m_e = 30 (§9 row 6)', () => {
    expect((squirtAngle(0.25, p) * 180) / Math.PI).toBeCloseTo(1.04, 2);
    expect((squirtAngle(0.5, p) * 180) / Math.PI).toBeCloseTo(1.89, 2);
  });
  test('offset beyond the limit is a miscue: weak, spinless hit', () => {
    const r = strike(cue, shot({ a: 0.6 }), p);
    expect(r.miscue).toBe(true);
    expect(norm(r.ball.w)).toBeCloseTo(0, 9);
    expect(norm(r.ball.v)).toBeLessThan(norm(strike(cue, shot({}), p).ball.v));
  });
  test('elevated cue drives the ball into the slate', () => {
    const { ball } = strike(cue, shot({ elevation: 0.5 }), p);
    expect(ball.v[2]).toBeLessThan(0);
    expect(norm(xy(ball.v))).toBeGreaterThan(0);
  });
  test('zero cue speed leaves the ball at rest', () => {
    const { ball } = strike(cue, shot({ cueSpeed: 0 }), p);
    expect(classify(ball, p)).toBe('stationary');
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/physics/strike.test.ts`
Expected: FAIL ("Failed to resolve import ./strike").

- [ ] **Step 3: Implementar `src/physics/strike.ts`**

```ts
import type { Ball, Shot } from './types';
import type { PhysicsParams } from './params';
import { withMotion } from './motion';
import { rotZ, scale, type Vec3 } from './vec';

/** Desvío de la blanca por efecto lateral (TP A.31). Positivo para a > 0; se aplica en sentido antihorario. */
export function squirtAngle(a: number, p: PhysicsParams): number {
  const ratio = p.m / p.cueEndMass;
  return Math.atan2(2.5 * a * Math.sqrt(Math.max(0, 1 - a * a)), 1 + ratio + 2.5 * (1 - a * a));
}

const MISCUE_SPEED_FACTOR = 0.2;

/** Impulso puntual instantáneo con taco elevado (modelo pooltool / TP A.30). */
export function strike(ball: Ball, shot: Shot, p: PhysicsParams): { ball: Ball; miscue: boolean } {
  const miscue = Math.hypot(shot.a, shot.b) > p.miscueLimit;
  const a = miscue ? 0 : shot.a;
  const b = miscue ? 0 : shot.b;
  const speed = miscue ? shot.cueSpeed * MISCUE_SPEED_FACTOR : shot.cueSpeed;

  const th = shot.elevation;
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  const c = Math.sqrt(Math.max(0, 1 - a * a - b * b));
  const R = p.R;
  const A = R * a;
  const C = R * (cos * c - sin * b);
  const B = R * (sin * c + cos * b);
  const Im = 0.4 * R * R;
  const denom = 1 + p.m / p.cueMass + (A * A + (B * cos - C * sin) ** 2) / Im;
  const vMag = ((1 + p.tipRestitution) * speed) / denom;

  const vLocal: Vec3 = [0, -vMag * cos, -vMag * sin];
  const wLocal: Vec3 = scale([-C * sin + B * cos, A * sin, -A * cos], vMag / Im);
  const rot = shot.azimuth + Math.PI / 2 + squirtAngle(a, p);
  return { ball: withMotion({ ...ball, v: rotZ(vLocal, rot), w: rotZ(wLocal, rot) }, p), miscue };
}
```

- [ ] **Step 4: Correr tests**

Run: `npx vitest run src/physics/strike.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/physics/strike.ts src/physics/strike.test.ts
git commit -m "feat(physics): cue strike with spin, elevation, squirt and miscue" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Choque bola-bola con fricción (throw)

Referencia: physics-models §4 y §9 filas 1, 7, 7d y 12. La componente tangencial usa `D = −min(μ·Jn, |u|/7)·û`, donde Jn = |Δv normal|. Esto unifica el caso de deslizamiento y el de agarre (no-slip) del §4.1. Δω = (5/2R)·(n̂ × D) para **ambas** bolas.

**Files:**
- Create: `src/physics/ballBall.ts`
- Test: `src/physics/ballBall.test.ts`

**Interfaces:**
- Consumes: `Ball`, `PhysicsParams`, `ballBallFriction`, `vec`.
- Produces: `resolveBallBall(b1, b2, p): [Ball, Ball]`. No reclasifica: lo hace el simulador.

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, expect, test } from 'vitest';
import type { Ball } from './types';
import { DEFAULT_PARAMS } from './params';
import { resolveBallBall } from './ballBall';
import { energy } from './motion';
import { add, dot, norm, sub, unit, type Vec3 } from './vec';

const p = DEFAULT_PARAMS;
const deg = (r: number) => (r * 180) / Math.PI;
const mk = (id: string, r: Vec3, v: Vec3 = [0, 0, 0], w: Vec3 = [0, 0, 0]): Ball => ({ id, r, v, w, motion: 'sliding' });

/** CB en el origen moviéndose +x; OB en contacto con la línea de centros a φ de +x (corte hacia +y). */
function cutSetup(phiDeg: number, v: number, w: Vec3 = [0, 0, 0]) {
  const phi = (phiDeg * Math.PI) / 180;
  const cb = mk('cue', [0, 0, p.R], [v, 0, 0], w);
  const ob = mk('1', [2 * p.R * Math.cos(phi), 2 * p.R * Math.sin(phi), p.R]);
  return { cb, ob, n: unit(sub(ob.r, cb.r)) };
}

describe('resolveBallBall', () => {
  test('head-on, elastic and frictionless: cue stops, object takes all the speed', () => {
    const q = { ...p, eBall: 1, muBall: 0 };
    const [c, o] = resolveBallBall(mk('cue', [0, 0, p.R], [1, 0, 0]), mk('1', [2 * p.R, 0, p.R]), q);
    expect(c.v[0]).toBeCloseTo(0, 12);
    expect(o.v[0]).toBeCloseTo(1, 12);
  });
  test('linear momentum is conserved and energy never increases', () => {
    const { cb, ob } = cutSetup(37, 2.3, [15, -40, 22]);
    const [c, o] = resolveBallBall(cb, { ...ob, v: [-0.4, 0.2, 0], w: [3, 1, -8] }, p);
    const before = add(cb.v, [-0.4, 0.2, 0]);
    const after = add(c.v, o.v);
    for (let i = 0; i < 3; i++) expect(after[i]).toBeCloseTo(before[i], 12);
    const e0 = energy(cb, p) + energy({ ...ob, v: [-0.4, 0.2, 0], w: [3, 1, -8] }, p);
    expect(energy(c, p) + energy(o, p)).toBeLessThanOrEqual(e0 + 1e-12);
  });
  test.each([30, 45])('90° rule: stun, frictionless, elastic, %s° cut (§9 row 1)', (phi) => {
    const q = { ...p, eBall: 1, muBall: 0 };
    const { cb, ob } = cutSetup(phi, 1);
    const [c, o] = resolveBallBall(cb, ob, q);
    expect(deg(Math.acos(dot(unit(c.v), unit(o.v))))).toBeCloseTo(90, 6);
  });
  test.each([
    [30, 4.72],
    [45, 4.95],
  ])('cut-induced throw at 0.447 m/s, %s° cut ≈ %s° (§9 row 7)', (phi, expected) => {
    const q = { ...p, eBall: 1 };
    const { cb, ob, n } = cutSetup(phi, 0.447);
    const [, o] = resolveBallBall(cb, ob, q);
    expect(deg(Math.acos(dot(unit(o.v), n)))).toBeCloseTo(expected, 1);
  });
  test('gearing outside english gives zero throw (§9 row 7d)', () => {
    const v = 1;
    const phi = Math.PI / 6;
    const { cb, ob, n } = cutSetup(30, v, [0, 0, (v * Math.sin(phi)) / p.R]);
    const [, o] = resolveBallBall(cb, ob, { ...p, eBall: 1 });
    expect(deg(Math.acos(Math.min(1, dot(unit(o.v), n))))).toBeLessThan(0.01);
  });
  test('restitution 0.95 leaves the cue ball a little normal speed', () => {
    const [c] = resolveBallBall(mk('cue', [0, 0, p.R], [1, 0, 0]), mk('1', [2 * p.R, 0, p.R]), { ...p, muBall: 0 });
    expect(c.v[0]).toBeCloseTo(0.025, 9);
    expect(norm(c.w)).toBe(0);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/physics/ballBall.test.ts`
Expected: FAIL ("Failed to resolve import ./ballBall").

- [ ] **Step 3: Implementar `src/physics/ballBall.ts`**

```ts
import type { Ball } from './types';
import { ballBallFriction, type PhysicsParams } from './params';
import { add, cross, dot, norm, scale, sub, unit } from './vec';

/** Choque instantáneo inelástico con fricción entre bolas de igual masa (§4.1). */
export function resolveBallBall(b1: Ball, b2: Ball, p: PhysicsParams): [Ball, Ball] {
  const n = unit(sub(b2.r, b1.r));
  const e = p.eBall;
  const v1n = dot(b1.v, n);
  const v2n = dot(b2.v, n);
  const v1nAfter = 0.5 * ((1 - e) * v1n + (1 + e) * v2n);
  const v2nAfter = 0.5 * ((1 + e) * v1n + (1 - e) * v2n);
  const jn = Math.abs(v1nAfter - v1n);

  let v1 = add(b1.v, scale(n, v1nAfter - v1n));
  let v2 = add(b2.v, scale(n, v2nAfter - v2n));
  let w1 = b1.w;
  let w2 = b2.w;

  // Velocidad relativa de los puntos de contacto (bola 1 en +R n̂, bola 2 en −R n̂), parte tangencial.
  const u = sub(add(b1.v, scale(cross(b1.w, n), p.R)), sub(b2.v, scale(cross(b2.w, n), p.R)));
  const ut = sub(u, scale(n, dot(u, n)));
  const s = norm(ut);
  if (s > 1e-12) {
    const mag = Math.min(ballBallFriction(p, s) * jn, s / 7);
    const d = scale(ut, -mag / s);
    const dw = scale(cross(n, d), 5 / (2 * p.R));
    v1 = add(v1, d);
    v2 = sub(v2, d);
    w1 = add(w1, dw);
    w2 = add(w2, dw);
  }
  return [
    { ...b1, v: v1, w: w1 },
    { ...b2, v: v2, w: w2 },
  ];
}
```

- [ ] **Step 4: Correr tests**

Run: `npx vitest run src/physics/ballBall.test.ts`
Expected: PASS. Si falla el throw, verificar que `jn` usa |Δv normal| y que el corte es hacia +y; no tocar los valores esperados sin recalcularlos con la fórmula del §4.2.

- [ ] **Step 5: Commit**

```bash
git add src/physics/ballBall.ts src/physics/ballBall.test.ts
git commit -m "feat(physics): frictional ball-ball collision with throw" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Choque contra banda (Han 2005) y rebote contra el paño

Referencia: physics-models §5.1, §6 y §9 fila 11. Marco de Han: x̂ = −n (hacia la banda), ŷ = ẑ × x̂, z arriba. Se descarta el impulso vertical PZ, así que la bola sigue en la mesa; si estaba en el aire conserva su `vz`.

**Files:**
- Create: `src/physics/cushion.ts`
- Test: `src/physics/cushion.test.ts`

**Interfaces:**
- Consumes: `Ball`, `PhysicsParams`, `slip`, `vec`.
- Produces: `resolveCushion(ball, nIntoTable: Vec3, p): Ball`, `resolveTable(ball, p): Ball` (rebote contra el paño; deja z = R).

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, expect, test } from 'vitest';
import type { Ball } from './types';
import { DEFAULT_PARAMS as p } from './params';
import { resolveCushion, resolveTable } from './cushion';
import { energy, slip } from './motion';
import { cross, norm, scale, type Vec3, Z } from './vec';

const deg = (r: number) => (r * 180) / Math.PI;
const N: Vec3 = [0, 1, 0]; // banda inferior (y = 0); la normal apunta hacia la mesa

function incoming(angleDeg: number, rolling: boolean): Ball {
  const a = (angleDeg * Math.PI) / 180;
  const v: Vec3 = [Math.sin(a), -Math.cos(a), 0];
  const w = rolling ? scale(cross(Z, v), 1 / p.R) : ([0, 0, 0] as Vec3);
  return { id: 'b', r: [1, p.R, p.R], v, w, motion: rolling ? 'rolling' : 'sliding' };
}
const outAngle = (b: Ball) => deg(Math.atan2(Math.abs(b.v[0]), b.v[1]));

describe('resolveCushion (Han 2005, §9 row 11 regression)', () => {
  test.each([
    [15, 12.3], [30, 26.6], [45, 43.7], [60, 61.8],
  ])('rolling in at %s° leaves at %s° immediately', (inA, out) => {
    expect(outAngle(resolveCushion(incoming(inA, true), N, p))).toBeCloseTo(out, 0);
  });
  test.each([
    [15, 14.6], [30, 29.3], [45, 44.1], [60, 62.1],
  ])('stun in at %s° leaves at %s° immediately', (inA, out) => {
    const r = resolveCushion(incoming(inA, false), N, p);
    expect(Math.abs(outAngle(r) - out)).toBeLessThan(0.3);
  });
  test('normal speed ratio for a straight-in stun ball is about 0.74', () => {
    const r = resolveCushion(incoming(0, false), N, p);
    expect(r.v[1]).toBeGreaterThan(0.7);
    expect(r.v[1]).toBeLessThan(0.85);
  });
  test('energy never increases', () => {
    const b = { ...incoming(40, true), w: [20, -10, 30] as Vec3 };
    expect(energy(resolveCushion(b, N, p), p)).toBeLessThanOrEqual(energy(b, p) + 1e-12);
  });
});

describe('resolveTable', () => {
  test('bounces with eTable and keeps the ball on the slate height', () => {
    const b: Ball = { id: 'b', r: [0, 0, p.R], v: [1, 0, -2], w: [0, 0, 0], motion: 'airborne' };
    const r = resolveTable(b, p);
    expect(r.v[2]).toBeCloseTo(1, 9);
    expect(r.r[2]).toBe(p.R);
    expect(norm(slip(r, p.R))).toBeLessThan(norm(slip(b, p.R)));
  });
  test('tiny bounces are cut to zero', () => {
    const b: Ball = { id: 'b', r: [0, 0, p.R], v: [1, 0, -0.1], w: [0, 0, 0], motion: 'airborne' };
    expect(resolveTable(b, p).v[2]).toBe(0);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/physics/cushion.test.ts`
Expected: FAIL ("Failed to resolve import ./cushion").

- [ ] **Step 3: Implementar `src/physics/cushion.ts`**

```ts
import type { Ball } from './types';
import type { PhysicsParams } from './params';
import { slip } from './motion';
import { add, cross, dot, norm, scale, sub, unit, type Vec3, xy, Z } from './vec';

/** Banda: modelo de impulso de Han 2005 tal como lo implementa pooltool (§5.1). */
export function resolveCushion(ball: Ball, nIntoTable: Vec3, p: PhysicsParams): Ball {
  const X = scale(unit(xy(nIntoTable)), -1);
  const Y = cross(Z, X);
  const toLocal = (v: Vec3): Vec3 => [dot(v, X), dot(v, Y), v[2]];
  const fromLocal = (l: Vec3): Vec3 => add(add(scale(X, l[0]), scale(Y, l[1])), [0, 0, l[2]]);

  const [vx, vy, vz] = toLocal(ball.v);
  const [wx, wy, wz] = toLocal(ball.w);
  const { R, m } = p;
  const I = 0.4 * m * R * R;
  const thA = Math.asin(p.cushionHeight / R - 1);
  const sinA = Math.sin(thA);
  const cosA = Math.cos(thA);

  const sx = vx * sinA - vz * cosA + R * wy;
  const sy = -vy - R * wz * cosA + R * wx * sinA;
  const c = -vx * cosA;
  const A = 7 / (2 * m);
  const B = 1 / m;
  const PzE = (-(1 + p.eCushion) * c) / B;
  const s = Math.hypot(sx, sy);
  const PzS = s / A;
  let PxE: number;
  let PyE: number;
  if (PzS <= p.muCushion * PzE) {
    PxE = sx / A;
    PyE = sy / A;
  } else {
    PxE = (p.muCushion * PzE * sx) / s;
    PyE = (p.muCushion * PzE * sy) / s;
  }
  const PX = -PxE * sinA - PzE * cosA;
  const PY = PyE;
  const PZ = PxE * cosA - PzE * sinA;

  const vLocal: Vec3 = [vx + PX / m, vy + PY / m, vz];
  const wLocal: Vec3 = [
    wx - (R / I) * PY * sinA,
    wy + (R / I) * (PX * sinA - PZ * cosA),
    wz + (R / I) * PY * cosA,
  ];
  return { ...ball, v: fromLocal(vLocal), w: fromLocal(wLocal) };
}

/** Rebote contra el paño: restitución normal + fricción de Coulomb limitada al no-slip (§6). */
export function resolveTable(ball: Ball, p: PhysicsParams): Ball {
  const jn = (1 + p.eTable) * Math.abs(Math.min(0, ball.v[2]));
  let vz = -p.eTable * Math.min(0, ball.v[2]);
  let v: Vec3 = xy(ball.v);
  let w = ball.w;
  const u = slip(ball, p.R);
  const s = norm(u);
  if (s > 1e-12 && jn > 0) {
    const mag = Math.min(p.muSlide * jn, (2 / 7) * s);
    const d = scale(u, -mag / s);
    v = add(v, d);
    w = sub(w, scale(cross(Z, d), 5 / (2 * p.R)));
  }
  if ((vz * vz) / (2 * p.g) < p.minBounceHeight) vz = 0;
  return { ...ball, r: [ball.r[0], ball.r[1], p.R], v: [v[0], v[1], vz], w };
}
```

- [ ] **Step 4: Correr tests**

Run: `npx vitest run src/physics/cushion.test.ts`
Expected: PASS. Los ángulos esperados fueron verificados a mano con estas fórmulas (stun 45° → 44,13°; rolling 45° → 43,68°).

- [ ] **Step 5: Commit**

```bash
git add src/physics/cushion.ts src/physics/cushion.test.ts
git commit -m "feat(physics): Han 2005 cushion model and ball-table bounce" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 7: Geometría de mesa, diamantes y ayudas de apuntado (`table/`)

Modelo de troneras de v1:
- Las bandas son segmentos que terminan en los vértices de las mandíbulas (*jaw points*).
- Cada vértice tiene un círculo (mandíbula redondeada) tangente a la banda.
- Cada tronera tiene una **línea de captura** ubicada 0,5R detrás de la línea de la boca y extendida R hacia cada lado: si el centro de la bola la cruza, queda embocada.
- No se modelan las caras internas (*facings*), así que en v1 no hay "sacudida" (*rattle*).

**Files:**
- Create: `src/table/geometry.ts`, `src/table/aim.ts`
- Test: `src/table/geometry.test.ts`, `src/table/aim.test.ts`

**Interfaces:**
- Consumes: tipos `Boundary`, `Segment`, `Circle`, `PocketMouth` (Task 2), `vec`.
- Produces:
  - `geometry.ts`: `TableSize`, `PocketId`, `POCKET_IDS`, `TABLE_DIMENSIONS`, `TableSpec`, `DEFAULT_TABLE_SPEC`, `SIGHT_OFFSET`, `TableGeometry { spec; length; width; diamond; boundary; pocketCenters: Record<PocketId, Vec3> }`, `buildTable(spec, R): TableGeometry`, `diamondToPoint(g, x, y, z?)`, `pointToDiamond(g, p)`.
  - `aim.ts`: `azimuthTo(from, to)`, `ghostBallPosition(ob, target, R)`, `cutAngleDeg(cb, ob, target, R)`.

- [ ] **Step 1: Escribir los tests que fallan**

`src/table/geometry.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { buildTable, DEFAULT_TABLE_SPEC, diamondToPoint, pointToDiamond } from './geometry';
import { dot, norm, sub } from '../physics/vec';

const R = 0.028575;

describe('buildTable', () => {
  const g = buildTable(DEFAULT_TABLE_SPEC, R);
  test('9 ft dimensions and diamond spacing', () => {
    expect(g.length).toBeCloseTo(2.54, 9);
    expect(g.width).toBeCloseTo(1.27, 9);
    expect(g.diamond).toBeCloseTo(0.3175, 9);
  });
  test('6 rails, 12 jaws, 6 pockets', () => {
    expect(g.boundary.segments).toHaveLength(6);
    expect(g.boundary.jaws).toHaveLength(12);
    expect(g.boundary.pockets.map((m) => m.id).sort()).toEqual(['c00', 'c04', 'c80', 'c84', 's40', 's44']);
  });
  test('mouth widths match the spec', () => {
    const s = Object.fromEntries(g.boundary.segments.map((x) => [x.id, x]));
    expect(norm(sub(s['y0-head'].p1, s['x0'].p1))).toBeCloseTo(DEFAULT_TABLE_SPEC.cornerMouth, 9);
    expect(s['y0-foot'].p1[0] - s['y0-head'].p2[0]).toBeCloseTo(DEFAULT_TABLE_SPEC.sideMouth, 9);
  });
  test('rail normals point into the playing surface', () => {
    const center = [g.length / 2, g.width / 2, 0] as const;
    for (const s of g.boundary.segments) expect(dot(sub(center, s.p1), s.n)).toBeGreaterThan(0);
  });
  test('capture lines sit half a radius behind the mouth', () => {
    const c00 = g.boundary.pockets.find((m) => m.id === 'c00')!;
    expect(dot(sub(c00.p1, [0.1143 / Math.SQRT2, 0, 0]), c00.n)).toBeCloseTo(-0.5 * R, 9);
  });
  test('8 ft table', () => {
    expect(buildTable({ ...DEFAULT_TABLE_SPEC, size: '8ft' }, R).length).toBeCloseTo(2.3368, 9);
  });
});

describe('diamonds', () => {
  const g = buildTable(DEFAULT_TABLE_SPEC, R);
  test('foot spot (6,2)', () => {
    const pt = diamondToPoint(g, 6, 2);
    expect(pt[0]).toBeCloseTo(1.905, 9);
    expect(pt[1]).toBeCloseTo(0.635, 9);
  });
  test('round trip', () => {
    const d = pointToDiamond(g, diamondToPoint(g, 3.25, 1.5));
    expect(d.x).toBeCloseTo(3.25, 12);
    expect(d.y).toBeCloseTo(1.5, 12);
  });
});
```

`src/table/aim.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { azimuthTo, cutAngleDeg, ghostBallPosition } from './aim';
import type { Vec3 } from '../physics/vec';

const R = 0.028575;

describe('aim helpers', () => {
  test('ghost ball sits 2R behind the object ball, opposite the target', () => {
    const gb = ghostBallPosition([1, 0, R], [2, 0, 0], R);
    expect(gb[0]).toBeCloseTo(1 - 2 * R, 12);
    expect(gb[1]).toBeCloseTo(0, 12);
    expect(gb[2]).toBe(R);
  });
  test('straight-in shot has a 0° cut', () => {
    expect(cutAngleDeg([0, 0, R], [1, 0, R], [2, 0, 0], R)).toBeCloseTo(0, 9);
  });
  test('30° cut', () => {
    const ob: Vec3 = [0, 0, R];
    const gb = ghostBallPosition(ob, [5, 0, 0], R);
    const a = Math.PI / 6;
    const cb: Vec3 = [gb[0] - Math.cos(a), gb[1] - Math.sin(a), R];
    expect(cutAngleDeg(cb, ob, [5, 0, 0], R)).toBeCloseTo(30, 9);
  });
  test('azimuthTo', () => {
    expect(azimuthTo([0, 0, 0], [0, 1, 0])).toBeCloseTo(Math.PI / 2, 12);
  });
});
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `npx vitest run src/table`
Expected: FAIL ("Failed to resolve import ./geometry" / "./aim").

- [ ] **Step 3: Implementar `src/table/geometry.ts`**

```ts
import type { Boundary, Circle, PocketMouth, Segment } from '../physics/types';
import { add, scale, sub, unit, type Vec3 } from '../physics/vec';

export type TableSize = '7ft' | '8ft' | '9ft';
/** Troneras nombradas por su coordenada en diamantes: c = esquina, s = media. */
export type PocketId = 'c00' | 'c04' | 'c80' | 'c84' | 's40' | 's44';
export const POCKET_IDS: PocketId[] = ['c00', 'c04', 'c80', 'c84', 's40', 's44'];

export const TABLE_DIMENSIONS: Record<TableSize, { length: number; width: number }> = {
  '9ft': { length: 2.54, width: 1.27 },
  '8ft': { length: 2.3368, width: 1.1684 },
  '7ft': { length: 1.9812, width: 0.9906 },
};

export interface TableSpec { size: TableSize; cornerMouth: number; sideMouth: number }
export const DEFAULT_TABLE_SPEC: TableSpec = { size: '9ft', cornerMouth: 0.1143, sideMouth: 0.127 };

const CORNER_JAW_RADIUS = 0.021;
const SIDE_JAW_RADIUS = 0.008;
/** Los diamantes (sights) están 3 11/16" detrás de la nariz de la banda (WPA). */
export const SIGHT_OFFSET = 0.0937;

export interface TableGeometry {
  spec: TableSpec;
  length: number;
  width: number;
  diamond: number;
  boundary: Boundary;
  /** Centro de la boca de cada tronera (punto al que se apunta). */
  pocketCenters: Record<PocketId, Vec3>;
}

export function buildTable(spec: TableSpec, R: number): TableGeometry {
  const { length: L, width: W } = TABLE_DIMENSIONS[spec.size];
  const k = spec.cornerMouth / Math.SQRT2;
  const sh = spec.sideMouth / 2;
  const C = CORNER_JAW_RADIUS;
  const S = SIDE_JAW_RADIUS;
  const segments: Segment[] = [];
  const jaws: Circle[] = [];

  const rail = (id: string, p1: Vec3, p2: Vec3, n: Vec3, r1: number, r2: number) => {
    segments.push({ id, p1, p2, n });
    jaws.push({ id: `${id}:a`, c: sub(p1, scale(n, r1)), radius: r1 });
    jaws.push({ id: `${id}:b`, c: sub(p2, scale(n, r2)), radius: r2 });
  };
  rail('y0-head', [k, 0, 0], [L / 2 - sh, 0, 0], [0, 1, 0], C, S);
  rail('y0-foot', [L / 2 + sh, 0, 0], [L - k, 0, 0], [0, 1, 0], S, C);
  rail('y4-head', [k, W, 0], [L / 2 - sh, W, 0], [0, -1, 0], C, S);
  rail('y4-foot', [L / 2 + sh, W, 0], [L - k, W, 0], [0, -1, 0], S, C);
  rail('x0', [0, k, 0], [0, W - k, 0], [1, 0, 0], C, C);
  rail('x8', [L, k, 0], [L, W - k, 0], [-1, 0, 0], C, C);

  const mouth = (id: PocketId, a: Vec3, b: Vec3, n: Vec3): PocketMouth => {
    const dir = unit(sub(b, a));
    const back = scale(n, -0.5 * R);
    return { id, p1: add(sub(a, scale(dir, R)), back), p2: add(add(b, scale(dir, R)), back), n };
  };
  const d = Math.SQRT1_2;
  const pockets: PocketMouth[] = [
    mouth('c00', [k, 0, 0], [0, k, 0], [d, d, 0]),
    mouth('c04', [0, W - k, 0], [k, W, 0], [d, -d, 0]),
    mouth('c80', [L - k, 0, 0], [L, k, 0], [-d, d, 0]),
    mouth('c84', [L, W - k, 0], [L - k, W, 0], [-d, -d, 0]),
    mouth('s40', [L / 2 - sh, 0, 0], [L / 2 + sh, 0, 0], [0, 1, 0]),
    mouth('s44', [L / 2 - sh, W, 0], [L / 2 + sh, W, 0], [0, -1, 0]),
  ];
  const pocketCenters: Record<PocketId, Vec3> = {
    c00: [k / 2, k / 2, 0],
    c04: [k / 2, W - k / 2, 0],
    c80: [L - k / 2, k / 2, 0],
    c84: [L - k / 2, W - k / 2, 0],
    s40: [L / 2, 0, 0],
    s44: [L / 2, W, 0],
  };
  return { spec, length: L, width: W, diamond: L / 8, boundary: { segments, jaws, pockets }, pocketCenters };
}

export const diamondToPoint = (g: TableGeometry, x: number, y: number, z = 0): Vec3 => [x * g.diamond, y * g.diamond, z];
export const pointToDiamond = (g: TableGeometry, p: Vec3): { x: number; y: number } => ({ x: p[0] / g.diamond, y: p[1] / g.diamond });
```

- [ ] **Step 4: Implementar `src/table/aim.ts`**

```ts
import { dot, sub, unit, type Vec3, xy } from '../physics/vec';

export const azimuthTo = (from: Vec3, to: Vec3): number => Math.atan2(to[1] - from[1], to[0] - from[0]);

/** Centro de la bola fantasma: a 2R de la BO, del lado opuesto al objetivo. */
export function ghostBallPosition(ob: Vec3, target: Vec3, R: number): Vec3 {
  const d = unit(xy(sub(target, ob)));
  return [ob[0] - 2 * R * d[0], ob[1] - 2 * R * d[1], ob[2]];
}

/** Ángulo de corte: entre la línea BB→BF y la línea BO→objetivo (grados). */
export function cutAngleDeg(cb: Vec3, ob: Vec3, target: Vec3, R: number): number {
  const gb = ghostBallPosition(ob, target, R);
  const a = unit(xy(sub(gb, cb)));
  const b = unit(xy(sub(target, ob)));
  return (Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) * 180) / Math.PI;
}
```

- [ ] **Step 5: Correr tests**

Run: `npx vitest run src/table`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/table
git commit -m "feat(table): table geometry, pockets, diamonds and aim helpers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Detección del próximo evento

Referencia: physics-models §8.2 y §8.4.
- Los tiempos se calculan con los polinomios de la trayectoria del estado actual, válidos hasta el `horizon` de cada bola (su próxima transición o su aterrizaje).
- Se acepta una raíz solo si las bolas se acercan.
- **Contacto previo:** si ya están en contacto (bola-bola a 2R, bola-banda a R) y se acercan, el evento ocurre en t = 0. Ver Review Focus #1.
- Ante empates, gana el primero en un orden fijo: por cada bola, primero su transición o aterrizaje, después bandas, mandíbulas y troneras, y al final los pares con bolas de índice mayor.

**Files:**
- Create: `src/physics/detect.ts`
- Test: `src/physics/detect.test.ts`

**Interfaces:**
- Consumes: `trajectory`, `transitionTime`, `Quad` (Task 2), `realRootsInRange` (Task 3), tipos de `Boundary`.
- Produces: `Candidate { t; kind; ids; target? }`, `isMoving(b)`, `landingTime(b, p)`, `ballBallTime(b1, b2, p)`, `segmentTime(b, s, p)`, `jawTime(b, c, p)`, `pocketTime(b, m, p)`, `nextEvent(balls, boundary, p): Candidate | null`. En los `Candidate`, `t` es **relativo** al estado actual.

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, expect, test } from 'vitest';
import type { Ball, Boundary } from './types';
import { DEFAULT_PARAMS } from './params';
import { withMotion } from './motion';
import { ballBallTime, jawTime, landingTime, nextEvent, pocketTime, segmentTime } from './detect';
import type { Vec3 } from './vec';

const p0 = { ...DEFAULT_PARAMS, muSlide: 0, muRoll: 0 }; // sin fricción: trayectorias rectas
const R = p0.R;
const mk = (id: string, r: Vec3, v: Vec3 = [0, 0, 0], p = p0): Ball =>
  withMotion({ id, r: [r[0], r[1], r[2] || R], v, w: [0, 0, 0], motion: 'stationary' }, p);
const bottomRail = { id: 'rail', p1: [0, 0, 0] as Vec3, p2: [2, 0, 0] as Vec3, n: [0, 1, 0] as Vec3 };

describe('ballBallTime', () => {
  test('head-on approach', () => {
    expect(ballBallTime(mk('a', [0, 0, 0], [1, 0, 0]), mk('b', [0.5, 0, 0]), p0)).toBeCloseTo(0.5 - 2 * R, 9);
  });
  test('frozen contacts: touching and approaching collide at t = 0', () => {
    expect(ballBallTime(mk('a', [0, 0, 0], [1, 0, 0]), mk('b', [2 * R, 0, 0]), p0)).toBe(0);
  });
  test('touching but separating never collide', () => {
    expect(ballBallTime(mk('a', [0, 0, 0], [-1, 0, 0]), mk('b', [2 * R, 0, 0]), p0)).toBe(Infinity);
  });
  test('passing wide misses', () => {
    expect(ballBallTime(mk('a', [0, 0, 0], [1, 0, 0]), mk('b', [0.5, 3 * R, 0]), p0)).toBe(Infinity);
  });
  test('two stationary balls never collide', () => {
    expect(ballBallTime(mk('a', [0, 0, 0]), mk('b', [2 * R, 0, 0]), p0)).toBe(Infinity);
  });
});

describe('cushions, jaws and pockets', () => {
  test('rail hit when the ball edge reaches the nose', () => {
    expect(segmentTime(mk('a', [1, 0.5, 0], [0, -1, 0]), bottomRail, p0)).toBeCloseTo(0.5 - R, 9);
  });
  test('outside the rail extent there is no hit', () => {
    expect(segmentTime(mk('a', [3, 0.5, 0], [0, -1, 0]), bottomRail, p0)).toBe(Infinity);
  });
  test('frozen to the rail and pushed into it collides at t = 0', () => {
    expect(segmentTime(mk('a', [1, R, 0], [0.3, -1, 0]), bottomRail, p0)).toBe(0);
  });
  test('moving away from the rail never hits it', () => {
    expect(segmentTime(mk('a', [1, 0.5, 0], [0, 1, 0]), bottomRail, p0)).toBe(Infinity);
  });
  test('pocket capture uses the ball center (no radius offset)', () => {
    const m = { id: 's40', p1: [0, 0, 0] as Vec3, p2: [1, 0, 0] as Vec3, n: [0, 1, 0] as Vec3 };
    expect(pocketTime(mk('a', [0.5, 0.3, 0], [0, -1, 0]), m, p0)).toBeCloseTo(0.3, 9);
  });
  test('jaw circle', () => {
    const jaw = { id: 'j', c: [1, 0, 0] as Vec3, radius: 0.02 };
    expect(jawTime(mk('a', [1, 0.5, 0], [0, -1, 0]), jaw, p0)).toBeCloseTo(0.5 - R - 0.02, 9);
  });
  test('landing time of an airborne ball', () => {
    const b = withMotion({ id: 'a', r: [0, 0, R + 0.01], v: [0, 0, 0], w: [0, 0, 0], motion: 'airborne' }, p0);
    expect(landingTime(b, p0)).toBeCloseTo(Math.sqrt(0.02 / p0.g), 9);
  });
});

describe('nextEvent', () => {
  const p = DEFAULT_PARAMS;
  const empty: Boundary = { segments: [], jaws: [], pockets: [] };
  test('nothing moving → null', () => {
    expect(nextEvent([mk('a', [0, 0, 0], [0, 0, 0], p)], empty, p)).toBeNull();
  });
  test('lone sliding ball → transition', () => {
    const e = nextEvent([mk('a', [0, 0, 0], [1, 0, 0], p)], empty, p)!;
    expect(e.kind).toBe('transition');
    expect(e.t).toBeCloseTo(0.1456, 3);
  });
  test('close object ball → ballBall before the slide ends', () => {
    const e = nextEvent([mk('cue', [0, 0, 0], [1, 0, 0], p), mk('1', [0.1, 0, 0], [0, 0, 0], p)], empty, p)!;
    expect(e.kind).toBe('ballBall');
    expect(e.ids).toEqual(['cue', '1']);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/physics/detect.test.ts`
Expected: FAIL ("Failed to resolve import ./detect").

- [ ] **Step 3: Implementar `src/physics/detect.ts`**

```ts
import type { Ball, Boundary, Circle, EventKind, PocketMouth, Segment } from './types';
import type { PhysicsParams } from './params';
import { type Quad, trajectory, transitionTime } from './motion';
import { realRootsInRange } from './roots';
import { add, dot, scale, sub, type Vec3, xy } from './vec';

export const T_EPS = 1e-10;
const TOUCH_EPS = 1e-9;

export interface Candidate { t: number; kind: EventKind; ids: string[]; target?: string }

export const isMoving = (b: Ball): boolean =>
  b.motion === 'sliding' || b.motion === 'rolling' || b.motion === 'airborne';

const at = (q: Quad, t: number): Vec3 => add(add(scale(q.a, t * t), scale(q.b, t)), q.c);
const vel = (q: Quad, t: number): Vec3 => add(scale(q.a, 2 * t), q.b);

export function landingTime(b: Ball, p: PhysicsParams): number {
  if (b.motion !== 'airborne') return Infinity;
  const q = trajectory(b, p);
  for (const t of realRootsInRange([q.a[2], q.b[2], q.c[2] - p.R], T_EPS, Infinity)) {
    if (vel(q, t)[2] < 0) return t;
  }
  return Infinity;
}

const horizon = (b: Ball, p: PhysicsParams): number =>
  b.motion === 'airborne' ? landingTime(b, p) : transitionTime(b, p);

/** Primer t en (0, h] con |A t² + B t + C| = D acercándose; 0 si ya están en contacto y acercándose. */
function contactTime(A: Vec3, B: Vec3, C: Vec3, D: number, h: number): number {
  if (dot(C, C) <= (D + TOUCH_EPS) ** 2 && dot(C, B) < 0) return 0;
  const coeffs = [dot(A, A), 2 * dot(A, B), dot(B, B) + 2 * dot(A, C), 2 * dot(B, C), dot(C, C) - D * D];
  for (const t of realRootsInRange(coeffs, T_EPS, h)) {
    const d = add(add(scale(A, t * t), scale(B, t)), C);
    if (dot(d, add(scale(A, 2 * t), B)) < 0) return t;
  }
  return Infinity;
}

export function ballBallTime(b1: Ball, b2: Ball, p: PhysicsParams): number {
  if (b1.motion === 'pocketed' || b2.motion === 'pocketed') return Infinity;
  if (!isMoving(b1) && !isMoving(b2)) return Infinity;
  const q1 = trajectory(b1, p);
  const q2 = trajectory(b2, p);
  const h = Math.min(horizon(b1, p), horizon(b2, p));
  return contactTime(sub(q2.a, q1.a), sub(q2.b, q1.b), sub(q2.c, q1.c), 2 * p.R, h);
}

export function jawTime(b: Ball, jaw: Circle, p: PhysicsParams): number {
  if (!isMoving(b)) return Infinity;
  const q = trajectory(b, p);
  return contactTime(xy(q.a), xy(q.b), sub(xy(q.c), xy(jaw.c)), p.R + jaw.radius, horizon(b, p));
}

/** La bola cruza la recta (p1, p2) a distancia `offset` moviéndose contra n, dentro del tramo. */
function lineTime(b: Ball, p1: Vec3, p2: Vec3, n: Vec3, offset: number, p: PhysicsParams): number {
  if (!isMoving(b)) return Infinity;
  const q = trajectory(b, p);
  const along = sub(p2, p1);
  const len2 = dot(along, along);
  const within = (r: Vec3) => {
    const u = dot(sub(r, p1), along) / len2;
    return u >= 0 && u <= 1;
  };
  const d0 = dot(sub(q.c, p1), n) - offset;
  if (d0 <= TOUCH_EPS && d0 > -p.R && dot(q.b, n) < 0 && within(q.c)) return 0;
  for (const t of realRootsInRange([dot(q.a, n), dot(q.b, n), d0], T_EPS, horizon(b, p))) {
    if (dot(vel(q, t), n) < 0 && within(at(q, t))) return t;
  }
  return Infinity;
}

export const segmentTime = (b: Ball, s: Segment, p: PhysicsParams): number => lineTime(b, s.p1, s.p2, s.n, p.R, p);
export const pocketTime = (b: Ball, m: PocketMouth, p: PhysicsParams): number => lineTime(b, m.p1, m.p2, m.n, 0, p);

function pick(best: Candidate | null, t: number, kind: EventKind, ids: string[], target?: string): Candidate | null {
  return t < Infinity && (best === null || t < best.t) ? { t, kind, ids, target } : best;
}

export function nextEvent(balls: Ball[], boundary: Boundary, p: PhysicsParams): Candidate | null {
  let best: Candidate | null = null;
  for (let i = 0; i < balls.length; i++) {
    const b = balls[i];
    if (b.motion === 'pocketed') continue;
    best = b.motion === 'airborne'
      ? pick(best, landingTime(b, p), 'table', [b.id])
      : pick(best, transitionTime(b, p), 'transition', [b.id]);
    if (isMoving(b)) {
      for (const s of boundary.segments) best = pick(best, segmentTime(b, s, p), 'cushion', [b.id], s.id);
      for (const c of boundary.jaws) best = pick(best, jawTime(b, c, p), 'jaw', [b.id], c.id);
      for (const m of boundary.pockets) best = pick(best, pocketTime(b, m, p), 'pocket', [b.id], m.id);
    }
    for (let j = i + 1; j < balls.length; j++) {
      best = pick(best, ballBallTime(b, balls[j], p), 'ballBall', [b.id, balls[j].id]);
    }
  }
  return best;
}
```

- [ ] **Step 4: Correr tests**

Run: `npx vitest run src/physics/detect.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/physics/detect.ts src/physics/detect.test.ts
git commit -m "feat(physics): event detection for balls, rails, jaws, pockets and landings" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Simulador por eventos y muestreo de la línea de tiempo

Referencia: physics-models §8.2–8.4 y §9.

**Files:**
- Create: `src/physics/simulate.ts`
- Test: `src/physics/simulate.test.ts`

**Interfaces:**
- Consumes: todo lo de los Tasks 2–8.
- Produces: `SimOptions { maxEvents?; maxDuration? }`, `simulate(balls, shot, boundary, p?, opts?): Timeline`, `stateAt(timeline, t, p): Ball[]`.
  - Las bolas de cada `SimEvent` muestran el estado **después** de resolver el evento.
  - El primer evento siempre es `strike`, en t = 0.
  - Si `truncated` es false, la última foto tiene todas las bolas quietas o embocadas.

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, expect, test } from 'vitest';
import type { Ball, Boundary, Shot } from './types';
import { DEFAULT_PARAMS as p } from './params';
import { simulate, stateAt } from './simulate';
import { energy, evolve } from './motion';
import { dot, unit, type Vec3, ZERO } from './vec';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';
import { azimuthTo } from '../table/aim';

const open: Boundary = { segments: [], jaws: [], pockets: [] };
const B = (id: string, x: number, y: number): Ball => ({ id, r: [x, y, p.R], v: ZERO, w: ZERO, motion: 'stationary' });
const shot = (over: Partial<Shot>): Shot => ({ cueBallId: 'cue', azimuth: 0, elevation: 0, a: 0, b: 0, cueSpeed: 1, ...over });
const deg = (r: number) => (r * 180) / Math.PI;
const last = (balls: Ball[], id: string) => balls.find((b) => b.id === id)!;
const g = buildTable(DEFAULT_TABLE_SPEC, p.R);

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('physics rules (integration)', () => {
  test('30° rule: rolling CB at a half-ball hit deflects 33.67° (§9 row 2)', () => {
    const q = { ...p, eBall: 1, muBall: 0 };
    const tl = simulate([B('cue', 0.3, 0.6), B('1', 0.8, 0.6 + p.R)], shot({ b: 0.4 }), open, q);
    const hit = tl.events.findIndex((e) => e.kind === 'ballBall');
    expect(hit).toBeGreaterThan(0);
    const settle = tl.events.slice(hit + 1).find((e) => e.kind === 'transition' && e.ids[0] === 'cue')!;
    const cue = last(settle.balls, 'cue');
    expect(Math.abs(deg(Math.atan2(cue.v[1], cue.v[0])))).toBeCloseTo(33.67, 1);
  });

  test('90° rule: stun CB separates at 90° (§9 row 1)', () => {
    const q = { ...p, eBall: 1, muBall: 0, muSlide: 1e-6 };
    const tl = simulate([B('cue', 0.3, 0.6), B('1', 0.8, 0.6 + 2 * p.R * Math.SQRT1_2)], shot({}), open, q);
    const hit = tl.events.find((e) => e.kind === 'ballBall')!;
    const c = last(hit.balls, 'cue');
    const o = last(hit.balls, '1');
    expect(deg(Math.acos(dot(unit(c.v), unit(o.v))))).toBeCloseTo(90, 2);
  });
});

describe('table interactions', () => {
  test('straight into the corner pocket', () => {
    const tl = simulate([B('cue', 0.5, 0.5)], shot({ azimuth: azimuthTo([0.5, 0.5, 0], g.pocketCenters.c00), cueSpeed: 1.5 }), g.boundary, p);
    const end = last(tl.events.at(-1)!.balls, 'cue');
    expect(end.motion).toBe('pocketed');
    expect(end.pocket).toBe('c00');
  });
  test('straight into the side pocket', () => {
    const tl = simulate([B('cue', g.length / 2, 0.4)], shot({ azimuth: -Math.PI / 2, cueSpeed: 1.5 }), g.boundary, p);
    expect(last(tl.events.at(-1)!.balls, 'cue').pocket).toBe('s40');
  });
  test('running along the rail into the corner', () => {
    const tl = simulate([B('cue', 1.0, p.R + 0.002)], shot({ azimuth: Math.PI, cueSpeed: 2 }), g.boundary, p);
    expect(last(tl.events.at(-1)!.balls, 'cue').pocket).toBe('c00');
  });
  test('rail bounce keeps the ball on the table', () => {
    const tl = simulate([B('cue', 1.0, 0.6)], shot({ azimuth: -Math.PI / 2, cueSpeed: 1 }), g.boundary, p);
    expect(tl.events.some((e) => e.kind === 'cushion')).toBe(true);
    expect(last(tl.events.at(-1)!.balls, 'cue').motion).toBe('stationary');
  });
});

describe('robustness', () => {
  test('frozen chain: the third ball moves', () => {
    const tl = simulate([B('cue', 0.5, 0.6), B('1', 1.0, 0.6), B('2', 1.0 + 2 * p.R, 0.6)], shot({ cueSpeed: 1.5 }), open, p);
    expect(tl.truncated).toBe(false);
    expect(last(tl.events.at(-1)!.balls, '2').r[0]).toBeGreaterThan(1.2);
  });
  test('zero power ends immediately', () => {
    const tl = simulate([B('cue', 0.5, 0.6)], shot({ cueSpeed: 0 }), g.boundary, p);
    expect(tl.events).toHaveLength(1);
    expect(tl.duration).toBe(0);
  });
  test('miscue finishes and is flagged', () => {
    const tl = simulate([B('cue', 0.5, 0.6)], shot({ a: 0.7, cueSpeed: 3 }), g.boundary, p);
    expect(tl.miscue).toBe(true);
    expect(tl.truncated).toBe(false);
  });
  test('jump: elevated cue makes the ball fly and land', () => {
    const tl = simulate([B('cue', 0.5, 0.6)], shot({ elevation: 0.6, cueSpeed: 3 }), open, p);
    expect(tl.events.some((e) => e.kind === 'table')).toBe(true);
    expect(stateAt(tl, 0.02, p)[0].r[2]).toBeGreaterThan(p.R);
    expect(tl.truncated).toBe(false);
  });
  test('event cap truncates', () => {
    const tl = simulate([B('cue', 1.0, 0.6)], shot({ cueSpeed: 4 }), g.boundary, p, { maxEvents: 2 });
    expect(tl.truncated).toBe(true);
    expect(tl.events.length).toBeLessThanOrEqual(2);
  });
  test('unknown cue ball id throws', () => {
    expect(() => simulate([B('x', 1, 1)], shot({}), open, p)).toThrow(/not found/);
  });

  test('balls never leave the table and energy never increases (randomized)', () => {
    const rand = rng(42);
    for (let i = 0; i < 40; i++) {
      const pos = (): Vec3 => [0.1 + rand() * (g.length - 0.2), 0.1 + rand() * (g.width - 0.2), p.R];
      const balls = ['cue', '1', '2'].map((id) => {
        const r = pos();
        return B(id, r[0], r[1]);
      });
      const tooClose = balls.some((a, j) => balls.some((b, k) => k > j && Math.hypot(a.r[0] - b.r[0], a.r[1] - b.r[1]) < 2.2 * p.R));
      if (tooClose) continue;
      const tl = simulate(balls, shot({
        azimuth: rand() * 2 * Math.PI, cueSpeed: 0.5 + rand() * 5,
        a: (rand() - 0.5) * 0.8, b: (rand() - 0.5) * 0.8, elevation: rand() < 0.2 ? 0.3 : 0,
      }), g.boundary, p);
      expect(tl.truncated).toBe(false);
      for (const b of tl.events.at(-1)!.balls) {
        if (b.motion === 'pocketed') continue;
        expect(b.r[0]).toBeGreaterThanOrEqual(p.R - 1e-6);
        expect(b.r[0]).toBeLessThanOrEqual(g.length - p.R + 1e-6);
        expect(b.r[1]).toBeGreaterThanOrEqual(p.R - 1e-6);
        expect(b.r[1]).toBeLessThanOrEqual(g.width - p.R + 1e-6);
      }
      let prev = Infinity;
      for (const e of tl.events) {
        const total = e.balls.reduce((s, b) => s + energy(b, p), 0);
        expect(total).toBeLessThanOrEqual(prev + 1e-9);
        prev = total;
      }
    }
  });
});

describe('stateAt', () => {
  test('evolves from the last event before t', () => {
    const tl = simulate([B('cue', 0.5, 0.6)], shot({ cueSpeed: 1 }), open, p);
    const e1 = tl.events[1];
    const t = e1.t + 0.3;
    expect(stateAt(tl, t, p)[0].r[0]).toBeCloseTo(evolve(e1.balls[0], 0.3, p).r[0], 12);
    expect(stateAt(tl, 1e9, p)[0].r[0]).toBeCloseTo(tl.events.at(-1)!.balls[0].r[0], 12);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/physics/simulate.test.ts`
Expected: FAIL ("Failed to resolve import ./simulate").

- [ ] **Step 3: Implementar `src/physics/simulate.ts`**

```ts
import type { Ball, Boundary, Shot, SimEvent, Timeline } from './types';
import { DEFAULT_PARAMS, type PhysicsParams } from './params';
import { applyTransition, evolve, withMotion } from './motion';
import { strike } from './strike';
import { resolveBallBall } from './ballBall';
import { resolveCushion, resolveTable } from './cushion';
import { type Candidate, nextEvent } from './detect';
import { sub, unit, xy, ZERO } from './vec';

export interface SimOptions { maxEvents?: number; maxDuration?: number }
const MAX_ZERO_DT_EVENTS = 100;

function resolveEvent(ev: Candidate, balls: Ball[], boundary: Boundary, p: PhysicsParams): Ball[] {
  const out = balls.slice();
  const i = out.findIndex((b) => b.id === ev.ids[0]);
  const b = out[i];
  switch (ev.kind) {
    case 'transition':
      out[i] = applyTransition(b, p);
      break;
    case 'ballBall': {
      const j = out.findIndex((x) => x.id === ev.ids[1]);
      const [r1, r2] = resolveBallBall(b, out[j], p);
      out[i] = withMotion(r1, p);
      out[j] = withMotion(r2, p);
      break;
    }
    case 'cushion': {
      const s = boundary.segments.find((x) => x.id === ev.target)!;
      out[i] = withMotion(resolveCushion(b, s.n, p), p);
      break;
    }
    case 'jaw': {
      const c = boundary.jaws.find((x) => x.id === ev.target)!;
      out[i] = withMotion(resolveCushion(b, unit(xy(sub(b.r, c.c))), p), p);
      break;
    }
    case 'pocket':
      out[i] = { ...b, v: ZERO, w: ZERO, motion: 'pocketed', pocket: ev.target };
      break;
    case 'table':
      out[i] = withMotion(resolveTable(b, p), p);
      break;
    case 'strike':
      break;
  }
  return out;
}

export function simulate(
  initial: Ball[],
  shot: Shot,
  boundary: Boundary,
  p: PhysicsParams = DEFAULT_PARAMS,
  opts: SimOptions = {},
): Timeline {
  const maxEvents = opts.maxEvents ?? 3000;
  const maxDuration = opts.maxDuration ?? 120;
  const idx = initial.findIndex((b) => b.id === shot.cueBallId);
  if (idx < 0) throw new Error(`Cue ball "${shot.cueBallId}" not found`);

  let balls = initial.map((b) => withMotion(b, p));
  const struck = strike(balls[idx], shot, p);
  balls[idx] = withMotion(struck.ball.v[2] < 0 ? resolveTable(struck.ball, p) : struck.ball, p);
  const events: SimEvent[] = [{ t: 0, kind: 'strike', ids: [shot.cueBallId], balls }];

  let t = 0;
  let truncated = false;
  let zeroStreak = 0;
  for (;;) {
    const next = nextEvent(balls, boundary, p);
    if (!next) break;
    if (events.length >= maxEvents || t + next.t > maxDuration) {
      truncated = true;
      break;
    }
    zeroStreak = next.t < 1e-12 ? zeroStreak + 1 : 0;
    if (zeroStreak > MAX_ZERO_DT_EVENTS) {
      truncated = true;
      break;
    }
    balls = balls.map((b) => evolve(b, next.t, p));
    t += next.t;
    balls = resolveEvent(next, balls, boundary, p);
    events.push({ t, kind: next.kind, ids: next.ids, target: next.target, balls });
  }
  return { events, duration: t, truncated, miscue: struck.miscue };
}

/** Estado de todas las bolas en el instante t (se recorta a [0, duration]). */
export function stateAt(tl: Timeline, t: number, p: PhysicsParams): Ball[] {
  const ev = tl.events;
  const time = Math.max(0, Math.min(t, tl.duration));
  let lo = 0;
  let hi = ev.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ev[mid].t <= time) lo = mid;
    else hi = mid - 1;
  }
  const base = ev[lo];
  return base.balls.map((b) => evolve(b, time - base.t, p));
}
```

- [ ] **Step 4: Correr tests**

Run: `npx vitest run src/physics`
Expected: PASS (todo `physics`). Si falla el test aleatorio:
- Imprimir la semilla y el índice que fallan, y reproducir ese tiro aislado.
- Causas típicas: un hueco entre la banda y la línea de captura, o una raíz aceptada que no corresponde a un acercamiento.
- Corregir la geometría o la detección, no la tolerancia del test.

- [ ] **Step 5: Commit**

```bash
git add src/physics/simulate.ts src/physics/simulate.test.ts
git commit -m "feat(physics): event-driven simulator and timeline sampling" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Web Worker y cliente de simulación (`sim/`)

`sim/` es la capa que une `physics` con `table`. En jsdom no existe `Worker`, así que el cliente simula en el mismo hilo (sirve para los tests de componentes).

**Files:**
- Create: `src/sim/client.ts`, `src/sim/worker.ts`
- Test: `src/sim/client.test.ts`

**Interfaces:**
- Consumes: `simulate` (Task 9), `buildTable`, `TableSpec` (Task 7).
- Produces: `SimRequest`, `SimResponse`, `runRequest(req)`, `simulateAsync(balls, shot, table: TableSpec, params): Promise<Timeline>`.

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, expect, test } from 'vitest';
import { simulateAsync } from './client';
import { DEFAULT_PARAMS as p } from '../physics/params';
import { DEFAULT_TABLE_SPEC } from '../table/geometry';

describe('simulateAsync', () => {
  test('falls back to in-thread simulation when Worker is unavailable', async () => {
    expect(typeof Worker).toBe('undefined');
    const tl = await simulateAsync(
      [{ id: 'cue', r: [0.6, 0.6, p.R], v: [0, 0, 0], w: [0, 0, 0], motion: 'stationary' }],
      { cueBallId: 'cue', azimuth: 0, elevation: 0, a: 0, b: 0, cueSpeed: 1 },
      DEFAULT_TABLE_SPEC,
      p,
    );
    expect(tl.events[0].kind).toBe('strike');
    expect(tl.duration).toBeGreaterThan(0);
  });
  test('rejects on simulation errors', async () => {
    await expect(
      simulateAsync([], { cueBallId: 'cue', azimuth: 0, elevation: 0, a: 0, b: 0, cueSpeed: 1 }, DEFAULT_TABLE_SPEC, p),
    ).rejects.toThrow(/not found/);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/sim`
Expected: FAIL ("Failed to resolve import ./client").

- [ ] **Step 3: Implementar `src/sim/client.ts` y `src/sim/worker.ts`**

`src/sim/client.ts`:
```ts
import type { Ball, Shot, Timeline } from '../physics/types';
import type { PhysicsParams } from '../physics/params';
import { simulate } from '../physics/simulate';
import { buildTable, type TableSpec } from '../table/geometry';

export interface SimRequest { id: number; balls: Ball[]; shot: Shot; table: TableSpec; params: PhysicsParams }
export type SimResponse =
  | { id: number; ok: true; timeline: Timeline }
  | { id: number; ok: false; error: string };

export function runRequest(req: Omit<SimRequest, 'id'>): Timeline {
  return simulate(req.balls, req.shot, buildTable(req.table, req.params.R).boundary, req.params);
}

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (t: Timeline) => void; reject: (e: Error) => void }>();

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<SimResponse>) => {
      const job = pending.get(e.data.id);
      if (!job) return;
      pending.delete(e.data.id);
      if (e.data.ok) job.resolve(e.data.timeline);
      else job.reject(new Error(e.data.error));
    };
    worker.onerror = (e) => {
      for (const job of pending.values()) job.reject(new Error(e.message || 'Error en el worker de simulación'));
      pending.clear();
      worker?.terminate();
      worker = null;
    };
  }
  return worker;
}

export function simulateAsync(balls: Ball[], shot: Shot, table: TableSpec, params: PhysicsParams): Promise<Timeline> {
  const w = getWorker();
  if (!w) return Promise.resolve().then(() => runRequest({ balls, shot, table, params }));
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, balls, shot, table, params } satisfies SimRequest);
  });
}
```

`src/sim/worker.ts`:
```ts
import { runRequest, type SimRequest, type SimResponse } from './client';

const scope = self as unknown as {
  onmessage: ((e: MessageEvent<SimRequest>) => void) | null;
  postMessage: (m: SimResponse) => void;
};

scope.onmessage = (e) => {
  const { id, ...req } = e.data;
  try {
    scope.postMessage({ id, ok: true, timeline: runRequest(req) });
  } catch (err) {
    console.error('[sim worker]', err);
    scope.postMessage({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
```

- [ ] **Step 4: Correr tests y chequeo de tipos**

Run: `npx vitest run src/sim && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim
git commit -m "feat(sim): web worker client with in-thread fallback" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Progreso persistente (`progress/`)

**Files:**
- Create: `src/progress/types.ts`, `src/progress/store.ts`, `src/progress/stats.ts`
- Test: `src/progress/store.test.ts`, `src/progress/stats.test.ts`

**Interfaces:**
- Consumes: `TableSize` (Task 7), `PhysicsParams` (Task 2).
- Produces:
  - `types.ts`: `SCHEMA_VERSION`, `Attempt`, `TableShot`, `TableSession`, `Settings`, `DEFAULT_SETTINGS`, `ProgressStore`.
  - `store.ts`: `newId()`, `createMemoryStore()`, `createIdbStore(name?)`, `openProgressStore()`.
  - `stats.ts`: `LessonStats`, `lessonStats(lessonId, crit, attempts, sessions, needs)`, `dayKey(ts)`, `computeStreak(timestamps, now)`.

- [ ] **Step 1: Crear `src/progress/types.ts`**

```ts
import type { TableSize } from '../table/geometry';
import type { PhysicsParams } from '../physics/params';

export const SCHEMA_VERSION = 1;

export interface Attempt {
  id: string;
  schemaVersion: number;
  lessonId: string;
  exerciseIndex: number;
  kind: 'estimate' | 'simShot';
  success: boolean;
  detail?: string;
  createdAt: number;
}

export interface TableShot { success: boolean; miss?: 'fina' | 'gruesa' }

export interface TableSession {
  id: string;
  schemaVersion: number;
  lessonId: string;
  exerciseIndex: number;
  shots: TableShot[];
  startedAt: number;
  endedAt: number;
}

export interface Settings {
  tableSize: TableSize;
  cornerMouthIn: number;
  sideMouthIn: number;
  ignoreLocks: boolean;
  showGuidesByDefault: boolean;
  physicsOverrides?: Partial<PhysicsParams>;
}

export const DEFAULT_SETTINGS: Settings = {
  tableSize: '9ft',
  cornerMouthIn: 4.5,
  sideMouthIn: 5,
  ignoreLocks: false,
  showGuidesByDefault: true,
};

export interface ProgressStore {
  persistent: boolean;
  addAttempt(a: Attempt): Promise<void>;
  listAttempts(): Promise<Attempt[]>;
  addTableSession(s: TableSession): Promise<void>;
  listTableSessions(): Promise<TableSession[]>;
  getSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<void>;
}
```

- [ ] **Step 2: Escribir los tests que fallan**

`src/progress/store.test.ts`:
```ts
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createIdbStore, createMemoryStore, newId, openProgressStore } from './store';
import { DEFAULT_SETTINGS, SCHEMA_VERSION, type Attempt } from './types';

const attempt = (over: Partial<Attempt> = {}): Attempt => ({
  id: newId(), schemaVersion: SCHEMA_VERSION, lessonId: 'ghost-ball', exerciseIndex: 0,
  kind: 'simShot', success: true, createdAt: Date.now(), ...over,
});

afterEach(() => vi.unstubAllGlobals());

describe.each([
  ['memory', async () => createMemoryStore()],
  ['indexeddb', async () => createIdbStore(`test-${Math.random()}`)],
])('%s store', (_name, make) => {
  test('attempts round trip', async () => {
    const s = await make();
    await s.addAttempt(attempt({ success: false }));
    await s.addAttempt(attempt());
    const all = await s.listAttempts();
    expect(all).toHaveLength(2);
    expect(all.filter((a) => a.success)).toHaveLength(1);
  });
  test('table sessions round trip', async () => {
    const s = await make();
    await s.addTableSession({ id: newId(), schemaVersion: SCHEMA_VERSION, lessonId: 'x', exerciseIndex: 2, shots: [{ success: true }, { success: false, miss: 'fina' }], startedAt: 1, endedAt: 2 });
    expect((await s.listTableSessions())[0].shots[1].miss).toBe('fina');
  });
  test('settings default and save', async () => {
    const s = await make();
    expect(await s.getSettings()).toEqual(DEFAULT_SETTINGS);
    await s.saveSettings({ ...DEFAULT_SETTINGS, tableSize: '7ft' });
    expect((await s.getSettings()).tableSize).toBe('7ft');
  });
});

describe('openProgressStore', () => {
  test('uses IndexedDB when available', async () => {
    expect((await openProgressStore()).persistent).toBe(true);
  });
  test('falls back to memory when IndexedDB is missing', async () => {
    vi.stubGlobal('indexedDB', undefined);
    expect((await openProgressStore()).persistent).toBe(false);
  });
});
```

`src/progress/stats.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { computeStreak, lessonStats } from './stats';
import type { Attempt, TableSession } from './types';

const DAY = 86_400_000;
const now = new Date(2026, 9, 1, 12).getTime();
const a = (success: boolean, lessonId = 'L'): Attempt => ({ id: Math.random().toString(), schemaVersion: 1, lessonId, exerciseIndex: 0, kind: 'simShot', success, createdAt: now });
const sess = (hits: boolean[], lessonId = 'L'): TableSession => ({ id: Math.random().toString(), schemaVersion: 1, lessonId, exerciseIndex: 1, shots: hits.map((success) => ({ success })), startedAt: now, endedAt: now });
const crit = { simulator: 0.7, realTable: 0.6 };
const needs = { sim: true, table: true };

describe('lessonStats', () => {
  test('rates and pass', () => {
    const s = lessonStats('L', crit, [a(true), a(true), a(true), a(false), a(true, 'other')], [sess([true, true, false])], needs);
    expect(s.simRate).toBeCloseTo(0.75);
    expect(s.tableRate).toBeCloseTo(2 / 3);
    expect(s.passed).toBe(true);
  });
  test('no data → null rates, not passed', () => {
    const s = lessonStats('L', crit, [], [], needs);
    expect(s.simRate).toBeNull();
    expect(s.passed).toBe(false);
  });
  test('below threshold does not pass', () => {
    expect(lessonStats('L', crit, [a(true), a(false)], [sess([true])], needs).passed).toBe(false);
  });
  test('lesson without table exercises only needs the simulator', () => {
    expect(lessonStats('L', crit, [a(true)], [], { sim: true, table: false }).passed).toBe(true);
  });
});

describe('computeStreak', () => {
  test('consecutive days ending today', () => {
    expect(computeStreak([now, now - DAY, now - 2 * DAY], now)).toBe(3);
  });
  test('streak still alive if the last activity was yesterday', () => {
    expect(computeStreak([now - DAY, now - 2 * DAY], now)).toBe(2);
  });
  test('broken streak', () => {
    expect(computeStreak([now - 3 * DAY], now)).toBe(0);
  });
  test('several entries the same day count once', () => {
    expect(computeStreak([now, now - 1000], now)).toBe(1);
  });
});
```

- [ ] **Step 3: Correr y verificar que fallan**

Run: `npx vitest run src/progress`
Expected: FAIL ("Failed to resolve import ./store" / "./stats").

- [ ] **Step 4: Implementar `src/progress/store.ts`**

```ts
import { openDB } from 'idb';
import { DEFAULT_SETTINGS, type Attempt, type ProgressStore, type Settings, type TableSession } from './types';

export const newId = (): string => crypto.randomUUID();

export function createMemoryStore(): ProgressStore {
  const attempts: Attempt[] = [];
  const sessions: TableSession[] = [];
  let settings: Settings = { ...DEFAULT_SETTINGS };
  return {
    persistent: false,
    async addAttempt(a) { attempts.push(a); },
    async listAttempts() { return attempts.slice(); },
    async addTableSession(s) { sessions.push(s); },
    async listTableSessions() { return sessions.slice(); },
    async getSettings() { return { ...settings }; },
    async saveSettings(s) { settings = { ...s }; },
  };
}

export async function createIdbStore(name = 'aimpool'): Promise<ProgressStore> {
  const db = await openDB(name, 1, {
    upgrade(d) {
      d.createObjectStore('attempts', { keyPath: 'id' }).createIndex('lessonId', 'lessonId');
      d.createObjectStore('tableSessions', { keyPath: 'id' }).createIndex('lessonId', 'lessonId');
      d.createObjectStore('settings');
    },
  });
  return {
    persistent: true,
    async addAttempt(a) { await db.put('attempts', a); },
    async listAttempts() { return (await db.getAll('attempts')) as Attempt[]; },
    async addTableSession(s) { await db.put('tableSessions', s); },
    async listTableSessions() { return (await db.getAll('tableSessions')) as TableSession[]; },
    async getSettings() {
      const s = (await db.get('settings', 'settings')) as Partial<Settings> | undefined;
      return { ...DEFAULT_SETTINGS, ...(s ?? {}) };
    },
    async saveSettings(s) { await db.put('settings', s, 'settings'); },
  };
}

/** IndexedDB si está disponible; si no (modo privado, navegador viejo), memoria. */
export async function openProgressStore(): Promise<ProgressStore> {
  try {
    if (typeof indexedDB === 'undefined' || !indexedDB) throw new Error('IndexedDB no disponible');
    return await createIdbStore();
  } catch (err) {
    console.warn('[progress] usando almacenamiento en memoria:', err);
    return createMemoryStore();
  }
}
```

- [ ] **Step 5: Implementar `src/progress/stats.ts`**

```ts
import type { Attempt, TableSession } from './types';

export interface LessonStats {
  simAttempts: number;
  simSuccess: number;
  simRate: number | null;
  tableShots: number;
  tableSuccess: number;
  tableRate: number | null;
  passed: boolean;
}

export function lessonStats(
  lessonId: string,
  crit: { simulator: number; realTable: number },
  attempts: Attempt[],
  sessions: TableSession[],
  needs: { sim: boolean; table: boolean },
): LessonStats {
  const mine = attempts.filter((a) => a.lessonId === lessonId);
  const simSuccess = mine.filter((a) => a.success).length;
  const shots = sessions.filter((s) => s.lessonId === lessonId).flatMap((s) => s.shots);
  const tableSuccess = shots.filter((s) => s.success).length;
  const simRate = mine.length ? simSuccess / mine.length : null;
  const tableRate = shots.length ? tableSuccess / shots.length : null;
  const simOk = !needs.sim || (simRate !== null && simRate >= crit.simulator);
  const tableOk = !needs.table || (tableRate !== null && tableRate >= crit.realTable);
  return { simAttempts: mine.length, simSuccess, simRate, tableShots: shots.length, tableSuccess, tableRate, passed: simOk && tableOk };
}

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Días consecutivos con actividad, terminando hoy o ayer (si hoy todavía no practicaste). */
export function computeStreak(timestamps: number[], now: number): number {
  const days = new Set(timestamps.map(dayKey));
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
```

- [ ] **Step 6: Correr tests**

Run: `npx vitest run src/progress`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/progress
git commit -m "feat(progress): IndexedDB store with memory fallback, lesson stats and streak" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Motor de contenido + lección Ghost ball (`content/`)

**Files:**
- Create: `src/content/types.ts`, `src/content/layout.ts`, `src/content/goals.ts`, `src/content/validate.ts`, `src/content/lessons/ghost-ball.ts`, `src/content/curriculum.ts`
- Test: `src/content/layout.test.ts`, `src/content/goals.test.ts`, `src/content/validate.test.ts`

**Interfaces:**
- Consumes: `Ball`, `Timeline`, `simulate`, `stateAt` (physics), `buildTable`, `TableGeometry`, `PocketId` (table).
- Produces:
  - `types.ts`: `Level`, `DiamondPos`, `BallLayout`, `GuideFlags`, `TargetSpec`, `TheoryBlock`, `EstimateAnswer`, `ShotGoal`, `VariationSpec`, `Exercise`, `Lesson`, `DEFAULT_PASS`.
  - `layout.ts`: `layoutToBalls(layout, g, R): Ball[]`, `mulberry32(seed)`, `applyVariation(layout, variation, rng)`.
  - `goals.ts`: `GoalResult`, `finalBalls(tl, p)`, `diagnoseCut(tl, ballId, target, p)`, `evaluateGoal(goal, tl, g, p)`.
  - `validate.ts`: `validateCurriculum(lessons): string[]`.
  - `curriculum.ts`: `LESSONS`, `lessonById(id)`, `isUnlocked(lesson, passed, ignoreLocks)`, `lessonNeeds(lesson)`, `orderedLessons(lessons?)`.

- [ ] **Step 1: Crear `src/content/types.ts`**

```ts
import type { PocketId } from '../table/geometry';

export type Level = 'principiante' | 'intermedio' | 'avanzado';
/** Posición del centro de una bola en diamantes: x ∈ [0,8] (0 = cabecera), y ∈ [0,4]. */
export interface DiamondPos { x: number; y: number }
/** 'cue' es la blanca; '1'..'15' bolas objetivo. */
export interface BallLayout { balls: { id: string; at: DiamondPos }[] }
export interface GuideFlags { aimLine: boolean; ghostBall: boolean; contactPreview: boolean }
export interface TargetSpec { ball: string; pocket: PocketId }

export type TheoryBlock =
  | { kind: 'text'; md: string }
  | { kind: 'diagram'; setup: BallLayout; target?: TargetSpec; showGhost?: boolean; caption: string }
  | { kind: 'table'; headers: string[]; rows: string[][]; caption?: string };

export type EstimateAnswer =
  | { kind: 'choice'; options: string[]; correct: number }
  | { kind: 'cutAngle'; ball: string; pocket: PocketId; toleranceDeg: number };

export interface ShotGoal {
  pocketBall?: { ball: string; pocket?: PocketId };
  cueBallZone?: { center: DiamondPos; radius: number }; // radio en diamantes
  allowScratch?: boolean;
}

export interface VariationSpec { balls: string[]; jitter: number } // jitter en diamantes

export type Exercise =
  | { kind: 'estimate'; prompt: string; setup: BallLayout; answer: EstimateAnswer; explanation: string; target?: TargetSpec }
  | { kind: 'simShot'; prompt: string; setup: BallLayout; variation?: VariationSpec; goal: ShotGoal; attempts: number; showGuides: GuideFlags }
  | { kind: 'realTable'; setup: BallLayout; shots: number; instructions: string; diagnose: boolean; target?: TargetSpec };

export interface Lesson {
  id: string;
  level: Level;
  module: string;
  title: string;
  summary: string;
  prerequisites: string[];
  theory: TheoryBlock[];
  reliability?: { stars: 1 | 2 | 3; note: string };
  sources: { label: string; url?: string }[];
  exercises: Exercise[];
  passCriteria: { simulator: number; realTable: number };
}

export const DEFAULT_PASS = { simulator: 0.7, realTable: 0.6 };
```

- [ ] **Step 2: Escribir los tests que fallan**

`src/content/layout.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { applyVariation, layoutToBalls, mulberry32 } from './layout';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';

const R = 0.028575;
const g9 = buildTable(DEFAULT_TABLE_SPEC, R);
const g7 = buildTable({ ...DEFAULT_TABLE_SPEC, size: '7ft' }, R);

describe('layoutToBalls', () => {
  test('converts diamonds to metres at rest on the cloth', () => {
    const [b] = layoutToBalls({ balls: [{ id: 'cue', at: { x: 6, y: 2 } }] }, g9, R);
    expect(b.r[0]).toBeCloseTo(1.905, 9);
    expect(b.r[2]).toBe(R);
    expect(b.motion).toBe('stationary');
  });
  test('frozen-to-rail positions are clamped so the ball never overlaps the cushion', () => {
    const [b] = layoutToBalls({ balls: [{ id: 'cue', at: { x: 3, y: 0.09 } }] }, g7, R);
    expect(b.r[1]).toBeCloseTo(R, 12);
  });
});

describe('applyVariation', () => {
  const layout = { balls: [{ id: 'cue', at: { x: 4, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }] };
  test('deterministic with a seeded rng and only moves listed balls', () => {
    const a = applyVariation(layout, { balls: ['cue'], jitter: 0.3 }, mulberry32(7));
    const b = applyVariation(layout, { balls: ['cue'], jitter: 0.3 }, mulberry32(7));
    expect(a).toEqual(b);
    expect(a.balls[1].at).toEqual({ x: 6, y: 2 });
    expect(Math.abs(a.balls[0].at.x - 4)).toBeLessThanOrEqual(0.3);
  });
  test('no variation returns the same layout', () => {
    expect(applyVariation(layout, undefined, Math.random)).toBe(layout);
  });
});
```

`src/content/goals.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { evaluateGoal } from './goals';
import { DEFAULT_PARAMS as p } from '../physics/params';
import { simulate } from '../physics/simulate';
import type { Ball } from '../physics/types';
import { add, scale, sub, unit, type Vec3, xy, ZERO } from '../physics/vec';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';
import { azimuthTo, ghostBallPosition } from '../table/aim';

const g = buildTable(DEFAULT_TABLE_SPEC, p.R);
const B = (id: string, r: Vec3): Ball => ({ id, r: [r[0], r[1], p.R], v: ZERO, w: ZERO, motion: 'stationary' });
const shoot = (balls: Ball[], aimAt: Vec3, cueSpeed = 1.5) =>
  simulate(balls, { cueBallId: 'cue', azimuth: azimuthTo(balls[0].r, aimAt), elevation: 0, a: 0, b: 0, cueSpeed }, g.boundary, p);
const goal = { pocketBall: { ball: '1', pocket: 'c00' as const } };

describe('evaluateGoal', () => {
  const ob: Vec3 = [0.6, 0.6, p.R];
  const target = g.pocketCenters.c00;

  test('straight-in shot succeeds', () => {
    const balls = [B('cue', [1.0, 1.0, 0]), B('1', ob)];
    const r = evaluateGoal(goal, shoot(balls, ob), g, p);
    expect(r.success).toBe(true);
    expect(r.messages[0]).toMatch(/Bien/);
  });

  test('missed cut is diagnosed as fina or gruesa', () => {
    const cue: Vec3 = [1.2, 0.6, p.R];
    const toCue = unit(xy(sub(cue, ob)));
    const ghostDir = unit(xy(sub(ghostBallPosition(ob, target, p.R), ob)));
    const thick = add(ob, scale(unit(add(ghostDir, scale(toCue, 0.3))), 2 * p.R));
    const thin = add(ob, scale(unit(sub(ghostDir, scale(toCue, 0.3))), 2 * p.R));
    const rThick = evaluateGoal(goal, shoot([B('cue', cue), B('1', ob)], thick), g, p);
    const rThin = evaluateGoal(goal, shoot([B('cue', cue), B('1', ob)], thin), g, p);
    expect(rThick.success).toBe(false);
    expect(rThick.miss).toBe('gruesa');
    expect(rThin.success).toBe(false);
    expect(rThin.miss).toBe('fina');
  });

  test('scratch fails unless allowed', () => {
    const balls = [B('cue', [0.5, 0.5, 0])];
    const tl = shoot(balls, g.pocketCenters.c00);
    expect(evaluateGoal({}, tl, g, p).success).toBe(false);
    expect(evaluateGoal({ allowScratch: true }, tl, g, p).success).toBe(true);
  });

  test('cue ball zone', () => {
    const balls = [B('cue', [1.0, 0.6, 0])];
    const tl = simulate(balls, { cueBallId: 'cue', azimuth: 0, elevation: 0, a: 0, b: 0, cueSpeed: 0.3 }, g.boundary, p);
    const endX = tl.events.at(-1)!.balls[0].r[0] / g.diamond;
    expect(evaluateGoal({ cueBallZone: { center: { x: endX, y: 0.6 / g.diamond }, radius: 0.3 } }, tl, g, p).success).toBe(true);
    expect(evaluateGoal({ cueBallZone: { center: { x: 7, y: 3 }, radius: 0.3 } }, tl, g, p).success).toBe(false);
  });
});
```

`src/content/validate.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { validateCurriculum } from './validate';
import { LESSONS } from './curriculum';
import { DEFAULT_PASS, type Lesson } from './types';

const base = (over: Partial<Lesson>): Lesson => ({
  id: 'a', level: 'principiante', module: 'm', title: 't', summary: 's', prerequisites: [], theory: [], sources: [],
  exercises: [{ kind: 'realTable', setup: { balls: [{ id: 'cue', at: { x: 2, y: 2 } }] }, shots: 5, instructions: 'x', diagnose: false }],
  passCriteria: DEFAULT_PASS, ...over,
});

describe('validateCurriculum', () => {
  test('the shipped curriculum is valid on 7, 8 and 9 ft tables', () => {
    expect(validateCurriculum(LESSONS)).toEqual([]);
  });
  test('detects duplicate ids, missing prerequisites and cycles', () => {
    expect(validateCurriculum([base({}), base({})]).join()).toMatch(/duplicad/);
    expect(validateCurriculum([base({ prerequisites: ['zzz'] })]).join()).toMatch(/zzz/);
    expect(validateCurriculum([base({ id: 'a', prerequisites: ['b'] }), base({ id: 'b', prerequisites: ['a'] })]).join()).toMatch(/ciclo/);
  });
  test('detects overlapping balls and missing cue ball', () => {
    const overlap = base({ exercises: [{ kind: 'realTable', setup: { balls: [{ id: 'cue', at: { x: 2, y: 2 } }, { id: '1', at: { x: 2.1, y: 2 } }] }, shots: 5, instructions: 'x', diagnose: false }] });
    expect(validateCurriculum([overlap]).join()).toMatch(/se solapan/);
    const noCue = base({ exercises: [{ kind: 'realTable', setup: { balls: [{ id: '1', at: { x: 2, y: 2 } }] }, shots: 5, instructions: 'x', diagnose: false }] });
    expect(validateCurriculum([noCue]).join()).toMatch(/blanca/);
  });
  test('detects bad choice index and unknown goal ball', () => {
    const bad = base({
      exercises: [
        { kind: 'estimate', prompt: 'p', setup: { balls: [{ id: 'cue', at: { x: 2, y: 2 } }] }, answer: { kind: 'choice', options: ['a', 'b'], correct: 5 }, explanation: 'e' },
        { kind: 'simShot', prompt: 'p', setup: { balls: [{ id: 'cue', at: { x: 2, y: 2 } }] }, goal: { pocketBall: { ball: '9' } }, attempts: 3, showGuides: { aimLine: true, ghostBall: false, contactPreview: false } },
      ],
    });
    const errs = validateCurriculum([bad]).join();
    expect(errs).toMatch(/correct/);
    expect(errs).toMatch(/bola 9/);
  });
});
```

- [ ] **Step 3: Correr y verificar que fallan**

Run: `npx vitest run src/content`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 4: Implementar `src/content/layout.ts`**

```ts
import type { Ball } from '../physics/types';
import { ZERO } from '../physics/vec';
import type { TableGeometry } from '../table/geometry';
import type { BallLayout, VariationSpec } from './types';

/** Convierte diamantes a metros. Recorta a [R, L−R] para que una bola "pegada a la banda" no la atraviese en mesas chicas. */
export function layoutToBalls(layout: BallLayout, g: TableGeometry, R: number): Ball[] {
  const clamp = (v: number, max: number) => Math.min(max - R, Math.max(R, v));
  return layout.balls.map(({ id, at }) => ({
    id,
    r: [clamp(at.x * g.diamond, g.length), clamp(at.y * g.diamond, g.width), R],
    v: ZERO,
    w: ZERO,
    motion: 'stationary',
  }));
}

export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Separación mínima en diamantes, válida en la mesa más chica (7 pies) con margen. */
const MIN_SEPARATION = 0.25;

export function applyVariation(layout: BallLayout, variation: VariationSpec | undefined, rng: () => number): BallLayout {
  if (!variation || variation.jitter <= 0) return layout;
  for (let attempt = 0; attempt < 10; attempt++) {
    const balls = layout.balls.map((b) => {
      if (!variation.balls.includes(b.id)) return b;
      const x = Math.min(7.8, Math.max(0.2, b.at.x + (rng() * 2 - 1) * variation.jitter));
      const y = Math.min(3.8, Math.max(0.2, b.at.y + (rng() * 2 - 1) * variation.jitter));
      return { ...b, at: { x, y } };
    });
    const ok = balls.every((a, i) => balls.every((b, j) => j <= i || Math.hypot(a.at.x - b.at.x, a.at.y - b.at.y) >= MIN_SEPARATION));
    if (ok) return { balls };
  }
  return layout;
}
```

- [ ] **Step 5: Implementar `src/content/goals.ts`**

```ts
import type { Ball, Timeline } from '../physics/types';
import type { PhysicsParams } from '../physics/params';
import { stateAt } from '../physics/simulate';
import { dot, norm, sub, unit, type Vec3, xy } from '../physics/vec';
import type { TableGeometry } from '../table/geometry';
import type { ShotGoal } from './types';

export interface GoalResult { success: boolean; messages: string[]; miss?: 'fina' | 'gruesa' }

export function finalBalls(tl: Timeline, p: PhysicsParams): Ball[] {
  return tl.truncated ? stateAt(tl, tl.duration, p) : tl.events[tl.events.length - 1].balls;
}

const angle = (a: Vec3, b: Vec3) => Math.acos(Math.max(-1, Math.min(1, dot(unit(xy(a)), unit(xy(b))))));

/** Compara el corte real con el necesario en el primer contacto blanca → bola. */
export function diagnoseCut(tl: Timeline, ballId: string, target: Vec3, p: PhysicsParams): 'fina' | 'gruesa' | undefined {
  const ev = tl.events.find((e) => e.kind === 'ballBall' && e.ids.includes('cue') && e.ids.includes(ballId));
  if (!ev) return undefined;
  const cueBefore = stateAt(tl, ev.t - 1e-9, p).find((b) => b.id === 'cue')!;
  const obAfter = ev.balls.find((b) => b.id === ballId)!;
  const actual = angle(cueBefore.v, obAfter.v);
  const needed = angle(cueBefore.v, sub(target, obAfter.r));
  if (Math.abs(actual - needed) < (0.3 * Math.PI) / 180) return undefined;
  return actual > needed ? 'fina' : 'gruesa';
}

export function evaluateGoal(goal: ShotGoal, tl: Timeline, g: TableGeometry, p: PhysicsParams): GoalResult {
  const end = finalBalls(tl, p);
  const cue = end.find((b) => b.id === 'cue');
  const messages: string[] = [];
  let success = true;
  let miss: GoalResult['miss'];

  if (tl.miscue) {
    success = false;
    messages.push('Pifia (miscue): le pegaste demasiado lejos del centro de la blanca.');
  }
  if (cue?.motion === 'pocketed' && !goal.allowScratch) {
    success = false;
    messages.push('La blanca entró (scratch).');
  }
  if (goal.pocketBall) {
    const { ball, pocket } = goal.pocketBall;
    const ob = end.find((b) => b.id === ball);
    if (!ob || ob.motion !== 'pocketed') {
      success = false;
      messages.push(`La bola ${ball} no entró.`);
      if (!tl.events.some((e) => e.kind === 'ballBall' && e.ids.includes('cue') && e.ids.includes(ball))) {
        messages.push(`La blanca no tocó la bola ${ball}.`);
      } else if (pocket) {
        miss = diagnoseCut(tl, ball, g.pocketCenters[pocket], p);
        if (miss === 'fina') messages.push('Pasó fina: cortaste de más.');
        if (miss === 'gruesa') messages.push('Pasó gruesa: cortaste de menos.');
      }
    } else if (pocket && ob.pocket !== pocket) {
      success = false;
      messages.push(`La bola ${ball} entró, pero en otra tronera.`);
    }
  }
  if (goal.cueBallZone && cue && cue.motion !== 'pocketed') {
    const c = goal.cueBallZone.center;
    const dist = norm(sub(xy(cue.r), [c.x * g.diamond, c.y * g.diamond, 0])) / g.diamond;
    if (dist > goal.cueBallZone.radius) {
      success = false;
      messages.push('La blanca quedó fuera de la zona marcada.');
    }
  }
  if (success) messages.unshift('¡Bien! Objetivo cumplido.');
  return { success, messages, miss };
}
```

- [ ] **Step 6: Implementar `src/content/validate.ts`**

```ts
import { DEFAULT_PARAMS } from '../physics/params';
import { buildTable, DEFAULT_TABLE_SPEC, type TableSize } from '../table/geometry';
import { layoutToBalls } from './layout';
import type { BallLayout, Exercise, Lesson } from './types';

const SIZES: TableSize[] = ['7ft', '8ft', '9ft'];

function checkLayout(where: string, layout: BallLayout, needCue: boolean, errors: string[]) {
  const ids = layout.balls.map((b) => b.id);
  if (new Set(ids).size !== ids.length) errors.push(`${where}: ids de bola repetidos`);
  if (needCue && !ids.includes('cue')) errors.push(`${where}: falta la blanca ('cue')`);
  for (const b of layout.balls) {
    if (b.at.x < 0 || b.at.x > 8 || b.at.y < 0 || b.at.y > 4) errors.push(`${where}: bola ${b.id} fuera de la mesa`);
  }
  const R = DEFAULT_PARAMS.R;
  for (const size of SIZES) {
    const balls = layoutToBalls(layout, buildTable({ ...DEFAULT_TABLE_SPEC, size }, R), R);
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const d = Math.hypot(balls[i].r[0] - balls[j].r[0], balls[i].r[1] - balls[j].r[1]);
        if (d < 2 * R - 1e-9) errors.push(`${where}: bolas ${balls[i].id} y ${balls[j].id} se solapan en mesa ${size}`);
      }
    }
  }
}

function checkExercise(where: string, ex: Exercise, errors: string[]) {
  checkLayout(where, ex.setup, true, errors);
  const ids = new Set(ex.setup.balls.map((b) => b.id));
  if (ex.kind === 'estimate') {
    if (ex.answer.kind === 'choice' && (ex.answer.options.length < 2 || ex.answer.correct < 0 || ex.answer.correct >= ex.answer.options.length)) {
      errors.push(`${where}: opción 'correct' inválida`);
    }
    if (ex.answer.kind === 'cutAngle' && !ids.has(ex.answer.ball)) errors.push(`${where}: bola ${ex.answer.ball} no está en el setup`);
  }
  if (ex.kind === 'simShot') {
    if (ex.attempts < 1) errors.push(`${where}: attempts debe ser ≥ 1`);
    if (ex.goal.pocketBall && !ids.has(ex.goal.pocketBall.ball)) errors.push(`${where}: bola ${ex.goal.pocketBall.ball} no está en el setup`);
    for (const id of ex.variation?.balls ?? []) if (!ids.has(id)) errors.push(`${where}: variación sobre bola ${id} inexistente`);
  }
  if (ex.kind === 'realTable' && ex.shots < 1) errors.push(`${where}: shots debe ser ≥ 1`);
  if ((ex.kind === 'realTable' || ex.kind === 'estimate') && ex.target && !ids.has(ex.target.ball)) {
    errors.push(`${where}: bola ${ex.target.ball} no está en el setup`);
  }
}

export function validateCurriculum(lessons: Lesson[]): string[] {
  const errors: string[] = [];
  const ids = lessons.map((l) => l.id);
  for (const id of new Set(ids)) if (ids.indexOf(id) !== ids.lastIndexOf(id)) errors.push(`id de lección duplicado: ${id}`);
  const byId = new Map(lessons.map((l) => [l.id, l]));

  for (const l of lessons) {
    for (const pre of l.prerequisites) if (!byId.has(pre)) errors.push(`${l.id}: prerrequisito inexistente ${pre}`);
    if (l.exercises.length === 0) errors.push(`${l.id}: sin ejercicios`);
    const { simulator, realTable } = l.passCriteria;
    if (simulator < 0 || simulator > 1 || realTable < 0 || realTable > 1) errors.push(`${l.id}: passCriteria fuera de [0,1]`);
    l.theory.forEach((t, i) => {
      if (t.kind === 'diagram') checkLayout(`${l.id} teoría ${i}`, t.setup, false, errors);
    });
    l.exercises.forEach((ex, i) => checkExercise(`${l.id} ejercicio ${i}`, ex, errors));
  }

  const state = new Map<string, 'visiting' | 'done'>();
  const visit = (id: string): boolean => {
    if (state.get(id) === 'done') return false;
    if (state.get(id) === 'visiting') return true;
    state.set(id, 'visiting');
    const cyclic = (byId.get(id)?.prerequisites ?? []).some(visit);
    state.set(id, 'done');
    return cyclic;
  };
  for (const l of lessons) {
    if (visit(l.id)) {
      errors.push(`hay un ciclo de prerrequisitos que pasa por ${l.id}`);
      break;
    }
  }
  return errors;
}
```

- [ ] **Step 7: Implementar `src/content/lessons/ghost-ball.ts`**

Contenido basado en `docs/research/aiming-systems-curriculum.md` §1 (escrito en voseo).

```ts
import { DEFAULT_PASS, type Lesson } from '../types';

const SHOT = { balls: [{ id: 'cue', at: { x: 4, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }] };
const TARGET = { ball: '1', pocket: 'c84' as const };

export const ghostBall: Lesson = {
  id: 'ghost-ball',
  level: 'principiante',
  module: 'Tiros directos',
  title: 'Bola fantasma (Ghost ball)',
  summary: 'El sistema base: imaginar dónde tiene que estar la blanca en el momento del contacto.',
  prerequisites: [],
  theory: [
    {
      kind: 'text',
      md: `La **bola fantasma** (*ghost ball*) es la definición geométrica de un tiro: para que la bola objetivo (BO) salga hacia la tronera, en el instante del choque el centro de la blanca tiene que estar **sobre la línea tronera → BO, a una bola de distancia** detrás de la BO.

Esa posición imaginaria es la bola fantasma. Tu trabajo es mandar el **centro de la blanca al centro de la bola fantasma**, no a la BO.`,
    },
    {
      kind: 'diagram',
      setup: SHOT,
      target: TARGET,
      showGhost: true,
      caption: 'La bola fantasma (círculo punteado) queda a una bola de distancia de la 1, sobre la línea a la tronera.',
    },
    {
      kind: 'text',
      md: `**Cómo aplicarlo en la mesa:**

1. Parate detrás de la BO mirando a la tronera y visualizá la línea tronera → centro de la BO.
2. Prolongá esa línea hacia atrás una bola (centro a centro = 2¼"). Ahí está la bola fantasma.
3. Volvé detrás de la blanca y apuntá su centro al centro de la fantasma.
4. Bajá al tiro sin perder esa línea.`,
    },
    {
      kind: 'table',
      caption: 'Desplazamiento de la línea de apuntado respecto del centro de la BO: d = 2R·sen(corte)',
      headers: ['Ángulo de corte', 'Desplazamiento'],
      rows: [['15°', '14,8 mm'], ['30°', '28,6 mm (media bola)'], ['45°', '40,4 mm'], ['60°', '49,5 mm']],
    },
    {
      kind: 'text',
      md: `**Errores comunes:**

- Ubicar la fantasma "pegada" al costado de la BO en vez de sobre la línea a la tronera (típico en cortes finos).
- Apuntar el centro de la blanca al punto de contacto: el punto de contacto está a 1R de la BO, la fantasma a 2R. El tiro queda grueso.
- No tener en cuenta el *throw*: a velocidad lenta y con la blanca deslizando, la BO se "tira" un poco hacia el lado del corte. Usá velocidad media.
- En cortes muy finos (más de 60°) cuesta visualizarla; ahí conviene complementar con fracciones de bola.`,
    },
  ],
  reliability: { stars: 3, note: 'Es la definición geométrica del tiro (sin contar throw ni desvío por efecto).' },
  sources: [
    { label: 'Dr. Dave — FAQ de apuntado', url: 'https://drdavepoolinfo.com/faq/aiming/' },
    { label: 'Dr. Dave — Punto de contacto', url: 'https://drdavepoolinfo.com/FAQ/aiming/contact-point/' },
    { label: 'Robert Byrne, Byrne’s New Standard Book of Pool and Billiards' },
  ],
  exercises: [
    {
      kind: 'estimate',
      prompt: '¿Dónde tiene que estar la blanca en el instante del contacto para meter la 1 en la tronera marcada?',
      setup: SHOT,
      target: TARGET,
      answer: {
        kind: 'choice',
        options: [
          'Tocando el punto de la bola 1 que mira a la tronera',
          'A una bola de distancia de la 1, sobre la línea tronera → bola 1',
          'Pegada al costado de la 1 que mira a la blanca',
        ],
        correct: 1,
      },
      explanation: 'La bola fantasma está sobre la prolongación de la línea tronera → BO, a 2R del centro de la BO.',
    },
    {
      kind: 'estimate',
      prompt: 'Estimá el ángulo de corte de este tiro (en grados).',
      setup: { balls: [{ id: 'cue', at: { x: 3, y: 1.2 } }, { id: '1', at: { x: 6, y: 2 } }] },
      answer: { kind: 'cutAngle', ball: '1', pocket: 'c84', toleranceDeg: 5 },
      explanation: 'El corte es el ángulo entre la línea blanca → fantasma y la línea BO → tronera.',
    },
    {
      kind: 'simShot',
      prompt: 'Meté la 1 en la tronera de la esquina. Tenés la bola fantasma dibujada: apuntá el centro de la blanca a su centro.',
      setup: SHOT,
      variation: { balls: ['cue'], jitter: 0.3 },
      goal: { pocketBall: { ball: '1', pocket: 'c84' } },
      attempts: 5,
      showGuides: { aimLine: true, ghostBall: true, contactPreview: true },
    },
    {
      kind: 'simShot',
      prompt: 'Ahora sin ayudas: imaginá vos la bola fantasma.',
      setup: SHOT,
      variation: { balls: ['cue', '1'], jitter: 0.4 },
      goal: { pocketBall: { ball: '1', pocket: 'c84' } },
      attempts: 8,
      showGuides: { aimLine: true, ghostBall: false, contactPreview: false },
    },
    {
      kind: 'realTable',
      setup: { balls: [{ id: 'cue', at: { x: 4, y: 2 } }, { id: '1', at: { x: 6, y: 2 } }] },
      target: TARGET,
      shots: 10,
      diagnose: true,
      instructions: '"Fantasma con bola real": poné una segunda bola en el lugar de la fantasma, mirala desde atrás de la blanca, sacala y tirá. Objetivo: 8 de 10.',
    },
    {
      kind: 'realTable',
      setup: { balls: [{ id: 'cue', at: { x: 3, y: 0.5 } }, { id: '1', at: { x: 6, y: 2 } }] },
      target: TARGET,
      shots: 10,
      diagnose: true,
      instructions: 'Mismo tiro con la blanca más lejos y de costado. Visualizá la fantasma sin la bola de ayuda. Objetivo: 7 de 10.',
    },
  ],
  passCriteria: DEFAULT_PASS,
};
```

- [ ] **Step 8: Implementar `src/content/curriculum.ts`**

```ts
import type { Lesson, Level } from './types';
import { ghostBall } from './lessons/ghost-ball';

export const LESSONS: Lesson[] = [ghostBall];

export const lessonById = (id: string): Lesson | undefined => LESSONS.find((l) => l.id === id);

export const isUnlocked = (lesson: Lesson, passed: Set<string>, ignoreLocks: boolean): boolean =>
  ignoreLocks || lesson.prerequisites.every((p) => passed.has(p));

export const lessonNeeds = (lesson: Lesson) => ({
  sim: lesson.exercises.some((e) => e.kind !== 'realTable'),
  table: lesson.exercises.some((e) => e.kind === 'realTable'),
});

const LEVEL_ORDER: Level[] = ['principiante', 'intermedio', 'avanzado'];

/** Orden topológico estable: por nivel y, dentro del nivel, respetando prerrequisitos. */
export function orderedLessons(lessons: Lesson[] = LESSONS): Lesson[] {
  const sorted = [...lessons].sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const seen = new Set<string>();
  const out: Lesson[] = [];
  const add = (l: Lesson) => {
    if (seen.has(l.id)) return;
    seen.add(l.id);
    for (const pre of l.prerequisites) {
      const dep = byId.get(pre);
      if (dep) add(dep);
    }
    out.push(l);
  };
  sorted.forEach(add);
  return out;
}
```

- [ ] **Step 9: Correr tests**

Run: `npx vitest run src/content`
Expected: PASS. Si falla el test `fina/gruesa`, revisar el signo de la comparación en `diagnoseCut` (corte real mayor que el necesario = fina), no el test.

- [ ] **Step 10: Commit**

```bash
git add src/content
git commit -m "feat(content): lesson model, goals with cut diagnosis, validation and Ghost ball lesson" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Render en Canvas (`render/`)

Mesa vista desde arriba con paño realista oscuro. En vertical, la cabecera (x = 0) queda abajo y la imagen es la de horizontal rotada 90° (no espejada).

**Files:**
- Create: `src/render/viewport.ts`, `src/render/guides.ts`, `src/render/draw.ts`, `src/render/TableCanvas.tsx`, `src/render/usePlayback.ts`, `src/render/JumpPanel.tsx`
- Modify: `src/test/setup.ts` (stubs de canvas y scroll)
- Test: `src/render/viewport.test.ts`, `src/render/guides.test.ts`

**Interfaces:**
- Consumes: `Ball`, `Timeline`, `stateAt`, `PhysicsParams` (physics), `TableGeometry`, `SIGHT_OFFSET`, `PocketId`, `ghostBallPosition` (table).
- Produces:
  - `viewport.ts`: `RAIL_WIDTH`, `Viewport`, `fitViewport(w, h, length, width)`, `worldToScreen(vp, p)`, `screenToWorld(vp, sx, sy)`.
  - `guides.ts`: `GuideDraw`, `firstContact(cue, azimuth, balls, length, width, R)`, `ghostGuides(ob, pocketPoint, cue | undefined, R)`.
  - `draw.ts`: `ballStyle(id)`, `drawScene(ctx, g, vp, balls, guides, R)`.
  - `TableCanvas` (props `{ geometry, balls, R, guides?, onPointer?, label? }`), `usePlayback(timeline, p) → { balls, playing, skip }`, `JumpPanel` (props `{ timeline, ballId, p }`).

- [ ] **Step 1: Agregar stubs a `src/test/setup.ts`** (jsdom no implementa canvas ni scroll; sin los stubs ensucia la salida con errores)

Agregar al final del archivo:
```ts
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
window.scrollTo = (() => {}) as typeof window.scrollTo;
```

- [ ] **Step 2: Escribir los tests que fallan**

`src/render/viewport.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { fitViewport, screenToWorld, worldToScreen } from './viewport';

describe('viewport', () => {
  test.each([[400, 800], [800, 400]])('round trip at %sx%s', (w, h) => {
    const vp = fitViewport(w, h, 2.54, 1.27);
    const [sx, sy] = worldToScreen(vp, [1.1, 0.4, 0]);
    const p = screenToWorld(vp, sx, sy);
    expect(p[0]).toBeCloseTo(1.1, 9);
    expect(p[1]).toBeCloseTo(0.4, 9);
  });
  test('portrait when taller than wide; head rail at the bottom', () => {
    const vp = fitViewport(400, 800, 2.54, 1.27);
    expect(vp.portrait).toBe(true);
    expect(worldToScreen(vp, [0, 0.6, 0])[1]).toBeGreaterThan(worldToScreen(vp, [2.5, 0.6, 0])[1]);
  });
  test('the whole table fits inside the canvas', () => {
    const vp = fitViewport(400, 800, 2.54, 1.27);
    for (const p of [[0, 0, 0], [2.54, 1.27, 0], [0, 1.27, 0], [2.54, 0, 0]] as const) {
      const [x, y] = worldToScreen(vp, p);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(400);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(800);
    }
  });
  test('portrait is a rotation, not a mirror: c84 ends up top-left', () => {
    const vp = fitViewport(400, 800, 2.54, 1.27);
    const [x, y] = worldToScreen(vp, [2.54, 1.27, 0]);
    expect(x).toBeLessThan(200);
    expect(y).toBeLessThan(400);
  });
});
```

`src/render/guides.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { firstContact, ghostGuides } from './guides';
import type { Ball } from '../physics/types';

const R = 0.028575;
const B = (id: string, x: number, y: number): Ball => ({ id, r: [x, y, R], v: [0, 0, 0], w: [0, 0, 0], motion: 'stationary' });

describe('firstContact', () => {
  test('stops where the cue ball first touches an object ball', () => {
    const cue = B('cue', 0.5, 0.5);
    const c = firstContact(cue, 0, [cue, B('1', 1.0, 0.5)], 2.54, 1.27, R);
    expect(c.ballId).toBe('1');
    expect(c.point[0]).toBeCloseTo(1.0 - 2 * R, 9);
  });
  test('stops at the rail when nothing is in the way', () => {
    const cue = B('cue', 0.5, 0.5);
    const c = firstContact(cue, 0, [cue], 2.54, 1.27, R);
    expect(c.ballId).toBeUndefined();
    expect(c.point[0]).toBeCloseTo(2.54 - R, 9);
  });
});

describe('ghostGuides', () => {
  test('ghost circle, object-to-pocket line and cue-to-ghost line', () => {
    const g = ghostGuides([1, 0.5, R], [2, 0.5, 0], [0.2, 0.5, R], R);
    expect(g.map((x) => x.kind).sort()).toEqual(['ghost', 'line', 'line']);
  });
});
```

- [ ] **Step 3: Correr y verificar que fallan**

Run: `npx vitest run src/render`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 4: Implementar `src/render/viewport.ts`**

```ts
import type { Vec3 } from '../physics/vec';

/** Madera de banda que se dibuja por fuera de la nariz (m). */
export const RAIL_WIDTH = 0.12;

export interface Viewport { scale: number; ox: number; oy: number; portrait: boolean; length: number; width: number }

/** Ajusta mesa + bandas al contenedor. En vertical la cabecera (x = 0) queda abajo. */
export function fitViewport(cssW: number, cssH: number, length: number, width: number): Viewport {
  const portrait = cssH > cssW;
  const spanX = (portrait ? width : length) + 2 * RAIL_WIDTH;
  const spanY = (portrait ? length : width) + 2 * RAIL_WIDTH;
  const scale = Math.max(1e-6, Math.min(cssW / spanX, cssH / spanY));
  const ox = (cssW - spanX * scale) / 2 + RAIL_WIDTH * scale;
  const oy = (cssH - spanY * scale) / 2 + RAIL_WIDTH * scale;
  return { scale, ox, oy, portrait, length, width };
}

export function worldToScreen(vp: Viewport, p: Vec3): [number, number] {
  if (vp.portrait) return [vp.ox + (vp.width - p[1]) * vp.scale, vp.oy + (vp.length - p[0]) * vp.scale];
  return [vp.ox + p[0] * vp.scale, vp.oy + (vp.width - p[1]) * vp.scale];
}

export function screenToWorld(vp: Viewport, sx: number, sy: number): Vec3 {
  if (vp.portrait) return [vp.length - (sy - vp.oy) / vp.scale, vp.width - (sx - vp.ox) / vp.scale, 0];
  return [(sx - vp.ox) / vp.scale, vp.width - (sy - vp.oy) / vp.scale, 0];
}
```

- [ ] **Step 5: Implementar `src/render/guides.ts`**

```ts
import type { Ball } from '../physics/types';
import { add, scale, sub, type Vec3 } from '../physics/vec';
import { ghostBallPosition } from '../table/aim';

export type GuideDraw =
  | { kind: 'line'; from: Vec3; to: Vec3; dashed?: boolean; color?: string }
  | { kind: 'ghost'; at: Vec3; color?: string }
  | { kind: 'cue'; at: Vec3; azimuth: number };

/** Recorre en línea recta desde la blanca: primer contacto con una bola (a 2R) o con la banda. */
export function firstContact(
  cue: Ball, azimuth: number, balls: Ball[], length: number, width: number, R: number,
): { point: Vec3; ballId?: string } {
  const d: Vec3 = [Math.cos(azimuth), Math.sin(azimuth), 0];
  let best = Infinity;
  let ballId: string | undefined;
  for (const b of balls) {
    if (b.id === cue.id || b.motion === 'pocketed') continue;
    const m = sub(cue.r, b.r);
    const bq = m[0] * d[0] + m[1] * d[1];
    const c = m[0] * m[0] + m[1] * m[1] - 4 * R * R;
    const disc = bq * bq - c;
    if (disc < 0) continue;
    const s = -bq - Math.sqrt(disc);
    if (s > 1e-9 && s < best) {
      best = s;
      ballId = b.id;
    }
  }
  const toRail = (pos: number, dir: number, lo: number, hi: number) =>
    dir > 1e-12 ? (hi - pos) / dir : dir < -1e-12 ? (lo - pos) / dir : Infinity;
  const sRail = Math.min(toRail(cue.r[0], d[0], R, length - R), toRail(cue.r[1], d[1], R, width - R));
  if (sRail < best) {
    best = sRail;
    ballId = undefined;
  }
  return { point: add(cue.r, scale(d, Math.max(0, best))), ballId };
}

export function ghostGuides(ob: Vec3, pocketPoint: Vec3, cue: Vec3 | undefined, R: number): GuideDraw[] {
  const gb = ghostBallPosition(ob, pocketPoint, R);
  const out: GuideDraw[] = [{ kind: 'line', from: ob, to: pocketPoint, dashed: true }];
  if (cue) out.push({ kind: 'line', from: cue, to: gb, dashed: true, color: 'rgba(255,209,102,0.9)' });
  out.push({ kind: 'ghost', at: gb });
  return out;
}
```

- [ ] **Step 6: Implementar `src/render/draw.ts`**

```ts
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
    const [tx, ty] = at(R * 1.6);
    const [jx, jy] = at(R * 1.6 + 0.015);
    const [bx, by] = at(R * 1.6 + 1.3);
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
```

- [ ] **Step 7: Implementar `src/render/TableCanvas.tsx`**

```tsx
import { type PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { Ball } from '../physics/types';
import type { Vec3 } from '../physics/vec';
import type { TableGeometry } from '../table/geometry';
import { drawScene } from './draw';
import type { GuideDraw } from './guides';
import { fitViewport, screenToWorld } from './viewport';

export interface TableCanvasProps {
  geometry: TableGeometry;
  balls: Ball[];
  R: number;
  guides?: GuideDraw[];
  onPointer?: (p: Vec3, phase: 'down' | 'move' | 'up') => void;
  label?: string;
}

const NO_GUIDES: GuideDraw[] = [];

export function TableCanvas({ geometry, balls, R, guides = NO_GUIDES, onPointer, label = 'Mesa de pool' }: TableCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const vp = useMemo(() => fitViewport(size.w, size.h, geometry.length, geometry.width), [size, geometry]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.w === 0 || size.h === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    drawScene(ctx, geometry, vp, balls, guides, R);
  }, [size, vp, geometry, balls, guides, R]);

  const toWorld = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return screenToWorld(vp, e.clientX - rect.left, e.clientY - rect.top);
  };

  return (
    <div ref={wrapRef} className="table-wrap">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        style={{ width: '100%', height: '100%', touchAction: onPointer ? 'none' : 'auto', display: 'block' }}
        onPointerDown={onPointer && ((e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          onPointer(toWorld(e), 'down');
        })}
        onPointerMove={onPointer && ((e) => { if (dragging.current) onPointer(toWorld(e), 'move'); })}
        onPointerUp={onPointer && ((e) => {
          dragging.current = false;
          onPointer(toWorld(e), 'up');
        })}
      />
    </div>
  );
}
```

- [ ] **Step 8: Implementar `src/render/usePlayback.ts` y `src/render/JumpPanel.tsx`**

`src/render/usePlayback.ts`:
```ts
import { useEffect, useRef, useState } from 'react';
import type { Ball, Timeline } from '../physics/types';
import type { PhysicsParams } from '../physics/params';
import { stateAt } from '../physics/simulate';

/** Reproduce un Timeline en tiempo real. Para repetirlo, pasar un objeto Timeline nuevo. */
export function usePlayback(timeline: Timeline | null, p: PhysicsParams) {
  const [balls, setBalls] = useState<Ball[] | null>(null);
  const [playing, setPlaying] = useState(false);
  const skipRef = useRef(false);

  useEffect(() => {
    if (!timeline) {
      setBalls(null);
      setPlaying(false);
      return;
    }
    skipRef.current = false;
    setPlaying(true);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = skipRef.current ? timeline.duration : (now - start) / 1000;
      setBalls(stateAt(timeline, t, p));
      if (t >= timeline.duration) setPlaying(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [timeline, p]);

  return { balls, playing, skip: () => { skipRef.current = true; } };
}
```

`src/render/JumpPanel.tsx`:
```tsx
import { useEffect, useMemo, useRef } from 'react';
import type { Timeline } from '../physics/types';
import type { PhysicsParams } from '../physics/params';
import { stateAt } from '../physics/simulate';
import type { Vec3 } from '../physics/vec';

/** Vista lateral (distancia recorrida vs. altura) de una bola; solo se muestra si la bola vuela. */
export function JumpPanel({ timeline, ballId, p }: { timeline: Timeline; ballId: string; p: PhysicsParams }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const samples = useMemo(() => {
    const pts: { d: number; h: number }[] = [];
    const end = Math.min(timeline.duration, 3);
    let prev: Vec3 | null = null;
    let dist = 0;
    for (let i = 0; i <= 160; i++) {
      const b = stateAt(timeline, (end * i) / 160, p).find((x) => x.id === ballId);
      if (!b) break;
      if (prev) dist += Math.hypot(b.r[0] - prev[0], b.r[1] - prev[1]);
      prev = b.r;
      pts.push({ d: dist, h: Math.max(0, b.r[2] - p.R) });
    }
    return pts;
  }, [timeline, ballId, p]);
  const maxH = Math.max(0, ...samples.map((s) => s.h));
  const maxD = Math.max(0.01, ...samples.map((s) => s.d));

  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx || maxH < 0.001) return;
    const W = 320;
    const H = 90;
    const ground = H - 8;
    const sy = (ground - 8) / Math.max(maxH, 0.06);
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(0, ground);
    ctx.lineTo(W, ground);
    ctx.stroke();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.beginPath();
    samples.forEach((s, i) => {
      const x = (s.d / maxD) * (W - 8) + 4;
      const y = ground - s.h * sy;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [samples, maxH, maxD]);

  if (maxH < 0.001) return null;
  return (
    <figure className="jump-panel">
      <canvas ref={ref} width={320} height={90} aria-label="Vista lateral del salto" />
      <figcaption>Vista lateral: la blanca subió hasta {Math.round(maxH * 1000)} mm.</figcaption>
    </figure>
  );
}
```

- [ ] **Step 9: Correr tests y tipos**

Run: `npx vitest run src/render && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/render src/test/setup.ts
git commit -m "feat(render): canvas table, balls, guides, playback and jump side view" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Controles de apuntado (`input/`)

**Files:**
- Create: `src/input/aim.ts`, `src/input/SpinPad.tsx`, `src/input/AimControls.tsx`
- Test: `src/input/aim.test.ts`, `src/input/AimControls.test.tsx`

**Interfaces:**
- Consumes: `Shot` (physics), `DEFAULT_PARAMS.miscueLimit`.
- Produces:
  - `aim.ts`: `AimState { azimuth (rad); elevation (grados); a; b; power (0..1) }`, `DEFAULT_AIM`, `MAX_SPIN`, `MAX_ELEVATION_DEG`, `clampSpin`, `spinFromPoint`, `powerToCueSpeed`, `powerLabel`, `aimToShot(aim, cueBallId?)`.
  - Componentes: `SpinPad` (props `{ a, b, onChange(a, b), size?, disabled? }`) y `AimControls` (props `{ aim, onChange(aim), disabled? }`).

- [ ] **Step 1: Escribir los tests que fallan**

`src/input/aim.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { aimToShot, clampSpin, DEFAULT_AIM, MAX_SPIN, powerLabel, powerToCueSpeed, spinFromPoint } from './aim';

describe('aim helpers', () => {
  test('clampSpin keeps the point inside the allowed radius', () => {
    const [a, b] = clampSpin(1, 1);
    expect(Math.hypot(a, b)).toBeCloseTo(MAX_SPIN, 12);
    expect(clampSpin(0.1, 0.2)).toEqual([0.1, 0.2]);
  });
  test('spinFromPoint maps pad pixels to normalized offsets (up = +b)', () => {
    expect(spinFromPoint(50, 50, 100)).toEqual([0, 0]);
    const [a, b] = spinFromPoint(50, 30, 100);
    expect(a).toBeCloseTo(0, 12);
    expect(b).toBeCloseTo(0.4, 12);
  });
  test('power mapping', () => {
    expect(powerToCueSpeed(0)).toBeCloseTo(0.2, 12);
    expect(powerToCueSpeed(1)).toBeCloseTo(6, 12);
    expect(powerLabel(0.1)).toBe('suave');
    expect(powerLabel(0.5)).toBe('media');
    expect(powerLabel(0.9)).toBe('fuerte');
  });
  test('aimToShot converts elevation degrees to radians', () => {
    const s = aimToShot({ ...DEFAULT_AIM, elevation: 30 });
    expect(s.elevation).toBeCloseTo(Math.PI / 6, 12);
    expect(s.cueBallId).toBe('cue');
  });
});
```

`src/input/AimControls.test.tsx`:
```tsx
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AimControls } from './AimControls';
import { DEFAULT_AIM } from './aim';

describe('AimControls', () => {
  test('fine tune rotates by 0.1°', () => {
    const onChange = vi.fn();
    render(<AimControls aim={DEFAULT_AIM} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('fine-right'));
    expect(onChange.mock.calls[0][0].azimuth).toBeCloseTo((0.1 * Math.PI) / 180, 12);
  });
  test('power slider updates power', () => {
    const onChange = vi.fn();
    render(<AimControls aim={DEFAULT_AIM} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Fuerza'), { target: { value: '0.8' } });
    expect(onChange.mock.calls[0][0].power).toBe(0.8);
  });
  test('warns about miscue outside the red circle', () => {
    render(<AimControls aim={{ ...DEFAULT_AIM, a: 0.55 }} onChange={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/miscue/);
  });
});
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `npx vitest run src/input`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 3: Implementar `src/input/aim.ts`**

```ts
import type { Shot } from '../physics/types';

export interface AimState {
  azimuth: number; // rad
  elevation: number; // grados (UI)
  a: number; // efecto lateral normalizado (+ derecha)
  b: number; // efecto vertical normalizado (+ arriba)
  power: number; // 0..1
}

export const DEFAULT_AIM: AimState = { azimuth: 0, elevation: 0, a: 0, b: 0, power: 0.5 };
/** Se deja pasar el límite de miscue (0,5) para que el jugador aprenda qué pasa. */
export const MAX_SPIN = 0.6;
export const MAX_ELEVATION_DEG = 60;

export function clampSpin(a: number, b: number, limit = MAX_SPIN): [number, number] {
  const r = Math.hypot(a, b);
  return r <= limit ? [a, b] : [(a * limit) / r, (b * limit) / r];
}

/** Punto tocado en la bola-diagrama (px desde su esquina superior izquierda) → (a, b). */
export function spinFromPoint(x: number, y: number, size: number): [number, number] {
  const r = size / 2;
  return clampSpin((x - r) / r, (r - y) / r);
}

export const powerToCueSpeed = (power: number): number => 0.2 + 5.8 * power * power;

export const powerLabel = (power: number): string => (power < 0.34 ? 'suave' : power < 0.67 ? 'media' : 'fuerte');

export const aimToShot = (aim: AimState, cueBallId = 'cue'): Shot => ({
  cueBallId,
  azimuth: aim.azimuth,
  elevation: (aim.elevation * Math.PI) / 180,
  a: aim.a,
  b: aim.b,
  cueSpeed: powerToCueSpeed(aim.power),
});
```

- [ ] **Step 4: Implementar `src/input/SpinPad.tsx`**

```tsx
import type { PointerEvent } from 'react';
import { spinFromPoint } from './aim';

function spinText(a: number, b: number): string {
  if (Math.hypot(a, b) < 0.05) return 'centro';
  const parts: string[] = [];
  if (Math.abs(b) >= 0.05) parts.push(`${b > 0 ? 'arriba' : 'abajo'} ${Math.abs(b).toFixed(2)}`);
  if (Math.abs(a) >= 0.05) parts.push(`${a > 0 ? 'derecha' : 'izquierda'} ${Math.abs(a).toFixed(2)}`);
  return parts.join(', ');
}

export function SpinPad({ a, b, onChange, size = 112, disabled }: {
  a: number; b: number; onChange: (a: number, b: number) => void; size?: number; disabled?: boolean;
}) {
  const r = size / 2;
  const handle = (e: PointerEvent<SVGSVGElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const [na, nb] = spinFromPoint(((e.clientX - rect.left) * size) / rect.width, ((e.clientY - rect.top) * size) / rect.height, size);
    onChange(na, nb);
  };
  return (
    <svg
      className="spin-pad"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="group"
      aria-label={`Punto de contacto en la blanca: ${spinText(a, b)}`}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); handle(e); }}
      onPointerMove={(e) => { if (e.buttons) handle(e); }}
    >
      <circle cx={r} cy={r} r={r - 1} fill="#f5f3ea" />
      <circle cx={r} cy={r} r={(r - 1) * 0.5} fill="none" stroke="#d62828" strokeDasharray="4 3" />
      <line x1={r} y1={4} x2={r} y2={size - 4} stroke="rgba(0,0,0,0.15)" />
      <line x1={4} y1={r} x2={size - 4} y2={r} stroke="rgba(0,0,0,0.15)" />
      <circle cx={r + a * (r - 1)} cy={r - b * (r - 1)} r={7} fill="#2c6fb5" />
    </svg>
  );
}
```

- [ ] **Step 5: Implementar `src/input/AimControls.tsx`**

```tsx
import { DEFAULT_PARAMS } from '../physics/params';
import { type AimState, MAX_ELEVATION_DEG, powerLabel } from './aim';
import { SpinPad } from './SpinPad';

export function AimControls({ aim, onChange, disabled }: { aim: AimState; onChange: (a: AimState) => void; disabled?: boolean }) {
  const rotate = (deg: number) => onChange({ ...aim, azimuth: aim.azimuth + (deg * Math.PI) / 180 });
  const miscue = Math.hypot(aim.a, aim.b) > DEFAULT_PARAMS.miscueLimit;
  return (
    <div className="aim-controls">
      <div className="fine-tune" role="group" aria-label="Ajuste fino de dirección">
        <button type="button" onClick={() => rotate(-1)} disabled={disabled}>−1°</button>
        <button type="button" onClick={() => rotate(-0.1)} disabled={disabled} data-testid="fine-left">−0,1°</button>
        <button type="button" onClick={() => rotate(0.1)} disabled={disabled} data-testid="fine-right">+0,1°</button>
        <button type="button" onClick={() => rotate(1)} disabled={disabled}>+1°</button>
      </div>
      <div className="aim-row">
        <SpinPad a={aim.a} b={aim.b} onChange={(a, b) => onChange({ ...aim, a, b })} disabled={disabled} />
        <div className="sliders">
          <label>
            <span>Fuerza: <strong>{powerLabel(aim.power)}</strong></span>
            <input type="range" min={0} max={1} step={0.01} value={aim.power} aria-label="Fuerza" disabled={disabled}
              onChange={(e) => onChange({ ...aim, power: Number(e.target.value) })} />
          </label>
          <label>
            <span>Elevación del taco: {Math.round(aim.elevation)}°</span>
            <input type="range" min={0} max={MAX_ELEVATION_DEG} step={1} value={aim.elevation} aria-label="Elevación del taco" disabled={disabled}
              onChange={(e) => onChange({ ...aim, elevation: Number(e.target.value) })} />
          </label>
          <button type="button" className="link" onClick={() => onChange({ ...aim, a: 0, b: 0 })} disabled={disabled}>Centrar efecto</button>
        </div>
      </div>
      {miscue && <p className="warn" role="alert">Fuera del círculo rojo: riesgo de pifia (miscue).</p>}
    </div>
  );
}
```

- [ ] **Step 6: Correr tests**

Run: `npx vitest run src/input`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/input
git commit -m "feat(input): aim state, spin pad and aim controls" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Componentes de ejercicio (`exercises/`)

**Files:**
- Create: `src/exercises/env.ts`, `src/exercises/RichText.tsx`, `src/exercises/EstimateExercise.tsx`, `src/exercises/SimShotExercise.tsx`, `src/exercises/RealTableExercise.tsx`
- Test: `src/exercises/RichText.test.tsx`, `src/exercises/EstimateExercise.test.tsx`, `src/exercises/SimShotExercise.test.tsx`, `src/exercises/RealTableExercise.test.tsx`

**Interfaces:**
- Consumes: `content` (tipos, `layoutToBalls`, `applyVariation`, `evaluateGoal`), `render` (`TableCanvas`, `usePlayback`, `JumpPanel`, `firstContact`, `ghostGuides`, `GuideDraw`), `input` (`AimControls`, `aimToShot`, `DEFAULT_AIM`), `sim/simulateAsync`, `table/aim` (`azimuthTo`, `cutAngleDeg`), `TableShot` (progress).
- Produces:
  - `ExerciseEnv { geometry; params; tableSpec }`, `RichText({ md })`.
  - `EstimateExercise({ exercise, env, onAnswer(success, detail), onContinue })`.
  - `SimShotExercise({ exercise, env, onAttempt(success, detail), onContinue })`.
  - `RealTableExercise({ exercise, env, onFinish(shots), onContinue })`. `onFinish` se llama una sola vez: al completar, al tocar "Terminar ahora" o al desmontar con ≥ 1 tiro.
  - test ids: `choice-{i}`, `angle-slider`, `estimate-submit`, `estimate-feedback`, `shoot`, `skip-playback`, `shot-result`, `next-shot`, `replay`, `real-hit`, `real-miss`, `miss-fina`, `miss-gruesa`, `miss-skip`, `real-finish`, `real-counter`, `real-summary`, `exercise-continue`.

- [ ] **Step 1: Crear `src/exercises/env.ts`**

```ts
import type { PhysicsParams } from '../physics/params';
import type { TableGeometry, TableSpec } from '../table/geometry';

export interface ExerciseEnv { geometry: TableGeometry; params: PhysicsParams; tableSpec: TableSpec }
```

- [ ] **Step 2: Escribir los tests que fallan**

Helper compartido. Cada test lo define arriba de todo:
```tsx
import { DEFAULT_PARAMS } from '../physics/params';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';
const env = { geometry: buildTable(DEFAULT_TABLE_SPEC, DEFAULT_PARAMS.R), params: DEFAULT_PARAMS, tableSpec: DEFAULT_TABLE_SPEC };
```

`src/exercises/RichText.test.tsx`:
```tsx
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RichText } from './RichText';

test('paragraphs, bold, bullet and numbered lists', () => {
  const { container } = render(<RichText md={'Hola **mundo**.\n\n- uno\n- dos\n\n1. a\n2. b'} />);
  expect(screen.getByText('mundo').tagName).toBe('STRONG');
  expect(container.querySelectorAll('ul li')).toHaveLength(2);
  expect(container.querySelectorAll('ol li')).toHaveLength(2);
});
```

`src/exercises/EstimateExercise.test.tsx`:
```tsx
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EstimateExercise } from './EstimateExercise';
import { DEFAULT_PARAMS } from '../physics/params';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';
import { layoutToBalls } from '../content/layout';
import { cutAngleDeg } from '../table/aim';
import type { Exercise } from '../content/types';

const env = { geometry: buildTable(DEFAULT_TABLE_SPEC, DEFAULT_PARAMS.R), params: DEFAULT_PARAMS, tableSpec: DEFAULT_TABLE_SPEC };
const setup = { balls: [{ id: 'cue', at: { x: 3, y: 1.2 } }, { id: '1', at: { x: 6, y: 2 } }] };

describe('EstimateExercise', () => {
  test('choice: correct answer', () => {
    const onAnswer = vi.fn();
    const ex: Extract<Exercise, { kind: 'estimate' }> = { kind: 'estimate', prompt: 'p', setup, explanation: 'porque sí', answer: { kind: 'choice', options: ['a', 'b'], correct: 1 } };
    render(<EstimateExercise exercise={ex} env={env} onAnswer={onAnswer} onContinue={() => {}} />);
    expect(screen.getByTestId('estimate-submit')).toBeDisabled();
    fireEvent.click(screen.getByTestId('choice-1'));
    fireEvent.click(screen.getByTestId('estimate-submit'));
    expect(onAnswer).toHaveBeenCalledWith(true, expect.any(String));
    expect(screen.getByTestId('estimate-feedback')).toHaveTextContent('porque sí');
  });
  test('cut angle within tolerance succeeds', () => {
    const onAnswer = vi.fn();
    const ex: Extract<Exercise, { kind: 'estimate' }> = { kind: 'estimate', prompt: 'p', setup, explanation: 'e', answer: { kind: 'cutAngle', ball: '1', pocket: 'c84', toleranceDeg: 5 } };
    const [cue, ob] = layoutToBalls(setup, env.geometry, DEFAULT_PARAMS.R);
    const correct = Math.round(cutAngleDeg(cue.r, ob.r, env.geometry.pocketCenters.c84, DEFAULT_PARAMS.R));
    render(<EstimateExercise exercise={ex} env={env} onAnswer={onAnswer} onContinue={() => {}} />);
    fireEvent.change(screen.getByTestId('angle-slider'), { target: { value: String(correct) } });
    fireEvent.click(screen.getByTestId('estimate-submit'));
    expect(onAnswer).toHaveBeenCalledWith(true, expect.stringContaining(`${correct}°`));
  });
});
```

`src/exercises/SimShotExercise.test.tsx`:
```tsx
import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SimShotExercise } from './SimShotExercise';
import { DEFAULT_PARAMS } from '../physics/params';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';
import type { Exercise } from '../content/types';

const env = { geometry: buildTable(DEFAULT_TABLE_SPEC, DEFAULT_PARAMS.R), params: DEFAULT_PARAMS, tableSpec: DEFAULT_TABLE_SPEC };

test('one shot: simulate, skip playback, show result, then continue', async () => {
  const onAttempt = vi.fn();
  const onContinue = vi.fn();
  const ex: Extract<Exercise, { kind: 'simShot' }> = {
    kind: 'simShot', prompt: 'Meté la 1', attempts: 1,
    setup: { balls: [{ id: 'cue', at: { x: 4, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }] },
    goal: { pocketBall: { ball: '1', pocket: 'c84' } },
    showGuides: { aimLine: true, ghostBall: true, contactPreview: true },
  };
  render(<SimShotExercise exercise={ex} env={env} onAttempt={onAttempt} onContinue={onContinue} />);
  fireEvent.click(screen.getByTestId('shoot'));
  fireEvent.click(await screen.findByTestId('skip-playback'));
  expect(await screen.findByTestId('shot-result')).toBeInTheDocument();
  expect(onAttempt).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByTestId('exercise-continue'));
  expect(onContinue).toHaveBeenCalled();
});
```

`src/exercises/RealTableExercise.test.tsx`:
```tsx
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RealTableExercise } from './RealTableExercise';
import { DEFAULT_PARAMS } from '../physics/params';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';
import type { Exercise } from '../content/types';

const env = { geometry: buildTable(DEFAULT_TABLE_SPEC, DEFAULT_PARAMS.R), params: DEFAULT_PARAMS, tableSpec: DEFAULT_TABLE_SPEC };
const ex = (shots: number): Extract<Exercise, { kind: 'realTable' }> => ({
  kind: 'realTable', shots, diagnose: true, instructions: 'Tirá',
  setup: { balls: [{ id: 'cue', at: { x: 4, y: 2 } }, { id: '1', at: { x: 6, y: 2 } }] },
  target: { ball: '1', pocket: 'c84' },
});

describe('RealTableExercise', () => {
  test('completes after N shots', () => {
    const onFinish = vi.fn();
    render(<RealTableExercise exercise={ex(3)} env={env} onFinish={onFinish} onContinue={() => {}} />);
    fireEvent.click(screen.getByTestId('real-hit'));
    fireEvent.click(screen.getByTestId('real-miss'));
    fireEvent.click(screen.getByTestId('miss-fina'));
    fireEvent.click(screen.getByTestId('real-hit'));
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0][0]).toEqual([{ success: true }, { success: false, miss: 'fina' }, { success: true }]);
    expect(screen.getByTestId('real-summary')).toHaveTextContent('2 de 3');
  });
  test('finish early', () => {
    const onFinish = vi.fn();
    render(<RealTableExercise exercise={ex(10)} env={env} onFinish={onFinish} onContinue={() => {}} />);
    fireEvent.click(screen.getByTestId('real-hit'));
    fireEvent.click(screen.getByTestId('real-finish'));
    expect(onFinish).toHaveBeenCalledWith([{ success: true }]);
  });
  test('partial session: leaving keeps the logged shots', () => {
    const onFinish = vi.fn();
    const { unmount } = render(<RealTableExercise exercise={ex(10)} env={env} onFinish={onFinish} onContinue={() => {}} />);
    fireEvent.click(screen.getByTestId('real-hit'));
    fireEvent.click(screen.getByTestId('real-hit'));
    unmount();
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0][0]).toHaveLength(2);
  });
  test('leaving without shots saves nothing', () => {
    const onFinish = vi.fn();
    const { unmount } = render(<RealTableExercise exercise={ex(10)} env={env} onFinish={onFinish} onContinue={() => {}} />);
    unmount();
    expect(onFinish).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Correr y verificar que fallan**

Run: `npx vitest run src/exercises`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 4: Implementar `src/exercises/RichText.tsx`**

```tsx
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
```

- [ ] **Step 5: Implementar `src/exercises/EstimateExercise.tsx`**

```tsx
import { useMemo, useState } from 'react';
import type { Exercise } from '../content/types';
import { layoutToBalls } from '../content/layout';
import { TableCanvas } from '../render/TableCanvas';
import { ghostGuides, type GuideDraw } from '../render/guides';
import { cutAngleDeg } from '../table/aim';
import type { ExerciseEnv } from './env';

type EstimateEx = Extract<Exercise, { kind: 'estimate' }>;

export function EstimateExercise({ exercise, env, onAnswer, onContinue }: {
  exercise: EstimateEx; env: ExerciseEnv; onAnswer: (success: boolean, detail: string) => void; onContinue: () => void;
}) {
  const R = env.params.R;
  const answer = exercise.answer;
  const balls = useMemo(() => layoutToBalls(exercise.setup, env.geometry, R), [exercise.setup, env.geometry, R]);
  const [choice, setChoice] = useState<number | null>(null);
  const [angle, setAngle] = useState(30);
  const [result, setResult] = useState<{ success: boolean; text: string } | null>(null);

  const reveal = exercise.target ?? (answer.kind === 'cutAngle' ? { ball: answer.ball, pocket: answer.pocket } : undefined);
  const correctAngle = useMemo(() => {
    if (answer.kind !== 'cutAngle') return null;
    const cue = balls.find((b) => b.id === 'cue')!;
    const ob = balls.find((b) => b.id === answer.ball)!;
    return cutAngleDeg(cue.r, ob.r, env.geometry.pocketCenters[answer.pocket], R);
  }, [answer, balls, env.geometry, R]);

  const guides = useMemo<GuideDraw[]>(() => {
    if (!result || !reveal) return [];
    const ob = balls.find((b) => b.id === reveal.ball);
    const cue = balls.find((b) => b.id === 'cue');
    return ob ? ghostGuides(ob.r, env.geometry.pocketCenters[reveal.pocket], cue?.r, R) : [];
  }, [result, reveal, balls, env.geometry, R]);

  const submit = () => {
    let success: boolean;
    let text: string;
    if (answer.kind === 'choice') {
      success = choice === answer.correct;
      text = success ? '¡Correcto!' : `No. La respuesta correcta es: «${answer.options[answer.correct]}».`;
    } else {
      const c = Math.round(correctAngle ?? 0);
      success = Math.abs(angle - (correctAngle ?? 0)) <= answer.toleranceDeg;
      text = `${success ? '¡Bien!' : 'Te alejaste.'} El corte es de ${c}° (dijiste ${angle}°).`;
    }
    setResult({ success, text });
    onAnswer(success, text);
  };

  return (
    <section className="exercise">
      <p className="prompt">{exercise.prompt}</p>
      <TableCanvas geometry={env.geometry} balls={balls} R={R} guides={guides} />
      {!result && answer.kind === 'choice' && (
        <div className="choices">
          {answer.options.map((o, i) => (
            <button key={i} type="button" className={choice === i ? 'choice selected' : 'choice'} aria-pressed={choice === i}
              data-testid={`choice-${i}`} onClick={() => setChoice(i)}>{o}</button>
          ))}
        </div>
      )}
      {!result && answer.kind === 'cutAngle' && (
        <label className="angle-input">
          <span>Ángulo estimado: <strong>{angle}°</strong></span>
          <input type="range" min={0} max={90} step={1} value={angle} data-testid="angle-slider" aria-label="Ángulo de corte estimado"
            onChange={(e) => setAngle(Number(e.target.value))} />
        </label>
      )}
      {!result && (
        <button type="button" className="primary big" disabled={answer.kind === 'choice' && choice === null}
          onClick={submit} data-testid="estimate-submit">Responder</button>
      )}
      {result && (
        <div className={result.success ? 'feedback ok' : 'feedback bad'} role="status" data-testid="estimate-feedback">
          <p>{result.text}</p>
          <p>{exercise.explanation}</p>
          <button type="button" className="primary" onClick={onContinue} data-testid="exercise-continue">Continuar</button>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 6: Implementar `src/exercises/SimShotExercise.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react';
import type { Exercise } from '../content/types';
import { applyVariation, layoutToBalls } from '../content/layout';
import { evaluateGoal, type GoalResult } from '../content/goals';
import type { Timeline } from '../physics/types';
import type { Vec3 } from '../physics/vec';
import { TableCanvas } from '../render/TableCanvas';
import { firstContact, ghostGuides, type GuideDraw } from '../render/guides';
import { usePlayback } from '../render/usePlayback';
import { JumpPanel } from '../render/JumpPanel';
import { AimControls } from '../input/AimControls';
import { type AimState, aimToShot, DEFAULT_AIM } from '../input/aim';
import { simulateAsync } from '../sim/client';
import { azimuthTo } from '../table/aim';
import type { ExerciseEnv } from './env';

type SimEx = Extract<Exercise, { kind: 'simShot' }>;

export function SimShotExercise({ exercise, env, onAttempt, onContinue }: {
  exercise: SimEx; env: ExerciseEnv; onAttempt: (success: boolean, detail: string) => void; onContinue: () => void;
}) {
  const R = env.params.R;
  const [round, setRound] = useState(0);
  const layout = useMemo(() => applyVariation(exercise.setup, exercise.variation, Math.random), [exercise, round]);
  const initial = useMemo(() => layoutToBalls(layout, env.geometry, R), [layout, env.geometry, R]);
  const cue = initial.find((b) => b.id === 'cue')!;
  const targetId = exercise.goal.pocketBall?.ball;
  const pocket = exercise.goal.pocketBall?.pocket;

  const [aim, setAim] = useState<AimState>(DEFAULT_AIM);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [result, setResult] = useState<GoalResult | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playback = usePlayback(timeline, env.params);

  useEffect(() => {
    const c = initial.find((b) => b.id === 'cue')!;
    const ob = initial.find((b) => b.id === targetId);
    setAim((a) => ({ ...a, azimuth: ob ? azimuthTo(c.r, ob.r) : 0 }));
  }, [initial, targetId]);

  const aiming = !timeline && !busy;
  const guides = useMemo<GuideDraw[]>(() => {
    if (!aiming) return [];
    const out: GuideDraw[] = [];
    const ob = initial.find((b) => b.id === targetId);
    if (exercise.showGuides.ghostBall && ob && pocket) out.push(...ghostGuides(ob.r, env.geometry.pocketCenters[pocket], undefined, R));
    const contact = firstContact(cue, aim.azimuth, initial, env.geometry.length, env.geometry.width, R);
    if (exercise.showGuides.aimLine) out.push({ kind: 'line', from: cue.r, to: contact.point, color: 'rgba(255,209,102,0.85)' });
    if (exercise.showGuides.contactPreview && contact.ballId) out.push({ kind: 'ghost', at: contact.point, color: 'rgba(255,209,102,0.9)' });
    out.push({ kind: 'cue', at: cue.r, azimuth: aim.azimuth });
    return out;
  }, [aiming, initial, targetId, pocket, exercise.showGuides, cue, aim.azimuth, env.geometry, R]);

  const shoot = async () => {
    setBusy(true);
    setError(null);
    try {
      const tl = await simulateAsync(initial, aimToShot(aim), env.tableSpec, env.params);
      const res = evaluateGoal(exercise.goal, tl, env.geometry, env.params);
      setResult(res);
      setResults((r) => [...r, res.success]);
      setTimeline(tl);
      onAttempt(res.success, res.messages.join(' '));
    } catch (err) {
      console.error('[SimShotExercise]', err);
      setError('No se pudo simular el tiro. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const nextShot = () => {
    setTimeline(null);
    setResult(null);
    setRound((r) => r + 1);
  };
  const onPointer = (p: Vec3) => setAim((a) => ({ ...a, azimuth: azimuthTo(cue.r, p) }));
  const hits = results.filter(Boolean).length;
  const shotNumber = Math.min(results.length + (timeline ? 0 : 1), exercise.attempts);

  return (
    <section className="exercise">
      <p className="prompt">{exercise.prompt}</p>
      <p className="counter">Tiro {shotNumber} de {exercise.attempts} · {hits} adentro</p>
      <TableCanvas geometry={env.geometry} balls={playback.balls ?? initial} R={R} guides={guides}
        onPointer={aiming ? onPointer : undefined} label="Mesa: arrastrá para apuntar" />
      {timeline && <JumpPanel timeline={timeline} ballId="cue" p={env.params} />}
      {error && <p className="warn" role="alert">{error}</p>}
      {aiming && (
        <>
          <AimControls aim={aim} onChange={setAim} />
          <button type="button" className="primary big" onClick={shoot} data-testid="shoot">Tirar</button>
        </>
      )}
      {busy && <p className="muted">Calculando el tiro…</p>}
      {timeline && playback.playing && (
        <button type="button" onClick={playback.skip} data-testid="skip-playback">Saltar animación</button>
      )}
      {timeline && !playback.playing && result && (
        <div className={result.success ? 'feedback ok' : 'feedback bad'} role="status" data-testid="shot-result">
          {result.messages.map((m, i) => <p key={i}>{m}</p>)}
          <div className="row">
            <button type="button" onClick={() => setTimeline({ ...timeline })} data-testid="replay">Repetir</button>
            {results.length < exercise.attempts ? (
              <button type="button" className="primary" onClick={nextShot} data-testid="next-shot">Otro tiro</button>
            ) : (
              <button type="button" className="primary" onClick={onContinue} data-testid="exercise-continue">
                Continuar ({hits}/{exercise.attempts})
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 7: Implementar `src/exercises/RealTableExercise.tsx`**

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Exercise } from '../content/types';
import { layoutToBalls } from '../content/layout';
import type { TableShot } from '../progress/types';
import { TableCanvas } from '../render/TableCanvas';
import type { GuideDraw } from '../render/guides';
import type { ExerciseEnv } from './env';

type RealEx = Extract<Exercise, { kind: 'realTable' }>;

function tendency(shots: TableShot[]): string | null {
  const fina = shots.filter((s) => s.miss === 'fina').length;
  const gruesa = shots.filter((s) => s.miss === 'gruesa').length;
  if (fina + gruesa < 2) return null;
  if (fina > gruesa * 1.5) return `Erraste ${fina} finas y ${gruesa} gruesas: tendés a cortar de más.`;
  if (gruesa > fina * 1.5) return `Erraste ${gruesa} gruesas y ${fina} finas: tendés a cortar de menos.`;
  return `Errores repartidos (${fina} finas, ${gruesa} gruesas): revisá la alineación y el golpe.`;
}

export function RealTableExercise({ exercise, env, onFinish, onContinue }: {
  exercise: RealEx; env: ExerciseEnv; onFinish: (shots: TableShot[]) => void; onContinue: () => void;
}) {
  const R = env.params.R;
  const balls = useMemo(() => layoutToBalls(exercise.setup, env.geometry, R), [exercise.setup, env.geometry, R]);
  const guides = useMemo<GuideDraw[]>(() => {
    const t = exercise.target;
    const ob = t && balls.find((b) => b.id === t.ball);
    return t && ob ? [{ kind: 'line', from: ob.r, to: env.geometry.pocketCenters[t.pocket], dashed: true }] : [];
  }, [exercise.target, balls, env.geometry]);

  const [shots, setShots] = useState<TableShot[]>([]);
  const [askMiss, setAskMiss] = useState(false);
  const [finished, setFinished] = useState(false);
  const shotsRef = useRef(shots);
  shotsRef.current = shots;
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => () => {
    if (!finishedRef.current && shotsRef.current.length > 0) {
      finishedRef.current = true;
      onFinishRef.current(shotsRef.current);
    }
  }, []);

  const finish = (list: TableShot[]) => {
    finishedRef.current = true;
    setFinished(true);
    onFinish(list);
  };
  const record = (s: TableShot) => {
    const list = [...shots, s];
    setShots(list);
    setAskMiss(false);
    if (list.length >= exercise.shots) finish(list);
  };
  const hits = shots.filter((s) => s.success).length;
  const advice = tendency(shots);

  return (
    <section className="exercise">
      <p className="prompt">{exercise.instructions}</p>
      <TableCanvas geometry={env.geometry} balls={balls} R={R} guides={guides} label="Ubicación de las bolas en la mesa real" />
      <ul className="positions">
        {exercise.setup.balls.map((b) => (
          <li key={b.id}>{b.id === 'cue' ? 'Blanca' : `Bola ${b.id}`}: diamante ({b.at.x}, {b.at.y})</li>
        ))}
      </ul>
      {!finished ? (
        <>
          <p className="counter" data-testid="real-counter">Tiro {shots.length + 1} de {exercise.shots} · {hits} adentro</p>
          {!askMiss ? (
            <div className="big-buttons">
              <button type="button" className="hit" aria-label="La metí" data-testid="real-hit" onClick={() => record({ success: true })}>✓</button>
              <button type="button" className="miss" aria-label="La erré" data-testid="real-miss"
                onClick={() => (exercise.diagnose ? setAskMiss(true) : record({ success: false }))}>✗</button>
            </div>
          ) : (
            <div className="miss-detail">
              <p>¿Cómo pasó la bola?</p>
              <button type="button" data-testid="miss-fina" onClick={() => record({ success: false, miss: 'fina' })}>Fina</button>
              <button type="button" data-testid="miss-gruesa" onClick={() => record({ success: false, miss: 'gruesa' })}>Gruesa</button>
              <button type="button" data-testid="miss-skip" onClick={() => record({ success: false })}>No sé</button>
            </div>
          )}
          {shots.length > 0 && (
            <button type="button" className="link" data-testid="real-finish" onClick={() => finish(shots)}>Terminar ahora</button>
          )}
        </>
      ) : (
        <div className="feedback ok" role="status" data-testid="real-summary">
          <p>Sesión guardada: {hits} de {shots.length} ({Math.round((100 * hits) / Math.max(1, shots.length))}%).</p>
          {advice && <p>{advice}</p>}
          <button type="button" className="primary" onClick={onContinue} data-testid="exercise-continue">Continuar</button>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 8: Correr tests y tipos**

Run: `npx vitest run src/exercises && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/exercises
git commit -m "feat(exercises): estimate, simulator shot and real-table exercise components" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: App, pantallas y navegación (`app/`)

**Files:**
- Create: `src/app/config.ts`, `src/app/routes.ts`, `src/app/ProgressContext.tsx`, `src/app/components/TopBar.tsx`, `src/app/components/TheoryBlockView.tsx`, `src/app/format.ts`, `src/app/screens/HomeScreen.tsx`, `src/app/screens/LessonMapScreen.tsx`, `src/app/screens/LessonScreen.tsx`, `src/app/screens/ExerciseScreen.tsx`, `src/app/screens/StatsScreen.tsx`, `src/app/screens/SettingsScreen.tsx`, `src/app/App.tsx`, `src/styles.css`
- Modify: `src/main.tsx`
- Test: `src/app/routes.test.ts`, `src/app/App.test.tsx`

**Interfaces:**
- Consumes: todos los módulos anteriores.
- Produces:
  - `Route`, `parseHash`, `href`, `useRoute`, `navigate`.
  - `ProgressProvider({ storeFactory? })`, `useProgress()`.
  - `App({ storeFactory? })`.
  - test ids: `continue-lesson`, `go-map`, `lesson-card-{id}`, `start-exercises`, `lesson-progress`, `table-size`.

- [ ] **Step 1: Escribir los tests que fallan**

`src/app/routes.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { href, parseHash } from './routes';

describe('routes', () => {
  test.each([
    ['', { name: 'home' }],
    ['#/', { name: 'home' }],
    ['#/map', { name: 'map' }],
    ['#/stats', { name: 'stats' }],
    ['#/settings', { name: 'settings' }],
    ['#/lesson/ghost-ball', { name: 'lesson', id: 'ghost-ball' }],
    ['#/lesson/ghost-ball/ex/3', { name: 'exercise', id: 'ghost-ball', index: 3 }],
    ['#/lesson/ghost-ball/ex/x', { name: 'lesson', id: 'ghost-ball' }],
    ['#/nope', { name: 'home' }],
  ])('parse %s', (hash, route) => {
    expect(parseHash(hash)).toEqual(route);
  });
  test('href round trip', () => {
    const r = { name: 'exercise' as const, id: 'ghost-ball', index: 2 };
    expect(parseHash(href(r))).toEqual(r);
  });
});
```

`src/app/App.test.tsx`:
```tsx
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';
import { createMemoryStore } from '../progress/store';

const factory = async () => createMemoryStore();

describe('App', () => {
  test('home: continue card, and a warning when progress is not persistent', async () => {
    window.location.hash = '#/';
    render(<App storeFactory={factory} />);
    expect(await screen.findByTestId('continue-lesson')).toHaveAttribute('href', '#/lesson/ghost-ball');
    expect(screen.getByRole('alert')).toHaveTextContent(/no se está guardando/);
  });
  test('lesson screen shows the title and the start button', async () => {
    window.location.hash = '#/lesson/ghost-ball';
    render(<App storeFactory={factory} />);
    expect(await screen.findByTestId('start-exercises')).toHaveAttribute('href', '#/lesson/ghost-ball/ex/0');
    expect(screen.getByRole('heading', { level: 1, name: /Bola fantasma/ })).toBeInTheDocument();
  });
  test('unknown lesson shows a not-found message', async () => {
    window.location.hash = '#/lesson/nope';
    render(<App storeFactory={factory} />);
    expect(await screen.findByText(/No encontramos/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `npx vitest run src/app`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 3: Implementar `src/app/config.ts`, `src/app/format.ts` y `src/app/routes.ts`**

`src/app/config.ts`:
```ts
import type { Settings } from '../progress/types';
import type { TableSpec } from '../table/geometry';

const INCH = 0.0254;

export const settingsToTableSpec = (s: Settings): TableSpec => ({
  size: s.tableSize,
  cornerMouth: s.cornerMouthIn * INCH,
  sideMouth: s.sideMouthIn * INCH,
});
```

`src/app/format.ts`:
```ts
import type { Level } from '../content/types';

export const pct = (rate: number | null): string => (rate === null ? '—' : `${Math.round(rate * 100)}%`);

export const LEVEL_LABEL: Record<Level, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};
export const LEVELS: Level[] = ['principiante', 'intermedio', 'avanzado'];
```

`src/app/routes.ts`:
```ts
import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'map' }
  | { name: 'lesson'; id: string }
  | { name: 'exercise'; id: string; index: number }
  | { name: 'stats' }
  | { name: 'settings' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'map') return { name: 'map' };
  if (parts[0] === 'stats') return { name: 'stats' };
  if (parts[0] === 'settings') return { name: 'settings' };
  if (parts[0] === 'lesson' && parts[1]) {
    if (parts[2] === 'ex' && /^\d+$/.test(parts[3] ?? '')) return { name: 'exercise', id: parts[1], index: Number(parts[3]) };
    return { name: 'lesson', id: parts[1] };
  }
  return { name: 'home' };
}

export function href(r: Route): string {
  switch (r.name) {
    case 'home': return '#/';
    case 'map': return '#/map';
    case 'stats': return '#/stats';
    case 'settings': return '#/settings';
    case 'lesson': return `#/lesson/${encodeURIComponent(r.id)}`;
    case 'exercise': return `#/lesson/${encodeURIComponent(r.id)}/ex/${r.index}`;
  }
}

export function navigate(r: Route): void {
  window.location.hash = href(r);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
```

- [ ] **Step 4: Implementar `src/app/ProgressContext.tsx`**

```tsx
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PARAMS, type PhysicsParams } from '../physics/params';
import { buildTable, type TableGeometry, type TableSpec } from '../table/geometry';
import { LESSONS, lessonNeeds } from '../content/curriculum';
import type { Lesson } from '../content/types';
import { newId, openProgressStore } from '../progress/store';
import { lessonStats, type LessonStats } from '../progress/stats';
import { type Attempt, DEFAULT_SETTINGS, type ProgressStore, SCHEMA_VERSION, type Settings, type TableSession } from '../progress/types';
import { settingsToTableSpec } from './config';

export interface ProgressValue {
  ready: boolean;
  persistent: boolean;
  settings: Settings;
  attempts: Attempt[];
  sessions: TableSession[];
  tableSpec: TableSpec;
  params: PhysicsParams;
  geometry: TableGeometry;
  passed: Set<string>;
  stats: (lesson: Lesson) => LessonStats;
  recordAttempt: (a: Omit<Attempt, 'id' | 'schemaVersion' | 'createdAt'>) => Promise<void>;
  recordSession: (s: Omit<TableSession, 'id' | 'schemaVersion'>) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
}

const Ctx = createContext<ProgressValue | null>(null);

export function ProgressProvider({ children, storeFactory = openProgressStore }: {
  children: ReactNode; storeFactory?: () => Promise<ProgressStore>;
}) {
  const [store, setStore] = useState<ProgressStore | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [sessions, setSessions] = useState<TableSession[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await storeFactory();
      const [st, at, se] = await Promise.all([s.getSettings(), s.listAttempts(), s.listTableSessions()]);
      if (!alive) return;
      setSettings(st);
      setAttempts(at);
      setSessions(se);
      setStore(s);
    })().catch((err) => console.error('[progress] no se pudo abrir el almacenamiento', err));
    return () => { alive = false; };
  }, [storeFactory]);

  const tableSpec = useMemo(() => settingsToTableSpec(settings), [settings]);
  const params = useMemo<PhysicsParams>(() => ({ ...DEFAULT_PARAMS, ...settings.physicsOverrides }), [settings]);
  const geometry = useMemo(() => buildTable(tableSpec, params.R), [tableSpec, params.R]);
  const stats = useCallback(
    (l: Lesson) => lessonStats(l.id, l.passCriteria, attempts, sessions, lessonNeeds(l)),
    [attempts, sessions],
  );
  const passed = useMemo(() => new Set(LESSONS.filter((l) => stats(l).passed).map((l) => l.id)), [stats]);

  const recordAttempt = useCallback<ProgressValue['recordAttempt']>(async (a) => {
    const full: Attempt = { ...a, id: newId(), schemaVersion: SCHEMA_VERSION, createdAt: Date.now() };
    setAttempts((x) => [...x, full]);
    try { await store?.addAttempt(full); } catch (err) { console.error('[progress] addAttempt', err); }
  }, [store]);

  const recordSession = useCallback<ProgressValue['recordSession']>(async (s) => {
    const full: TableSession = { ...s, id: newId(), schemaVersion: SCHEMA_VERSION };
    setSessions((x) => [...x, full]);
    try { await store?.addTableSession(full); } catch (err) { console.error('[progress] addTableSession', err); }
  }, [store]);

  const updateSettings = useCallback<ProgressValue['updateSettings']>(async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try { await store?.saveSettings(next); } catch (err) { console.error('[progress] saveSettings', err); }
  }, [settings, store]);

  const value: ProgressValue = {
    ready: store !== null, persistent: store?.persistent ?? true, settings, attempts, sessions,
    tableSpec, params, geometry, passed, stats, recordAttempt, recordSession, updateSettings,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProgress debe usarse dentro de ProgressProvider');
  return v;
}
```

- [ ] **Step 5: Implementar los componentes compartidos**

`src/app/components/TopBar.tsx`:
```tsx
import { href, type Route } from '../routes';

export function TopBar({ title, back }: { title: string; back?: Route }) {
  return (
    <header className="topbar">
      {back && <a className="back" href={href(back)} aria-label="Volver">←</a>}
      <h1>{title}</h1>
    </header>
  );
}
```

`src/app/components/TheoryBlockView.tsx`:
```tsx
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
```

- [ ] **Step 6: Implementar las pantallas**

`src/app/screens/HomeScreen.tsx`:
```tsx
import { isUnlocked, orderedLessons } from '../../content/curriculum';
import { computeStreak } from '../../progress/stats';
import { useProgress } from '../ProgressContext';
import { href } from '../routes';

export function HomeScreen() {
  const { ready, persistent, attempts, sessions, passed, settings } = useProgress();
  const streak = computeStreak([...attempts.map((a) => a.createdAt), ...sessions.map((s) => s.endedAt)], Date.now());
  const lessons = orderedLessons();
  const next = lessons.find((l) => !passed.has(l.id) && isUnlocked(l, passed, settings.ignoreLocks)) ?? lessons[0];
  return (
    <div className="screen home">
      <header className="hero">
        <h1>AimPool</h1>
        <p>Academia de apuntado para pool: sistemas, simulador y rutinas para la mesa real.</p>
      </header>
      {!ready ? (
        <p className="muted">Cargando…</p>
      ) : (
        <>
          {!persistent && (
            <p className="warn" role="alert">Tu progreso no se está guardando en este navegador (¿modo privado?). Se pierde al cerrar.</p>
          )}
          <p className="streak">Racha: <strong>{streak}</strong> {streak === 1 ? 'día' : 'días'} seguidos</p>
          {next && (
            <a className="card primary-card" href={href({ name: 'lesson', id: next.id })} data-testid="continue-lesson">
              <span className="eyebrow">Seguí con</span>
              <strong>{next.title}</strong>
              <span>{next.summary}</span>
            </a>
          )}
          <nav className="menu" aria-label="Secciones">
            <a href={href({ name: 'map' })} data-testid="go-map">Mapa de lecciones</a>
            <a href={href({ name: 'stats' })}>Estadísticas</a>
            <a href={href({ name: 'settings' })}>Ajustes</a>
          </nav>
        </>
      )}
    </div>
  );
}
```

`src/app/screens/LessonMapScreen.tsx`:
```tsx
import { isUnlocked, orderedLessons } from '../../content/curriculum';
import { LEVEL_LABEL, LEVELS, pct } from '../format';
import { useProgress } from '../ProgressContext';
import { href } from '../routes';
import { TopBar } from '../components/TopBar';

export function LessonMapScreen() {
  const { passed, settings, stats } = useProgress();
  const lessons = orderedLessons();
  return (
    <div className="screen">
      <TopBar title="Mapa de lecciones" back={{ name: 'home' }} />
      {LEVELS.map((level) => {
        const ls = lessons.filter((l) => l.level === level);
        if (ls.length === 0) return null;
        return (
          <section key={level}>
            <h2 className="level">{LEVEL_LABEL[level]}</h2>
            <ol className="path">
              {ls.map((l) => {
                const unlocked = isUnlocked(l, passed, settings.ignoreLocks);
                const s = stats(l);
                const status = s.passed ? 'Aprobada' : !unlocked ? 'Bloqueada' : s.simAttempts || s.tableShots ? 'En progreso' : 'Nueva';
                const body = (
                  <>
                    <span className="status">{l.module} · {status}</span>
                    <strong>{l.title}</strong>
                    <span className="status">Simulador {pct(s.simRate)} · Mesa {pct(s.tableRate)}</span>
                  </>
                );
                return (
                  <li key={l.id} className={`path-item${s.passed ? ' passed' : ''}${unlocked ? '' : ' locked'}`}>
                    {unlocked
                      ? <a href={href({ name: 'lesson', id: l.id })} data-testid={`lesson-card-${l.id}`}>{body}</a>
                      : <div aria-disabled="true">{body}</div>}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
```

`src/app/screens/LessonScreen.tsx`:
```tsx
import { motion } from 'motion/react';
import { isUnlocked, lessonById } from '../../content/curriculum';
import { LEVEL_LABEL, pct } from '../format';
import { useProgress } from '../ProgressContext';
import { href } from '../routes';
import { TopBar } from '../components/TopBar';
import { TheoryBlockView } from '../components/TheoryBlockView';

export function NotFound() {
  return (
    <div className="screen">
      <TopBar title="No encontrado" back={{ name: 'map' }} />
      <p>No encontramos esa lección. <a href={href({ name: 'map' })}>Volver al mapa</a>.</p>
    </div>
  );
}

export function LessonScreen({ id }: { id: string }) {
  const { geometry, params, stats, passed, settings } = useProgress();
  const lesson = lessonById(id);
  if (!lesson) return <NotFound />;
  const unlocked = isUnlocked(lesson, passed, settings.ignoreLocks);
  const s = stats(lesson);
  const missing = lesson.prerequisites.filter((p) => !passed.has(p)).map((p) => lessonById(p)?.title ?? p);
  return (
    <div className="screen lesson">
      <TopBar title={lesson.title} back={{ name: 'map' }} />
      <p className="meta">
        {LEVEL_LABEL[lesson.level]} · {lesson.module}
        {lesson.reliability && ` · Confiabilidad ${'★'.repeat(lesson.reliability.stars)}${'☆'.repeat(3 - lesson.reliability.stars)}`}
      </p>
      {!unlocked && <p className="warn">Lección bloqueada: primero aprobá {missing.join(', ')}. Podés desbloquear todo en Ajustes.</p>}
      <div className="progress-box" data-testid="lesson-progress">
        Simulador: {pct(s.simRate)} ({s.simAttempts}) · Mesa real: {pct(s.tableRate)} ({s.tableShots} tiros){s.passed ? ' · Aprobada' : ''}
      </div>
      {lesson.theory.map((block, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.05 }}>
          <TheoryBlockView block={block} geometry={geometry} R={params.R} showGuides={settings.showGuidesByDefault} />
        </motion.div>
      ))}
      {lesson.reliability && <p className="muted">{lesson.reliability.note}</p>}
      <h2 className="level">Fuentes</h2>
      <ul className="sources">
        {lesson.sources.map((src) => (
          <li key={src.label}>{src.url ? <a href={src.url} target="_blank" rel="noreferrer">{src.label}</a> : src.label}</li>
        ))}
      </ul>
      {unlocked && (
        <a className="button primary big" href={href({ name: 'exercise', id, index: 0 })} data-testid="start-exercises">Empezar ejercicios</a>
      )}
    </div>
  );
}
```

`src/app/screens/ExerciseScreen.tsx`:
```tsx
import { useRef } from 'react';
import { lessonById } from '../../content/curriculum';
import { EstimateExercise } from '../../exercises/EstimateExercise';
import { RealTableExercise } from '../../exercises/RealTableExercise';
import { SimShotExercise } from '../../exercises/SimShotExercise';
import { useProgress } from '../ProgressContext';
import { navigate } from '../routes';
import { TopBar } from '../components/TopBar';
import { NotFound } from './LessonScreen';

export function ExerciseScreen({ id, index }: { id: string; index: number }) {
  const { geometry, params, tableSpec, recordAttempt, recordSession } = useProgress();
  const startedAt = useRef(Date.now());
  const lesson = lessonById(id);
  const ex = lesson?.exercises[index];
  if (!lesson || !ex) return <NotFound />;
  const env = { geometry, params, tableSpec };
  const next = () =>
    navigate(index + 1 < lesson.exercises.length ? { name: 'exercise', id, index: index + 1 } : { name: 'lesson', id });

  return (
    <div className="screen exercise-screen">
      <TopBar title={`${lesson.title} · ${index + 1}/${lesson.exercises.length}`} back={{ name: 'lesson', id }} />
      {ex.kind === 'estimate' && (
        <EstimateExercise exercise={ex} env={env} onContinue={next}
          onAnswer={(success, detail) => recordAttempt({ lessonId: id, exerciseIndex: index, kind: 'estimate', success, detail })} />
      )}
      {ex.kind === 'simShot' && (
        <SimShotExercise exercise={ex} env={env} onContinue={next}
          onAttempt={(success, detail) => recordAttempt({ lessonId: id, exerciseIndex: index, kind: 'simShot', success, detail })} />
      )}
      {ex.kind === 'realTable' && (
        <RealTableExercise exercise={ex} env={env} onContinue={next}
          onFinish={(shots) => recordSession({ lessonId: id, exerciseIndex: index, shots, startedAt: startedAt.current, endedAt: Date.now() })} />
      )}
    </div>
  );
}
```

`src/app/screens/StatsScreen.tsx`:
```tsx
import { orderedLessons } from '../../content/curriculum';
import { computeStreak } from '../../progress/stats';
import type { TableSession } from '../../progress/types';
import { pct } from '../format';
import { useProgress } from '../ProgressContext';
import { TopBar } from '../components/TopBar';

function SessionBars({ sessions }: { sessions: TableSession[] }) {
  const W = 300;
  const H = 120;
  const bw = W / sessions.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" role="img" aria-label="Porcentaje de acierto de las últimas sesiones en la mesa real">
      <line x1={0} y1={H - H * 0.6} x2={W} y2={H - H * 0.6} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" />
      {sessions.map((s, i) => {
        const rate = s.shots.length ? s.shots.filter((x) => x.success).length / s.shots.length : 0;
        const h = Math.max(2, rate * H);
        return (
          <g key={s.id}>
            <rect x={i * bw + 4} y={H - h} width={bw - 8} height={h} rx={3} fill={rate >= 0.6 ? '#3ccf8e' : '#ffd166'} />
            <text x={i * bw + bw / 2} y={H + 14} textAnchor="middle" fontSize="10" fill="#9bb0a8">{Math.round(rate * 100)}%</text>
          </g>
        );
      })}
    </svg>
  );
}

export function StatsScreen() {
  const { attempts, sessions, stats } = useProgress();
  const streak = computeStreak([...attempts.map((a) => a.createdAt), ...sessions.map((s) => s.endedAt)], Date.now());
  const recent = [...sessions].sort((a, b) => a.endedAt - b.endedAt).slice(-10);
  return (
    <div className="screen">
      <TopBar title="Estadísticas" back={{ name: 'home' }} />
      <p>Racha actual: <strong>{streak}</strong> {streak === 1 ? 'día' : 'días'}</p>
      <table className="stats-table">
        <thead><tr><th>Lección</th><th>Simulador</th><th>Mesa real</th><th>Estado</th></tr></thead>
        <tbody>
          {orderedLessons().map((l) => {
            const s = stats(l);
            return (
              <tr key={l.id}>
                <td>{l.title}</td>
                <td>{pct(s.simRate)} <small>({s.simAttempts})</small></td>
                <td>{pct(s.tableRate)} <small>({s.tableShots})</small></td>
                <td>{s.passed ? 'Aprobada' : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <h2 className="level">Últimas sesiones en la mesa real</h2>
      {recent.length === 0 ? <p className="muted">Todavía no registraste sesiones. La línea punteada marca el 60 % para aprobar.</p> : <SessionBars sessions={recent} />}
    </div>
  );
}
```

`src/app/screens/SettingsScreen.tsx`:
```tsx
import type { ChangeEvent } from 'react';
import type { TableSize } from '../../table/geometry';
import { useProgress } from '../ProgressContext';
import { TopBar } from '../components/TopBar';

export function SettingsScreen() {
  const { settings, updateSettings, persistent } = useProgress();
  const num = (min: number, max: number, apply: (v: number) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (Number.isFinite(v) && v >= min && v <= max) apply(v);
  };
  return (
    <div className="screen">
      <TopBar title="Ajustes" back={{ name: 'home' }} />
      <label className="field">
        Tamaño de mesa
        <select value={settings.tableSize} data-testid="table-size" onChange={(e) => updateSettings({ tableSize: e.target.value as TableSize })}>
          <option value="9ft">9 pies (torneo)</option>
          <option value="8ft">8 pies</option>
          <option value="7ft">7 pies (bar)</option>
        </select>
      </label>
      <label className="field">
        Boca de tronera de esquina (pulgadas)
        <input type="number" min={4} max={5.5} step={0.125} defaultValue={settings.cornerMouthIn} onChange={num(4, 5.5, (v) => updateSettings({ cornerMouthIn: v }))} />
      </label>
      <label className="field">
        Boca de tronera del medio (pulgadas)
        <input type="number" min={4.5} max={6} step={0.125} defaultValue={settings.sideMouthIn} onChange={num(4.5, 6, (v) => updateSettings({ sideMouthIn: v }))} />
      </label>
      <label className="check">
        <input type="checkbox" checked={settings.ignoreLocks} onChange={(e) => updateSettings({ ignoreLocks: e.target.checked })} />
        Desbloquear todas las lecciones
      </label>
      <label className="check">
        <input type="checkbox" checked={settings.showGuidesByDefault} onChange={(e) => updateSettings({ showGuidesByDefault: e.target.checked })} />
        Mostrar guías (bola fantasma) en los diagramas de teoría
      </label>
      <p className="muted">{persistent ? 'Tu progreso se guarda en este dispositivo.' : 'Atención: el progreso no se está guardando en este navegador.'}</p>
    </div>
  );
}
```

- [ ] **Step 7: Implementar `src/app/App.tsx` y actualizar `src/main.tsx`**

`src/app/App.tsx`:
```tsx
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ProgressStore } from '../progress/types';
import { ProgressProvider } from './ProgressContext';
import { href, type Route, useRoute } from './routes';
import { HomeScreen } from './screens/HomeScreen';
import { LessonMapScreen } from './screens/LessonMapScreen';
import { LessonScreen } from './screens/LessonScreen';
import { ExerciseScreen } from './screens/ExerciseScreen';
import { StatsScreen } from './screens/StatsScreen';
import { SettingsScreen } from './screens/SettingsScreen';

function renderRoute(r: Route) {
  switch (r.name) {
    case 'home': return <HomeScreen />;
    case 'map': return <LessonMapScreen />;
    case 'lesson': return <LessonScreen id={r.id} />;
    case 'exercise': return <ExerciseScreen key={`${r.id}/${r.index}`} id={r.id} index={r.index} />;
    case 'stats': return <StatsScreen />;
    case 'settings': return <SettingsScreen />;
  }
}

function Shell() {
  const route = useRoute();
  const key = href(route);
  useEffect(() => { window.scrollTo(0, 0); }, [key]);
  return (
    <AnimatePresence mode="wait">
      <motion.main key={key} className="app-main" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
        {renderRoute(route)}
      </motion.main>
    </AnimatePresence>
  );
}

export function App({ storeFactory }: { storeFactory?: () => Promise<ProgressStore> }) {
  return (
    <ProgressProvider storeFactory={storeFactory}>
      <Shell />
    </ProgressProvider>
  );
}
```

Nota: `ProgressProvider` tiene un valor por defecto para `storeFactory`. Si se le pasa `undefined` explícito, se usa el default (así funciona la desestructuración en JS).

`src/main.tsx`:
```tsx
import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 8: Crear `src/styles.css`**

```css
:root {
  --bg: #0b0f0e;
  --surface: #141b19;
  --surface-2: #1c2523;
  --border: #2a3532;
  --text: #e9efe9;
  --muted: #9bb0a8;
  --accent: #ffd166;
  --ok: #3ccf8e;
  --bad: #ff6b6b;
  --radius: 14px;
  --gutter: 16px;
  color-scheme: dark;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.45;
}
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--bg); color: var(--text); }
body { min-height: 100dvh; -webkit-tap-highlight-color: transparent; overflow-x: hidden; }
a { color: var(--accent); }
.app-main { max-width: 560px; margin: 0 auto; padding: max(12px, env(safe-area-inset-top)) var(--gutter) calc(28px + env(safe-area-inset-bottom)); }
.screen { display: flex; flex-direction: column; gap: 14px; }
.topbar { display: flex; align-items: center; gap: 8px; }
.topbar h1 { font-size: 1.15rem; margin: 0; }
.topbar .back { text-decoration: none; font-size: 1.4rem; padding: 4px 10px 4px 0; }
.hero h1 { font-size: 2.2rem; margin: 8px 0 0; letter-spacing: -0.02em; }
.hero p { color: var(--muted); margin: 4px 0 0; }
.card { display: flex; flex-direction: column; gap: 4px; padding: 16px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border); color: var(--text); text-decoration: none; }
.primary-card { background: linear-gradient(135deg, #12755d, #0c4f40); border: none; }
.eyebrow { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); }
.menu { display: grid; gap: 8px; }
.menu a { padding: 14px 16px; background: var(--surface); border-radius: var(--radius); text-decoration: none; color: var(--text); border: 1px solid var(--border); }
.streak, .muted, .meta, .counter { color: var(--muted); margin: 0; }
.counter { font-variant-numeric: tabular-nums; }
.level { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin: 8px 0; }
.path { list-style: none; margin: 0; padding: 0 0 0 16px; border-left: 2px solid var(--border); display: grid; gap: 10px; }
.path-item > a, .path-item > div { display: flex; flex-direction: column; gap: 2px; padding: 14px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border); text-decoration: none; color: var(--text); }
.path-item.passed > a { border-color: var(--ok); }
.path-item.locked { opacity: 0.5; }
.status { font-size: 0.8rem; color: var(--muted); }
.table-wrap { width: 100%; aspect-ratio: 1 / 1.85; max-height: 62dvh; margin: 0 auto; }
@media (orientation: landscape) { .table-wrap { aspect-ratio: 1.85 / 1; max-height: 70dvh; } }
button, .button { font: inherit; border-radius: 12px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text); padding: 10px 14px; cursor: pointer; text-align: center; text-decoration: none; display: inline-block; touch-action: manipulation; }
button:disabled { opacity: 0.5; cursor: default; }
button:focus-visible, a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.primary { background: var(--accent); color: #1b1600; border-color: transparent; font-weight: 600; }
.big { padding: 14px 18px; font-size: 1.05rem; width: 100%; }
.link { background: none; border: none; color: var(--accent); padding: 6px 0; }
.choices { display: grid; gap: 8px; }
.choice { text-align: left; }
.choice.selected { border-color: var(--accent); background: #2a2614; }
.feedback { padding: 14px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border); }
.feedback.ok { border-color: var(--ok); }
.feedback.bad { border-color: var(--bad); }
.feedback p { margin: 0 0 8px; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.warn { color: #ffcf8a; background: #2b2110; padding: 10px 12px; border-radius: 10px; margin: 0; }
.aim-controls { display: grid; gap: 10px; }
.fine-tune { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.aim-row { display: flex; gap: 14px; align-items: center; }
.sliders { flex: 1; min-width: 0; display: grid; gap: 10px; }
.sliders label, .angle-input { display: grid; gap: 4px; font-size: 0.9rem; }
input[type='range'] { width: 100%; accent-color: var(--accent); }
.spin-pad { touch-action: none; flex: none; }
.big-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.big-buttons button { font-size: 2.4rem; padding: 22px 0; border-radius: 18px; }
.hit { background: #10392a; border-color: var(--ok); }
.miss { background: #3a1616; border-color: var(--bad); }
.miss-detail { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.miss-detail p { grid-column: 1 / -1; margin: 0; }
.positions { margin: 0; padding-left: 18px; color: var(--muted); font-size: 0.9rem; }
table.theory, .stats-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
th, td { text-align: left; padding: 6px 4px; border-bottom: 1px solid var(--border); }
figure { margin: 0; }
figcaption, caption { color: var(--muted); font-size: 0.85rem; padding: 6px 0; caption-side: bottom; text-align: left; }
.progress-box { background: var(--surface); border-radius: 12px; padding: 10px 12px; font-size: 0.9rem; }
.jump-panel canvas { width: 100%; height: 90px; background: var(--surface); border-radius: 10px; }
.field { display: grid; gap: 6px; }
.field select, .field input { font: inherit; padding: 10px; border-radius: 10px; background: var(--surface-2); color: var(--text); border: 1px solid var(--border); }
.check { display: flex; gap: 10px; align-items: center; }
.sources { padding-left: 18px; font-size: 0.9rem; margin: 0; }
.update-banner { position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(16px + env(safe-area-inset-bottom)); background: var(--surface-2); border: 1px solid var(--accent); padding: 10px 12px; border-radius: 12px; display: flex; gap: 10px; align-items: center; z-index: 10; max-width: calc(100% - 32px); }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
```

- [ ] **Step 9: Correr todos los tests, tipos y build**

Run: `npm test && npx tsc --noEmit && npx vite build`
Expected: PASS y build sin errores.

- [ ] **Step 10: Prueba manual en el navegador**

Run: `npm run dev`. Abrir la URL en modo de dispositivo móvil (DevTools) y recorrer:
- Inicio → Mapa → Bola fantasma → Empezar.
- Ejercicio 1 (opciones) → ejercicio 2 (ángulo).
- Ejercicio 3: arrastrar para apuntar, tirar y verificar que la animación y el resultado aparecen.
- Ejercicio 5: marcar ✓/✗.
- Volver a la lección y verificar que el porcentaje se actualizó.
- Recargar la página y verificar que el progreso sigue ahí.

- [ ] **Step 11: Commit**

```bash
git add src
git commit -m "feat(app): screens, hash routing, progress context and dark theme" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: PWA (manifest, íconos, offline, aviso de actualización) + E2E

**Files:**
- Modify: `vite.config.ts`, `index.html`, `tsconfig.json`, `src/app/App.tsx`
- Create: `public/icon.svg`, íconos generados en `public/`, `src/app/UpdateBanner.tsx`, `src/test/pwa-register-stub.ts`, `playwright.config.ts`, `e2e/ghost-ball.spec.ts`, `e2e/offline.spec.ts`

**Interfaces:**
- Consumes: la app completa (Task 16) y los test ids de los Tasks 15–16.
- Produces: build instalable con service worker (precache) y un banner de "Nueva versión disponible".

- [ ] **Step 1: Crear `public/icon.svg` y generar los íconos**

`public/icon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0b0f0e"/>
  <circle cx="256" cy="256" r="190" fill="#12755d"/>
  <circle cx="256" cy="256" r="120" fill="none" stroke="#e8dcc0" stroke-width="10" stroke-dasharray="18 14"/>
  <g stroke="#ffd166" stroke-width="12" stroke-linecap="round">
    <line x1="256" y1="96" x2="256" y2="176"/><line x1="256" y1="336" x2="256" y2="416"/>
    <line x1="96" y1="256" x2="176" y2="256"/><line x1="336" y1="256" x2="416" y2="256"/>
  </g>
  <circle cx="256" cy="256" r="46" fill="#f5f3ea"/>
</svg>
```

Run: `npx pwa-assets-generator --preset minimal-2023 public/icon.svg`
Expected: crea en `public/` los archivos `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png` y `favicon.ico`.

- [ ] **Step 2: Actualizar `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: 'AimPool — Academia de pool',
        short_name: 'AimPool',
        description: 'Aprendé a apuntar en pool: sistemas, simulador y rutinas para la mesa real.',
        lang: 'es',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0f0e',
        theme_color: '#0b0f0e',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'] },
    }),
  ],
  worker: { format: 'es' },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    alias: {
      'virtual:pwa-register/react': fileURLToPath(new URL('./src/test/pwa-register-stub.ts', import.meta.url)),
    },
  },
});
```

- [ ] **Step 3: Agregar los links a `index.html` y los tipos a `tsconfig.json`**

En el `<head>` de `index.html`, después de `theme-color`:
```html
    <link rel="icon" href="favicon.ico" sizes="any" />
    <link rel="icon" href="icon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="apple-touch-icon-180x180.png" />
```

En `tsconfig.json`, cambiar `"types"` a:
```json
    "types": ["vite/client", "node", "vite-plugin-pwa/react"]
```

- [ ] **Step 4: Crear `src/test/pwa-register-stub.ts` y `src/app/UpdateBanner.tsx`, y montarlo en `App`**

`src/test/pwa-register-stub.ts`:
```ts
export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}] as [boolean, (v: boolean) => void],
    offlineReady: [false, () => {}] as [boolean, (v: boolean) => void],
    updateServiceWorker: async () => {},
  };
}
```

`src/app/UpdateBanner.tsx`:
```tsx
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdateBanner() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisterError: (err) => console.error('[pwa] no se pudo registrar el service worker', err),
  });
  if (!needRefresh) return null;
  return (
    <div className="update-banner" role="status">
      <span>Nueva versión disponible</span>
      <button type="button" className="primary" onClick={() => updateServiceWorker(true)}>Recargar</button>
      <button type="button" aria-label="Cerrar" onClick={() => setNeedRefresh(false)}>×</button>
    </div>
  );
}
```

En `src/app/App.tsx`, importar `UpdateBanner` y renderizarlo dentro de `ProgressProvider`, después de `<Shell />`:
```tsx
import { UpdateBanner } from './UpdateBanner';
// ...
    <ProgressProvider storeFactory={storeFactory}>
      <Shell />
      <UpdateBanner />
    </ProgressProvider>
```

- [ ] **Step 5: Verificar que los unit tests siguen pasando y el build genera el SW**

Run: `npm test && npm run build`
Expected: PASS. En `dist/` aparecen `sw.js`, `manifest.webmanifest` y los íconos.

- [ ] **Step 6: Crear `playwright.config.ts` e instalar Chromium**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:4173/', trace: 'retain-on-failure' },
  projects: [{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

Run: `npx playwright install chromium`

- [ ] **Step 7: Escribir los tests E2E**

`e2e/ghost-ball.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('Ghost ball lesson end to end, progress survives a reload', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('continue-lesson').click();
  await page.getByTestId('start-exercises').click();

  await page.getByTestId('choice-1').click();
  await page.getByTestId('estimate-submit').click();
  await expect(page.getByTestId('estimate-feedback')).toContainText('Correcto');
  await page.getByTestId('exercise-continue').click();

  await page.getByTestId('angle-slider').fill('30');
  await page.getByTestId('estimate-submit').click();
  await expect(page.getByTestId('estimate-feedback')).toBeVisible();
  await page.getByTestId('exercise-continue').click();

  for (const attempts of [5, 8]) {
    for (let i = 0; i < attempts; i++) {
      await page.getByTestId('shoot').click();
      const skip = page.getByTestId('skip-playback');
      const result = page.getByTestId('shot-result');
      await expect(skip.or(result)).toBeVisible({ timeout: 15_000 });
      if (await skip.isVisible()) await skip.click({ timeout: 2_000 }).catch(() => {});
      await expect(result).toBeVisible({ timeout: 15_000 });
      if (i < attempts - 1) await page.getByTestId('next-shot').click();
    }
    await page.getByTestId('exercise-continue').click();
  }

  for (let s = 0; s < 2; s++) {
    for (let i = 0; i < 10; i++) await page.getByTestId('real-hit').click();
    await expect(page.getByTestId('real-summary')).toContainText('10 de 10');
    await page.getByTestId('exercise-continue').click();
  }

  await expect(page.getByTestId('lesson-progress')).toContainText('Mesa real: 100%');
  await page.reload();
  await expect(page.getByTestId('lesson-progress')).toContainText('Mesa real: 100%');
});
```

`e2e/offline.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'AimPool' })).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'AimPool' })).toBeVisible();
  await page.getByTestId('go-map').click();
  await expect(page.getByTestId('lesson-card-ghost-ball')).toBeVisible();
});
```

- [ ] **Step 8: Correr E2E**

Run: `npm run e2e`
Expected: 2 tests PASS. Si falla el test offline, verificar en `dist/sw.js` que el precache incluye `index.html` y los `.js`. Si el problema es que el SW todavía no controla la página, agregar una segunda recarga antes de `setOffline`.

- [ ] **Step 9: Commit**

```bash
git add public vite.config.ts index.html tsconfig.json src playwright.config.ts e2e
git commit -m "feat(pwa): installable manifest, offline precache, update banner and e2e tests" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: CI + deploy a GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: scripts `test`, `e2e` y `build`.
- Produces: URL pública https de la PWA.

- [ ] **Step 1: Crear `.github/workflows/deploy.yml`**

```yaml
name: CI y deploy

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
      - uses: actions/upload-pages-artifact@v3
        if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
        with:
          path: dist

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github
git commit -m "ci: test, e2e and deploy to GitHub Pages" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 3: PEDIR CONFIRMACIÓN AL USUARIO antes de crear el repositorio remoto**

Es una acción hacia afuera: crea un repo en GitHub (público, porque Pages gratis lo requiere en planes free) y publica el código. Preguntar explícitamente: nombre del repo (default `AimPool`), si es público y si se puede publicar ya. No seguir sin un "sí".

- [ ] **Step 4: Crear el repo, habilitar Pages y pushear** (solo tras la confirmación)

```bash
gh repo create AimPool --public --source . --remote origin --push
gh api -X POST "repos/$(gh api user -q .login)/AimPool/pages" -f build_type=workflow
gh run watch --exit-status
```
Expected: el workflow termina en verde y `gh api "repos/$(gh api user -q .login)/AimPool/pages" -q .html_url` devuelve la URL.

- [ ] **Step 5: Verificar la instalación en el celular**

Abrir la URL en Chrome (Android) o Safari (iOS) → "Agregar a la pantalla principal" / "Instalar app". Abrir la app instalada, activar el modo avión y verificar que abre y que la lección funciona.

---

## Self-review (hecho al escribir el plan)

- **Cobertura de la spec:**
  - §1 criterios de éxito → Tasks 16, 17 y 18.
  - §3 arquitectura → estructura de carpetas.
  - §4 mesa → Task 7.
  - §5 motor → Tasks 2 a 10.
  - §6 render e input → Tasks 13 y 14.
  - §7 contenido → Task 12.
  - §8 progreso → Task 11.
  - §9 pantallas → Task 16.
  - §10 errores → worker con rechazo y mensaje (Tasks 10 y 15), validación de contenido (Task 12), banner de actualización (Task 17), fallback a memoria (Task 11).
  - §11 testing → Vitest en cada task, Playwright en Task 17 y CI en Task 18.
- **Simplificación consciente respecto de la spec:** el contenido inválido no se "excluye en producción". En cambio, `validateCurriculum` corre en CI y bloquea el deploy. Como el contenido es estático, esto es equivalente y más simple.
- **Fuera de alcance (igual que la spec §12):** caras internas de las troneras (sin rattle), modelo de banda Mathavan (queda la interfaz `resolveCushion` para agregarlo), saque de 15 bolas, IA y sincronización.
