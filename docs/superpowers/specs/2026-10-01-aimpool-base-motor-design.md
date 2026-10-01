# AimPool — Sub-proyecto 1: Base + motor físico

**Fecha:** 2026-10-01
**Estado:** borrador para revisión

## 1. Contexto e intención

AimPool es una academia de pool (8/9 bolas, mesa con troneras) en forma de PWA instalable en el celular. Es una **plataforma de aprendizaje desde cero**: el usuario es jugador intermedio pero no conoce los sistemas formales de apuntado y quiere aprenderlos.

Modelo **híbrido**: cada lección combina teoría con diagramas, ejercicios en un simulador en pantalla y una rutina para practicar en la mesa real, donde el usuario registra el resultado de cada tiro.

- **Usuario:** uso personal, pero publicada gratis por link (sin cuentas). Por eso el contenido y el onboarding tienen que entenderse sin explicación previa.
- **Idioma:** español rioplatense, con el término en inglés al lado.
- **Offline:** la app funciona completa sin conexión.

### Plan general (sub-proyectos)

1. **Base + motor físico** ← *este documento*
2. Tiros directos + control de blanca (incluye el test de ubicación inicial)
3. Banks + kicks (incluye el perfil de calibración por mesa)
4. Sistemas avanzados: CTE/Pro One, parallel aiming, fracciones de 1/8, BHE/FHE y swerve, masse y salto

Material de referencia: `docs/research/physics-models.md` y `docs/research/aiming-systems-curriculum.md`. Ambos son **borradores que hay que verificar**: algunas cifras y fuentes no se pudieron leer completas (ver las notas en cada archivo).

### Criterios de éxito del sub-proyecto 1

- La app se instala en Android/iOS desde un link https (GitHub Pages) y abre sin conexión.
- Se ve una mesa de 9 pies (también se puede elegir 7 u 8 pies) con paño realista oscuro, diamantes y troneras según la norma WPA.
- Se puede apuntar, elegir el efecto y la fuerza, y tirar en el simulador. La física pasa la batería de tests de validación (sección 5.5).
- Una lección de muestra (**Ghost ball**) funciona de punta a punta: teoría → estimar → tirar en el simulador → rutina en la mesa real → progreso guardado.
- El progreso se conserva entre sesiones (IndexedDB).

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Stack | React + Vite + TypeScript, `vite-plugin-pwa`, Motion (`motion/react`) para animar la interfaz, Canvas 2D para la mesa |
| Hosting | GitHub Pages con deploy por GitHub Actions |
| Vista | Cenital 2D, más un mini-panel lateral para los saltos y el masse |
| Controles | Arrastrar para orientar el taco (con ajuste fino), panel de efecto (punto de contacto en la blanca y elevación del taco) y barra de fuerza |
| Física | Simulación completa por eventos (sección 5) |
| Registro en la mesa real | Botones rápidos por tiro: ✓ / ✗, y opcionalmente "pasó fina" / "pasó gruesa" |
| Estilo | Paño realista oscuro, interfaz oscura moderna |
| Gamificación | Liviana: desbloqueo por prerrequisitos, % de acierto, racha diaria; sin XP ni medallas |

## 3. Arquitectura

```
src/
  physics/    motor puro TS (sin DOM). Corre en Web Worker.
  table/      geometría de mesa y conversión coordenadas ↔ diamantes
  render/     dibujo en Canvas: mesa, bolas, guías, reproducción de la línea de tiempo, panel lateral
  input/      gestos: apuntar, ajuste fino, panel de efecto, fuerza
  content/    lecciones y ejercicios como datos + componentes de ejercicio
  progress/   persistencia IndexedDB (intentos, sesiones en la mesa real, ajustes)
  app/        pantallas y navegación
```

**Reglas de dependencia:** `physics`, `table` y `progress` no dependen de nadie. `render`, `input` y `content` dependen solo de `table` (y `render` consume la línea de tiempo de `physics` como datos). `app` puede usar todos los módulos.

**Flujo de un tiro:** `input` produce un `Shot` → se envía al Worker → `physics.simulate(state, shot)` devuelve un `Timeline` → `render` lo reproduce a 60 fps interpolando entre eventos → el ejercicio evalúa el `Timeline` contra su objetivo.

## 4. Geometría de mesa (`table/`)

- Medidas de la superficie de juego: 9 pies = 100×50", 8 pies = 92×46", 7 pies = 78×39" (esta última no es medida WPA; es la que usa pooltool).
- Diamantes: 3 por banda corta y 7 por banda larga, contando desde la nariz de la banda. Hay funciones `diamondToPoint(rail, n)` y `pointToDiamond(p)`, con fracciones de diamante.
- Troneras: boca de esquina de 4,5–4,625" y de centro de 5–5,125", configurables. Nariz de la banda a 63,5% del diámetro de la bola.
- Unidades internas: metros y segundos (SI). La conversión a píxeles la hace solo `render`.

## 5. Motor físico (`physics/`)

Referencia detallada: `docs/research/physics-models.md`.

### 5.1 Estado

Por bola: posición 3D `r`, velocidad `v`, velocidad angular `ω` y estado ∈ {deslizando, rodando, girando, en el aire, quieta, embocada}. Los parámetros físicos (masa, radio, fricciones, coeficientes de rebote) viven en un objeto `PhysicsParams` que se puede ajustar por mesa.

### 5.2 Simulación por eventos

- Cada estado tiene una fórmula exacta de movimiento.
- El bucle calcula el tiempo al próximo evento: cambio de estado, choque bola-bola, choque bola-banda, tronera o rebote contra el paño. Los tiempos de choque salen de las raíces de polinomios de grado 2 a 4.
- El motor avanza directo a ese momento, resuelve el evento y repite hasta que todas las bolas quedan quietas o embocadas. Si se supera un límite de eventos o de tiempo, aborta con un error controlado.
- **Salida:** `Timeline` = una lista ordenada de eventos `{t, tipo, bolas, estadoResultante}`, con la que se puede calcular la posición de cualquier bola en cualquier instante.

### 5.3 Modelos

| Fenómeno | Modelo por defecto |
|---|---|
| Golpe del taco | Impulso puntual con desplazamiento del punto de contacto (a, b) y elevación θ. Squirt según la fórmula de Dr. Dave (TP A.31). Miscue si el desplazamiento supera ~0,5R |
| Bola-bola | Choque inelástico con fricción; μ = 0.00995 + 0.108·e^(−1.088·v); restitución 0,95. El throw (CIT y SIT) aparece solo |
| Bola-banda | Han 2005. Mathavan 2010 queda detrás de una opción de "alta calidad" |
| Swerve / masse | Salen de las ecuaciones de deslizamiento con spin; no llevan código especial |
| Salto | El taco elevado genera velocidad vertical, la bola vuela en balística y rebota contra el paño en una cadena de rebotes (modelo de pooltool) |
| Troneras | Captura geométrica por la boca y las mandíbulas, con un modelo simplificado de rebote en las mandíbulas |

### 5.4 Robustez numérica

- Los tiempos se miden desde el último evento, no desde el comienzo del tiro.
- Solo se aceptan raíces en las que las bolas se están acercando, con una tolerancia ε.
- Los eventos simultáneos se resuelven en un orden fijo y determinista.
- Se protege el caso de deslizamiento cero, al pasar de deslizar a rodar.
- El resultado se calcula en una sola fuente (el Worker); no se reproduce paso a paso en distintos dispositivos.

### 5.5 Validación (TDD)

Se escriben tests antes de implementar cada modelo:
- **Regla de los 90°:** una blanca en stun sale perpendicular a la bola objetivo (±0,5°).
- **Regla de los 30°:** con la blanca rodando y un golpe de media bola, se desvía 33,7° (±1°).
- **Throw vs. ángulo de corte:** contra las tablas de referencia (son valores calculados, sirven para detectar regresiones).
- **Rebote en banda:** ángulos de salida del modelo Han, también como valores de regresión.
- **Distancias de stun y follow, squirt y dirección final del masse.**
- **Casos borde:** eventos simultáneos, bolas en contacto inicial, tiros con velocidad casi nula y el límite de eventos.

Los valores que no se midieron en una mesa están marcados así en los tests. Más adelante se validan comparando con la mesa real del usuario.

## 6. Render e input

- **Canvas 2D** con devicePixelRatio. Paño con textura sutil, bolas con sombreado y número, y sombra para indicar altura en los saltos.
- **Guías** que se pueden activar o desactivar: línea de apuntado, ghost ball, línea tangente y trayectoria prevista (opcional por ejercicio, porque en ciertos ejercicios sería hacer trampa).
- **Panel lateral:** aparece solo si hay un tramo en el aire o el taco está elevado más de cierto ángulo.
- **Input:**
  - arrastrar en la mesa orienta el taco;
  - un control de ajuste fino rota en décimas de grado;
  - una bola-diagrama permite elegir el punto de contacto, con un límite visible de miscue;
  - un slider controla la elevación del taco;
  - una barra controla la fuerza (velocidad inicial en m/s, con etiquetas "suave / media / fuerte").
- Botón **"Repetir"** para volver a ver el tiro y **"Reset"** para volver a la posición inicial.

## 7. Contenido (`content/`)

**Jerarquía:** Nivel → Módulo → Lección → Ejercicios. Las lecciones tienen `prerequisites: LessonId[]` y forman un grafo.

```ts
type Lesson = {
  id: string; level: 'principiante'|'intermedio'|'avanzado'; module: string;
  title: string; prerequisites: string[];
  theory: TheoryBlock[];          // texto, diagrama animado, tabla
  reliability?: { stars: 1|2|3; note: string };
  sources: { label: string; url: string }[];
  exercises: Exercise[];
  passCriteria: { simulator: number; realTable: number }; // por defecto 0.7 / 0.6
};
type Exercise =
  | { kind: 'estimate'; prompt: string; setup: BallLayout; answer: EstimateAnswer; input: 'choice'|'slider' }
  | { kind: 'simShot'; setup: BallLayout; variation?: VariationSpec; goal: ShotGoal; attempts: number; showGuides: GuideFlags }
  | { kind: 'realTable'; setup: BallLayout; shots: number; instructions: string; diagnose: boolean };
```

- `BallLayout` usa posiciones expresadas en diamantes, para que la misma lección sirva en cualquier tamaño de mesa.
- `ShotGoal` puede ser: embocar una bola en una tronera dada, dejar la blanca en una zona, pegar en un punto de la banda o combinar varias condiciones.
- **Mapa de lecciones:** muestra el grafo como un camino. En ajustes se puede **saltear el bloqueo**.
- **Alcance de este sub-proyecto:** los tres tipos de ejercicio funcionando y **una lección de muestra: Ghost ball**. El resto del contenido llega en los sub-proyectos 2 a 4.

## 8. Progreso (`progress/`)

IndexedDB, a través de un wrapper liviano como `idb`.

- `attempts`: `{id, schemaVersion, lessonId, exerciseIndex, kind, success, detail, createdAt}`
- `tableSessions`: `{id, schemaVersion, lessonId, shots: {success, miss?: 'fina'|'gruesa'}[], startedAt, endedAt}`
- `settings`: tamaño de mesa, medidas de las troneras, `PhysicsParams` personalizados, ignorar el bloqueo de lecciones, guías por defecto.
- **Lógica derivada:** % de acierto por lección (simulador y mesa real por separado), estado aprobada o en progreso, y racha diaria (días consecutivos con al menos un intento).
- Los ids son UUID y cada registro lleva `schemaVersion`, para migrar o sincronizar más adelante.
- Si IndexedDB no está disponible, la app sigue funcionando con progreso solo en memoria y muestra un aviso.

## 9. Pantallas (`app/`)

Inicio (continuar lección y racha) · Mapa de lecciones · Lección (teoría) · Ejercicio en el simulador · Sesión en la mesa real (diagrama de dónde ubicar las bolas, botones grandes ✓/✗ y contador) · Estadísticas · Ajustes. La interfaz está pensada para usarse en vertical con una mano. La mesa se adapta en vertical y en horizontal.

## 10. Manejo de errores

- Si el Worker falla o hay un error de simulación, se muestra un aviso y se puede reintentar el tiro; el error se registra en la consola.
- Si una lección tiene datos inválidos, se valida al cargar (en tests y en desarrollo) y se excluye en producción.
- Si sale una versión nueva, el service worker avisa con "Nueva versión disponible, recargar".

## 11. Testing

- **Vitest:** tests unitarios de `physics` (batería de validación), `table` (conversión a diamantes), `progress` (contra una IndexedDB simulada) y validación del contenido.
- **Playwright:** un test de punta a punta de la lección Ghost ball en un viewport de celular, más una verificación de funcionamiento offline.
- **CI** (GitHub Actions): tests + build + deploy a Pages en cada push a `main`.

## 12. Fuera de alcance (sub-proyecto 1)

Contenido más allá de Ghost ball, test de ubicación, perfil de calibración por mesa, saque realista con 15 bolas, IA, multijugador, cuentas y sincronización, vista 3D.
