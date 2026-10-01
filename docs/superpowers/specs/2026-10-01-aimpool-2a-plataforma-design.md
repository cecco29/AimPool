# AimPool — Sub-proyecto 2a: plataforma para aprender sin mesa

**Fecha:** 2026-10-01
**Estado:** borrador para revisión
**Depende de:** sub-proyecto 1 (en `main`). Prepara el terreno para el 2b (lecciones de Fundamentos, tiros directos, control de blanca y postura).

## 1. Intención

La app tiene que servir **también a quien no tiene mesa** y enseñar desde lo más básico. El 2a no agrega lecciones nuevas, salvo ejemplos mínimos para probar las piezas. Lo que agrega son las piezas que el contenido del 2b va a necesitar:

1. Onboarding que pregunta si tenés mesa y ofrece el test de ubicación.
2. Modo sin mesa: aprobar con el simulador.
3. Ejercicio "predecir la blanca".
4. Bloques de teoría con imágenes con crédito y con demos del simulador.
5. Motor del test de ubicación, solo en pantalla.
6. Arreglos chicos que quedaron de la revisión del sub-proyecto 1.

### Criterios de éxito

- En el primer uso aparece el onboarding. Si elegís "No tengo mesa", nunca ves ejercicios de mesa real y aun así podés aprobar lecciones.
- Si elegís "Sí, tengo mesa", el comportamiento es el actual, y una lección aprobada en mesa muestra un distintivo.
- Un ejercicio de predicción funciona de punta a punta: tocás la mesa, la app simula, dibuja la trayectoria real junto a tu marca y te dice si acertaste.
- Una lección puede mostrar imágenes con su crédito y licencia, y una demo animada del simulador con "Repetir".
- El test de ubicación (unas 10 preguntas) aprueba las lecciones cuyas preguntas respondiste todas bien.
- Todo funciona offline, incluidas las imágenes.

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| ¿Tenés mesa? | Se pregunta en el primer uso. Opciones: **Sí** / **A veces** / **No**. Se puede cambiar en Ajustes |
| Sin mesa | Los ejercicios `realTable` se ocultan y la lección se aprueba solo con el simulador |
| "A veces" | Los ejercicios de mesa se muestran pero son **opcionales**: se aprueba con el simulador y la mesa suma el distintivo |
| Test de ubicación | Solo en pantalla (estimar + predecir), unos 10 ítems |
| Imágenes | Ilustraciones estáticas. Solo imágenes de internet con licencia libre verificada (CC0, CC-BY, CC-BY-SA, dominio público), con atribución visible. Los huecos se cubren con SVG propios. Nada de animaciones de mano o postura |
| Animación | Solo demos del simulador (física real), que son la animación de calidad que podemos garantizar |
| Fuentes con copyright | Dr. Dave, Billiard University y otros: solo como link en "Fuentes", nunca embebidas |

## 3. Modelo de datos

### 3.1 Settings (`progress/types.ts`)

Campos nuevos; `SCHEMA_VERSION` sigue en 1, porque los campos son opcionales y se mezclan con los defaults:

```ts
hasTable: 'yes' | 'sometimes' | 'no';   // default 'yes' (compatibilidad con usuarios existentes)
onboardingDone: boolean;                 // default false
placement?: { completedAt: number; passed: string[] }; // lecciones aprobadas por ubicación
```

**Migración:** a un usuario que ya tiene progreso guardado (intentos o sesiones) se le asume `onboardingDone: true` y `hasTable: 'yes'`, para no mostrarle la bienvenida de nuevo.

### 3.2 Estado de una lección

`lessonStatus(lesson, stats, settings)` devuelve uno de estos estados:

- `'passedTable'`: aprobada con el simulador **y** con la mesa. Solo es posible si `hasTable` no es `'no'` y la lección tiene ejercicios de mesa real.
- `'passedSim'`: aprobada con el simulador. Si `hasTable === 'yes'` y la lección tiene ejercicios de mesa real, este estado **no** alcanza para "aprobada" (comportamiento actual).
- `'passedPlacement'`: la lección figura en `settings.placement.passed`.
- `'inProgress'` / `'new'` / `'locked'`.

**"Aprobada" para desbloquear prerrequisitos:**

| `hasTable` | Estados que cuentan como aprobada |
|---|---|
| `'yes'` | `passedTable`, `passedPlacement`, o `passedSim` en una lección sin ejercicios de mesa |
| `'sometimes'` / `'no'` | `passedSim`, `passedTable`, `passedPlacement` |

### 3.3 Ejercicio de predicción (`content/types.ts`)

```ts
/** Cómo se define un tiro fijo en contenido (sin depender del tamaño de mesa). */
type ShotSpec = {
  aim: { ghostOf: string; pocket: PocketId } | { at: DiamondPos } | { azimuthDeg: number };
  power: number;             // 0..1 (misma escala que el taco)
  spin?: { a: number; b: number };
  elevationDeg?: number;
};

type Exercise = /* ...los actuales... */
  | { kind: 'predict'; prompt: string; setup: BallLayout; shot: ShotSpec;
      question: 'cueStop' | 'cueDirection'; tolerance: number; explanation: string };
```

- **`cueStop`**: tocás dónde creés que termina la blanca. Acertás si la distancia entre tu marca y la posición final real es menor o igual a `tolerance` (en diamantes).
- **`cueDirection`**: tocás un punto por el que creés que pasa la blanca después del primer contacto con una bola. Acertás si el ángulo entre la dirección "punto de contacto → tu marca" y la dirección de salida real es menor o igual a `tolerance` (en grados).
  - La dirección de salida real es la velocidad de la blanca en la primera transición posterior al choque, es decir, cuando ya terminó de curvarse.
- **Resolución del tiro:** `resolveShotSpec(spec, balls, geometry)` lo convierte en un `Shot`. `ghostOf` apunta a la bola fantasma, `at` apunta a una posición en diamantes y `azimuthDeg` es una dirección absoluta.

### 3.4 Bloques de teoría nuevos

```ts
type TheoryBlock = /* ...los actuales... */
  | { kind: 'image'; src: string; alt: string; caption: string;
      credit?: { author: string; license: string; url: string } }   // sin credit = ilustración propia
  | { kind: 'demo'; setup: BallLayout; shot: ShotSpec; caption: string;
      trace?: string[]; interactive?: 'spin' };
```

- **`image.src`:** ruta relativa dentro de `public/illustrations/`. La imagen se descarga al repo y queda en el precache del service worker, así funciona offline. El crédito se muestra debajo de la imagen: "Foto: Autor · CC BY-SA 4.0" con link.
- **`demo`:** al aparecer en pantalla, reproduce el tiro una vez y dibuja la trayectoria de las bolas listadas en `trace` (por defecto, la blanca). Tiene un botón "Repetir". Con `interactive: 'spin'` muestra además el panel de efecto: cada cambio vuelve a simular y redibuja la trayectoria, sin puntuar.

### 3.5 Test de ubicación (`content/placement.ts`)

```ts
interface PlacementItem { lessonId: string; exercise: Extract<Exercise, { kind: 'estimate' | 'predict' }> }
export const PLACEMENT: PlacementItem[];   // ordenados por dificultad
```

- **Resultado:** `passed` es la lista de lecciones cuyos ítems acertaste todos. Se guarda en `settings.placement`.
- **Repetir el test:** reemplaza el resultado anterior. Las aprobaciones obtenidas por ejercicio no se pierden, porque viven en los intentos, no en `placement`.
- **Contenido en el 2a:** solo los ítems de Ghost ball (2 o 3). El 2b agrega los del resto.
- **Validación:** `validateCurriculum` también valida `PLACEMENT`:
  - cada ítem referencia una lección existente;
  - la disposición de las bolas es válida;
  - cada lección con ítems tiene al menos 2.

## 4. Pantallas y flujo

- **`#/welcome`** (Onboarding):
  1. Paso 1: "¿Tenés una mesa de pool para practicar?" con tres botones grandes (Sí / A veces / No).
  2. Paso 2: "¿Hacemos un test de ubicación de unos 5 minutos?" con las opciones Hacer el test / Saltear.
  3. Al terminar se marca `onboardingDone`.
  - Si `onboardingDone` es falso, Home redirige a `#/welcome`.
- **`#/placement`:** las preguntas una por una, con un contador; al final, un resumen con las lecciones aprobadas y un botón "Ir al mapa".
- **Ejercicios:**
  - En `ExerciseScreen` la secuencia salta los `realTable` cuando `hasTable === 'no'`. La numeración "3/5" cuenta solo los ejercicios visibles.
  - Con `'sometimes'`, los ejercicios de mesa se muestran con la etiqueta "Opcional" y un botón "Saltear".
- **Mapa y lección:** muestran el estado de la §3.2 con íconos: ✓ simulador, ✓✓ mesa, ✓ ubicación.
- **Ajustes:** selector "¿Tenés mesa?" y botón "Repetir test de ubicación".

## 5. Componentes nuevos o modificados

| Archivo | Cambio |
|---|---|
| `content/types.ts` | `ShotSpec`, ejercicio `predict`, bloques `image` y `demo` |
| `content/shotSpec.ts` (nuevo) | `resolveShotSpec(spec, balls, g)` |
| `content/predict.ts` (nuevo) | `evaluatePrediction(question, tolerance, tap, timeline, g, p)` → `{ success, actual, errorText }` |
| `content/placement.ts` (nuevo) | `PLACEMENT` y `scorePlacement(answers)` → `passed[]` |
| `content/validate.ts` | Valida `predict`, `image` (`src` dentro de `illustrations/`, `alt` no vacío), `demo` y `PLACEMENT` |
| `progress/types.ts`, `store.ts` | Settings nuevos, defaults y migración |
| `progress/status.ts` (nuevo) | `lessonStatus`, `countsAsPassed` |
| `exercises/PredictExercise.tsx` (nuevo) | Tocar la mesa → marca → simular → trayectoria + veredicto |
| `render/guides.ts`, `draw.ts` | Guía `path` (polilínea) y guía `marker` (la marca del usuario) |
| `app/components/TheoryBlockView.tsx` | Render de `image` (con crédito) y `demo` (`DemoView`) |
| `app/components/DemoView.tsx` (nuevo) | Demo con `usePlayback`, trayectoria y efecto interactivo |
| `app/screens/WelcomeScreen.tsx`, `PlacementScreen.tsx` (nuevos) | Onboarding y test de ubicación |
| `app/screens/ExerciseScreen.tsx` | Secuencia filtrada por `hasTable`, ejercicios opcionales y despacho a `predict` |
| `app/routes.ts` | Rutas `welcome` y `placement` |
| `sim/client.ts` | Si el Worker falla al cargar, marca un flag y simula en el hilo principal |
| `exercises/SimShotExercise.tsx` | Guard `alive`: no registra intentos si el componente ya se desmontó |
| `render/guides.ts` (`firstContact`) | Una bola pegada a la blanca (`s ≤ 1e-9` con raíz válida) cuenta como contacto inmediato |
| `content/lessons/ghost-ball.ts` | Agrega 1 bloque `demo`, 1 ejercicio `predict` (`cueDirection` con stun → regla de 90°, como anticipo) e ítems de `PLACEMENT` |

## 6. Imágenes

- **Fuentes:** la investigación en curso (`docs/research/illustrations-sources.md`) lista candidatas con licencia verificada. Se incorporan en el 2b, junto con la lección que las usa.
- **En el 2a:** solo se construye el soporte. Incluye 1 imagen de prueba propia (SVG simple de un puente abierto) para el test del bloque `image`.
- **Archivo de créditos:** `public/illustrations/CREDITS.md` acompaña a las imágenes, con autor, licencia, URL de origen y cambios hechos. Así cumple con CC-BY-SA aunque la imagen se use fuera del bloque.

## 7. Manejo de errores

- Si una imagen no carga, se muestra el texto alternativo y el pie de foto; nunca queda un hueco vacío.
- Si una demo o una predicción no se puede simular, aparece el mensaje "No se pudo simular" con un botón para reintentar; el resto de la lección sigue funcionando.
- Si la migración de settings falla, se usan los defaults y nada impide abrir la app.

## 8. Testing

- **Unitarios:**
  - `resolveShotSpec`, para las tres formas de apuntar.
  - `evaluatePrediction`: acierto y error en `cueStop` y en `cueDirection`, y el caso de una blanca que no toca ninguna bola.
  - `lessonStatus` y `countsAsPassed`, para las 3 opciones de `hasTable`.
  - `scorePlacement`.
  - La validación de los bloques y ejercicios nuevos.
  - La migración de settings.
  - El fallback del Worker.
  - El guard `alive`.
  - `firstContact` con una bola pegada.
- **De componente:**
  - `PredictExercise`: tocar, simular y mostrar el veredicto.
  - `WelcomeScreen`: la elección se guarda.
  - `ExerciseScreen`: oculta los `realTable` con `'no'`.
  - `DemoView`: con efecto interactivo, vuelve a simular.
- **E2E:**
  - Primer uso sin mesa → test de ubicación → mapa con Ghost ball aprobada por ubicación.
  - En la lección, el ejercicio de predicción funciona y no aparece ningún ejercicio de mesa real.
  - El E2E actual pasa a empezar marcando "Sí, tengo mesa" en el onboarding.

## 9. Fuera de alcance (va al 2b o después)

- Lecciones de Fundamentos, tiros directos, control de blanca y postura, con sus imágenes y sus ítems del test de ubicación.
- Animaciones de mano o postura.
- Ajustes de la física que surjan del contenido nuevo.
