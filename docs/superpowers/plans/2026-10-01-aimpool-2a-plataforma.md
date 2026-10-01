# AimPool — Sub-proyecto 2a (plataforma para aprender sin mesa) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que la app sirva sin mesa. Se agregan:
- onboarding "¿tenés mesa?" y modo sin mesa;
- ejercicio "predecir la blanca";
- bloques de teoría `image` y `demo`;
- test de ubicación;
- 3 arreglos pendientes (respaldo si falla el Worker, intento que se registra después de salir del ejercicio, bola pegada a la blanca en la guía de apuntado).

**Architecture:** se extiende lo existente. La regla de aprobación pasa a una función pura nueva, `progress/status.ts`. Los tiros fijos del contenido se describen con `ShotSpec` y se resuelven con `content/shotSpec.ts`. La predicción se evalúa en `content/predict.ts`, también puro. Las pantallas nuevas (`WelcomeScreen`, `PlacementScreen`) reutilizan los componentes de ejercicio.

**Tech Stack:** la misma del sub-proyecto 1: React 19, Vite, TS strict, Vitest + Testing Library, Playwright, motion.

**Spec:** `docs/superpowers/specs/2026-10-01-aimpool-2a-plataforma-design.md`

## Global Constraints

- Idioma de la UI: español rioplatense (voseo).
- Animación: solo `motion/react`; nada de framer-motion ni GSAP.
- `src/physics/**` sigue sin imports externos. `content/` puede importar de `input/aim.ts` (solo funciones puras).
- `Settings` nuevos con defaults: `hasTable: 'yes'`, `onboardingDone: false`. `SCHEMA_VERSION` se queda en 1.
- Imágenes solo con licencia libre verificada, guardadas en `public/illustrations/` y con su línea en `public/illustrations/CREDITS.md`.
- `exerciseIndex` de los intentos = índice real en `lesson.exercises`, aunque haya ejercicios ocultos.
- Commits con:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_013YgBi7rRQnbweQruREWpza`

## Review Focus

1. **Deep link a un ejercicio oculto:** con `hasTable: 'no'`, `#/lesson/x/ex/5` apunta a un `realTable`. Tiene que redirigir al próximo ejercicio visible o a la lección, nunca mostrarlo. → Task 7, test "hidden exercise deep link".
2. **Usuario existente:** con intentos guardados y sin `onboardingDone`, no tiene que ver la bienvenida. → Task 1, test de `migrateSettings`.
3. **Lección solo de mesa con `hasTable: 'no'`:** no puede bloquear las lecciones que dependen de ella. → Task 1, test de `countsAsPassed`.
4. **Predicción cuando la blanca no toca ninguna bola:** veredicto claro, sin crash ni `NaN`. → Task 2, test "no contact".
5. **Imagen que no carga:** se ve el texto alternativo, no un hueco. → Task 6, test "image error".

---

### Task 1: Settings nuevos, migración y estado de lección

**Files:**
- Modify: `src/progress/types.ts`, `src/app/ProgressContext.tsx`
- Create: `src/progress/migrate.ts`, `src/progress/status.ts`
- Test: `src/progress/migrate.test.ts`, `src/progress/status.test.ts`

**Interfaces:**
- Produces:
  - `Settings.hasTable: 'yes' | 'sometimes' | 'no'`, `Settings.onboardingDone: boolean`, `Settings.placement?: { completedAt: number; passed: string[] }`; `Attempt.kind` suma `'predict'`.
  - `migrateSettings(s, hasHistory): Settings`.
  - `LessonStatus`, `lessonStatus(input): LessonStatus`, `isPassed(status)`, `countsAsPassed(status, hasTable, needs)`.
  - `ProgressValue.status(lesson): LessonStatus`.

- [ ] **Step 1: Escribir los tests que fallan**

`src/progress/migrate.test.ts`:
```ts
import { expect, test } from 'vitest';
import { migrateSettings } from './migrate';
import { DEFAULT_SETTINGS } from './types';

test('existing users with history skip onboarding and keep table mode', () => {
  const m = migrateSettings({ ...DEFAULT_SETTINGS, hasTable: 'no', onboardingDone: false }, true);
  expect(m.onboardingDone).toBe(true);
  expect(m.hasTable).toBe('yes');
});
test('new users are left alone (same object)', () => {
  const s = { ...DEFAULT_SETTINGS };
  expect(migrateSettings(s, false)).toBe(s);
});
test('already onboarded users are left alone', () => {
  const s = { ...DEFAULT_SETTINGS, onboardingDone: true, hasTable: 'no' as const };
  expect(migrateSettings(s, true)).toBe(s);
});
```

`src/progress/status.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { countsAsPassed, isPassed, lessonStatus, type StatusInput } from './status';
import type { LessonStats } from './stats';

const stats = (simRate: number | null, tableRate: number | null): LessonStats => ({
  simAttempts: simRate === null ? 0 : 10, simSuccess: 0, simRate,
  tableShots: tableRate === null ? 0 : 10, tableSuccess: 0, tableRate, passed: false,
});
const base: StatusInput = {
  stats: stats(null, null), crit: { simulator: 0.7, realTable: 0.6 }, needs: { sim: true, table: true },
  hasTable: 'yes', placementPassed: false, unlocked: true,
};

describe('lessonStatus', () => {
  test('with a table, simulator alone is not enough', () => {
    expect(lessonStatus({ ...base, stats: stats(0.9, null) })).toBe('inProgress');
    expect(lessonStatus({ ...base, stats: stats(0.9, 0.7) })).toBe('passedTable');
  });
  test('sometimes / no table: simulator is enough; table adds the badge', () => {
    expect(lessonStatus({ ...base, hasTable: 'sometimes', stats: stats(0.9, null) })).toBe('passedSim');
    expect(lessonStatus({ ...base, hasTable: 'no', stats: stats(0.9, null) })).toBe('passedSim');
    expect(lessonStatus({ ...base, hasTable: 'sometimes', stats: stats(0.9, 0.7) })).toBe('passedTable');
    expect(lessonStatus({ ...base, hasTable: 'no', stats: stats(0.9, 0.7) })).toBe('passedSim');
  });
  test('placement, locked, new, in progress', () => {
    expect(lessonStatus({ ...base, placementPassed: true })).toBe('passedPlacement');
    expect(lessonStatus({ ...base, unlocked: false })).toBe('locked');
    expect(lessonStatus(base)).toBe('new');
    expect(lessonStatus({ ...base, stats: stats(0.2, null) })).toBe('inProgress');
  });
  test('a lesson without table exercises passes on the simulator even with a table', () => {
    expect(lessonStatus({ ...base, needs: { sim: true, table: false }, stats: stats(0.9, null) })).toBe('passedSim');
  });
});

describe('countsAsPassed', () => {
  test('passed statuses count', () => {
    expect(isPassed('passedSim')).toBe(true);
    expect(isPassed('inProgress')).toBe(false);
  });
  test('a table-only lesson never blocks someone without a table', () => {
    expect(countsAsPassed('new', 'no', { sim: false, table: true })).toBe(true);
    expect(countsAsPassed('new', 'yes', { sim: false, table: true })).toBe(false);
  });
});
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `npx vitest run src/progress/migrate.test.ts src/progress/status.test.ts`
Expected: FAIL ("Failed to resolve import").

- [ ] **Step 3: Implementar**

En `src/progress/types.ts`:
- Reemplazar `kind: 'estimate' | 'simShot';` por `kind: 'estimate' | 'simShot' | 'predict';`.
- Dentro de `interface Settings`, después de `showGuidesByDefault: boolean;`, agregar:
```ts
  hasTable: 'yes' | 'sometimes' | 'no';
  onboardingDone: boolean;
  placement?: { completedAt: number; passed: string[] };
```
- En `DEFAULT_SETTINGS`, después de `showGuidesByDefault: true,`, agregar `hasTable: 'yes', onboardingDone: false,`.

`src/progress/migrate.ts`:
```ts
import type { Settings } from './types';

/** Quien ya practicó antes de que existiera el onboarding no ve la bienvenida y conserva el modo con mesa. */
export function migrateSettings(s: Settings, hasHistory: boolean): Settings {
  return !s.onboardingDone && hasHistory ? { ...s, onboardingDone: true, hasTable: 'yes' } : s;
}
```

`src/progress/status.ts`:
```ts
import type { LessonStats } from './stats';
import type { Settings } from './types';

export type LessonStatus = 'passedTable' | 'passedSim' | 'passedPlacement' | 'inProgress' | 'new' | 'locked';

export interface StatusInput {
  stats: LessonStats;
  crit: { simulator: number; realTable: number };
  needs: { sim: boolean; table: boolean };
  hasTable: Settings['hasTable'];
  placementPassed: boolean;
  unlocked: boolean;
}

export function lessonStatus({ stats, crit, needs, hasTable, placementPassed, unlocked }: StatusInput): LessonStatus {
  const simOk = needs.sim && stats.simRate !== null && stats.simRate >= crit.simulator;
  const tableOk = needs.table && stats.tableRate !== null && stats.tableRate >= crit.realTable;
  if (hasTable !== 'no' && tableOk && (simOk || !needs.sim)) return 'passedTable';
  if (simOk && !(hasTable === 'yes' && needs.table)) return 'passedSim';
  if (placementPassed) return 'passedPlacement';
  if (!unlocked) return 'locked';
  return stats.simAttempts + stats.tableShots > 0 ? 'inProgress' : 'new';
}

export const isPassed = (s: LessonStatus): boolean => s === 'passedTable' || s === 'passedSim' || s === 'passedPlacement';

/** Para desbloquear: una lección solo de mesa no bloquea a quien no tiene mesa. */
export function countsAsPassed(s: LessonStatus, hasTable: Settings['hasTable'], needs: { sim: boolean; table: boolean }): boolean {
  return isPassed(s) || (hasTable === 'no' && !needs.sim);
}
```

En `src/app/ProgressContext.tsx`:
- Reemplazar `import { LESSONS, lessonNeeds } from '../content/curriculum';` por `import { isUnlocked, LESSONS, lessonNeeds } from '../content/curriculum';`.
- Agregar `import { migrateSettings } from '../progress/migrate';` e `import { countsAsPassed, lessonStatus, type LessonStatus } from '../progress/status';`.
- En `interface ProgressValue`, después de `stats: (lesson: Lesson) => LessonStats;`, agregar `status: (lesson: Lesson) => LessonStatus;`.
- En el efecto de carga, reemplazar:
```ts
      const [st, at, se] = await Promise.all([s.getSettings(), s.listAttempts(), s.listTableSessions()]);
      if (!alive) return;
      setSettings(st);
```
por:
```ts
      const [raw, at, se] = await Promise.all([s.getSettings(), s.listAttempts(), s.listTableSessions()]);
      const st = migrateSettings(raw, at.length + se.length > 0);
      if (st !== raw) await s.saveSettings(st);
      if (!alive) return;
      setSettings(st);
```
- Reemplazar `  const passed = useMemo(() => new Set(LESSONS.filter((l) => stats(l).passed).map((l) => l.id)), [stats]);` por:
```ts
  const statusOf = useCallback(
    (l: Lesson, unlocked: boolean) => lessonStatus({
      stats: stats(l), crit: l.passCriteria, needs: lessonNeeds(l), hasTable: settings.hasTable,
      placementPassed: settings.placement?.passed.includes(l.id) ?? false, unlocked,
    }),
    [stats, settings.hasTable, settings.placement],
  );
  const passed = useMemo(
    () => new Set(LESSONS.filter((l) => countsAsPassed(statusOf(l, true), settings.hasTable, lessonNeeds(l))).map((l) => l.id)),
    [statusOf, settings.hasTable],
  );
  const status = useCallback(
    (l: Lesson) => statusOf(l, isUnlocked(l, passed, settings.ignoreLocks)),
    [statusOf, passed, settings.ignoreLocks],
  );
```
- En el objeto `value`, agregar `status,` después de `stats,`.

- [ ] **Step 4: Correr tests y tipos**

Run: `npx vitest run src/progress && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/progress src/app/ProgressContext.tsx
git commit -m "feat(progress): table mode settings, migration and lesson status" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013YgBi7rRQnbweQruREWpza"
```

---

### Task 2: `ShotSpec` y evaluación de predicciones

**Files:**
- Modify: `src/content/types.ts`
- Create: `src/content/shotSpec.ts`, `src/content/predict.ts`
- Test: `src/content/shotSpec.test.ts`, `src/content/predict.test.ts`

**Interfaces:**
- Consumes: `aimToShot` (`input/aim.ts`), `ghostBallPosition` y `azimuthTo` (`table/aim.ts`), `finalBalls` (`content/goals.ts`), `stateAt`.
- Produces:
  - `ShotSpec`.
  - `resolveShotSpec(spec, balls, g, R): Shot`.
  - `PredictionResult { success; text; exitFrom?: Vec3; actual?: Vec3 }`.
  - `evaluatePrediction(question, tolerance, tap, tl, g, p): PredictionResult`.

- [ ] **Step 1: Agregar los tipos en `src/content/types.ts`**

Después de `export interface VariationSpec ...`, agregar:
```ts
/** Tiro fijo definido en contenido (independiente del tamaño de mesa). power en escala 0..1 del taco. */
export interface ShotSpec {
  aim: { ghostOf: string; pocket: PocketId } | { at: DiamondPos } | { azimuthDeg: number };
  power: number;
  spin?: { a: number; b: number };
  elevationDeg?: number;
}
```

- [ ] **Step 2: Escribir los tests que fallan**

`src/content/shotSpec.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { resolveShotSpec } from './shotSpec';
import { layoutToBalls } from './layout';
import { DEFAULT_PARAMS as P } from '../physics/params';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';
import { azimuthTo, ghostBallPosition } from '../table/aim';
import { powerToCueSpeed } from '../input/aim';

const g = buildTable(DEFAULT_TABLE_SPEC, P.R);
const balls = layoutToBalls({ balls: [{ id: 'cue', at: { x: 4, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }] }, g, P.R);

describe('resolveShotSpec', () => {
  test('ghostOf aims at the ghost ball', () => {
    const s = resolveShotSpec({ aim: { ghostOf: '1', pocket: 'c84' }, power: 0.5 }, balls, g, P.R);
    expect(s.azimuth).toBeCloseTo(azimuthTo(balls[0].r, ghostBallPosition(balls[1].r, g.pocketCenters.c84, P.R)), 12);
    expect(s.cueSpeed).toBeCloseTo(powerToCueSpeed(0.5), 12);
  });
  test('at aims at a diamond position; azimuthDeg is absolute; spin and elevation pass through', () => {
    const at = resolveShotSpec({ aim: { at: { x: 8, y: 1 } }, power: 0.3 }, balls, g, P.R);
    expect(at.azimuth).toBeCloseTo(0, 12);
    const ab = resolveShotSpec({ aim: { azimuthDeg: 90 }, power: 0.3, spin: { a: 0.1, b: -0.2 }, elevationDeg: 10 }, balls, g, P.R);
    expect(ab.azimuth).toBeCloseTo(Math.PI / 2, 12);
    expect(ab.a).toBe(0.1);
    expect(ab.b).toBe(-0.2);
    expect(ab.elevation).toBeCloseTo((10 * Math.PI) / 180, 12);
  });
  test('missing balls throw a readable error', () => {
    expect(() => resolveShotSpec({ aim: { ghostOf: '9', pocket: 'c84' }, power: 0.5 }, balls, g, P.R)).toThrow(/bola 9/);
  });
});
```

`src/content/predict.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { evaluatePrediction } from './predict';
import { layoutToBalls } from './layout';
import { resolveShotSpec } from './shotSpec';
import { DEFAULT_PARAMS as P } from '../physics/params';
import { simulate } from '../physics/simulate';
import { add, scale, type Vec3 } from '../physics/vec';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';

const g = buildTable(DEFAULT_TABLE_SPEC, P.R);
const run = (layout: { id: string; at: { x: number; y: number } }[], aim: Parameters<typeof resolveShotSpec>[0]['aim'], power = 0.4) => {
  const balls = layoutToBalls({ balls: layout }, g, P.R);
  return simulate(balls, resolveShotSpec({ aim, power }, balls, g, P.R), g.boundary, P);
};

describe('evaluatePrediction', () => {
  test('cueStop: tapping the real final spot succeeds, far away fails', () => {
    const tl = run([{ id: 'cue', at: { x: 2, y: 2 } }], { azimuthDeg: 0 }, 0.2);
    const end = tl.events.at(-1)!.balls[0].r;
    expect(evaluatePrediction('cueStop', 0.5, end, tl, g, P).success).toBe(true);
    const far = evaluatePrediction('cueStop', 0.5, add(end, [1, 0, 0]), tl, g, P);
    expect(far.success).toBe(false);
    expect(far.text).toMatch(/diamantes/);
  });
  test('cueDirection: tapping along the real exit line succeeds, along the old line fails', () => {
    const tl = run([{ id: 'cue', at: { x: 4, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }], { ghostOf: '1', pocket: 'c84' }, 0.5);
    const hit = evaluatePrediction('cueDirection', 10, [0, 0, 0], tl, g, P);
    const from = hit.exitFrom!;
    const along = hit.actual!;
    expect(evaluatePrediction('cueDirection', 10, along, tl, g, P).success).toBe(true);
    const incoming = scale(add(from, scale(tl.events[0].balls[0].r, -1)), 1);
    expect(evaluatePrediction('cueDirection', 10, add(from, incoming), tl, g, P).success).toBe(false);
  });
  test('no contact: clear verdict, no NaN', () => {
    const tl = run([{ id: 'cue', at: { x: 2, y: 2 } }, { id: '1', at: { x: 6, y: 3.5 } }], { azimuthDeg: 0 }, 0.3);
    const r = evaluatePrediction('cueDirection', 10, [1, 1, 0] as Vec3, tl, g, P);
    expect(r.success).toBe(false);
    expect(r.text).toMatch(/no tocó/);
  });
});
```

- [ ] **Step 3: Correr y verificar que fallan**

Run: `npx vitest run src/content/shotSpec.test.ts src/content/predict.test.ts`
Expected: FAIL ("Failed to resolve import").

- [ ] **Step 4: Implementar `src/content/shotSpec.ts`**

```ts
import type { Ball, Shot } from '../physics/types';
import type { TableGeometry } from '../table/geometry';
import { azimuthTo, ghostBallPosition } from '../table/aim';
import { aimToShot } from '../input/aim';
import type { ShotSpec } from './types';

export function resolveShotSpec(spec: ShotSpec, balls: Ball[], g: TableGeometry, R: number): Shot {
  const cue = balls.find((b) => b.id === 'cue');
  if (!cue) throw new Error('Falta la blanca en el setup');
  const aim = spec.aim;
  let azimuth: number;
  if ('ghostOf' in aim) {
    const ob = balls.find((b) => b.id === aim.ghostOf);
    if (!ob) throw new Error(`La bola ${aim.ghostOf} no está en el setup`);
    azimuth = azimuthTo(cue.r, ghostBallPosition(ob.r, g.pocketCenters[aim.pocket], R));
  } else if ('at' in aim) {
    azimuth = azimuthTo(cue.r, [aim.at.x * g.diamond, aim.at.y * g.diamond, 0]);
  } else {
    azimuth = (aim.azimuthDeg * Math.PI) / 180;
  }
  return aimToShot({ azimuth, elevation: spec.elevationDeg ?? 0, a: spec.spin?.a ?? 0, b: spec.spin?.b ?? 0, power: spec.power });
}
```

- [ ] **Step 5: Implementar `src/content/predict.ts`**

```ts
import type { Timeline } from '../physics/types';
import type { PhysicsParams } from '../physics/params';
import { add, dot, norm, scale, sub, unit, type Vec3, xy } from '../physics/vec';
import type { TableGeometry } from '../table/geometry';
import { finalBalls } from './goals';

export interface PredictionResult {
  success: boolean;
  text: string;
  /** cueDirection: punto de contacto desde donde sale la blanca. */
  exitFrom?: Vec3;
  /** cueStop: posición final real. cueDirection: un punto 0,5 m adelante sobre la salida real. */
  actual?: Vec3;
}

const fmt = (n: number) => n.toFixed(2).replace('.', ',');

export function evaluatePrediction(
  question: 'cueStop' | 'cueDirection', tolerance: number, tap: Vec3, tl: Timeline, g: TableGeometry, p: PhysicsParams,
): PredictionResult {
  if (question === 'cueStop') {
    const cue = finalBalls(tl, p).find((b) => b.id === 'cue')!;
    if (cue.motion === 'pocketed') return { success: false, text: 'La blanca terminó adentro de una tronera (scratch).', actual: cue.r };
    const dist = norm(sub(xy(tap), xy(cue.r))) / g.diamond;
    return dist <= tolerance
      ? { success: true, text: `¡Muy bien! Quedaste a ${fmt(dist)} diamantes.`, actual: cue.r }
      : { success: false, text: `Le erraste por ${fmt(dist)} diamantes.`, actual: cue.r };
  }

  const hitIdx = tl.events.findIndex((e) => e.kind === 'ballBall' && e.ids.includes('cue'));
  if (hitIdx < 0) return { success: false, text: 'En este tiro la blanca no tocó ninguna bola.' };
  const hit = tl.events[hitIdx];
  const from = hit.balls.find((b) => b.id === 'cue')!.r;
  const settle = tl.events.slice(hitIdx + 1).find((e) => e.ids[0] === 'cue' && e.kind !== 'ballBall') ?? hit;
  let v = settle.balls.find((b) => b.id === 'cue')!.v;
  if (norm(xy(v)) < 1e-6) v = hit.balls.find((b) => b.id === 'cue')!.v;
  if (norm(xy(v)) < 1e-6) {
    const near = norm(sub(xy(tap), xy(from))) / g.diamond <= 0.3;
    return { success: near, text: near ? '¡Bien! La blanca se queda casi quieta.' : 'La blanca se queda casi quieta en el contacto.', exitFrom: from, actual: from };
  }
  const exit = unit(xy(v));
  const actual = add(from, scale(exit, 0.5));
  const mine = unit(xy(sub(tap, from)));
  const err = (Math.acos(Math.max(-1, Math.min(1, dot(exit, mine)))) * 180) / Math.PI;
  return err <= tolerance
    ? { success: true, text: `¡Muy bien! Le erraste por ${Math.round(err)}°.`, exitFrom: from, actual }
    : { success: false, text: `Le erraste por ${Math.round(err)}°.`, exitFrom: from, actual };
}
```

- [ ] **Step 6: Correr tests**

Run: `npx vitest run src/content && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/content
git commit -m "feat(content): ShotSpec resolution and prediction evaluation" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013YgBi7rRQnbweQruREWpza"
```

---

### Task 3: Ejercicio `predict`, bloques `image`/`demo`, test de ubicación y contenido de Bola fantasma

**Files:**
- Modify: `src/content/types.ts`, `src/content/validate.ts`, `src/content/lessons/ghost-ball.ts`, `src/content/curriculum.ts`
- Create: `src/content/placement.ts`, `public/illustrations/puente-abierto.svg`, `public/illustrations/CREDITS.md`
- Test: `src/content/placement.test.ts`, modify `src/content/validate.test.ts`

**Interfaces:**
- Produces:
  - `Exercise` con `kind: 'predict'`.
  - `TheoryBlock` con `image` y `demo`.
  - `PlacementItem`, `PLACEMENT`, `scorePlacement(items, answers): string[]`.
  - `validateCurriculum(lessons, placement?)`.

- [ ] **Step 1: Tipos en `src/content/types.ts`**

En `TheoryBlock`, agregar estas dos variantes al final de la unión:
```ts
  | { kind: 'image'; src: string; alt: string; caption: string; credit?: { author: string; license: string; url: string } }
  | { kind: 'demo'; setup: BallLayout; shot: ShotSpec; caption: string; trace?: string[]; interactive?: 'spin' }
```
En `Exercise`, agregar al final de la unión:
```ts
  | { kind: 'predict'; prompt: string; setup: BallLayout; shot: ShotSpec; question: 'cueStop' | 'cueDirection'; tolerance: number; explanation: string }
```
Mover la declaración de `ShotSpec` (Task 2) **antes** de `TheoryBlock`, porque ahora la usa.

- [ ] **Step 2: Escribir los tests que fallan**

`src/content/placement.test.ts`:
```ts
import { expect, test } from 'vitest';
import { PLACEMENT, scorePlacement, type PlacementItem } from './placement';

const item = (lessonId: string): PlacementItem => ({ ...PLACEMENT[0], lessonId });

test('a lesson passes only if all of its items are correct', () => {
  const items = [item('a'), item('a'), item('b'), item('b')];
  expect(scorePlacement(items, [true, true, true, false])).toEqual(['a']);
  expect(scorePlacement(items, [true, true, true, true]).sort()).toEqual(['a', 'b']);
});
test('unanswered items count as wrong', () => {
  expect(scorePlacement([item('a'), item('a')], [true])).toEqual([]);
});
test('ships at least two Ghost ball items', () => {
  expect(PLACEMENT.filter((i) => i.lessonId === 'ghost-ball').length).toBeGreaterThanOrEqual(2);
});
```

Agregar al final de `src/content/validate.test.ts`, dentro de un `describe` nuevo:
```ts
import { existsSync } from 'node:fs';
import { PLACEMENT } from './placement';

describe('validateCurriculum: new blocks, predict and placement', () => {
  test('shipped placement is valid', () => {
    expect(validateCurriculum(LESSONS, PLACEMENT)).toEqual([]);
  });
  test('placement items must reference existing lessons, and have ≥ 2 per lesson', () => {
    const one = [{ ...PLACEMENT[0], lessonId: 'zzz' }];
    const errs = validateCurriculum(LESSONS, one).join();
    expect(errs).toMatch(/zzz/);
    expect(errs).toMatch(/al menos 2/);
  });
  test('image blocks need a src under illustrations/ and an alt text; demo and predict need valid balls', () => {
    const bad = base({
      theory: [
        { kind: 'image', src: 'http://x.com/a.png', alt: '', caption: 'c' },
        { kind: 'demo', setup: { balls: [{ id: 'cue', at: { x: 2, y: 2 } }] }, shot: { aim: { ghostOf: '7', pocket: 'c84' }, power: 0.5 }, caption: 'd' },
      ],
      exercises: [{ kind: 'predict', prompt: 'p', setup: { balls: [{ id: 'cue', at: { x: 2, y: 2 } }] }, shot: { aim: { azimuthDeg: 0 }, power: 0.4 }, question: 'cueStop', tolerance: 0, explanation: 'e' }],
    });
    const errs = validateCurriculum([bad]).join();
    expect(errs).toMatch(/illustrations/);
    expect(errs).toMatch(/alt/);
    expect(errs).toMatch(/bola 7/);
    expect(errs).toMatch(/tolerance/);
  });
  test('every image block points to a file that exists in public/', () => {
    for (const l of LESSONS) for (const t of l.theory) if (t.kind === 'image') expect(existsSync(`public/${t.src}`)).toBe(true);
    expect(existsSync('public/illustrations/CREDITS.md')).toBe(true);
  });
});
```

- [ ] **Step 3: Correr y verificar que fallan**

Run: `npx vitest run src/content`
Expected: FAIL (no existe `./placement`; tipos nuevos sin validar).

- [ ] **Step 4: Implementar `src/content/placement.ts`**

```ts
import type { Exercise } from './types';

export interface PlacementItem { lessonId: string; exercise: Extract<Exercise, { kind: 'estimate' | 'predict' }> }

const GB = { balls: [{ id: 'cue', at: { x: 4, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }] };

/** Ordenados por dificultad. El 2b agrega los ítems de las lecciones nuevas. */
export const PLACEMENT: PlacementItem[] = [
  {
    lessonId: 'ghost-ball',
    exercise: {
      kind: 'estimate', prompt: 'Para meter la 1 en la tronera marcada, ¿dónde tiene que estar la blanca en el instante del choque?',
      setup: GB, target: { ball: '1', pocket: 'c84' },
      answer: { kind: 'choice', options: ['Tocando el punto de la 1 que mira a la tronera', 'A una bola de distancia de la 1, sobre la línea tronera → bola 1', 'Pegada al costado de la 1 que mira a la blanca'], correct: 1 },
      explanation: 'Es la bola fantasma: sobre la prolongación de la línea tronera → bola, a una bola de distancia.',
    },
  },
  {
    lessonId: 'ghost-ball',
    exercise: {
      kind: 'estimate', prompt: 'Estimá el ángulo de corte de este tiro (en grados).',
      setup: { balls: [{ id: 'cue', at: { x: 2, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }] },
      answer: { kind: 'cutAngle', ball: '1', pocket: 'c84', toleranceDeg: 7 },
      explanation: 'El corte es el ángulo entre la línea blanca → fantasma y la línea bola → tronera.',
    },
  },
];

export function scorePlacement(items: PlacementItem[], answers: boolean[]): string[] {
  const ok = new Map<string, boolean>();
  items.forEach((it, i) => ok.set(it.lessonId, (ok.get(it.lessonId) ?? true) && answers[i] === true));
  return [...ok].filter(([, v]) => v).map(([k]) => k);
}
```

- [ ] **Step 5: Extender `src/content/validate.ts`**

- Agregar `import type { PlacementItem } from './placement';` e `import type { ShotSpec } from './types';`.
- Agregar la función:
```ts
function checkShot(where: string, shot: ShotSpec, ids: Set<string>, errors: string[]) {
  if ('ghostOf' in shot.aim && !ids.has(shot.aim.ghostOf)) errors.push(`${where}: bola ${shot.aim.ghostOf} no está en el setup`);
  if (shot.power < 0 || shot.power > 1) errors.push(`${where}: power fuera de [0,1]`);
}
```
- En `checkExercise`, antes del `if ((ex.kind === 'realTable' ...`, agregar:
```ts
  if (ex.kind === 'predict') {
    checkShot(where, ex.shot, ids, errors);
    if (!(ex.tolerance > 0)) errors.push(`${where}: tolerance debe ser > 0`);
  }
```
- En `validateCurriculum`, reemplazar la firma por `export function validateCurriculum(lessons: Lesson[], placement: PlacementItem[] = []): string[] {`.
- Reemplazar el `forEach` de teoría por:
```ts
    l.theory.forEach((t, i) => {
      const where = `${l.id} teoría ${i}`;
      if (t.kind === 'diagram') checkLayout(where, t.setup, false, errors);
      if (t.kind === 'image') {
        if (!t.src.startsWith('illustrations/')) errors.push(`${where}: la imagen debe estar en illustrations/`);
        if (!t.alt.trim()) errors.push(`${where}: falta el texto alt de la imagen`);
      }
      if (t.kind === 'demo') {
        checkLayout(where, t.setup, true, errors);
        checkShot(where, t.shot, new Set(t.setup.balls.map((b) => b.id)), errors);
      }
    });
```
- Antes del bloque de ciclos (`const state = new Map...`), agregar:
```ts
  const perLesson = new Map<string, number>();
  placement.forEach((it, i) => {
    if (!byId.has(it.lessonId)) errors.push(`ubicación ${i}: lección inexistente ${it.lessonId}`);
    perLesson.set(it.lessonId, (perLesson.get(it.lessonId) ?? 0) + 1);
    checkExercise(`ubicación ${i}`, it.exercise, errors);
  });
  for (const [id, n] of perLesson) if (n < 2) errors.push(`ubicación: la lección ${id} necesita al menos 2 ítems`);
```
- Actualizar `validate.test.ts` → el primer test (`'the shipped curriculum is valid...'`) queda igual (sin placement).

- [ ] **Step 6: Contenido de Bola fantasma (`src/content/lessons/ghost-ball.ts`)**

- Después del bloque `diagram` de `theory` (el segundo elemento), insertar:
```ts
    {
      kind: 'demo',
      setup: SHOT,
      shot: { aim: { ghostOf: '1', pocket: 'c84' }, power: 0.5 },
      trace: ['cue', '1'],
      caption: 'Así se ve: la blanca va al centro de la fantasma y la 1 sale derecho a la tronera. Tocá “Repetir” para verlo otra vez.',
    },
```
- En `exercises`, insertar entre el segundo `simShot` y el primer `realTable`:
```ts
    {
      kind: 'predict',
      prompt: 'Apuntando a la fantasma con fuerza media, ¿hacia dónde sale la blanca después de pegarle a la 1? Tocá un punto de su camino.',
      setup: SHOT,
      shot: { aim: { ghostOf: '1', pocket: 'c84' }, power: 0.5 },
      question: 'cueDirection',
      tolerance: 12,
      explanation: 'Si la blanca llega seca (sin rotación), sale a 90° de la bola objetivo: es la regla de los 90°. Si llega rodando, se abre un poco menos (regla de los 30°). Lo vas a ver en Control de blanca.',
    },
```

- [ ] **Step 7: Imagen de prueba y créditos**

`public/illustrations/puente-abierto.svg` (ilustración propia, simple):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" role="img" aria-label="Puente abierto: la mano apoyada, el taco descansa en la V entre el pulgar y el índice">
  <rect width="320" height="200" fill="#12755d"/>
  <path d="M60 170 Q70 120 120 110 L200 108 Q240 110 250 150 L255 170 Z" fill="#e8c4a0" stroke="#5a3b22" stroke-width="3"/>
  <path d="M120 110 Q130 70 150 62 Q160 60 162 75 L150 108" fill="#e8c4a0" stroke="#5a3b22" stroke-width="3"/>
  <line x1="10" y1="64" x2="310" y2="64" stroke="#d9b07a" stroke-width="10" stroke-linecap="round"/>
  <line x1="300" y1="64" x2="312" y2="64" stroke="#2c6fb5" stroke-width="10" stroke-linecap="round"/>
  <text x="160" y="192" fill="#e9efe9" font-family="system-ui,sans-serif" font-size="14" text-anchor="middle">Puente abierto: el taco apoya en la “V” del pulgar</text>
</svg>
```

`public/illustrations/CREDITS.md`:
```markdown
# Créditos de ilustraciones

| Archivo | Autor | Licencia | Origen | Cambios |
|---|---|---|---|---|
| puente-abierto.svg | AimPool (ilustración propia) | CC0 | — | — |
```

- [ ] **Step 8: Correr tests**

Run: `npx vitest run src/content && npx tsc --noEmit`
Expected: PASS. Puede romper `ExerciseScreen`/`TheoryBlockView` en tipos (switch no exhaustivo): eso se resuelve en Tasks 5–7. Si `tsc` falla **solo** por eso, seguir y ledgerear.

- [ ] **Step 9: Commit**

```bash
git add src/content public/illustrations
git commit -m "feat(content): predict exercise, image/demo blocks, placement test and Ghost ball additions" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013YgBi7rRQnbweQruREWpza"
```

---

### Task 4: Guías `path` y `marker`, `samplePath` y `firstContact` con bola pegada

**Files:**
- Modify: `src/render/guides.ts`, `src/render/draw.ts`
- Test: `src/render/guides.test.ts`

**Interfaces:**
- Produces:
  - `GuideDraw` con `{ kind: 'path'; points: Vec3[]; color?: string }` y `{ kind: 'marker'; at: Vec3; color?: string }`.
  - `samplePath(tl, ballId, p, n?): Vec3[]`.
  - `firstContact`: si hay una bola pegada adelante, el contacto es inmediato.

- [ ] **Step 1: Tests que fallan (agregar a `src/render/guides.test.ts`)**

```ts
import { samplePath } from './guides';
import { simulate } from '../physics/simulate';
import { DEFAULT_PARAMS as P } from '../physics/params';

describe('firstContact with a frozen ball', () => {
  test('a ball frozen in front is hit immediately', () => {
    const cue = B('cue', 0.5, 0.5);
    const c = firstContact(cue, 0, [cue, B('1', 0.5 + 2 * R, 0.5)], 2.54, 1.27, R);
    expect(c.ballId).toBe('1');
    expect(c.point[0]).toBeCloseTo(0.5, 9);
  });
  test('a ball frozen behind is ignored', () => {
    const cue = B('cue', 0.5, 0.5);
    expect(firstContact(cue, 0, [cue, B('1', 0.5 - 2 * R, 0.5)], 2.54, 1.27, R).ballId).toBeUndefined();
  });
});

describe('samplePath', () => {
  test('samples the ball positions over the whole timeline', () => {
    const tl = simulate([B('cue', 0.5, 0.5)], { cueBallId: 'cue', azimuth: 0, elevation: 0, a: 0, b: 0, cueSpeed: 1 }, { segments: [], jaws: [], pockets: [] }, P);
    const pts = samplePath(tl, 'cue', P, 20);
    expect(pts).toHaveLength(21);
    expect(pts[0][0]).toBeCloseTo(0.5, 9);
    expect(pts[20][0]).toBeCloseTo(tl.events.at(-1)!.balls[0].r[0], 9);
  });
});
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run src/render/guides.test.ts`
Expected: FAIL (`samplePath` no existe; el test de la bola pegada adelante falla).

- [ ] **Step 3: Implementar**

En `src/render/guides.ts`:
- Agregar imports: `import type { Timeline } from '../physics/types';`, `import type { PhysicsParams } from '../physics/params';` e `import { stateAt } from '../physics/simulate';`.
- En la unión `GuideDraw`, agregar `| { kind: 'path'; points: Vec3[]; color?: string }` y `| { kind: 'marker'; at: Vec3; color?: string }`.
- En `firstContact`, reemplazar:
```ts
    const s = -bq - Math.sqrt(disc);
    if (s > 1e-9 && s < best) {
```
por:
```ts
    // bq < 0: la bola está adelante. Una bola pegada (s ≈ 0) cuenta como contacto inmediato.
    const s = Math.max(0, -bq - Math.sqrt(disc));
    if (bq < 0 && s < best) {
```
- Agregar al final del archivo:
```ts
export function samplePath(tl: Timeline, ballId: string, p: PhysicsParams, n = 80): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const b = stateAt(tl, (tl.duration * i) / n, p).find((x) => x.id === ballId);
    if (b && b.motion !== 'pocketed') pts.push(b.r);
    else if (b) { pts.push(b.r); break; }
  }
  return pts;
}
```

En `src/render/draw.ts`, en `drawGuide`, antes del `} else {` final que dibuja el taco (después del bloque `ghost`), agregar:
```ts
  } else if (gd.kind === 'path') {
    if (gd.points.length < 2) return;
    ctx.strokeStyle = gd.color ?? 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    gd.points.forEach((pt, i) => {
      const [x, y] = worldToScreen(vp, pt);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  } else if (gd.kind === 'marker') {
    const [x, y] = worldToScreen(vp, gd.at);
    const s = Math.max(6, R * vp.scale);
    ctx.strokeStyle = gd.color ?? '#ffd166';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s);
    ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s);
    ctx.stroke();
```
y reemplazar el `} else {` del taco por `} else if (gd.kind === 'cue') {`.

- [ ] **Step 4: Correr tests**

Run: `npx vitest run src/render && npx tsc --noEmit`
Expected: PASS (con la salvedad de tipos del Task 3, si sigue pendiente).

- [ ] **Step 5: Commit**

```bash
git add src/render
git commit -m "feat(render): path and marker guides, samplePath, frozen-ball contact in aim guide" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013YgBi7rRQnbweQruREWpza"
```

---
### Task 5: Componente `PredictExercise`

**Files:**
- Create: `src/exercises/PredictExercise.tsx`
- Test: `src/exercises/PredictExercise.test.tsx`

**Interfaces:**
- Consumes: `resolveShotSpec`, `evaluatePrediction`, `samplePath`, `firstContact`, `usePlayback`, `simulateAsync`, `TableCanvas`.
- Produces: `PredictExercise({ exercise, env, onAnswer(success, detail), onContinue })`, con los test ids `predict-submit`, `skip-playback`, `predict-result`, `replay` y `exercise-continue`.

- [ ] **Step 1: Test que falla**

```tsx
import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PredictExercise } from './PredictExercise';
import { DEFAULT_PARAMS } from '../physics/params';
import { buildTable, DEFAULT_TABLE_SPEC } from '../table/geometry';
import type { Exercise } from '../content/types';

const env = { geometry: buildTable(DEFAULT_TABLE_SPEC, DEFAULT_PARAMS.R), params: DEFAULT_PARAMS, tableSpec: DEFAULT_TABLE_SPEC };
const ex: Extract<Exercise, { kind: 'predict' }> = {
  kind: 'predict', prompt: '¿Dónde termina la blanca?', question: 'cueStop', tolerance: 0.5, explanation: 'porque sí',
  setup: { balls: [{ id: 'cue', at: { x: 2, y: 2 } }] }, shot: { aim: { azimuthDeg: 0 }, power: 0.2 },
};

test('tap to mark, check, see the verdict and continue', async () => {
  const onAnswer = vi.fn();
  const onContinue = vi.fn();
  render(<PredictExercise exercise={ex} env={env} onAnswer={onAnswer} onContinue={onContinue} />);
  expect(screen.getByTestId('predict-submit')).toBeDisabled();
  fireEvent.pointerDown(screen.getByRole('img', { name: /predicción/ }), { clientX: 10, clientY: 10, pointerId: 1 });
  fireEvent.click(screen.getByTestId('predict-submit'));
  fireEvent.click(await screen.findByTestId('skip-playback'));
  expect(await screen.findByTestId('predict-result')).toHaveTextContent('porque sí');
  expect(onAnswer).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByTestId('exercise-continue'));
  expect(onContinue).toHaveBeenCalled();
});
```

- [ ] **Step 2: Verificar que falla**

Run: `npx vitest run src/exercises/PredictExercise.test.tsx`
Expected: FAIL ("Failed to resolve import ./PredictExercise").

- [ ] **Step 3: Implementar `src/exercises/PredictExercise.tsx`**

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Exercise } from '../content/types';
import { layoutToBalls } from '../content/layout';
import { resolveShotSpec } from '../content/shotSpec';
import { evaluatePrediction, type PredictionResult } from '../content/predict';
import type { Timeline } from '../physics/types';
import type { Vec3 } from '../physics/vec';
import { TableCanvas } from '../render/TableCanvas';
import { firstContact, type GuideDraw, samplePath } from '../render/guides';
import { usePlayback } from '../render/usePlayback';
import { simulateAsync } from '../sim/client';
import type { ExerciseEnv } from './env';

type PredictEx = Extract<Exercise, { kind: 'predict' }>;

export function PredictExercise({ exercise, env, onAnswer, onContinue }: {
  exercise: PredictEx; env: ExerciseEnv; onAnswer: (success: boolean, detail: string) => void; onContinue: () => void;
}) {
  const R = env.params.R;
  const balls = useMemo(() => layoutToBalls(exercise.setup, env.geometry, R), [exercise.setup, env.geometry, R]);
  const shot = useMemo(() => resolveShotSpec(exercise.shot, balls, env.geometry, R), [exercise.shot, balls, env.geometry, R]);
  const cue = balls.find((b) => b.id === 'cue')!;
  const [tap, setTap] = useState<Vec3 | null>(null);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  const playback = usePlayback(timeline, env.params);

  const guides = useMemo<GuideDraw[]>(() => {
    const out: GuideDraw[] = [];
    if (!timeline) {
      const contact = firstContact(cue, shot.azimuth, balls, env.geometry.length, env.geometry.width, R);
      out.push({ kind: 'line', from: cue.r, to: contact.point, dashed: true, color: 'rgba(255,209,102,0.85)' });
      out.push({ kind: 'cue', at: cue.r, azimuth: shot.azimuth });
    } else if (!playback.playing) {
      out.push({ kind: 'path', points: samplePath(timeline, 'cue', env.params), color: 'rgba(255,255,255,0.8)' });
      if (result?.actual) out.push({ kind: 'marker', at: result.actual, color: '#3ccf8e' });
    }
    if (tap) out.push({ kind: 'marker', at: tap });
    return out;
  }, [timeline, playback.playing, tap, result, cue, shot.azimuth, balls, env.geometry, env.params, R]);

  const check = async () => {
    if (!tap) return;
    setBusy(true);
    setError(null);
    try {
      const tl = await simulateAsync(balls, shot, env.tableSpec, env.params);
      if (!alive.current) return;
      const r = evaluatePrediction(exercise.question, exercise.tolerance, tap, tl, env.geometry, env.params);
      setTimeline(tl);
      setResult(r);
      onAnswer(r.success, r.text);
    } catch (err) {
      console.error('[PredictExercise]', err);
      if (alive.current) setError('No se pudo simular el tiro. Probá de nuevo.');
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  return (
    <section className="exercise">
      <p className="prompt">{exercise.prompt}</p>
      <TableCanvas geometry={env.geometry} balls={playback.balls ?? balls} R={R} guides={guides}
        onPointer={!timeline && !busy ? (p, phase) => { if (phase === 'down') setTap(p); } : undefined}
        label="Mesa: tocá para marcar tu predicción" />
      {!timeline && (
        <p className="hint">
          {tap ? 'Podés tocar de nuevo para mover la marca.' : 'Tocá la mesa para marcar tu predicción.'} La línea punteada muestra hacia dónde se tira.
        </p>
      )}
      {error && <p className="warn" role="alert">{error}</p>}
      {!timeline && (
        <button type="button" className="primary big" disabled={!tap || busy} onClick={() => { void check(); }} data-testid="predict-submit">
          {busy ? 'Calculando…' : 'Comprobar'}
        </button>
      )}
      {timeline && playback.playing && (
        <button type="button" onClick={playback.skip} data-testid="skip-playback">Saltar animación</button>
      )}
      {timeline && !playback.playing && result && (
        <div className={result.success ? 'feedback ok' : 'feedback bad'} role="status" data-testid="predict-result">
          <p>{result.text}</p>
          <p>{exercise.explanation}</p>
          <p className="muted">La cruz amarilla es tu marca; la verde muestra lo que pasó de verdad.</p>
          <div className="row">
            <button type="button" onClick={() => setTimeline({ ...timeline })} data-testid="replay">Ver de nuevo</button>
            <button type="button" className="primary" onClick={onContinue} data-testid="exercise-continue">Continuar</button>
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Correr tests**

Run: `npx vitest run src/exercises`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/exercises
git commit -m "feat(exercises): predict-the-cue-ball exercise" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013YgBi7rRQnbweQruREWpza"
```

---

### Task 6: Bloques de teoría `image` y `demo`

**Files:**
- Create: `src/app/components/DemoView.tsx`
- Modify: `src/app/components/TheoryBlockView.tsx` (reescritura), `src/app/screens/LessonScreen.tsx`
- Test: `src/app/components/TheoryBlockView.test.tsx`, `src/app/components/DemoView.test.tsx`

**Interfaces:**
- Produces:
  - `TheoryBlockView({ block, geometry, params, tableSpec, showGuides })`. **Cambio de firma:** recibe `params` y `tableSpec` en lugar de `R`.
  - `DemoView({ block, geometry, params, tableSpec })`, con los test ids `demo-replay` y `demo-retry`, y botones de efecto predefinido.

- [ ] **Step 1: Tests que fallan**

`src/app/components/TheoryBlockView.test.tsx`:
```tsx
import { expect, test } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TheoryBlockView } from './TheoryBlockView';
import { DEFAULT_PARAMS } from '../../physics/params';
import { buildTable, DEFAULT_TABLE_SPEC } from '../../table/geometry';

const props = { geometry: buildTable(DEFAULT_TABLE_SPEC, DEFAULT_PARAMS.R), params: DEFAULT_PARAMS, tableSpec: DEFAULT_TABLE_SPEC, showGuides: true };

test('image block shows the image and its credit', () => {
  render(<TheoryBlockView {...props} block={{ kind: 'image', src: 'illustrations/puente-abierto.svg', alt: 'Puente abierto', caption: 'El puente', credit: { author: 'Fulano', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/x' } }} />);
  expect(screen.getByAltText('Puente abierto')).toHaveAttribute('src', 'illustrations/puente-abierto.svg');
  expect(screen.getByRole('link', { name: /Fulano · CC BY-SA 4.0/ })).toHaveAttribute('href', 'https://commons.wikimedia.org/x');
});

test('image error: shows the alt text instead of a hole', () => {
  render(<TheoryBlockView {...props} block={{ kind: 'image', src: 'illustrations/nope.png', alt: 'Agarre del taco', caption: 'c' }} />);
  fireEvent.error(screen.getByAltText('Agarre del taco'));
  expect(screen.queryByRole('img', { name: 'Agarre del taco' })).toBeNull();
  expect(screen.getByText('Agarre del taco')).toBeInTheDocument();
});
```

`src/app/components/DemoView.test.tsx`:
```tsx
import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('../../sim/client', async (orig) => {
  const m = await orig<typeof import('../../sim/client')>();
  return { ...m, simulateAsync: vi.fn(m.simulateAsync) };
});

import { simulateAsync } from '../../sim/client';
import { DemoView } from './DemoView';
import { DEFAULT_PARAMS } from '../../physics/params';
import { buildTable, DEFAULT_TABLE_SPEC } from '../../table/geometry';

test('demo simulates on mount, can replay, and re-simulates when the spin changes', async () => {
  render(<DemoView geometry={buildTable(DEFAULT_TABLE_SPEC, DEFAULT_PARAMS.R)} params={DEFAULT_PARAMS} tableSpec={DEFAULT_TABLE_SPEC}
    block={{ kind: 'demo', caption: 'Demo', interactive: 'spin', setup: { balls: [{ id: 'cue', at: { x: 2, y: 2 } }, { id: '1', at: { x: 4, y: 2 } }] }, shot: { aim: { at: { x: 4, y: 2 } }, power: 0.4 } }} />);
  await waitFor(() => expect(screen.getByTestId('demo-replay')).toBeEnabled());
  expect(simulateAsync).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Abajo (draw)' }));
  await waitFor(() => expect(simulateAsync).toHaveBeenCalledTimes(2));
});
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run src/app/components`
Expected: FAIL (no existe `./DemoView`; `TheoryBlockView` no soporta `image`).

- [ ] **Step 3: Implementar `src/app/components/DemoView.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react';
import type { TheoryBlock } from '../../content/types';
import { layoutToBalls } from '../../content/layout';
import { resolveShotSpec } from '../../content/shotSpec';
import type { PhysicsParams } from '../../physics/params';
import type { Timeline } from '../../physics/types';
import { TableCanvas } from '../../render/TableCanvas';
import { type GuideDraw, samplePath } from '../../render/guides';
import { usePlayback } from '../../render/usePlayback';
import { SpinPad } from '../../input/SpinPad';
import { simulateAsync } from '../../sim/client';
import type { TableGeometry, TableSpec } from '../../table/geometry';

type DemoBlock = Extract<TheoryBlock, { kind: 'demo' }>;

const PRESETS = [
  { label: 'Centro', a: 0, b: 0 },
  { label: 'Arriba (follow)', a: 0, b: 0.4 },
  { label: 'Abajo (draw)', a: 0, b: -0.4 },
  { label: 'Izquierda', a: -0.3, b: 0 },
  { label: 'Derecha', a: 0.3, b: 0 },
];
const TRACE_COLORS = ['rgba(255,255,255,0.8)', 'rgba(255,209,102,0.85)', 'rgba(60,207,142,0.85)'];

export function DemoView({ block, geometry, params, tableSpec }: {
  block: DemoBlock; geometry: TableGeometry; params: PhysicsParams; tableSpec: TableSpec;
}) {
  const R = params.R;
  const balls = useMemo(() => layoutToBalls(block.setup, geometry, R), [block.setup, geometry, R]);
  const [spin, setSpin] = useState(block.shot.spin ?? { a: 0, b: 0 });
  const shot = useMemo(() => resolveShotSpec({ ...block.shot, spin }, balls, geometry, R), [block.shot, spin, balls, geometry, R]);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    simulateAsync(balls, shot, tableSpec, params)
      .then((tl) => { if (alive) setTimeline(tl); })
      .catch((err) => {
        console.error('[DemoView]', err);
        if (alive) setFailed(true);
      });
    return () => { alive = false; };
  }, [balls, shot, tableSpec, params, attempt]);

  const playback = usePlayback(timeline, params);
  const traces = block.trace ?? ['cue'];
  const guides = useMemo<GuideDraw[]>(
    () => (timeline && !playback.playing
      ? traces.map((id, i) => ({ kind: 'path' as const, points: samplePath(timeline, id, params), color: TRACE_COLORS[i % TRACE_COLORS.length] }))
      : []),
    [timeline, playback.playing, traces, params],
  );

  return (
    <figure className="demo">
      <TableCanvas geometry={geometry} balls={playback.balls ?? balls} R={R} guides={guides} label={block.caption} />
      <figcaption>{block.caption}</figcaption>
      {failed ? (
        <p className="warn" role="alert">
          No se pudo simular la demo.{' '}
          <button type="button" onClick={() => setAttempt((a) => a + 1)} data-testid="demo-retry">Reintentar</button>
        </p>
      ) : (
        <div className="row">
          <button type="button" disabled={!timeline} onClick={() => timeline && setTimeline({ ...timeline })} data-testid="demo-replay">Repetir</button>
          {playback.playing && <button type="button" onClick={playback.skip}>Saltar</button>}
        </div>
      )}
      {block.interactive === 'spin' && (
        <div className="demo-spin">
          <SpinPad a={spin.a} b={spin.b} size={84} onChange={(a, b) => setSpin({ a, b })} />
          <div className="row">
            {PRESETS.map((p) => (
              <button key={p.label} type="button" aria-pressed={spin.a === p.a && spin.b === p.b} onClick={() => setSpin({ a: p.a, b: p.b })}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </figure>
  );
}
```

- [ ] **Step 4: Reescribir `src/app/components/TheoryBlockView.tsx`**

```tsx
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
```

En `src/app/screens/LessonScreen.tsx`:
- Reemplazar `const { geometry, params, stats, passed, settings } = useProgress();` por `const { geometry, params, tableSpec, stats, passed, settings } = useProgress();`.
- Reemplazar `<TheoryBlockView block={block} geometry={geometry} R={params.R} showGuides={settings.showGuidesByDefault} />` por `<TheoryBlockView block={block} geometry={geometry} params={params} tableSpec={tableSpec} showGuides={settings.showGuidesByDefault} />`.

Agregar a `src/styles.css`:
```css
.theory-image img { width: 100%; height: auto; border-radius: 12px; display: block; background: var(--surface); }
.image-fallback { padding: 24px 12px; border-radius: 12px; background: var(--surface); color: var(--muted); text-align: center; margin: 0; }
.demo { display: grid; gap: 8px; }
.demo-spin { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.demo-spin .row button { padding: 6px 10px; font-size: 0.85rem; }
.demo-spin button[aria-pressed='true'] { border-color: var(--accent); }
```

- [ ] **Step 5: Correr tests y tipos**

Run: `npx vitest run src/app && npx tsc --noEmit`
Expected: PASS. `ExerciseScreen` todavía no despacha `predict`; si `tsc` se queja por eso, se resuelve en el Task 7.

- [ ] **Step 6: Commit**

```bash
git add src/app src/styles.css
git commit -m "feat(theory): image blocks with credits and simulator demo blocks" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013YgBi7rRQnbweQruREWpza"
```

---

### Task 7: Onboarding, test de ubicación, modo sin mesa en ejercicios y estados en pantallas

**Files:**
- Create: `src/app/screens/WelcomeScreen.tsx`, `src/app/screens/PlacementScreen.tsx`
- Modify: `src/app/routes.ts`, `src/app/App.tsx`, `src/app/format.ts`, `src/app/screens/HomeScreen.tsx`, `src/app/screens/SettingsScreen.tsx`, `src/app/screens/ExerciseScreen.tsx` (reescritura), `src/app/screens/LessonMapScreen.tsx` (reescritura), `src/app/screens/LessonScreen.tsx`, `src/app/screens/StatsScreen.tsx`, `src/styles.css`
- Test: `src/app/routes.test.ts`, `src/app/App.test.tsx`

**Interfaces:**
- Consumes: `status(lesson)` (Task 1), `PLACEMENT`, `scorePlacement` (Task 3), `PredictExercise` (Task 5).
- Produces:
  - Rutas `{ name: 'welcome' }` (`#/welcome`) y `{ name: 'placement' }` (`#/placement`).
  - `STATUS_LABEL`.
  - Test ids: `welcome-yes`, `welcome-sometimes`, `welcome-no`, `welcome-placement`, `welcome-skip`, `placement-summary`, `placement-done`, `has-table`, `repeat-placement` y `skip-optional`.

- [ ] **Step 1: Tests que fallan**

En `src/app/routes.test.ts`, agregar dos filas a la tabla de `test.each`:
```ts
    ['#/welcome', { name: 'welcome' }],
    ['#/placement', { name: 'placement' }],
```

Reemplazar `src/app/App.test.tsx` completo por:
```tsx
import { describe, expect, test } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from './App';
import { createMemoryStore } from '../progress/store';
import { DEFAULT_SETTINGS, type Settings } from '../progress/types';

const factory = (patch: Partial<Settings> = { onboardingDone: true }) => async () => {
  const s = createMemoryStore();
  await s.saveSettings({ ...DEFAULT_SETTINGS, ...patch });
  return s;
};

describe('App', () => {
  test('home: continue card, and a warning when progress is not persistent', async () => {
    window.location.hash = '#/';
    render(<App storeFactory={factory()} />);
    expect(await screen.findByTestId('continue-lesson')).toHaveAttribute('href', '#/lesson/ghost-ball');
    expect(screen.getByRole('alert')).toHaveTextContent(/no se está guardando/);
  });
  test('first run: welcome → no table → skip placement → home', async () => {
    window.location.hash = '#/';
    render(<App storeFactory={factory({})} />);
    fireEvent.click(await screen.findByTestId('welcome-no'));
    fireEvent.click(screen.getByTestId('welcome-skip'));
    expect(await screen.findByTestId('continue-lesson')).toBeInTheDocument();
  });
  test('lesson screen shows the title and the start button', async () => {
    window.location.hash = '#/lesson/ghost-ball';
    render(<App storeFactory={factory()} />);
    expect(await screen.findByTestId('start-exercises')).toHaveAttribute('href', '#/lesson/ghost-ball/ex/0');
    expect(screen.getByRole('heading', { level: 1, name: /Bola fantasma/ })).toBeInTheDocument();
  });
  test('without a table, real-table exercises are not counted', async () => {
    window.location.hash = '#/lesson/ghost-ball/ex/4';
    render(<App storeFactory={factory({ onboardingDone: true, hasTable: 'no' })} />);
    expect(await screen.findByRole('heading', { level: 1, name: /5\/5/ })).toBeInTheDocument();
  });
  test('hidden exercise deep link redirects to the lesson', async () => {
    window.location.hash = '#/lesson/ghost-ball/ex/5';
    render(<App storeFactory={factory({ onboardingDone: true, hasTable: 'no' })} />);
    await waitFor(() => expect(window.location.hash).toBe('#/lesson/ghost-ball'));
  });
  test('unknown lesson shows a not-found message', async () => {
    window.location.hash = '#/lesson/nope';
    render(<App storeFactory={factory()} />);
    expect(await screen.findByText(/No encontramos/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run src/app`
Expected: FAIL (rutas nuevas, onboarding, filtrado).

- [ ] **Step 3: Rutas, labels y App**

En `src/app/routes.ts`:
- En el tipo `Route`, agregar `| { name: 'welcome' } | { name: 'placement' }`.
- En `parseHash`, después de la línea de `settings`, agregar:
```ts
  if (parts[0] === 'welcome') return { name: 'welcome' };
  if (parts[0] === 'placement') return { name: 'placement' };
```
- En `href`, agregar:
```ts
    case 'welcome': return '#/welcome';
    case 'placement': return '#/placement';
```

En `src/app/format.ts`, agregar:
```ts
import type { LessonStatus } from '../progress/status';

export const STATUS_LABEL: Record<LessonStatus, string> = {
  passedTable: 'Aprobada en mesa ✓✓',
  passedSim: 'Aprobada ✓',
  passedPlacement: 'Aprobada por ubicación ✓',
  inProgress: 'En progreso',
  new: 'Nueva',
  locked: 'Bloqueada',
};
```

En `src/app/App.tsx`:
- Agregar `import { WelcomeScreen } from './screens/WelcomeScreen';` e `import { PlacementScreen } from './screens/PlacementScreen';`.
- En `renderRoute`, agregar:
```tsx
    case 'welcome': return <WelcomeScreen />;
    case 'placement': return <PlacementScreen />;
```

- [ ] **Step 4: `WelcomeScreen` y `PlacementScreen`**

`src/app/screens/WelcomeScreen.tsx`:
```tsx
import { useState } from 'react';
import type { Settings } from '../../progress/types';
import { useProgress } from '../ProgressContext';
import { navigate } from '../routes';

const OPTIONS: { value: Settings['hasTable']; title: string; text: string }[] = [
  { value: 'yes', title: 'Sí, tengo mesa', text: 'Las lecciones incluyen rutinas para practicar en la mesa real.' },
  { value: 'sometimes', title: 'A veces', text: 'Las rutinas de mesa son opcionales: aprobás con el simulador.' },
  { value: 'no', title: 'No tengo mesa', text: 'Aprendés y aprobás todo con el simulador.' },
];

export function WelcomeScreen() {
  const { updateSettings } = useProgress();
  const [step, setStep] = useState<1 | 2>(1);
  const choose = (hasTable: Settings['hasTable']) => {
    void updateSettings({ hasTable });
    setStep(2);
  };
  const finish = async (placement: boolean) => {
    await updateSettings({ onboardingDone: true });
    navigate(placement ? { name: 'placement' } : { name: 'home' });
  };
  return (
    <div className="screen welcome">
      <header className="hero">
        <h1>AimPool</h1>
        <p>Te enseñamos a apuntar en pool, desde cero.</p>
      </header>
      {step === 1 ? (
        <section className="welcome-step">
          <h2>¿Tenés una mesa de pool para practicar?</h2>
          {OPTIONS.map((o) => (
            <button key={o.value} type="button" className="choice-big" data-testid={`welcome-${o.value}`} onClick={() => choose(o.value)}>
              <strong>{o.title}</strong>
              <span>{o.text}</span>
            </button>
          ))}
        </section>
      ) : (
        <section className="welcome-step">
          <h2>¿Hacemos un test de ubicación?</h2>
          <p>Son unas preguntas en pantalla (unos 5 minutos). Si ya sabés algo, te salteás lo que dominás.</p>
          <button type="button" className="primary big" data-testid="welcome-placement" onClick={() => { void finish(true); }}>Hacer el test</button>
          <button type="button" className="big" data-testid="welcome-skip" onClick={() => { void finish(false); }}>Saltear, empiezo de cero</button>
        </section>
      )}
      <p className="muted">Podés cambiar esto cuando quieras en Ajustes.</p>
    </div>
  );
}
```

`src/app/screens/PlacementScreen.tsx`:
```tsx
import { useState } from 'react';
import { lessonById } from '../../content/curriculum';
import { PLACEMENT, scorePlacement } from '../../content/placement';
import { EstimateExercise } from '../../exercises/EstimateExercise';
import { PredictExercise } from '../../exercises/PredictExercise';
import { useProgress } from '../ProgressContext';
import { navigate } from '../routes';
import { TopBar } from '../components/TopBar';

export function PlacementScreen() {
  const { geometry, params, tableSpec, updateSettings } = useProgress();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [passed, setPassed] = useState<string[] | null>(null);
  const env = { geometry, params, tableSpec };

  const answer = (ok: boolean) => setAnswers((a) => { const n = a.slice(); n[i] = ok; return n; });
  const advance = async () => {
    if (i + 1 < PLACEMENT.length) {
      setI(i + 1);
      return;
    }
    const p = scorePlacement(PLACEMENT, answers);
    await updateSettings({ placement: { completedAt: Date.now(), passed: p } });
    setPassed(p);
  };

  if (passed) {
    return (
      <div className="screen">
        <TopBar title="Test de ubicación" back={{ name: 'home' }} />
        <div className="feedback ok" role="status" data-testid="placement-summary">
          {passed.length === 0 ? (
            <p>Arrancás desde el principio: es el mejor camino para aprender bien la base.</p>
          ) : (
            <>
              <p>Aprobaste por ubicación:</p>
              <ul>{passed.map((id) => <li key={id}>{lessonById(id)?.title ?? id}</li>)}</ul>
              <p>Igual podés hacerlas cuando quieras para practicar.</p>
            </>
          )}
          <button type="button" className="primary" onClick={() => navigate({ name: 'map' })} data-testid="placement-done">Ir al mapa</button>
        </div>
      </div>
    );
  }

  const item = PLACEMENT[i];
  return (
    <div className="screen">
      <TopBar title={`Test de ubicación · ${i + 1}/${PLACEMENT.length}`} back={{ name: 'home' }} />
      {item.exercise.kind === 'estimate' ? (
        <EstimateExercise key={i} exercise={item.exercise} env={env} onAnswer={(ok) => answer(ok)} onContinue={() => { void advance(); }} />
      ) : (
        <PredictExercise key={i} exercise={item.exercise} env={env} onAnswer={(ok) => answer(ok)} onContinue={() => { void advance(); }} />
      )}
    </div>
  );
}
```

- [ ] **Step 5: `HomeScreen` (redirección) y `SettingsScreen`**

En `src/app/screens/HomeScreen.tsx`:
- Agregar `import { useEffect } from 'react';` y cambiar `import { href } from '../routes';` por `import { href, navigate } from '../routes';`.
- Después de `const next = ...;`, agregar:
```tsx
  useEffect(() => {
    if (ready && !settings.onboardingDone) navigate({ name: 'welcome' });
  }, [ready, settings.onboardingDone]);
```

En `src/app/screens/SettingsScreen.tsx`:
- Agregar `import type { Settings } from '../../progress/types';` e `import { href } from '../routes';`.
- Después del `</label>` del selector `table-size`, agregar:
```tsx
      <label className="field">
        ¿Tenés mesa para practicar?
        <select value={settings.hasTable} data-testid="has-table" onChange={(e) => updateSettings({ hasTable: e.target.value as Settings['hasTable'] })}>
          <option value="yes">Sí</option>
          <option value="sometimes">A veces (la mesa es opcional)</option>
          <option value="no">No (solo simulador)</option>
        </select>
      </label>
      <a className="button" href={href({ name: 'placement' })} data-testid="repeat-placement">
        {settings.placement ? 'Repetir test de ubicación' : 'Hacer test de ubicación'}
      </a>
```

- [ ] **Step 6: Reescribir `src/app/screens/ExerciseScreen.tsx`**

```tsx
import { useEffect, useMemo, useRef } from 'react';
import { lessonById } from '../../content/curriculum';
import { EstimateExercise } from '../../exercises/EstimateExercise';
import { PredictExercise } from '../../exercises/PredictExercise';
import { RealTableExercise } from '../../exercises/RealTableExercise';
import { SimShotExercise } from '../../exercises/SimShotExercise';
import { newId } from '../../progress/store';
import { useProgress } from '../ProgressContext';
import { navigate } from '../routes';
import { TopBar } from '../components/TopBar';
import { NotFound } from './LessonScreen';

export function ExerciseScreen({ id, index }: { id: string; index: number }) {
  const { geometry, params, tableSpec, settings, recordAttempt, recordSession } = useProgress();
  const startedAt = useRef(Date.now());
  const sessionId = useRef(newId());
  const lesson = lessonById(id);
  const visible = useMemo(
    () => (lesson?.exercises ?? [])
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => !(e.kind === 'realTable' && settings.hasTable === 'no'))
      .map(({ i }) => i),
    [lesson, settings.hasTable],
  );
  const exists = !!lesson && index < lesson.exercises.length;
  const hidden = exists && !visible.includes(index);
  const nextIndex = visible.find((i) => i > index);
  const goNext = () => navigate(nextIndex !== undefined ? { name: 'exercise', id, index: nextIndex } : { name: 'lesson', id });

  useEffect(() => {
    if (hidden) navigate(nextIndex !== undefined ? { name: 'exercise', id, index: nextIndex } : { name: 'lesson', id });
  }, [hidden, nextIndex, id]);

  const ex = lesson?.exercises[index];
  if (!lesson || !ex) return <NotFound />;
  if (hidden) return null;
  const env = { geometry, params, tableSpec };
  const optional = ex.kind === 'realTable' && settings.hasTable === 'sometimes';

  return (
    <div className="screen exercise-screen">
      <TopBar title={`${lesson.title} · ${visible.indexOf(index) + 1}/${visible.length}`} back={{ name: 'lesson', id }} />
      {optional && (
        <div className="optional-bar">
          <span className="chip">Opcional</span>
          <span>Si hoy no tenés mesa, podés saltearlo.</span>
          <button type="button" className="link" onClick={goNext} data-testid="skip-optional">Saltear</button>
        </div>
      )}
      {ex.kind === 'estimate' && (
        <EstimateExercise exercise={ex} env={env} onContinue={goNext}
          onAnswer={(success, detail) => recordAttempt({ lessonId: id, exerciseIndex: index, kind: 'estimate', success, detail })} />
      )}
      {ex.kind === 'simShot' && (
        <SimShotExercise exercise={ex} env={env} onContinue={goNext}
          onAttempt={(success, detail) => recordAttempt({ lessonId: id, exerciseIndex: index, kind: 'simShot', success, detail })} />
      )}
      {ex.kind === 'predict' && (
        <PredictExercise exercise={ex} env={env} onContinue={goNext}
          onAnswer={(success, detail) => recordAttempt({ lessonId: id, exerciseIndex: index, kind: 'predict', success, detail })} />
      )}
      {ex.kind === 'realTable' && (
        <RealTableExercise exercise={ex} env={env} onContinue={goNext}
          onShots={(shots) => recordSession({ id: sessionId.current, lessonId: id, exerciseIndex: index, shots, startedAt: startedAt.current, endedAt: Date.now() })} />
      )}
    </div>
  );
}
```

- [ ] **Step 7: Estados en el mapa, la lección y las estadísticas**

Reescribir `src/app/screens/LessonMapScreen.tsx`:
```tsx
import { orderedLessons } from '../../content/curriculum';
import { isPassed } from '../../progress/status';
import { LEVEL_LABEL, LEVELS, pct, STATUS_LABEL } from '../format';
import { useProgress } from '../ProgressContext';
import { href } from '../routes';
import { TopBar } from '../components/TopBar';

export function LessonMapScreen() {
  const { stats, status, settings } = useProgress();
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
                const st = status(l);
                const s = stats(l);
                const body = (
                  <>
                    <span className="status">{l.module} · {STATUS_LABEL[st]}</span>
                    <strong>{l.title}</strong>
                    <span className="status">
                      Simulador {pct(s.simRate)}{settings.hasTable !== 'no' && ` · Mesa ${pct(s.tableRate)}`}
                    </span>
                  </>
                );
                return (
                  <li key={l.id} className={`path-item${isPassed(st) ? ' passed' : ''}${st === 'locked' ? ' locked' : ''}`}>
                    {st !== 'locked'
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

En `src/app/screens/LessonScreen.tsx`:
- Cambiar la desestructuración a `const { geometry, params, tableSpec, stats, status, passed, settings } = useProgress();`.
- Reemplazar `const unlocked = isUnlocked(lesson, passed, settings.ignoreLocks);` por `const st = status(lesson);` y `const unlocked = st !== 'locked';`.
- Reemplazar el contenido de `progress-box` por:
```tsx
        Simulador: {pct(s.simRate)} ({s.simAttempts}){settings.hasTable !== 'no' && ` · Mesa real: ${pct(s.tableRate)} (${s.tableShots} tiros)`} · {STATUS_LABEL[st]}
```
- Ajustar los imports: quitar `isUnlocked` (dejar `lessonById`) y agregar `STATUS_LABEL` al import de `../format`.

En `src/app/screens/StatsScreen.tsx`:
- Cambiar `const { attempts, sessions, stats } = useProgress();` por `const { attempts, sessions, stats, status } = useProgress();`.
- Reemplazar `<td>{s.passed ? 'Aprobada' : '—'}</td>` por `<td>{STATUS_LABEL[status(l)]}</td>`.
- Agregar `STATUS_LABEL` al import de `../format`.

Agregar a `src/styles.css`:
```css
.welcome-step { display: grid; gap: 10px; }
.welcome-step h2 { font-size: 1.15rem; margin: 4px 0; }
.choice-big { display: grid; gap: 4px; text-align: left; padding: 16px; border-radius: var(--radius); }
.choice-big span { color: var(--muted); font-size: 0.9rem; }
.optional-bar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; font-size: 0.9rem; color: var(--muted); }
.chip { background: var(--surface-2); border: 1px solid var(--accent); color: var(--accent); border-radius: 999px; padding: 2px 10px; font-size: 0.75rem; }
```

- [ ] **Step 8: Correr todo**

Run: `npx tsc --noEmit && npx vitest run`
Expected: PASS (suite completa).

- [ ] **Step 9: Commit**

```bash
git add src
git commit -m "feat(app): onboarding, placement test, no-table mode and lesson status labels" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013YgBi7rRQnbweQruREWpza"
```

---

### Task 8: Respaldo si falla el Worker + no registrar intentos después de salir

**Files:**
- Modify: `src/sim/client.ts`, `src/exercises/SimShotExercise.tsx`
- Test: `src/sim/client.fallback.test.ts`, agregar a `src/exercises/SimShotExercise.test.tsx`

- [ ] **Step 1: Tests que fallan**

`src/sim/client.fallback.test.ts`:
```ts
import { expect, test, vi } from 'vitest';
import { DEFAULT_PARAMS as p } from '../physics/params';
import { DEFAULT_TABLE_SPEC } from '../table/geometry';

class BrokenWorker {
  static created = 0;
  onmessage: unknown = null;
  onerror: ((e: { message: string }) => void) | null = null;
  constructor() { BrokenWorker.created++; }
  postMessage() { setTimeout(() => this.onerror?.({ message: 'boom' }), 0); }
  terminate() {}
}

test('a worker that fails to load falls back to the main thread, once and for all', async () => {
  vi.stubGlobal('Worker', BrokenWorker);
  const { simulateAsync } = await import('./client');
  const args = [
    [{ id: 'cue', r: [0.6, 0.6, p.R], v: [0, 0, 0], w: [0, 0, 0], motion: 'stationary' as const }],
    { cueBallId: 'cue', azimuth: 0, elevation: 0, a: 0, b: 0, cueSpeed: 1 },
    DEFAULT_TABLE_SPEC, p,
  ] as const;
  const tl = await simulateAsync(...args);
  expect(tl.events[0].kind).toBe('strike');
  await simulateAsync(...args);
  expect(BrokenWorker.created).toBe(1);
  vi.unstubAllGlobals();
});
```

Agregar a `src/exercises/SimShotExercise.test.tsx`:
```tsx
test('leaving during "Calculando…" does not record an attempt', async () => {
  const onAttempt = vi.fn();
  const ex: Extract<Exercise, { kind: 'simShot' }> = {
    kind: 'simShot', prompt: 'p', attempts: 1,
    setup: { balls: [{ id: 'cue', at: { x: 4, y: 1 } }, { id: '1', at: { x: 6, y: 2 } }] },
    goal: { pocketBall: { ball: '1', pocket: 'c84' } },
    showGuides: { aimLine: true, ghostBall: false, contactPreview: false },
  };
  const { unmount } = render(<SimShotExercise exercise={ex} env={env} onAttempt={onAttempt} onContinue={() => {}} />);
  fireEvent.click(screen.getByTestId('shoot'));
  unmount();
  await new Promise((r) => setTimeout(r, 50));
  expect(onAttempt).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run src/sim src/exercises/SimShotExercise.test.tsx`
Expected: FAIL. El fallback rechaza con "boom" y el intento se registra después del unmount.

- [ ] **Step 3: Implementar**

En `src/sim/client.ts`:
- Reemplazar la declaración de `pending` por:
```ts
let workerBroken = false;
const pending = new Map<number, { resolve: (t: Timeline) => void; reject: (e: Error) => void; req: Omit<SimRequest, 'id'> }>();
```
- Reemplazar `getWorker` completo por:
```ts
function getWorker(): Worker | null {
  if (workerBroken || typeof Worker === 'undefined') return null;
  if (!worker) {
    try {
      worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    } catch (err) {
      console.warn('[sim] no hay worker; simulo en el hilo principal', err);
      workerBroken = true;
      return null;
    }
    worker.onmessage = (e: MessageEvent<SimResponse>) => {
      const job = pending.get(e.data.id);
      if (!job) return;
      pending.delete(e.data.id);
      if (e.data.ok) job.resolve(e.data.timeline);
      else job.reject(new Error(e.data.error));
    };
    worker.onerror = (e) => {
      console.warn('[sim] el worker falló; sigo en el hilo principal:', e.message);
      workerBroken = true;
      worker?.terminate();
      worker = null;
      for (const [id, job] of pending) {
        pending.delete(id);
        try { job.resolve(runRequest(job.req)); } catch (err) { job.reject(err instanceof Error ? err : new Error(String(err))); }
      }
    };
  }
  return worker;
}
```
- En `simulateAsync`, reemplazar `pending.set(id, { resolve, reject });` por `pending.set(id, { resolve, reject, req: { balls, shot, table, params } });`.

En `src/exercises/SimShotExercise.tsx`:
- Después de `const lastDrag = useRef<Vec3 | null>(null);`, agregar:
```tsx
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
```
- En `shoot`, justo después de `const tl = await simulateAsync(...);`, agregar `if (!alive.current) return;`.
- En el `catch`, envolver con `if (alive.current) setError(...)`.
- En el `finally`, cambiar a `if (alive.current) setBusy(false);`.

- [ ] **Step 4: Correr tests**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim src/exercises
git commit -m "fix: main-thread fallback when the worker fails; no attempt recorded after leaving" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013YgBi7rRQnbweQruREWpza"
```

---

### Task 9: E2E y publicación

**Files:**
- Modify: `e2e/ghost-ball.spec.ts`, `e2e/offline.spec.ts`
- Create: `e2e/no-table.spec.ts`

- [ ] **Step 1: Actualizar `e2e/ghost-ball.spec.ts`**

- Después de `await page.goto('./');`, agregar:
```ts
  await page.getByTestId('welcome-yes').click();
  await page.getByTestId('welcome-skip').click();
```
- Después del bucle `for (const attempts of [5, 8])`, y antes del bucle de mesa real, agregar:
```ts
  await page.getByRole('img', { name: /predicción/ }).click({ position: { x: 120, y: 150 } });
  await page.getByTestId('predict-submit').click();
  const skipP = page.getByTestId('skip-playback');
  const res = page.getByTestId('predict-result');
  await expect(skipP.or(res)).toBeVisible({ timeout: 15_000 });
  if (await skipP.isVisible()) await skipP.click({ timeout: 2_000 }).catch(() => {});
  await expect(res).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('exercise-continue').click();
```

- [ ] **Step 2: Actualizar `e2e/offline.spec.ts`**

Después de `await page.goto('./');`, agregar:
```ts
  await page.getByTestId('welcome-no').click();
  await page.getByTestId('welcome-skip').click();
```

- [ ] **Step 3: Crear `e2e/no-table.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('without a table: onboarding, placement test, lesson without real-table exercises', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('welcome-no').click();
  await page.getByTestId('welcome-placement').click();

  await page.getByTestId('choice-1').click();
  await page.getByTestId('estimate-submit').click();
  await page.getByTestId('exercise-continue').click();
  await page.getByTestId('angle-slider').fill('32');
  await page.getByTestId('estimate-submit').click();
  await page.getByTestId('exercise-continue').click();

  await expect(page.getByTestId('placement-summary')).toBeVisible();
  await page.getByTestId('placement-done').click();
  await page.getByTestId('lesson-card-ghost-ball').click();
  await page.getByTestId('start-exercises').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('1/5');
});
```

- [ ] **Step 4: Correr E2E y build**

Run: `npm run e2e`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add e2e
git commit -m "test(e2e): onboarding, placement and no-table flows" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013YgBi7rRQnbweQruREWpza"
```

- [ ] **Step 6: Publicar**

El usuario ya autorizó publicar las actualizaciones de la app. Mergear `feat/2a-plataforma` a `main` (fast-forward), hacer push y verificar con `gh run watch` que el workflow "CI y deploy" termine en verde.

---

## Self-review

- **Cobertura de la spec:**
  - §3.1 settings → Task 1.
  - §3.2 estados → Tasks 1 y 7.
  - §3.3 `predict` → Tasks 2, 3 y 5.
  - §3.4 bloques → Tasks 3 y 6.
  - §3.5 ubicación → Tasks 3 y 7.
  - §4 pantallas → Task 7.
  - §5 deuda técnica → Tasks 4 (`firstContact`) y 8.
  - §6 imágenes → Task 3.
  - §7 errores → Tasks 5, 6 y 8.
  - §8 testing → todos los tasks más el Task 9.
- **Consistencia de tipos:**
  - `status(lesson)` se define en el Task 1 y se usa en el Task 7.
  - `TheoryBlockView` cambia de firma en el Task 6 y el único llamador (`LessonScreen`) se actualiza en el mismo task.
  - `Attempt.kind 'predict'` se define en el Task 1 y se usa en el Task 7.
- **Pendiente explícito:** entre los Tasks 3 y 7 pueden quedar errores de `tsc` por uniones nuevas todavía sin despachar. Cada task lo indica en su step de verificación.
