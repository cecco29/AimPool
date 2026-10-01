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
      kind: 'demo',
      setup: SHOT,
      shot: { aim: { ghostOf: '1', pocket: 'c84' }, power: 0.5 },
      trace: ['cue', '1'],
      caption: 'Así se ve: la blanca va al centro de la fantasma y la 1 sale derecho a la tronera. Tocá “Repetir” para verlo otra vez.',
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
      kind: 'predict',
      prompt: 'Apuntando a la fantasma con fuerza media, ¿hacia dónde sale la blanca después de pegarle a la 1? Tocá un punto de su camino.',
      setup: SHOT,
      shot: { aim: { ghostOf: '1', pocket: 'c84' }, power: 0.5 },
      question: 'cueDirection',
      tolerance: 12,
      explanation: 'Si la blanca llega seca (sin rotación), sale a 90° de la bola objetivo: es la regla de los 90°. Si llega rodando, se abre un poco menos (regla de los 30°). Lo vas a ver en Control de blanca.',
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
