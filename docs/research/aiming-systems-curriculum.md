# Sistemas de apuntado y de tiro en pool — Referencia para el currículo de AimPool

> Documento de investigación para diseñar las lecciones de la app. Escrito en español rioplatense; los términos técnicos van también en inglés entre paréntesis.
> Fuentes principales: Dr. Dave Alciatore (drdavepoolinfo.com / billiards.colostate.edu, columnas de *Billiards Digest*, VEPS), Billiard University (Alciatore / Joe Tucker), Bob Jewett, Stan Shuffett (CTE / Pro One), Hal Houle, Mark Wilson, Robert Byrne, Freddy Bentivegna, y discusiones del foro AzBilliards.
> Fecha de la investigación: octubre 2026.

---

## 0. Convenciones usadas en todo el documento

### 0.1 Mesa de referencia: 9 pies (9 ft)
- Superficie de juego: 100" × 50" (254 × 127 cm). Bola: 2¼" (57,15 mm), radio R ≈ 28,6 mm.
- Distancia entre diamantes (*diamonds*): 12,5" (31,75 cm). Banda larga = 8 tramos de diamante; banda corta = 4.
- 1 diamante ≈ 5,5 bolas de ancho.

### 0.2 Sistema de coordenadas para los ejercicios (drills)
Coordenadas en **diamantes**: `(x, y)`; dentro de las coordenadas se usa punto decimal (p. ej. `(6.66, 0.09)`) para no confundir con la coma separadora.
- `x` a lo largo de la banda larga: 0 = banda de cabecera (*head rail*, donde se saca), 8 = banda de pie (*foot rail*).
- `y` a lo largo de la banda corta: 0 = banda larga inferior, 4 = banda larga superior.
- Troneras: esquinas `(0,0) (0,4) (8,0) (8,4)`; medias/laterales (*side pockets*) `(4,0) (4,4)`.
- Puntos notables: punto de cabecera (*head spot*) `(2,2)`; punto central (*center spot*) `(4,2)`; punto de pie (*foot spot*) `(6,2)`; línea de cabecera (*head string*) `x = 2`.
- Las coordenadas se refieren al **centro de la bola**. Una bola "pegada a la banda" (*frozen*) tiene `y = 0,09` (aprox. ½ bola del borde de la banda medida en diamantes: 1,125"/12,5" ≈ 0,09).
- "Ranura de banda" (*rail groove*): la línea por donde pasa el centro de una bola apoyada en la banda (a 1 R de la nariz de la banda). Algunos sistemas miden "a través del diamante" (*through the diamond*, la línea imaginaria que va al diamante mismo, sobre la madera) y otros "frente al diamante" (*across from the diamond*, en la ranura). Es una diferencia de ~3,5" y cambia todo: cada sistema dice cuál usa.

### 0.3 Abreviaturas
- **BB / CB** = bola blanca (*cue ball*). **BO / OB** = bola objetivo (*object ball*).
- **BF** = bola fantasma (*ghost ball*). **PC** = punto de contacto (*contact point*).
- **Efecto** = *English* / *side spin*. **Efecto de corrido** (*running English*) = el efecto que "acompaña" la dirección del rebote; **efecto contrario** (*reverse English*).
- **Seco / stun** = blanca deslizando sin rotación vertical en el impacto. **Rodando** = *natural roll*. **Retroceso** = *draw*. **Seguimiento / corrido** = *follow*.

### 0.4 Escala de confiabilidad usada
- ★★★ Física/geometría validada; funciona tal cual.
- ★★ Funciona en un rango acotado; necesita calibración por mesa.
- ★ Útil como referencia/rutina, pero sin base geométrica completa o muy dependiente de "sensación".

---

# NIVEL PRINCIPIANTE

## 1. Bola fantasma (Ghost Ball)
- **Nivel:** principiante. **Confiabilidad:** ★★★ (es la definición geométrica del tiro, ignorando *throw* y desvío).
- **Problema que resuelve:** saber hacia dónde mandar el centro de la blanca para que la bola objetivo salga en la línea a la tronera.

### Cómo aplicarlo en la mesa
1. Parate detrás de la BO, mirando hacia la tronera. Visualizá la línea tronera → centro de la BO y prolongala hacia atrás.
2. Sobre esa prolongación, a **una bola de distancia** (centro a centro = 2R = 2¼"), imaginá la bola fantasma: es donde tiene que estar la blanca en el instante del contacto.
3. Volvé detrás de la blanca y apuntá el **centro de la blanca al centro de la BF** (no a la BO).
4. Bajá al tiro manteniendo esa línea (ver §5, alineación).

### Matemática
- Ángulo de corte θ (*cut angle*) = ángulo entre la línea BB→BF y la línea BF→tronera.
- El centro de la BF está a 2R del centro de la BO; el desplazamiento lateral de la línea de apuntado respecto del centro de la BO es `d = 2R·sin θ`.

### Errores comunes / limitaciones
- Ubicar la BF "pegada" a la BO de costado en lugar de **sobre la línea a la tronera** (error típico en cortes finos).
- Apuntar al PC con el centro de la blanca → el golpe queda grueso (*undercut*). El PC está a 1R de la BO; la BF está a 2R.
- No incorpora *throw* (§19) ni desvío por efecto (§17). En cortes de 30–50° a velocidad lenta, el *throw* puede requerir ~½ bola de corrección por diamante.
- Es difícil visualizar una bola "en el aire" para cortes muy finos (> 60°): conviene complementarlo con fracciones (§3).

### Drills (mesa 9 ft)
1. **"Fantasma con bola real"**: BO en `(6,2)` (punto de pie) hacia la esquina `(8,4)`. Colocá una segunda bola en la posición de la BF, mirala desde atrás de la BB en `(4,2)`, retirala y tirá. Criterio: 8/10. Progresión: BB en `(4,1)`, `(4,3)`, `(3, 0.5)`.
2. **"Moneda/arandela fantasma"**: marcá con una arandela adhesiva el punto de apoyo de la BF (la app puede proyectarlo en la vista). 3 ángulos (15°, 30°, 45°) desde la misma posición. Criterio: 7/10 en cada ángulo.
3. **Distancia creciente**: mismo corte de 30°, BB a 1, 2, 3 y 4 diamantes de la BO. Criterio: mantener 70% al aumentar distancia.

### Fuentes
- https://drdavepoolinfo.com/faq/aiming/ (FAQ de apuntado, ghost ball)
- https://drdavepoolinfo.com/FAQ/aiming/contact-point/
- Robert Byrne, *Byrne's New Standard Book of Pool and Billiards* (cap. de apuntado: "ghost ball").

---

## 2. Punto de contacto (Contact Point) y "contacto a contacto" (contact-point-to-contact-point / parallel lines)
- **Nivel:** principiante (PC); intermedio (la versión de líneas paralelas). **Confiabilidad:** ★★★ geométricamente si se hace bien; ★★ en la práctica por la dificultad visual.
- **Problema que resuelve:** identificar el punto exacto de la BO que debe tocarse; alternativa a "ver" la BF.

### Cómo aplicarlo
1. Línea tronera → centro BO; donde esa línea "sale" por el lado opuesto de la BO está el **PC de la BO**.
2. Versión simple (correcta): apuntar la blanca de forma que el **centro de la BF** quede a 1R detrás del PC (es decir, es el mismo método de la BF).
3. Versión "líneas paralelas" (*parallel lines*): trazá desde el centro de la BB una paralela a la línea BO→tronera; donde corta el borde de la blanca está el **PC de la BB**. Luego imaginá la línea PC(BB)→PC(BO) y desplazala en paralelo al centro de la blanca: esa es la línea de tiro.

### Errores comunes
- **El error clásico**: "apuntar el PC de la blanca al PC de la bola" sin el desplazamiento paralelo, o apuntar el **centro** de la BB al PC → golpe grueso (siempre corta de menos, salvo tiros casi rectos).
- En tiros largos, un error de 1/8" al estimar el PC se duplica en el punto de apuntado (Dr. Dave).

### Drills
1. **Marcado de PC**: BO en `(6,2)` a `(8,4)`; la app muestra la BO con un punto en el PC. Jugador toca la bola con la tiza en el PC (fuera de juego) y la app verifica en foto. Criterio: error < 3 mm.
2. **Contraste de métodos**: 10 tiros de 30° apuntando "centro a PC" (verá que corta de menos) vs. 10 con BF. Objetivo pedagógico: experimentar el *undercut*.

### Fuentes
- https://drdavepoolinfo.com/FAQ/aiming/contact-point/
- AzBilliards (debates "contact point to contact point"): https://forums.azbilliards.com/

---

## 3. Apuntado por fracciones (Fractional-Ball Aiming)
- **Nivel:** principiante (½, ¼, ¾, llena); avanzado (octavos, §15). **Confiabilidad:** ★★★ como referencias fijas; el jugador igual debe interpolar.
- **Problema que resuelve:** reemplazar una visualización "en el aire" (BF) por referencias **visibles sobre la bola**: centro o borde de la BO.

### Concepto: "fracción de bola" (*ball-hit fraction*)
Porcentaje de superposición de la BB sobre la BO vista desde la línea de tiro en el contacto. Relación exacta:

`sin θ = 1 − f`   (θ = ángulo de corte, f = fracción de bola)

Equivalente en el punto de apuntado: el centro de la blanca apunta a una distancia `d = 2R·(1 − f)` del centro de la BO (medida perpendicular a la línea de tiro).

### Tabla de fracciones → ángulo (exacta, sin *throw*)

| Fracción (f) | Ángulo de corte | Dónde apunta el centro de la BB | Referencia horaria aprox. (Dr. Dave) |
|---|---|---|---|
| 1 (llena, *full*) | 0° | centro de la BO | 12:00 |
| 7/8 | 7,2° | ¼ R desde el centro | ~12:30 |
| 3/4 | 14,5° | ½ R desde el centro (mitad entre centro y borde) | ~12:30–1:00 |
| 5/8 | 22,0° | ¾ R desde el centro | — |
| 1/2 (*half-ball*) | 30,0° | **el borde** de la BO | — |
| 3/8 | 38,7° | ¼ R por fuera del borde | — |
| 1/4 | 48,6° | ½ R por fuera del borde (borde de la BB al "cuarto" de la BO) | — |
| 1/8 | 61,0° | ¾ R por fuera del borde | — |
| ~0 (roce, *thin*) | → 90° | 1 R por fuera del borde | — |

Reglas mnemotécnicas: **¾ ≈ 15°, ½ = 30°, ¼ ≈ 45–49°** (Hal Houle usaba exactamente estos tres como sus "3 ángulos"). Nota: ¼ da 48,6°, no 45°; para 45° la fracción es 0,29.

### Tabla inversa ángulo → fracción (para la app)

| Ángulo | 5° | 10° | 15° | 20° | 25° | 30° | 35° | 40° | 45° | 50° | 55° | 60° | 70° | 80° |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| f | 0,91 | 0,83 | 0,74 | 0,66 | 0,58 | 0,50 | 0,43 | 0,36 | 0,29 | 0,23 | 0,18 | 0,13 | 0,06 | 0,02 |

Observá que la relación no es lineal: entre 0° y 30° la fracción cambia 0,5; entre 30° y 60° cambia ~0,37; los cortes finos son muy sensibles (en 60–80° un cambio de 0,07 de bola = 20°).

### Cómo aplicarlo
1. Estimá el ángulo de corte (§4).
2. Elegí la fracción de referencia más cercana (¾, ½, ¼).
3. Apuntá la referencia correspondiente (centro de la BB al borde de la BO para ½; etc.) y ajustá "un poco más fino/grueso" si el ángulo cae entre referencias.
4. Con práctica, el jugador "reconoce" visualmente el tiro de media bola (el más útil: 30°, que además es la base de la regla de 30°).

### Limitaciones y errores
- Hay que **interpolar** entre referencias: el sistema no elimina el juicio, lo ancla.
- La superposición se percibe distinto con el ojo dominante y la altura de la cabeza (§5).
- Ignora *throw*: en el tiro de media bola lento y seco el *throw* es máximo (~5°); hay que cortar un poco más fino.
- Dr. Dave: los sistemas de "línea de apuntado fija" son útiles como referencias de calibración, no como reemplazo de la percepción.

### Drills
1. **Las 3 referencias**: BO en `(6,1)`. Calculá posiciones de BB para 15°, 30° y 48,6° hacia la esquina `(8,0)` (la app las dibuja a ~2 diamantes). 10 tiros por fracción. Criterio: 7/10.
2. **Reconocimiento de media bola**: la app presenta posiciones aleatorias; el jugador dice "más grueso/más fino/media bola" antes de tirar. Criterio: 80% de clasificación correcta.
3. **Escalera de fracciones**: BB fija en `(3,2)`, BO movida en pasos para generar 0°, 15°, 30°, 45° a la misma tronera. Criterio: embocar la escalera completa sin fallar 2 veces seguidas.

### Fuentes
- https://drdavepoolinfo.com/FAQ/cut/ball-hit-fraction/
- https://drdavepoolinfo.com/?p=1633 ("What is fractional-ball aiming…")
- TP A.23 (prueba técnica): https://billiards.colostate.edu/technical_proofs/new/TP_A-23.pdf
- https://www.engr.colostate.edu/~dga/pool/threads/fractional/

---

## 4. Estimación del ángulo de corte (Cut-Angle Estimation)
- **Nivel:** principiante. **Confiabilidad:** ★★★ (habilidad perceptiva entrenable).
- **Problema que resuelve:** elegir fracción, predecir la trayectoria de la blanca (regla de 90°/30°) y planear posición.

### Métodos
1. **Comparación con referencias**: ¿es más o menos que media bola (30°)? ¿más o menos que ¾ (15°)?
2. **Mano/dedos**: con el brazo extendido, el ángulo entre índice y medio en "V" (*peace sign*) puede calibrarse a ~30° (Dr. Dave usa esa misma V para la regla de 30°). Calibrá en casa con un transportador.
3. **Geometría del reloj**: el PC visto desde la BB: 12:00 = 0°, ~12:30 ≈ 15°, ~1:30 ≈ 45°.
4. **Diamantes**: la dirección de la BB y de la BO se pueden proyectar a puntos de las bandas y comparar.

### Errores
- Subestimar los cortes finos (el ojo "comprime" los ángulos grandes).
- Juzgar desde la posición agachada en lugar de pararse detrás de la BO.

### Drills
1. **Adivina el ángulo** (ideal para la app con foto/AR): 20 posiciones; el jugador estima en pasos de 5°. Criterio: error medio ≤ 5°, máximo ≤ 10°.
2. **Corte de 30° puro**: BO en `(4,1)` hacia `(8,0)`; ubicar la BB *sin ayuda* para que el corte sea 30°, luego verificar con la app. Criterio: ±3°.

### Fuentes
- https://drdavepoolinfo.com/?p=2102 ("How can you estimate the cut angle for a shot?")
- Mark Wilson, *Play Your Best Pool* (énfasis en percepción y reconocimiento de ángulos por experiencia).

---

## 5. Postura y alineación del golpe relevantes al apuntado (Stance, Vision & Stroke Alignment)
- **Nivel:** principiante. **Confiabilidad:** ★★★ (prerequisito de todo lo demás).
- **Problema que resuelve:** apuntar bien y "pegarle a otra cosa" es la causa #1 de errores en jugadores intermedios autodidactas.

### Puntos clave
1. **Ojo dominante / centro de visión** (*vision center*): la posición de la cabeza respecto del taco debe ser la que hace que un taco centrado "se vea" centrado. Prueba: apuntá un taco a la línea recta de un tiro recto largo; si te parece recto pero no lo está, tu centro de visión está desplazado. Se ajusta corriendo la cabeza lateralmente.
2. **Alineación antes de bajar** (*pre-shot routine*): pararse sobre la línea de tiro, con el pie trasero en la línea, y bajar a la posición **sin girar** la cabeza o el taco una vez abajo.
3. **Golpe recto** (*straight stroke*): codo arriba de la mano, antebrazo vertical en el contacto (aprox.), puente firme, sin "swoop" lateral. Un desvío lateral del taco al golpear genera efecto involuntario → *squirt* y *throw*.
4. **Pausa y final**: pausa atrás, seguimiento hacia adelante, quedarse abajo (*stay down*).
5. **Golpear donde apuntaste en la blanca**: punta en el eje vertical de la BB salvo que se busque efecto (crítico para kicks, §12).

### Errores comunes
- "Pivotear" la cabeza al bajar; cambiar de línea en la última pasada.
- Efecto involuntario de 1–2 mm: suficiente para errar un tiro largo o un kick.

### Drills (estilo Billiard University F1–F4, adaptado)
1. **Blanca sola ida y vuelta**: BB en `(0.5, 2)`, golpe centrado a velocidad media contra la banda de pie en `(8, 2)`; debe volver sobre la línea central (`y = 2`) y pasar sobre la posición inicial. Criterio: desvío ≤ ½ bola en 8/10.
2. **Tiro recto a la esquina (escalera BU)**: BO en `(7, 3)`, tiro recto a `(8, 4)`; la BB sobre la línea diagonal a distancias 1–7 (posición 1 = ½ diamante de la BO, cada posición +½ diamante). Empezás en 4: subís al embocar, bajás al fallar. Criterio: terminar en posición ≥ 5 tras 10 tiros.
3. **Botella/vaso de chequeo de golpe**: tacada a través de la boca de una botella (sin bola). Criterio: 20 pasadas sin tocar.
4. **Prueba de centro de visión**: la app muestra 3 posiciones de cabeza; se tira 5 rectas largas con cada una y se elige la de mejor resultado.

### Fuentes
- Billiard University – Exam I (Fundamentos): https://billiards.colostate.edu/bd_articles/2013/sept13.pdf y oct13.pdf; puntajes: https://forums.azbilliards.com/goto/post?id=4227712
- https://drdavepoolinfo.com/faq/fundamentals/ (vision center, stroke)
- Mark Wilson, *Play Your Best Pool* (alineación, rutina previa).

---

# CONTROL DE BLANCA (CUE BALL CONTROL)

## 6. Línea tangente / Regla de 90° (Tangent Line / 90° Rule)
- **Nivel:** principiante–intermedio. **Confiabilidad:** ★★★ (física pura, para blanca deslizando).
- **Problema que resuelve:** predecir a dónde va la blanca después del impacto (evitar scratch, planear posición).

### Regla
- Con **blanca seca** (*stun*: sin rotación vertical al contacto), la BB sale **exactamente por la línea tangente**, a 90° de la dirección de la BO, para cualquier ángulo de corte.
- Con algo de rotación, la BB sale por la tangente y luego **curva**: con seguimiento hacia adelante, con retroceso hacia atrás.
- Para que la BB llegue seca hay que golpear más abajo cuanto mayor sea la distancia BB–BO y menor la velocidad (el paño convierte el retroceso en rodar).

### Cómo aplicarlo
1. Ubicá la BF. Desde la BF, trazá la perpendicular a la línea BF→tronera: esa es la tangente.
2. Proyectala a la banda: ese es el primer punto de contacto con la banda de la BB.
3. Con la mano: colocá la mano formando un ángulo recto (pulgar en la dirección de la BO, índice en la tangente).

### Errores / limitaciones
- Bola sucia o paño lento modifican levemente el ángulo (Dr. Dave, "ball conditions").
- Con mucha velocidad, aunque esté seca, la BB puede "saltar" levemente y desviarse poco.

### Drills
1. **Tangente a la media**: BO en `(6,1)` a la esquina `(8,0)`, BB en `(4,1)` (corte ~30°). Tiro seco: la BB debe ir por la tangente y pegar en la banda superior cerca del diamante predicho por la app. Criterio: ±½ diamante en 7/10.
2. **Stop a distancias crecientes** (BU F5-like): tiro recto, BB debe quedar parada a ≤ 1 bola del lugar de contacto. Distancias 1, 2, 3, 4 diamantes. Criterio: 4/5 por distancia.
3. **Evitar el scratch**: BO en `(7, 0.5)` cerca de la esquina `(8,0)`, BB ubicada de manera que la tangente vaya a la tronera media `(4,4)`: el jugador debe usar seguimiento o retroceso para evitarla. Criterio: 0 scratches en 10.

### Fuentes
- https://drdavepoolinfo.com/faq/cue-ball-control/lines/
- https://drdavepoolinfo.com/FAQ/30-90-rules/30-degree-rule/ (y 90°)
- https://www.engr.colostate.edu/~dga/pool/30-90-rules/conditions/

---

## 7. Regla de 30° (30° Rule, blanca rodando)
- **Nivel:** intermedio. **Confiabilidad:** ★★★ en su rango.
- **Problema que resuelve:** predecir la dirección final de la blanca con **rodado natural** (*natural roll*), la situación más frecuente en el juego real.

### Regla
- Si la BB llega **rodando** y el golpe está entre **¼ y ¾ de bola** (≈ 15°–49° de corte), la blanca se desvía **≈ 30°** respecto de su dirección original (la línea de tiro). Ese es el "ángulo natural" (*natural angle*).
- El desvío máximo exacto es 33,7° en el golpe de media bola; en ¼ y ¾ es ~27–28°. "30°" es una aproximación muy buena.
- Fuera del rango: cortes muy finos → desvío menor que 30° (la BB sigue casi derecho); cortes muy gruesos → desvío menor (la BB "sigue" a la BO).
- La BB primero sale por la tangente y luego curva hasta la dirección de 30°; la distancia de curva crece con la velocidad.

### Cómo aplicarlo: técnica de la "V" (*peace sign*)
1. Calibrá tu V (índice + medio separados) a ~30° con un transportador.
2. Poné el índice sobre la línea de tiro (BB→BF) con la base de los dedos en la BF.
3. El dedo medio indica la dirección final de la blanca (del lado de la tangente).

### Errores
- Aplicarla con BB que todavía patina (tiros con mucha velocidad o distancia corta y golpe bajo): ahí aplica más la tangente.
- Olvidar que con velocidad fuerte la curva tarda: la BB llega a la banda antes de completar el giro a 30°.

### Drills
1. **V calibration**: BO en `(6,2)`, tiros de media bola a la esquina `(8,4)` con blanca rodando (golpe arriba del centro, velocidad media). Predecí con la V el punto de banda; la app registra. Criterio: ±½ diamante 7/10.
2. **Tres fracciones, mismo desvío**: ¾, ½ y ¼ de bola: observar que la BB sale ~30° en las tres. Criterio pedagógico + predicción ±1 diamante.
3. **Posición a la zona**: BO en `(5,1)` a `(8,0)`, colocar la BB para que la regla de 30° la lleve a un aro objetivo (círculo de 1 diamante) en `(6,3)`. Criterio: 5/10.

### Fuentes
- https://drdavepoolinfo.com/FAQ/30-90-rules/30-degree-rule/
- https://drdavepoolinfo.com/?p=1535 (en qué tiros aplica)
- Video NV B.44 (peace-sign), en la web de Dr. Dave.

---

## 8. Efecto de seguimiento/retroceso en la trayectoria (Follow/Draw Effect on CB Path)
- **Nivel:** intermedio. **Confiabilidad:** ★★★ cualitativa; ★★ cuantitativa (depende de velocidad, paño).
- **Problema que resuelve:** saber cuánto "se abre" o "se cierra" la trayectoria con distintas cantidades de rotación vertical y velocidad.

### Principios
- La BB **siempre** sale primero por la tangente (después del impacto) y luego curva:
  - **Seguimiento** (*follow*, golpe arriba): curva hacia adelante (hacia la dirección de la BO).
  - **Retroceso** (*draw*, golpe abajo): curva hacia atrás.
- **Velocidad**: a más velocidad, más larga la parte recta por la tangente antes de curvar (curva "tardía"; trayectoria más ancha).
- **Distancia BB–BO**: el retroceso se pierde con la distancia (el paño lo convierte en rodar). Para llegar con retroceso a 4 diamantes hace falta golpe bien bajo y más velocidad.
- Golpe "seco-seguimiento" (*stun-follow*) y "seco-retroceso" (*stun-draw*): pequeñas desviaciones respecto de la tangente para posición fina.
- Ángulo de corte grande (> 50°): la BB conserva mucha de su velocidad → el efecto vertical influye poco; ángulo chico → la BB pierde velocidad y el efecto domina.

### Drills
1. **Abanico de trayectorias**: BO en `(6,1)` a `(8,0)`, BB en `(4, 1.5)` (corte ~30°). Cinco tiros: retroceso fuerte, retroceso suave, seco, seguimiento suave, seguimiento fuerte. Marcar dónde toca la banda la BB. Criterio: los cinco puntos en el orden correcto y separados.
2. **Velocidad vs curva**: mismo tiro con seguimiento a 3 velocidades. Observar el desplazamiento del primer contacto con banda.
3. **Retroceso a distancia** (*draw distance ladder*, tipo BU): tiro recto, BB debe retroceder 1 diamante. Aumentar distancia BB–BO de 1 a 5 diamantes. Criterio: llegar a la posición 5 con 3/5.

### Fuentes
- https://drdavepoolinfo.com/faq/cue-ball-control/lines/
- Bert Kinister, videos de drills (*"Kinister Tapes"*, p. ej. "Shotmaking & Position" / "Running English"), drills de posición con rotación: https://www.kinister.com (catálogo histórico; también citados en AzBilliards).

---

## 9. Sistema de trisección (Trisect System, Dr. Dave) — retroceso
- **Nivel:** intermedio. **Confiabilidad:** ★★ (funciona para retroceso con "buena acción" y cortes chicos).
- **Problema que resuelve:** predecir la dirección final de la blanca en tiros con retroceso, donde la tangente y la regla de 30° no sirven.

### Regla
- Válido para retroceso con buena acción (rotación abundante al contacto, velocidad media) y **cortes menores a ~40°** (fracción > ~3/8).
- La BB termina saliendo en una dirección que forma **3 veces el ángulo de corte** con la línea de tiro **invertida** (la línea que vuelve hacia el jugador). Dicho de otro modo: la dirección final queda a **2θ** "más allá" de la línea de la BO reflejada; el ángulo total se divide en tres partes iguales (de ahí "trisect").
- Ejemplos: corte de 10° → la BB vuelve a ~30° de la línea de tiro invertida; corte de 20° → ~60°; corte de 30° → ~90° (perpendicular a la línea de tiro).

### Cómo aplicarlo
1. Estimá el ángulo de corte θ.
2. Visualizá la línea de tiro prolongada hacia atrás (hacia vos).
3. Girá desde esa línea, hacia el lado opuesto a donde va la BO, un ángulo 3θ. Con práctica, se usa la mano: tres "partes" de θ.

### Limitaciones
- Si el retroceso es débil, el ángulo es menor (más cerca de la tangente).
- Para cortes > 40° no aplica bien.

### Drills
1. **Retroceso con ángulo**: BO en `(6,1)` a `(8,0)`; BB a 2 diamantes con corte de 10°, 20° y 30°. Predecir con trisección el primer punto de banda. Criterio: ±1 diamante en 6/10.
2. **Draw-to-zone**: mismo tiro, la BB debe terminar en un aro de 1 diamante determinado por la app. Criterio: 4/10, luego 6/10.

### Fuentes
- https://drdavepoolinfo.com/faq/cue-ball-control/lines/ (90°, 30° y trisect; VEPS I)
- https://drdavepoolinfo.com/?p=2131

---

# BANDAS (BANKS) — la BO va a la banda

## 10. Sistemas de bandas
### 10.1 Espejo / reflexión (Mirror / Equal-Angle Bank)
- **Nivel:** intermedio. **Confiabilidad:** ★★ (base correcta; necesita las correcciones de §10.4).
- **Problema que resuelve:** encontrar el punto de banda para embocar la BO después de un rebote.

**Cómo:**
1. Imaginá la **tronera reflejada** del otro lado de la banda (espejo): para banda larga, la tronera "fantasma" está a la misma distancia más allá de la banda.
2. Medí en la **ranura de banda** (*rail groove*, para la BO que no llega rodando): el punto de rebote es donde la línea BO→tronera reflejada cruza la ranura.
3. Método con diamantes "igual distancia" (*equal-angle / equal-distance*): ver §10.2.

**Matemática:** ángulo de incidencia = ángulo de rebote (sólo como primera aproximación). Con la BO en `(x₀, y₀)` y la tronera destino en `(x₁, y₁)`, rebotando en la banda `y = 4` (ranura en `y = 4 − 0,09`): reflejá la tronera en la ranura → `y₁' = 2·(4−0,09) − y₁` y uní con una recta.

### 10.2 Conteo de diamantes (Diamond Counting / Equal-Distance)
1. Ubicá el punto `a` donde la línea de la BO (prolongada hacia atrás) cruza la banda **opuesta** (ranura).
2. Ubicá la tronera destino `c` sobre la misma banda opuesta.
3. El punto de rebote `b` sobre la banda de rebote está **frente al punto medio** entre `a` y `c` (igual distancia a cada lado). Ejemplo Dr. Dave: `a` frente al diamante 4 (media), `c` = esquina (0) → apuntar frente al diamante 2 de la banda contraria.
4. Variante "a través del diamante" (*through-diamond*): si la bola llega **rodando** (lento, BO lejos de la banda) se miden los puntos en los diamantes mismos (no en la ranura); eso compensa que la rodada "alarga" el rebote.

### 10.3 Contacto a contacto (Contact-Point-to-Contact-Point Bank)
- Versión de bancas que usa el punto de contacto de la BO con la **nariz de la banda** (*cushion nose*) en lugar del centro de la bola en la ranura. Ver el kick espejo de punto de contacto (§11.1): funciona bien con ángulos chicos y velocidad lenta.

### 10.4 Correcciones (speed / cut / spin) — lo más importante
Fuente: Dr. Dave, "What effects does one need to adjust for when aiming bank and kick shots?"
| Factor | Efecto sobre el rebote |
|---|---|
| **Más velocidad** | rebote **más corto** (más cerrado; compresión de banda y menos rodada). Menos velocidad → más largo. La consistencia es mejor con velocidad media-firme. |
| **Efecto inducido por corte, corte "de afuera"** (*outside cut*, la BB empuja la BO hacia la tronera-lado) | **acorta** la banda (la BO adquiere efecto contrario). |
| **Corte "de adentro"** (*inside cut*) | **alarga** la banda. |
| **Rotación hacia adelante (rodada) de la BO** | alarga el rebote; menos rodada (BO cerca de la banda o tiro rápido) → más corto. |
| **Efecto de corrido** | alarga; **efecto contrario** acorta. Efecto máximo cuando la bola entra perpendicular a la banda; casi nulo con ángulos rasantes. |
| **Efecto de engranaje externo** (*gearing outside English*) | se usa en la BB para **anular** el efecto inducido por el corte en la BO. |
| **Ángulo** | las bancas con mucho ángulo (rasantes) tienden a ir **largas**; las casi perpendiculares, más fieles al espejo pero sensibles al efecto. |
| **Mesa/condiciones** | bandas vivas o muertas, paño nuevo (más deslizamiento) vs. viejo, humedad. Calibrar siempre con un tiro de referencia. |

**Tendencias corta/larga (Bentivegna):** "si una banca va corta, van todas cortas" en esa mesa. Se corrige siempre **en la misma dirección**: más grosor/menos corte, más efecto de corrido, menos velocidad (para alargar) o lo inverso.

### 10.5 Cross-side y cross-corner
- **Cross-side** (*cross-side bank*, a la media opuesta pasando por la banda larga): BO cerca del centro, tronera media del lado contrario. Típicamente es "corto" por velocidad y por el ángulo cerrado: dar un poco más largo o algo de corrido. Atención: la tronera media "acepta" menos ángulo (bolas que llegan muy rasantes a la media rebotan en las mandíbulas).
- **Cross-corner** (*cross-corner bank*, banda larga hacia la esquina contraria): el clásico. Referencia: ver drill 1 (BO en el punto de pie a la esquina opuesta). Las bancas largas de 2 bandas (*two-rail banks*) y "cross-table" usan sistemas propios (ver Dr. Dave, "two-rail bank shots off the short rail").
- **Banca larga** (*long bank*, por la banda corta hacia la otra punta): tiende a ir larga con bola rodando lenta; Bentivegna enseña muchos tiros de referencia ("tracks").

### Errores comunes (bancas)
- Medir en la madera cuando la BO no viene rodando (o al revés).
- "Doble beso" (*double kiss*): en bancas casi rectas cerca de la banda la BB y la BO vuelven a chocarse. Se evita cortando o con retroceso / ángulo.
- Velocidad inconsistente: hace inútil cualquier sistema.

### Drills (bancas)
1. **Banca cruzada de referencia (cross-corner)**: BO en el punto de pie `(6, 2)`, banca contra la banda inferior hacia la esquina `(8, 4)`. Espejo en la ranura (`y = 0,09`): la esquina reflejada queda en `(8, −3.82)` → punto de banda ≈ `(6.66, 0.09)`. BB detrás, sobre la prolongación (≈ `(5.6, 3.1)`), tiro recto sin efecto. Encontrá la velocidad "estándar" que la emboca. Criterio: 7/10 a velocidad media.
2. **Escalera de velocidad**: el mismo tiro a lenta, media y fuerte; marcá con tiza dónde termina el rebote. Objetivo: internalizar "rápido = corto".
3. **Corte inducido**: misma BO, BB desplazada para corte de 15° hacia adentro y hacia afuera. Observar alargue/acorte. Criterio: corregir y embocar 5/10 de cada lado.
4. **Cross-side**: BO en `(3.5, 3)`, banca contra la banda superior hacia la media inferior `(4, 0)`. Espejo: media reflejada en `(4, 7.82)` → punto de banda ≈ `(3.6, 3.91)`. BB detrás sobre la prolongación (≈ `(3.4, 2)`). Criterio: 6/10.

### Fuentes
- https://drdavepoolinfo.com/faq/bank-kick/effects/ ; resumen PDF: https://billiards.colostate.edu/resource_files/bank_effects.pdf
- Dr. Dave, *Billiards Digest* mayo 2010 "Banks and Kicks" (equal-angle, rail groove vs through-diamond): https://drdavepoolinfo.com/bd_articles/2010/may10.pdf
- https://drdavepoolinfo.com/?p=1828 (two-rail banks off the short rail)
- Freddy Bentivegna, *Banking with the Beard* (libro): https://www.pooldawg.com/banking-with-the-beard ; hilo: https://forums.azbilliards.com/threads/banking-with-the-beard.26056
- Robert Byrne, *Standard Book of Pool and Billiards* (bancas y "rule of thumb" de corrección por velocidad).

---

# KICKS — la blanca va a la banda primero

## 11. Kicks de 1 banda
### 11.1 Kick espejo por punto de contacto (Contact-Point Mirror Kick, ángulos chicos)
- **Nivel:** intermedio. **Confiabilidad:** ★★★ en su rango (Dr. Dave lo probó de 5° a 35° con BO a 1 bola de la banda).
- **Cómo:**
  1. Elegí el **PC deseado** en la BO.
  2. Medí con la mano o el taco la distancia PC → **nariz de la banda** (no la ranura).
  3. Duplicá esa distancia más allá de la nariz: ese es el **punto espejo**.
  4. Apuntá la blanca (su centro) directamente a ese punto espejo. **Velocidad lenta, rodando, sin efecto** (golpe en el eje vertical).
- **Rango:** funciona mejor con la BO a ~1 bola de la banda y ángulos poco inclinados.

### 11.2 Espejo por ranura (Ghost-Ball Rail-Groove Mirror)
- Reflejá el centro de la BF respecto de la ranura de banda y apuntá la BB a esa imagen. Bueno para tiros secos/rápidos a ángulos moderados.

### 11.3 Sistema "a través del diamante" 2-a-1 (Rolling-CB Through-Diamond / "Double-Distance")
- **Nivel:** intermedio. **Confiabilidad:** ★★ (hasta ~6 diamantes de origen; más allá, corregir).
- **Uso típico:** kick a una bola "colgada" en la esquina.
- **Cómo:**
  1. Numerá los diamantes de la banda donde vas a rebotar desde la esquina objetivo (esquina = 0) y los de la banda opuesta igual.
  2. La línea de la BB debe pasar por el diamante `2n` de la banda opuesta (cercana al tirador) y por el diamante `n` de la banda de rebote (**relación 2 a 1**; medidas **a través de los diamantes**, no en la ranura, porque la blanca rueda y "alarga" el rebote).
  3. Si la BB no está sobre una línea entera, empezá con la línea 2-a-1 más cercana y **corré la culata del taco el doble que la punta** (p. ej. punta 1", culata 2") hasta pasar por la BB. Ejemplo Dr. Dave: de la referencia 3→1,5 se llega a 3,4→1,7.
  4. Golpe centrado, rodando, velocidad moderada.
- **Corrección por ángulo grande:** con origen ~9 (mucho ángulo), la BB va **larga** (~⅓ diamante en su mesa). Ejemplo: en lugar de 9→4,5, tirar 8,8→4,7.
- **Objetivo no en la esquina:** usar como "cero" el punto de la banda frente al objetivo (p. ej. 1,4 diamantes de la esquina) y contar desde allí.

### Correcciones de efecto/velocidad (kicks 1 banda)
- Efecto de corrido involuntario → largo; contrario → corto. Golpear **en el eje vertical**.
- Velocidad alta → más corto (más reflexión pura, menos curva por rodada).
- Retroceso al llegar a la banda → acorta.

### Drills
1. **Hanger kick (esquina)**: BO colgada en `(8,0)`... frente a la tronera, BB en `(3,4)`→ línea 3→1,5 hacia la banda superior. Criterio: 6/10 contactos de la BO, 4/10 embocadas.
2. **Shift 2-a-1**: BB en posición arbitraria (la app la sortea); el jugador calcula la línea y lo dice antes de tirar; la app verifica el cálculo y el resultado. Criterio: cálculo ±0,2 diamante, contacto 6/10.
3. **Espejo de PC**: replicar el experimento de Dr. Dave: BO a ½, 1 y 1½ bolas de la banda frente al diamante 2; ángulos de entrada 10°, 20°, 30°. Criterio: 7/10 con la BO a 1 bola.
4. **Kick a bola en el medio de la mesa** (*kick to a ball off the rail*): BO en `(6,2)`, BB tapada; usar espejo por ranura. Criterio: contacto 6/10.

### Fuentes
- *Billiards Digest* jun 2010 "One-Rail Kicks": https://drdavepoolinfo.com/bd_articles/2010/june10.pdf
- *Billiards Digest* jul 2010 "Contact-Point Mirror Kick": https://drdavepoolinfo.com/bd_articles/2010/july10.pdf
- https://drdavepoolinfo.com/FAQ/bank-kick/diamond-systems/ (equal-distance, mirror, 2-to-1)
- https://drdavepoolinfo.com/?p=1629 (double-the-distance)

---

## 12. Sistema Plus (Plus System / "Plus Two"), 2 bandas desde banda corta
- **Nivel:** intermedio–avanzado. **Confiabilidad:** ★★ (sólido una vez calibrado por mesa).
- **Problema que resuelve:** kicks de 2 bandas (banda corta → banda larga opuesta → objetivo en la banda larga del tirador) cuando la BO está tapada.

### Numeración
- **Banda corta** (la del primer rebote): la **esquina lejana** (la del lado de la banda larga a la que volverá la bola) vale **1**; aumenta **1 por cada medio diamante**. Así: ½ diamante = 2, 1er diamante = **3**, 2º = **5**, 3er = **7**, esquina opuesta = 9. (Para la esquina, el "diamante" se considera centrado en la tronera.)
- **Fórmula:** la línea de la blanca se desplaza **hacia arriba de la mesa** (*up table*), a lo largo de la banda larga, **tantos diamantes como el número de banda corta** por el que apuntás.
  `Destino (banda larga, 3ª banda) = Origen (punto de la banda larga donde cruza la línea de la BB) + Número de banda corta`
- Ejemplos: apuntando por el "3", la línea se corre 3 diamantes; por el "2" (½ diamante), +2 diamantes (el típico kick "entrando y saliendo de la esquina", de ahí "plus two"); 1 diamante en la banda corta = 2 diamantes en la larga.

### Tiro de calibración (benchmark)
- Desde el 3er diamante de la banda larga, apuntando por el **5** de la banda corta → la bola debe desplazarse 5 diamantes y llegar **a la esquina**. Ajustá velocidad y efecto hasta lograrlo.
- **Correcciones:** más velocidad → va **larga** (la curva post-rebote se retrasa); más efecto → va **corta** (abre el ángulo en la primera banda). Si va corta: más velocidad o menos efecto; si va larga: menos velocidad o más efecto.
- **Condición:** blanca rodando con **efecto de corrido** (*running English*), cantidad constante.

### Cómo aplicarlo
1. Ubicá el punto objetivo en la 3ª banda (si la BO está fuera de la banda, proyectá la línea de salida de la 2ª banda que pasa por la BF).
2. Contá diamantes desde ese objetivo hacia abajo para encontrar líneas enteras (p. ej. origen 4 + corta 4) que pasen cerca de la BB.
3. Desplazá el taco con la relación **culata 2 : punta 1** hasta pasar por la BB (p. ej. termina en 3,6).

### Drills
1. **Benchmark 3→5→esquina**: BB en la ranura frente al diamante 3 de la banda larga, apuntar por el 5. Ajustar hasta 7/10 a la esquina. Registrar la combinación (velocidad, efecto) en el perfil de mesa de la app.
2. **Kick a bola en la banda**: BO pegada en la banda larga a 1 diamante de la esquina; BB a 3–4 diamantes. Criterio: contacto 6/10.
3. **Kick con obstáculo**: escenario de Dr. Dave (8 cerca de la esquina, 14 bloqueando). Criterio: contacto 5/10, embocada 3/10.

### Fuentes
- *Billiards Digest* ago 2010 (intro, numeración, calibración): https://drdavepoolinfo.com/bd_articles/2010/aug10.pdf
- sep 2010 (velocidad/efecto) y oct 2010 (ejemplos): https://drdavepoolinfo.com/bd_articles/2010/oct10.pdf
- https://drdavepoolinfo.com/FAQ/bank-kick/Plus/ (también "midpoint-parallel-shift system", alternativa visual sin números)
- AzBilliards: https://forums.azbilliards.com/threads/calling-dr-dave-plus-system-for-kicking.404132/page-2

---

## 13. Sistema Corner-5 / Diamond System (3 bandas desde banda larga)
- **Nivel:** avanzado. **Confiabilidad:** ★★ la **predicción de 3ª banda** es robusta; la trayectoria después de la 3ª banda depende de mesa, velocidad y efecto.
- **Problema que resuelve:** kicks de 2, 3 y 4 bandas empezando por una banda larga (origen del billar a tres bandas, adaptado al pool).

### Numeración (tres juegos de números)
- **D = origen** (*origination direction*, dónde cruza la línea de la BB la banda/el borde más cercano al tirador): vale **5 en la esquina** (diamante centrado en la tronera). Aumenta **+1 por diamante** sobre la banda **corta** (5, 6, 7, 8…) y **disminuye −½ por diamante** sobre la banda **larga** (5, 4,5, 4, 3,5, 3…).
- **F = 1ª banda** (banda larga opuesta): 1 en el primer diamante desde la banda corta lejana, +1 por diamante hacia arriba (1…7; la media = 4).
- **T = 3ª banda** (banda larga del tirador): misma numeración que F (1 en el diamante más lejano).
- **Fórmula:** `T = D − F`
- Ejemplo: desde la esquina (D = 5) apuntando al diamante 3 (F = 3) → la BB llega a la 3ª banda en T = 2.
- Condición: **blanca rodando con efecto de corrido** (moderado).

### Benchmark y diferencias pool vs. billar
- En billar a tres bandas el recorrido 5-3-2 continúa a la esquina; **en la mayoría de las mesas de pool queda casi 1 diamante corto**. En la mesa de Dr. Dave, la trayectoria de esquina a esquina (por 3 bandas) es **5→2 (T = 3)**. Encontrá el T de "esquina" de tu mesa (p. ej. 3 o 3,2). Si queda corto (del lado de la banda larga), **bajá F** un poco; si va largo, **subí F**.
- Una vez conocido el T de referencia, cualquier combinación con `D − F = T` llega al mismo punto (p. ej. 6−3, 5−2, 4,5−1,5, 4−1 → T=3).
- Para kicks de 2 bandas a una BO fuera de la banda: estimá la dirección de salida de la 2ª banda (**~45°** es una buena estimación para gran parte del rango), proyectá por la BF a la 3ª banda para obtener T, y luego buscá D y F. Ej.: T = 3,2 → 5,1 − 1,9.

### Correcciones
- **Velocidad**: casi no afecta el T (los efectos de 1ª y 2ª banda se compensan), pero **sí** el recorrido después de la 3ª banda: lenta → corto; rápida → largo (el efecto se conserva más).
- **Efecto**: también poco efecto sobre T; más efecto → más largo después de la 3ª banda.
- **Origen lejos de 5** (D < 5, BB más abajo en la banda larga): la bola tiende a quedar **corta** en la 4ª banda → bajar F (≈ ⅓ diamante para D = 3,5 en la mesa de Dr. Dave).
- Paño/bolas: bolas limpias en paño rápido conservan más efecto.
- Existen correcciones "de deslizamiento" para ángulos largos en libros de tres bandas (Walter Ceulemans, "Mister 100"); no se trasladan bien al pool — mejor calibrar.

### Drills
1. **Benchmark esquina→esquina**: BB en la esquina `(0,0)`-zona (D = 5), probar F = 3, 2,5, 2 hasta que vuelva a la esquina opuesta del mismo lado corto. Registrar T de la mesa. Criterio: 6/10 en la tronera.
2. **Familia de líneas**: con el T calibrado, tirar desde D = 6, 5, 4,5 y 4. Criterio: 5/10 en cada.
3. **Kick 2 bandas a bola en banda larga**: BO frente al diamante 2 de la banda del tirador, bloqueada. Criterio: contacto 6/10.
4. **Kick 3 bandas a "colgada"**: BO colgada en esquina; la app sortea la BB. Criterio: contacto 4/10.

### Fuentes
- *Billiards Digest* nov 2010 (intro y numeración): https://drdavepoolinfo.com/bd_articles/2010/nov10.pdf
- dic 2010 (ejemplo y benchmark): https://drdavepoolinfo.com/bd_articles/2010/dec10.pdf
- ene 2011 (ajustes): https://drdavepoolinfo.com/bd_articles/2011/jan11.pdf
- https://drdavepoolinfo.com/FAQ/bank-kick/diamond-systems/ (incluye guía de Marcel Elfers "Corner-5 and Spot-on-the-Wall")
- Bob Jewett, columnas en *Billiards Digest* sobre Corner-5. Robert Byrne, *Standard Book* (capítulo "diamond system" de tres bandas).

---

## 14. Kicks "sin efecto" y punto en la pared (No-English Kick Systems / Spot-on-the-Wall)
- **Nivel:** intermedio–avanzado. **Confiabilidad:** ★★.
- **Idea:** los sistemas basados en **golpe centrado sin efecto** (a diferencia de Plus/Corner-5) son más repetibles bajo presión porque eliminan *squirt*, *swerve* y variación del efecto. Ejemplos: equal-distance/2-a-1 (§11.3), espejo (§11.1), **"spot on the wall"** (elegir un punto fijo fuera de la mesa —en la pared— que sirve de "esquina reflejada"; todas las líneas desde la BB hacia ese punto pasando por la banda llegan a la misma zona).
- **Correcciones:** a velocidad lenta la rodada alarga; a velocidad alta se acerca al espejo puro. Con ángulos grandes, la bola va larga.
- **Drill:** elegir el "spot" en la pared para kick de 1 banda a la esquina, tirar desde 4 posiciones diferentes. Criterio: contacto 6/10 en cada.
- **Fuentes:** https://billiards.colostate.edu/resource_files/trcd/ (Tom Ross, "Spot on Wall", Billiards Digest) ; https://drdavepoolinfo.com/FAQ/bank-kick/diamond-systems/

---

# NIVEL AVANZADO

## 15. Fracciones en octavos (1/8 Fractions)
- **Nivel:** avanzado. **Confiabilidad:** ★★★ geométrica; ★★ práctica (diferenciar 1/8 de bola requiere vista y rutina).
- **Tabla:** ver §3 (7/8 = 7,2°, 5/8 = 22,0°, 3/8 = 38,7°, 1/8 = 61,0°).
- **Cómo:** se marcan visualmente puntos en la BO: centro, ¼ R, ½ R, ¾ R, borde, y en el "aire" afuera del borde: ¼ R, ½ R, ¾ R. El centro de la BB apunta a uno de esos 8 puntos.
- **Advertencia:** entre 1/8 y 0 hay ~30°: en cortes muy finos ningún sistema de fracciones es suficientemente preciso; manda la percepción y el *throw* (que también cambia mucho).
- **Drills:** "escalera de octavos": BB fija, 8 posiciones de BO generadas por la app, una por octavo, hacia la misma esquina. Criterio: 6/8 en la primera vuelta, 8/8 objetivo.
- **Fuentes:** como §3; Hal Houle (fracciones), https://www.engr.colostate.edu/~dga/pool/threads/fractional/

---

## 16. CTE (Center-to-Edge) y Pro One (Stan Shuffett)
- **Nivel:** avanzado. **Confiabilidad:** ★ (honestidad: es **el sistema más controvertido** del pool).
- **Origen:** Hal Houle (CTE, "3-angle" systems); desarrollado y comercializado por Stan Shuffett como **Pro One** (DVDs, libro *Pro One* y web justcueit.com).

### Qué propone
- **Visuales** (*visuals*): líneas "objetivas" de BB a BO que no dependen de imaginar ángulos:
  - **CTE**: línea del **centro de la BB al borde de la BO**.
  - Otras referencias (A/B/C, ¼ de la BO, "edge to A", etc.) según el ángulo/distancia.
- **Perceptions 15/30/45** (en Pro One): se elige una de tres "percepciones" según el ángulo aproximado del tiro, y se combina con un desplazamiento del puente (½ punta) y un **pivote/barrido** (*pivot / sweep*) hacia el centro de la blanca.
- **Rutina**: pararse con los ojos en el visual, bajar con el taco desplazado, pivotear al centro de la BB y tirar. Shuffett insiste en que el sistema "encuentra" el ángulo sin que el jugador lo estime.

### Lo que dice la evidencia (Dr. Dave, "CTE evaluation")
- Geométricamente, una línea fija + un pivote fijo **sólo produce una (o unas pocas) líneas de apuntado** por combinación; cubre correctamente **rangos limitados** de ángulo de corte y distancia.
- Para cubrir todos los tiros, los usuarios **ajustan** (consciente o inconscientemente) una o más de: alineación visual sutil, cantidad de desplazamiento paralelo, cantidad de pivote (no exactamente al centro), longitud efectiva del pivote (puente). Dr. Dave: *"Any align-and-pivot system like CTE requires changes in alignment and/or effective pivot length as the cut angle and shot distance change."*
- Por lo tanto el sistema funciona **cuando la experiencia/"feel" del jugador rellena la diferencia**. Pro One, según el propio Dr. Dave, es más un **"nivel de habilidad" y una rutina previa** (*pre-shot routine*) que un algoritmo cerrado.
- En AzBilliards el debate lleva >15 años (hilos con miles de posts). Defensores: profesionales y aficionados reportan mejoras grandes en consistencia. Críticos: no hay descripción completa y verificable, las "explicaciones" geométricas propuestas no cierran.

### Recomendación para la app
- **No** presentarlo como "sistema exacto". Ofrecerlo como **módulo opcional avanzado**: "rutina de alineación basada en referencias visuales (CTE)". Medir su efecto con el mismo set de tiros antes y después (A/B personal), que es honesto y útil.
- Remitir al material oficial de Shuffett para la versión completa (no reproducir su contenido comercial).

### Drills
1. **A/B personal**: 20 cortes estándar (15°, 30°, 45° × 2 distancias) con el método habitual vs. con CTE. Criterio: comparar porcentaje; la app grafica.
2. **Rutina de pivote** (sin bola): practicar desplazamiento de ½ punta + pivote con espejo para consistencia.

### Fuentes
- Dr. Dave: https://drdavepoolinfo.com/FAQ/aiming/CTE/ ; Pro One: https://drdavepoolinfo.com/FAQ/aiming/CTE/Pro-One/ ; evaluación: https://drdavepoolinfo.com/faq/aiming/cte/evaluation/ ; citas: https://drdavepoolinfo.com/faq/aiming/cte/quotes/
- Stan Shuffett: http://www.justcueit.com (Pro One DVD y libro)
- AzBilliards: https://forums.azbilliards.com/threads/what-is-the-supposed-phenomena-of-center-to-edge-aiming.442380/ ; https://forums.azbilliards.com/goto/post?id=2415012 ("NEW CTE Pro One")

---

## 17. Apuntado paralelo (Parallel Aiming)
- **Nivel:** avanzado (como visualización). **Confiabilidad:** ★★ si se hace como en §2 (contacto a contacto con doble paralela); ★ en variantes populares simplificadas.
- **Variante popular (incorrecta):** "trazá una paralela a la línea BO→tronera que pase por el borde de la BB y apuntá esa paralela al PC" → produce **cortes de menos** porque iguala la línea de la BB al PC en vez de a la BF.
- **Variante correcta:** la del §2 (paralela para encontrar el PC de la BB y luego desplazar la línea PC-PC al centro de la BB). Equivale geométricamente a la BF.
- **"Double-the-distance" / Pocket Intersection Method:** variantes que duplican distancias para encontrar el punto de apuntado; sirven como chequeo pero son poco prácticas a distancia.
- **Drill:** "detectar el undercut": 10 tiros de 30° con la variante popular vs. 10 con BF. Objetivo: entender el error.
- **Fuentes:** https://drdavepoolinfo.com/FAQ/aiming/contact-point/ ; https://drdavepoolinfo.com/?p=1629 ; https://forums.azbilliards.com/goto/post?id=1997123

---

## 18. Efecto: desvío (squirt), curva (swerve), BHE / FHE / aim-and-pivot
- **Nivel:** avanzado. **Confiabilidad:** ★★★ física; ★★ los métodos de compensación (dependen del taco, velocidad, distancia, elevación).

### Física
- **Squirt / desvío de la blanca** (*cue ball deflection*): con efecto, la BB sale desviada **hacia el lado opuesto** al efecto respecto de la línea del taco (efecto derecho → la BB sale a la izquierda). Mayor con más efecto y con tacos de alta desviación; tacos de baja desviación (*LD shafts*) reducen el squirt.
- **Swerve / curva**: como el taco nunca está perfectamente horizontal, el efecto hace que la BB **curve hacia el lado del efecto** a medida que se agarra al paño. Más curva con: más elevación del taco, menos velocidad, más distancia.
- Efecto neto en la BO: squirt − swerve. A alta velocidad/corta distancia domina el squirt; a baja velocidad/larga distancia el swerve lo compensa en parte.

### Longitud de pivote natural (*natural pivot length*)
- Es la distancia puente–punta a la cual, pivoteando el taco con la mano de atrás, el squirt queda exactamente compensado (con taco nivelado / tiro rápido y corto).
- Valores típicos: ~**12–13"** para muchos tacos estándar; reportes de 8" (alta desviación) a 14"+ (baja desviación); algunos LD superan 20".
- Cómo medirla: tiro recto largo, rápido, a un objetivo; apuntar centro, pivotear con la mano trasera hasta la cantidad de efecto deseada, variar la longitud del puente hasta que la BB vaya a donde apuntó al centro.

### Métodos
1. **BHE – Back-Hand English (pivote con la mano trasera):** apuntá con la punta al centro de la BB, luego **girá la culata** con el puente fijo hasta el efecto deseado. Si el puente está a la longitud de pivote natural, el squirt se compensa solo.
2. **FHE – Front-Hand English (pivote con el puente):** alineá con efecto paralelo y luego desplazás la **mano del puente**; manteniendo la culata. Compensa en sentido opuesto (útil cuando el swerve domina).
3. **Aim-and-pivot (apuntar y pivotear):** término general: alineás la línea de apuntado al centro y luego pivoteás (BHE o FHE). Variante "**SAM**"/sistemas de pivote de Houle.
4. **Efecto paralelo** (*parallel English*): se desplaza el taco paralelo a la línea de apuntado y se compensa el squirt "a ojo" (apuntando un poco hacia el lado del efecto).

### Errores
- Usar BHE con un puente distinto de la longitud de pivote natural → compensación incompleta.
- Olvidar el swerve en tiros lentos y largos (la BB "vuelve").
- Elevar el taco más de lo necesario (aumenta swerve).

### Drills
1. **Medir pivote natural**: BB en `(1,2)`, objetivo: diamante central de la banda de pie `(8,2)`. Tiros firmes con BHE de ½ punta izquierda/derecha variando el puente de 9" a 16". Criterio: encontrar la longitud donde la BB pega a ≤ ½ bola del objetivo 4/5. Guardar en el perfil.
2. **Efecto en cortes**: corte de 30°, BO en `(6,2)`, BB a 2 diamantes; tirar con efecto de afuera y de adentro, a lenta y rápida, compensando con BHE. Criterio: 6/10 por combinación.
3. **Squirt vs swerve**: mismo tiro recto largo con efecto a 3 velocidades; observar dónde queda el impacto. Pedagógico.

### Fuentes
- https://drdavepoolinfo.com/?p=1997 (natural pivot length)
- https://drdavepoolinfo.com/faq/squirt/ y /faq/swerve/ (FAQ de Dr. Dave sobre squirt/swerve/BHE/FHE)
- AzBilliards: https://forums.azbilliards.com/goto/post?id=4817320 ("Redefining the Definition of Backhand English"); https://forums.azbilliards.com/threads/squirt-deflection.31788

---

## 19. Throw: compensación CIT y SIT (Cut-Induced Throw / Spin-Induced Throw)
- **Nivel:** avanzado. **Confiabilidad:** ★★★ (medido experimentalmente por Dr. Dave).
- **Problema:** la fricción entre bolas "arrastra" la BO fuera de la línea de centros, desviándola de lo que predice la BF.

### CIT (*cut-induced throw*)
- La BO sale **un poco hacia el lado del movimiento de la BB** → corta de menos (*undercut*) → hay que **apuntar un poco más fino**.
- **Máximo:** tiro **lento, seco** (*stun*), cerca de **media bola** (30°): ≈ **5°**, es decir ≈ **1" por pie** de recorrido de la BO, o **½ bola por diamante** en una mesa de 9 ft.
- Menos throw con: **más velocidad**, **rodada o retroceso** (la BB "rueda" sobre la BO), bolas limpias/pulidas. Más throw con bolas sucias (manchas de tiza: "skid/cling").
- Corte fino o casi recto → throw menor.

### SIT (*spin-induced throw*)
- El efecto en la BB empuja la BO **hacia el lado contrario al efecto** (efecto derecho → la BO sale a la izquierda) — en tiros rectos es el principal.
- **Efecto interno** (*inside English*) **suma** al CIT; **efecto externo** (*outside English*) **resta**.
- **Efecto de engranaje** (*gearing outside English*): cantidad de efecto externo que elimina el deslizamiento entre bolas → **throw cero**. Para media bola: **~50% de efecto externo** (≈ media punta del máximo) → sin throw; 10% externo todavía da throw máximo.

### Cómo compensar en la práctica
1. Tiros lentos y cortes de 15–45° → apuntar algo más fino (empezar por ¼ de bola extra cada 2 diamantes de recorrido de la BO, calibrar).
2. Tiros rectos con efecto lateral → corregir hacia el lado del efecto.
3. Usar throw a favor: "cortar" una bola casi recta con efecto interno para "tirarla" a la tronera (*throw shot*), o mover combinaciones/frozen balls.

### Drills
1. **Medir el throw**: tiro de media bola **lento y seco**, BO en `(4,2)` hacia la banda de pie (distancia 4 diamantes). Marcá dónde pega vs. donde predice la BF. Repetir rápido y con rodada. Objetivo: ver ~2 bolas de diferencia lento vs rápido.
2. **Throw con efecto en tiro recto**: BO pegada a otra (frozen) — "throw de bolas pegadas": BO en `(6,2)` frozen con otra bola, inclinadas ~5° respecto de la tronera; usar efecto para embocarla. Criterio: 5/10.
3. **Engranaje**: corte de 30°, mismo tiro con 0%, 25%, 50% efecto externo. Observar la desaparición del throw.

### Fuentes
- https://drdavepoolinfo.com/FAQ/throw/maximum/ ; https://drdavepoolinfo.com/?p=2633 (factores del throw) ; https://drdavepoolinfo.com/?p=2625 (stun vs top/back)
- *Billiards Digest* oct 2006 (throw): https://billiards.colostate.edu/bd_articles/2006/oct06.pdf
- Alciatore, *The Illustrated Principles of Pool and Billiards* (libro, cap. throw).

---

## 20. Massé (fundamentos)
- **Nivel:** avanzado. **Confiabilidad:** ★★ (alto nivel de destreza; mucha variabilidad).
- **Problema:** rodear una bola obstáculo con una curva pronunciada.

### Fundamentos
- Taco **elevado** (30°–90°); golpe de arriba hacia abajo con desplazamiento lateral de la punta respecto del centro → la BB sale en una dirección y curva hacia otra.
- Modelo práctico de Dr. Dave: la BB sale **aproximadamente en la dirección del taco proyectada sobre la mesa** (más el squirt) y **termina** en una dirección hacia el **"punto de apuntado"**: el punto donde la línea del taco intersecta la mesa (proyección vertical del eje del taco). Cuanto más elevado, más cerrada la curva.
- **Semimassé / swerve deliberado**: elevación 15°–30°, curva leve para pasar una bola cercana a la línea.
- Puente elevado (*elevated bridge*) estable; golpe corto y suelto; hacer de manera que la punta no toque el paño (riesgo de romper el paño: muchas salas lo prohíben).

### Errores
- Apretar el taco; golpear demasiado fuerte (la curva se produce tarde).
- Elevación inconsistente.

### Drills
1. **Swerve corto**: obstáculo a ½ bola de la línea BB-BO; BB `(2,2)`, obstáculo `(3, 2.1)`, BO `(5,2)`. Criterio: contacto 6/10.
2. **Massé de 90°**: BB pegada a una bola obstáculo, objetivo a 1 diamante al costado. Criterio: 3/10 inicial.

### Fuentes
- https://drdavepoolinfo.com/faq/masse/ (FAQ massé y "aim point" de Dr. Dave)
- Video Encyclopedia of Pool Shots (VEPS IV – Banks, Kicks and Advanced Shots).

---

## 21. Tiro de salto (Jump Shot) — fundamentos y legalidad
- **Nivel:** avanzado. **Confiabilidad:** ★★★ física; habilidad entrenable.

### Legalidad (reglas WPA/BCA "World Standardized Rules")
- **Legal:** saltar la blanca golpeando **hacia abajo** con el taco elevado (la BB rebota contra la pizarra).
- **Falta (foul):** "cucharear" (*scoop / miscue jump*) golpeando debajo del centro para levantarla.
- Tacos de salto: la WPA exige longitud mínima del taco (40" / 101,6 cm). Muchas ligas o salas restringen saltos o tacos de salto: verificar reglas locales.

### Fundamentos
- **Elevación del taco**: 30°–60° típicamente; más elevación → salto más alto y corto. Para pasar una bola obstáculo a ~1 diamante se usa ~45–50° con taco de salto.
- **Golpe al centro** (vertical) de la BB desde arriba, con un golpe corto, rápido y relajado ("tirar dardos" / *dart stroke*).
- La BB debe estar a suficiente distancia del obstáculo: con taco de salto ~½ a 1 diamante mínimo; más cerca requiere más elevación.
- Apuntado: igual que un tiro normal (la BB, al aterrizar, conserva la dirección); con efecto lateral involuntario el salto se desvía.

### Drills
1. **Salto sobre una bola**: BB `(2,2)`, obstáculo `(2.7, 2)`, BO `(4,2)` (o más lejos). Criterio: superar obstáculo sin tocar 6/10; contacto con BO 4/10.
2. **Escalera de distancia**: acercar el obstáculo (1 diamante → ½ diamante). Criterio por paso: 5/10.
3. **Salto + embocar**: BO a 2 diamantes de una esquina. Criterio: 3/10.

### Fuentes
- https://drdavepoolinfo.com/faq/jump/ (FAQ jump, Dr. Dave)
- WPA Rules (World Standardized Rules), regla de jump shots y "cue length": https://wpapool.com/rules-of-play/

---

# 22. Ruta de aprendizaje recomendada (grafo de prerequisitos)

```
[L1 Postura/Alineación §5]
        │
        ▼
[L2 Bola fantasma §1] ──► [L3 Punto de contacto §2]
        │                         │
        ▼                         ▼
[L4 Estimación de ángulo §4] ◄────┘
        │
        ▼
[L5 Fracciones ¾ ½ ¼ §3]
        │
        ├──────────────► [L6 Regla 90° / tangente §6]
        │                         │
        │                         ▼
        │                [L7 Regla 30° §7] ──► [L8 Seguimiento/retroceso §8] ──► [L9 Trisección §9]
        │                                                 │
        ▼                                                 ▼
[L10 Bancas: espejo + conteo §10.1–10.2] ─► [L11 Correcciones de banca §10.4–10.5]
        │                                                 │
        ▼                                                 ▼
[L12 Kick 1 banda: espejo y 2-a-1 §11] ─► [L13 Plus System §12] ─► [L14 Corner-5 §13]
        │                                        │
        ▼                                        ▼
[L15 Kicks sin efecto / spot on the wall §14]   (requiere L8: efecto de corrido controlado)

Rama avanzada (requiere L5 + L8):
[L16 Octavos §15] ─► [L17 Throw CIT/SIT §19]
[L18 Squirt/Swerve, BHE/FHE §18] ─► [L19 Throw con efecto (SIT) §19] ─► [L20 Massé §20]
[L21 Jump §21] (requiere L1 + L8)
[L22 CTE / Pro One §16 — opcional] (requiere L5 + L18) ; [L23 Parallel aiming §17 — opcional, como teoría]
```

### Orden lineal sugerido (con prerequisitos)
| # | Lección | Prerequisitos | Duración sugerida |
|---|---|---|---|
| 1 | Postura, centro de visión, golpe recto | — | 1–2 semanas |
| 2 | Bola fantasma | 1 | 1 semana |
| 3 | Punto de contacto (y el error de undercut) | 2 | 2–3 sesiones |
| 4 | Estimación de ángulo | 2 | continuo |
| 5 | Fracciones ¾, ½, ¼, llena | 3, 4 | 1–2 semanas |
| 6 | Tangente / 90° (stun) | 5 | 1 semana |
| 7 | Regla de 30° | 6 | 1 semana |
| 8 | Seguimiento/retroceso y velocidad | 7 | 2 semanas |
| 9 | Trisección (retroceso) | 8 | 1 semana |
| 10 | Bancas: espejo y conteo de diamantes | 5 | 1 semana |
| 11 | Correcciones de banca, cross-side/corner | 10, 8 | 2 semanas |
| 12 | Kicks de 1 banda (espejo PC, 2-a-1) | 10 | 1–2 semanas |
| 13 | Plus System | 12, 8 | 2 semanas |
| 14 | Corner-5 | 13 | 2–3 semanas |
| 15 | Kicks sin efecto / spot on the wall | 12 | 1 semana |
| 16 | Octavos | 5 | 1 semana |
| 17 | Throw (CIT) | 16 | 1 semana |
| 18 | Squirt, swerve, BHE/FHE, pivote natural | 8 | 2 semanas |
| 19 | Throw con efecto (SIT, engranaje) | 17, 18 | 1 semana |
| 20 | Massé básico | 18 | continuo |
| 21 | Salto básico | 1, 8 | continuo |
| 22 | CTE / Pro One (opcional, A/B personal) | 5, 18 | opcional |
| 23 | Apuntado paralelo (teoría) | 3 | opcional |

> Para un jugador **intermedio** que ya emboca, conviene un **test diagnóstico inicial** (ver abajo) que permita saltear L2–L5 si el rendimiento es alto, pero **no saltear** L1 (alineación) ni L6–L7 (las reglas de trayectoria suelen ser nuevas para autodidactas).

---

# 23. Evaluación sugerida por lección

Formato general: **examen de habilidad** al estilo Billiard University (posiciones 1–7: subís una posición al acertar, bajás al fallar; 10 intentos; puntaje = posición final o suma), complementado con **preguntas teóricas cortas** en la app.

| Lección | Evaluación práctica | Aprobado | Evaluación teórica |
|---|---|---|---|
| 1 Postura | Tiro de blanca sola a banda de pie y vuelta sobre `y=2` (10 int.); recto largo progresivo BU | 7/10 a ≤ ½ bola; posición ≥ 5 | Identificar 3 errores de alineación en un video |
| 2 BF | 3 ángulos (15/30/45) a esquina, BB a 2 diamantes | 7/10 por ángulo | Ubicar la BF en 5 diagramas |
| 3 PC | Marcar PC en 5 configuraciones; 10 tiros comparando métodos | error < 3 mm | Explicar por qué "centro a PC" corta de menos |
| 4 Ángulo | 20 estimaciones con la app | error medio ≤ 5° | — |
| 5 Fracciones | Escalera de fracciones (4 tiros) ×3 | 2 escaleras completas de 3 | Tabla fracción↔ángulo (¾=14,5°, ½=30°, ¼=48,6°) |
| 6 Tangente | Predecir punto de banda en 10 tiros secos | ±½ diamante 7/10 | Dibujar la tangente en 5 diagramas |
| 7 Regla 30° | Predicción con V en 10 tiros rodados | ±½ diamante 7/10 | Rango de validez (¼–¾) |
| 8 Follow/draw | Abanico de 5 trayectorias; draw ladder | orden correcto; posición ≥ 5 | Efecto de la velocidad sobre la curva |
| 9 Trisección | 10 predicciones de retroceso | ±1 diamante 6/10 | Calcular 3θ para 3 ejemplos |
| 10 Bancas base | Banca de referencia + 2 variantes | 7/10 referencia, 5/10 variantes | Calcular punto de banda por conteo |
| 11 Correcciones | Escalera de velocidad y corte inducido | 5/10 cada lado | Tabla de correcciones (rápido=corto, etc.) |
| 12 Kick 1 banda | 2-a-1 desde posición sorteada (10) | contacto 6/10 y cálculo ±0,2 | Calcular línea 2-a-1 con shift culata 2:punta 1 |
| 13 Plus | Benchmark 3→5 + 2 kicks a bola en banda | 7/10 benchmark; 6/10 contacto | Numeración de la banda corta (1,2,3…9) |
| 14 Corner-5 | Benchmark + familia de líneas | 6/10; 5/10 | Resolver T = D − F en 5 problemas |
| 15 Sin efecto | Spot on the wall desde 4 posiciones | 6/10 | — |
| 16 Octavos | Escalera de octavos | 6/8 | Tabla completa de octavos |
| 17 CIT | Medición del throw lento vs rápido | detectar ≥ 1 bola de diferencia | ½ bola por diamante, cuándo es máximo |
| 18 Squirt/BHE | Medición de pivote natural + cortes con efecto | longitud registrada; 6/10 | Diferencia squirt vs swerve; BHE vs FHE |
| 19 SIT | Throw de bolas pegadas; engranaje | 5/10 | Efecto interno suma / externo resta |
| 20 Massé | Swerve corto | 6/10 | Concepto de "punto de apuntado" de massé |
| 21 Salto | Salto sobre obstáculo a 1 diamante | 6/10 sin tocar | Legal vs scoop (falta) |
| 22 CTE | A/B personal 20 tiros | (no se aprueba/reprueba; informe) | Qué dice la evidencia (limitaciones) |

### Evaluación diagnóstica inicial (para jugadores intermedios)
1. 10 cortes (2 por ángulo: 0°, 15°, 30°, 45°, 60°) a 2 diamantes.
2. 5 predicciones de trayectoria (2 stun, 2 rodada, 1 retroceso).
3. 3 bancas de referencia y 3 kicks de 1 banda.
4. Estimación de 10 ángulos.
Resultado → la app ubica al usuario y desbloquea lecciones.

### Perfil de mesa (recomendación de producto)
Muchos sistemas (Plus, Corner-5, bancas) necesitan **calibración por mesa**. La app debería guardar por mesa: velocidad estándar de banca, T de esquina del Corner-5, benchmark Plus (velocidad/efecto), y por jugador: longitud de pivote natural del taco.

---

## Bibliografía general
- Dr. Dave Alciatore — FAQ: https://drdavepoolinfo.com/faq/ ; columnas *Billiards Digest* (archivo): https://drdavepoolinfo.com/bd_articles/ ; pruebas técnicas: https://billiards.colostate.edu/technical_proofs/ ; libros *The Illustrated Principles of Pool and Billiards* y *Pool and Billiards for Dummies*; DVDs *VEPS I–V*.
- Billiard University (Alciatore, Joe Tucker): exámenes BU I–IV, https://billiarduniversity.org ; artículos BD sep 2013 – ene 2014.
- Bert Kinister — serie de videos de drills ("Kinister tapes").
- Stan Shuffett — *Pro One* (DVD/libro), http://www.justcueit.com
- Hal Houle — sistemas de fracciones/"3 angles", CTE (transmitidos por discípulos; ver citas en drdavepoolinfo.com/faq/aiming/cte/quotes/).
- Mark Wilson — *Play Your Best Pool* (2018).
- Robert Byrne — *Byrne's Standard Book of Pool and Billiards* (ed. revisada *New Standard Book*, 1998).
- Freddy Bentivegna — *Banking with the Beard*.
- Foro AzBilliards — https://forums.azbilliards.com/ (hilos sobre CTE, Plus System, BHE, banks).

> Nota de verificación: los números de Plus System, Corner-5, kicks de 1 banda y throw se extrajeron de los artículos originales de Dr. Dave en *Billiards Digest* (2010–2011) y su FAQ. Las cifras de massé y salto son rangos orientativos de la literatura instruccional; conviene validarlas en la mesa al grabar los videos de cada lección. Algunas coordenadas de drills son aproximadas y la app debería calcular las posiciones exactas a partir del ángulo de corte buscado.
