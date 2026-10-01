# Pool Physics Models: Engineering Reference

Scope: physics for a pocket-billiards simulator in TypeScript (mobile PWA). Rendering is top-down 2D, but the
physics state is full 3D: position `r`, velocity `v` and angular velocity `ω` are all 3-vectors, so the
model covers side/top/back spin, masse/swerve and jumps.

Conventions used throughout (they match pooltool):
- Table frame: `x` along the table width, `y` along the length, `z` up. The slate is the plane `z = 0`, so the
  center of a resting ball is at `z = R`.
- The ball state is the triple `rvw = [r, v, ω]`, all in SI units (m, m/s, rad/s).
- Contact-point slip velocity with the cloth: `u = v + R ẑ × ω`. Rolling without slip means `u = 0`.
- Cue tip offsets `(a, b)` are normalized by `R`: `a` is side offset (pooltool: +a = left english),
  `b` is vertical offset (+b = top).

Primary sources (cited inline as [tags]):
- [DD-PP] Dr. Dave, physical property constants: https://billiards.colostate.edu/faq/physics/physical-properties/
- [DD-SPD] Dr. Dave, typical ball speeds: https://billiards.colostate.edu/faq/speed/typical/
- [TP A.4] Post-impact CB trajectory for any cut, speed and spin: https://billiards.colostate.edu/technical_proofs/new/TP_A-4.pdf
- [TP A.5/A.6] Ball-ball impulse and friction: https://billiards.colostate.edu/technical_proofs/new/TP_A-5.pdf , https://billiards.colostate.edu/technical_proofs/new/TP_A-6.pdf
- [TP A.14] Effects of cut angle, speed and spin on throw: https://billiards.colostate.edu/technical_proofs/new/TP_A-14.pdf
- [TP A.30] Cue tip offset, cue weight, cue speed vs CB speed and spin: https://billiards.colostate.edu/technical_proofs/new/TP_A-30.pdf
- [TP A.31] Physics of squirt: https://billiards.colostate.edu/technical_proofs/new/TP_A-31.pdf
- [TP 3.1] 90° rule: https://billiards.colostate.edu/technical_proofs/TP_3-1.pdf
- [TP 3.3] 30° rule: https://billiards.colostate.edu/technical_proofs/TP_3-3.pdf
- [TP 3.5/3.6] Effective pocket target sizes (side/corner): https://billiards.colostate.edu/technical_proofs/TP_3-5.pdf , https://billiards.colostate.edu/technical_proofs/TP_3-6.pdf
- [TP 4.1] Distance for stun and natural roll to develop: https://billiards.colostate.edu/technical_proofs/TP_4-1.pdf
- [TP B.6] CB table lengths of travel vs speed: https://billiards.colostate.edu/technical_proofs/new/TP_B-6.pdf
- [WPA] WPA Recommended Equipment Specifications: https://wpapool.com/wp-content/uploads/2024/01/RECOMMENDED-EQUIPMENT-SPECIFICATIONS.pdf
- [PT] pooltool source code (ekiefl): https://github.com/ekiefl/pooltool . Files cited below are under `pooltool/`. Docs: https://pooltool.readthedocs.io
- [PT-THEORY] Ekiefl, "pooltool theory" (equations of motion): https://ekiefl.github.io/2020/04/24/pooltool-theory/
- [HAN05] I. Han, "Dynamics in carom and three cushion billiards", J. Mech. Sci. Tech. 19(4):976–984, 2005. https://doi.org/10.1007/BF02919180
- [MAT10] S. Mathavan, M.R. Jackson, R.M. Parkin, "A theoretical analysis of billiard ball dynamics under cushion impacts", Proc. IMechE Part C 224(9):1863–1873, 2010. https://doi.org/10.1243/09544062JMES1964 (open copy: https://dspace.lboro.ac.uk/2134/15087)
- [LG06] W. Leckie, M. Greenspan, "An Event-Based Pool Physics Simulator", Advances in Computer Games (ACG 11), LNCS 4250, 2006. https://doi.org/10.1007/11922155_19
- [MARLOW] W.C. Marlow, *The Physics of Pocket Billiards*, MAST, 1995. Its ball-ball friction data (Table 10, p. 245) are the basis of the [TP A.14] friction fit.
- [Q1010] Orellana & De Michele, "Algorithm 1010: Boosting efficiency in solving quartic equations", ACM TOMS 46(2), 2020. https://doi.org/10.1145/3386241

---

## 1. Standard parameters

### 1.1 Balls
| Quantity | Value | Source |
|---|---|---|
| Diameter | 2.25 in ± 0.005 in = 57.15 mm (R = 0.028575 m) | [WPA] §16 |
| Mass | 5.5–6 oz = 156–170 g. Default 0.170097 kg (6 oz) | [WPA] §16, [DD-PP], [PT] `objects/ball/params.py` |
| Moment of inertia | I = 2/5 m R² (solid sphere) | [DD-PP] |

### 1.2 Tables (playing surface measured cushion nose to cushion nose)
| Size | Playing surface | Diamond spacing | Source |
|---|---|---|---|
| 9 ft | 100 × 50 in (2.540 × 1.270 m), tolerance ±1/8 in | 12.5 in (317.5 mm) | [WPA] §5, §6 |
| 8 ft | 92 × 46 in (2.3368 × 1.1684 m), tolerance ±1/8 in | 11.5 in (292.1 mm) | [WPA] §5, §6 |
| 7 ft | Not a WPA size. Typically 78 × 39 in (1.9812 × 0.9906 m); varies by maker (74–78 in) | L/8 = 9.75 in | [PT] `objects/table/specs.py` (7-ft default) |

- Rails carry 18 sights (diamonds). That gives 8 intervals along the length and 4 across the width. The
  playing surface is 2:1, so spacing along both is the same: L/8 = W/4. The center of each sight sits
  3 11/16 in (93.7 mm) back from the cushion nose [WPA] §6. Account for this offset when drawing diamonds
  and building diamond-system aim aids.
- **Cushion nose height** is 63.5% ±1% of the ball diameter (62.5–64.5%) [WPA] §7. That is 36.3 mm for a
  57.15 mm ball. pooltool uses `cushion_height = 0.64·2R = 36.58 mm` [PT]. Contact angle above the ball
  center: `θ = asin(h/R − 1)`, which is about 15.7° at 63.5% (sin θ = 0.27). Note that Mathavan's snooker
  analysis uses h = 7R/5, i.e. sin θ = 2/5 [MAT10]. Use the pool value.
- Cushion width (cloth-covered) is 1 7/8 to 2 in [WPA] §7. Table "speed" requirement: a firm center-ball
  shot from the head spot through the foot spot must travel at least 4–4.5 table lengths [WPA] §8. This is
  a good global calibration test for `e_c` and `μr` (§9).

### 1.3 Pockets ([WPA] §9; Dr. Dave pocket models [TP 3.5/3.6])
| | Corner | Side | Source |
|---|---|---|---|
| Mouth (point to point of the cushion noses) | 4.5–4.625 in (114.3–117.5 mm) | 5–5.125 in (127–130.2 mm); traditionally 0.5 in wider than the corner | [WPA] |
| Facing cut angle (rubber vs. rail) | 142° ±1. That is a 7° wall angle relative to the pocket axis (142 − 135) | 104° ±1. That is a 14° wall angle (104 − 90) | [WPA]; α = 7° / 14° in [TP 3.6]/[TP 3.5] |
| Shelf (mouth line to slate cut) | 1–2.25 in | 0–0.375 in | [WPA] |
| Back draft (vertical pocket angle) | 12–15° | 12–15° | [WPA] |
| Dr. Dave model geometry | p = 4.5875 in, α = 7°, R_hole = 2.75 in, shelf b = 1.125 in | p = 5.0625 in, α = 14°, R_hole = 3 in, b = 0.1875 in | [TP 3.6], [TP 3.5] |
| pooltool 7-ft defaults (m) | width 0.118, angle 5.3°, depth 0.0417, radius 0.062, jaw radius 0.02095 | width 0.137, angle 7.14°, depth 0.0685, radius 0.0645, jaw radius 0.00795 | [PT] `objects/table/specs.py` |

### 1.4 Friction and restitution coefficients
| Pair / quantity | Range (Dr. Dave) | pooltool default | Notes |
|---|---|---|---|
| Ball-cloth sliding friction μs | 0.15–0.4, typical 0.2 | `u_s = 0.2` | [DD-PP], [PT] params.py |
| Ball-cloth rolling resistance μr | 0.005–0.015 | `u_r = 0.01` | [DD-PP] |
| Ball-cloth spin deceleration (z-spin) | 5–15 rad/s² | `u_sp = (10·2/5/9)·R`, which gives α_sp = 5·u_sp·g/(2R) ≈ 10.9 rad/s² | [DD-PP], [PT] |
| Ball-ball friction μb | 0.03–0.08 | speed-dependent: `μ(v_rel) = 9.951e-3 + 0.108·exp(−1.088·v_rel)` (v_rel = contact slip speed, m/s); constant fallback `u_b = 0.05` | [TP A.14] fit to [MARLOW] Table 10, [PT] `physics/resolve/ball_ball/friction.py` |
| Ball-ball restitution e_b | 0.92–0.98 | 0.95 | [DD-PP], [PT] |
| Ball-rail restitution e_c | 0.6–0.9 (about 0.7 for a rolling ball into a rail [TP B.6]) | 0.85 (constant; van Balen thesis cited in code) | [DD-PP], [PT] `ball_cushion/han_2005/properties.py` |
| Ball-rail friction f_c | — | 0.2 | [PT]. [MAT10] fits μw = 0.14 with e = 0.98 (snooker, rigid cushion, ≤2.5 m/s normal) |
| Ball-table (slate) restitution e_t | 0.5–0.7 | 0.5 | [DD-PP], [PT] |
| Cue tip-ball friction | 0.6 | — | [DD-PP] |
| Cue tip-ball restitution | 0.71–0.75 (leather), 0.81–0.87 (phenolic) | elastic (factor 2) | [DD-PP], [TP A.30] |
| Cue mass M | ~18–21 oz. Dr. Dave uses 18 oz (m/M ≈ 1/3) | 0.567 kg (20 oz) | [TP A.30], [PT] `objects/cue/datatypes.py` |
| Shaft end mass m_e (squirt) | depends on shaft | m/30 ≈ 5.7 g | [TP A.31], [PT] |
| Tip radius | ~dime radius | 0.0106 m | [PT] |
| g | 9.81 m/s² | 9.81 | |

pooltool also has a speed-dependent cushion restitution that is present in the code but disabled:
`e_c(v_n) = max(0.40, 0.50 + 0.257·v_n − 0.044·v_n²)` ([PT] `han_2005/properties.py`). It is an option if
fixed `e_c` feels wrong at break speeds.

### 1.5 Typical cue-ball speeds [DD-SPD]
| Shot | mph | m/s |
|---|---|---|
| Soft touch | <1 | <0.45 |
| Slow | 1–2 | 0.45–0.89 |
| Medium | 2–4 | 0.89–1.9 |
| Fast | 4–7 | 1.9–3.2 |
| Power | 7–10 | 3.2–4.5 |
| Powerful break | 25–30 | 11–13 |
| "Ridiculous" break | 35 | 16 |

Design implication: the UI power slider should map to CB speed of about 0.3–13 m/s (break mode up to about
13 m/s). The engine must stay exact at 16 m/s, because 16 m/s × 1/60 s = 27 cm per frame (see §8).

---

## 2. Ball motion states (equations of motion and transition times)

Sources: [PT-THEORY], [PT] `physics/evolve/__init__.py`, `physics/utils.py`, [TP A.4], [TP 4.1], [LG06].

States: `STATIONARY`, `SPINNING` (v = 0, ωz ≠ 0), `SLIDING` (u ≠ 0), `ROLLING` (u = 0, v ≠ 0),
`AIRBORNE`, `POCKETED`. The z-spin ωz decays independently in every on-table state at the constant rate
`α_sp = 5·μsp·g/(2R)`. It never crosses zero: clamp it at zero.

### 2.1 Sliding (u₀ ≠ 0)
Friction is `F = −μs m g û`, where `û = u₀/|u₀|`. Its direction is **constant** during the slide, because
`du/dt = −(7/2) μs g û` [TP A.4 eq. 10]. Closed form, with `t` measured from the start of the state:
```
r(t)    = r0 + v0 t − ½ μs g t² û
v(t)    = v0 − μs g t û
ω_xy(t) = ω0_xy + (5 μs g / 2R) t (ẑ × û)
ωz(t)   = ωz0 − sign(ωz0) α_sp t            (clamped at 0)
τ_slide = 2 |u0| / (7 μs g)                    [TP A.4 eq. 20; PT get_slide_time]
```
The trajectory is a parabola. This is the source of swerve, masse, and the curved post-impact cue-ball path.
The velocity at the end of the slide is independent of μs [TP A.4 eq. 24]:
`v_f = v0 − (2/7) u0 = (5/7) v0 + (2/7) R (ω0 × ẑ)`.

### 2.2 Rolling (u = 0)
```
r(t) = r0 + v0 t − ½ μr g t² v̂0
v(t) = v0 − μr g t v̂0
ω_xy(t) = (ẑ × v(t)) / R ;  ωz decays as above
τ_roll = |v0| / (μr g)                         [PT get_roll_time]
d_roll = |v0|² / (2 μr g)                      [TP B.6]
```
At the end of τ_roll the next state is SPINNING if ωz ≠ 0, otherwise STATIONARY.

### 2.3 Spinning
`τ_spin = |ωz| / α_sp = 2R|ωz| / (5 μsp g)` [PT get_spin_time]. Then STATIONARY.

### 2.4 Airborne
Parabolic flight with `ω` conserved: `r(t) = r0 + v0 t − ½ g t² ẑ`, `v(t) = v0 − g t ẑ` [PT `_evolve_airborne_state`].
Leaving the airborne state is a ball-table collision event (§6).

### 2.5 Worked numbers (μs = 0.2, μr = 0.01, g = 9.81)
These are useful as unit tests. A stun ball at 1 m/s slides for 0.146 s over 0.125 m, then rolls at 5/7 v
(0.714 m/s) for 7.28 s over 2.60 m. Slide distance for stun is `12 v²/(49 μs g)` [TP B.6].

---

## 3. Cue-ball strike

### 3.1 Speed and spin from tip offset and elevation (instantaneous point impulse)
Source: [TP A.30] (level cue), generalized to an elevated cue in [PT] `physics/resolve/stick_ball/instantaneous_point/__init__.py`
(same model as [LG06]/[MARLOW]).

Level cue, offset `x` from center (any direction perpendicular to the cue), restitution `e`:
```
v_ball = (1+e) V_cue / (1 + m/M + (5/2)(x/R)²)        (pooltool uses 1+e = 2, elastic)
ω      = (5/2) v_ball x / R²                           (spin axis ⟂ to offset and cue axis)
```
- Center hit, m/M = 1/3, elastic: v_ball = 1.5·V_cue [TP A.30 eq. 8].
- Natural roll at impact occurs for a top offset of b = 0.4R, i.e. Rω/v = (5/2)(0.4) = 1. A vertical
  offset b gives Rω/v = 2.5b (b normalized). At b = 0.5 this is 1.25× natural roll.
- The theoretical max-spin offset is `x = R·sqrt(2/5·(1 + m/M))` ≈ 0.73R [TP A.30 eq. 11–12]. It is
  unreachable in practice because of the miscue limit (§3.3).

Elevated cue (elevation θ, aim azimuth φ), pooltool algorithm:
```
// cue-frame contact (normalized): a (side), b (vertical), c = sqrt(1 − a² − b²)
ba = a
bc = cosθ·c − sinθ·b
bb = sinθ·c + cosθ·b
A = R·ba;  C = R·bc;  B = R·bb;  I_m = 2/5 R²
v = 2 V0 / (1 + m/M + (A² + (B cosθ)² + (C sinθ)² − 2 B C cosθ sinθ)/I_m)
v_ball_frame = −v·(0, cosθ, sinθ)        // z component < 0: the ball is driven INTO the slate
ω_ball_frame = (v/I_m)·(−C sinθ + B cosθ,  A sinθ,  −A cosθ)
rotate both about z by (φ + π/2) into the table frame; then apply squirt rotation α (3.2)
```
- For θ > 0 the negative v_z produces an immediate ball-table collision. That collision is how jumps
  happen (§6).
- Side offset with an elevated cue produces an ω_xy component that is not perpendicular to v. That gives
  slip u not parallel to v, which makes the path curve (swerve/masse) under §2.1.
- pooltool notes that a finite tip radius moves the contact point. The effective contact point is
  `Q = (a,b)/(1 + r_tip/R)` (docstring in the same file). Apply it if (a,b) means the tip-center offset in
  the UI.
- Realism: use `1+e_tip` with e_tip ≈ 0.75 (leather) instead of 2, or calibrate V0 so that full power gives
  the speeds in §1.5. The `english_throttle` multiplier on ω exists in pooltool for tuning.

### 3.2 Squirt (cue-ball deflection) [TP A.31], [PT] `stick_ball/squirt.py`
```
α = −atan2( (5/2)·a·sqrt(1−a²),  1 + m/m_e + (5/2)(1−a²) )      // a = side offset / R; rad; −α = right
```
Rotate the CB velocity by α about z. With m/m_e = 30 (pooltool default) squirt is 1.0° at a = 0.25 and
1.9° at a = 0.5. With m/m_e = 15 (a high-squirt shaft) it is 1.9° and 3.5°. Dr. Dave notes typical values
are under about 2° (low-squirt shafts). Expose `m_e` as a cue property, so low-deflection shafts become a
game stat. Swerve (§2.1) partially cancels squirt on elevated or slow shots. This emerges from the model
for free.

### 3.3 Miscue limit
Dr. Dave's FAQ (https://drdavepoolinfo.com/faq/foul/miscue/) uses a limit of about **0.5R** (the contact
point half a ball radius from center). This is consistent with tip-ball friction μ ≈ 0.6
([DD-PP]: atan 0.6 = 31°, sin 31° ≈ 0.51). Implementation: if `sqrt(a²+b²) > 0.5` (contact-point basis),
flag a miscue. Then either clamp the UI at about 0.5, or simulate a weak, random, low-spin hit.

---

## 4. Ball-ball collision with friction (throw)

### 4.1 Impulse model (instantaneous, equal masses)
Source: [TP A.5/A.6/A.14], extended to both balls with full vectors in [PT] `physics/resolve/ball_ball/frictional_inelastic/__init__.py`.
Work in a frame with x̂ = n̂ = unit(r2 − r1).
```
// normal (restitution), same in the slip and no-slip cases
v1n' = ½((1−e)v1n + (1+e)v2n);  v2n' = ½((1+e)v1n + (1−e)v2n);  ΔVn = |v2n' − v1n'|
ω1n, ω2n unchanged
// zero the normal components of v and ω, then tangential:
u12 = (v1 + R ω1×n̂) − (v2 − R ω2×n̂)                 // contact slip, tangential
if |u12| > ε:                                           // try sliding throughout the impact
    Δv1 = −μ(|u12|)·ΔVn·û12
    Δω  = (5/2R)(n̂ × Δv1)
    v1 += Δv1;  v2 −= Δv1;  ω1 += Δω;  ω2 += Δω
if |u12| ≤ ε or the slip direction reversed (u12·u12' ≤ 0):  // gripping (no-slip) case
    Δv1 = −(1/7)(v1 − v2 + R (ω1+ω2) × n̂)
    Δω  = −(5/14)((n̂ × (v1 − v2))/R + ω1 + ω2)
    v1 = v1⁰ + Δv1;  v2 = v2⁰ − Δv1;  ω1 = ω1⁰ + Δω;  ω2 = ω2⁰ + Δω
// restore normal components; recompute motion states (usually SLIDING)
```
`μ(v_rel) = 9.951e-3 + 0.108·e^(−1.088 v_rel)` [TP A.14]. pooltool averages `e_b` between the two balls.
Higher-fidelity alternative: pooltool's `frictional_mathavan` model, which accounts for cloth friction
during the impact (Mathavan et al. 2014, *Sports Engineering*). It is not required for game feel.

### 4.2 Closed-form throw angle (stationary OB) [TP A.14 eq. 1–17]
CB speed v, cut angle φ, CB sidespin ωz, CB topspin/draw ωx:
```
v_rel   = sqrt( (v sinφ − R ωz)² + (R ωx cosφ)² )
v_OB,t  = min( μ(v_rel)·v cosφ·(v sinφ − Rωz)/v_rel ,  (v sinφ − Rωz)/7 )
v_OB,n  = v cosφ
θ_throw = atan( v_OB,t / v_OB,n )
```
- Cut-induced throw (CIT): ωz = 0. Spin-induced throw (SIT): ωz ≠ 0. "Gearing" outside english
  (Rωz = v sinφ) gives **zero throw**.
- The `1/7` branch is the no-slip limit. It makes throw independent of speed for small cuts.

---

## 5. Ball-cushion collision

### 5.1 Han 2005 impulse model (recommended default) [HAN05], [PT] `ball_cushion/han_2005/model.py`
Rotate into the cushion frame: x̂ along the normal into the cushion (v_x > 0), ŷ along the rail.
`θa = asin(h/R − 1)` (contact above center, about 15.7°).
```
sx = vx sinθa − vz cosθa + R ωy
sy = −vy − R ωz cosθa + R ωx sinθa
c  = −vx cosθa                          // vz ≈ 0 assumption
A = 7/(2m);  B = 1/m
PzE = −(1+e_c)·c / B                    // normal impulse along the contact normal
PzS = |s| / A                           // impulse needed to stop slip
if PzS ≤ μ·PzE:  PxE = sx/A;  PyE = sy/A                        // sticking
else:            PxE = μ PzE sx/|s|;  PyE = μ PzE sy/|s|         // sliding
PX = −PxE sinθa − PzE cosθa;  PY = PyE;  PZ = PxE cosθa − PzE sinθa
vx += PX/m;  vy += PY/m                 // pooltool drops PZ/m (keeps the ball on the table)
ωx += −(R/I) PY sinθa
ωy +=  (R/I)(PX sinθa − PZ cosθa)
ωz +=  (R/I) PY cosθa
```
Parameters: e_c = 0.85, μ = f_c = 0.2, h = 0.635·2R. This model captures sidespin "running/reverse
english" changing the rebound angle, topspin/draw interaction through θa, and some z-spin from the cushion.
It is a single closed-form impulse, so it is cheap and well suited to event-based simulation.

### 5.2 Mathavan 2010 (higher fidelity) [MAT10], [PT] `ball_cushion/mathavan_2010/model.py`
The model has two simultaneous slip contacts: cushion (I, friction μw) and cloth (C, friction μs).
- **Compression phase.** Integrate the equations in normal impulse `P` with step `ΔP ≈ m·vy/5000` until
  the normal velocity vy reaches 0. Accumulate cushion work `W_c`.
- **Restitution phase.** Continue until `W_r = e²·W_c`.
- Slip speeds and angles are recomputed at every step.
- Fitted values: e = 0.98, μw = 0.14. The rigid-cushion assumption holds for normal speed ≤ 2.5 m/s.
- Cost is about 10³–10⁴ small steps per cushion hit. This is acceptable inside one event, but too heavy for
  AI search loops.

pooltool's current default is a third option: `StrongeCompliantLinear2D(omega_ratio=1.8)`, a compliant
frictional model ([PT] `physics/resolve/resolver.py`).

### 5.3 Simpler fallbacks
- **L0 (arcade):** `v_n' = −e_c v_n`, tangential velocity kept, spins unchanged.
- **L1 (recommended cheap model):** treat the cushion as a sphere-half-space contact at the nose height.
  Apply the normal impulse with `e_c`. Apply a tangential friction impulse limited by μ (Coulomb) or by the
  no-slip limit with the 2/7 factor. pooltool uses this structure for ball-table impacts
  (`physics/resolve/ball_table/frictional_inelastic/__init__.py`) and for its sphere-half-space helper.
- **Jaws:** treat them as circular cushion segments (pooltool: `CircularCushionSegment`). Use the same
  model, with the normal taken from the segment center to the ball.

---

## 6. Swerve, masse and jump

- **Swerve/masse** needs no special code. The cue strike (§3.1) with θ > 0 and side offset produces
  ω_xy not perpendicular to v. Sliding (§2.1) then gives a parabolic curve. Curvature grows with
  elevation, offset and slow speed. Each phase has a closed form: slide parabola, then straight roll.
  Test: the final direction must equal `(5/7)v0 + (2/7)R(ω0 × ẑ)` independent of μs [TP A.4 eq. 24].
- **Jump (event chain).**
  1. The cue strike gives the ball v_z < 0 (driven into the slate).
  2. An immediate ball-table impulse resolves it. Normal: `Δv_z = (1+e_t)(−v_z)`. Tangential: friction
     `μs·Δv_⊥` or the no-slip limit `(2/7)(R ω×ẑ − v)` with `Δω = (5/7)(−ω + ẑ×v/R)` ([PT]
     `ball_table/frictional_inelastic`, e_t = 0.5).
  3. AIRBORNE parabola: peak height `v_z'²/(2g)`, flight time `2v_z'/g`.
  4. Landing is another ball-table event. Repeat. If the predicted bounce height is below 5 mm, set v_z = 0
     and recompute the state (`min_bounce_height = 0.005` [PT]).
- **Airborne interactions (game-level simplifications).**
  - Ball-ball: test 3D sphere overlap. Relative motion is quadratic in t, so it is a quartic, just like on
    the table.
  - Cushion: if the ball bottom (z − R) is above the cushion nose height h when it reaches the rail line,
    it leaves the table (foul). Otherwise apply the cushion model.
  - Pocket: pooltool's rule ([PT] `evolution/event_based/detect/ball_pocket.py`):
    - the ball lands inside the pocket circle → pocketed;
    - it crosses the pocket cylinder with center height ≤ 7/5 R → pocketed;
    - it crosses higher → it flies over.

---

## 7. Pocket geometry and capture

Geometry model (pooltool style, [PT] `objects/table/specs.py`, `components.py`):
- Each pocket is a **circle** (center offset behind the mouth by `depth`, with `radius`), flanked by two
  linear cushion segments angled at the facing angle (corner 7°, side 14° per [WPA]). The pointed jaw tips
  are rounded with small circular segments (corner jaw radius ≈ 21 mm, side ≈ 8 mm in pooltool).
- **Capture event:** the ball center enters the pocket circle, `|r_xy(t) − c| = r_pocket`. This is a quartic
  in t while sliding or rolling (pooltool `ball_pocket_collision_time`). Once captured, the state is
  POCKETED and the ball is removed from detection.
- Rattle and "spit out" emerge from jaw collisions with the cushion model. A slightly lower restitution on
  facings (WPA: facings are harder rubber) is a tuning knob, not a sourced number.
- Reference values for acceptance tests: Dr. Dave's effective-target-size models give the margin of error
  vs approach angle and speed for side and corner pockets [TP 3.5/3.6] (see TP 3.7/3.8 for fast shots).
  Slow shots into the corner have the largest target when straight in along the pocket axis; it shrinks for
  shots along the rail and across. Use these geometries to cross-check the pocket hitbox.

---

## 8. Simulation architecture

### 8.1 Options
| | Event-based (analytic) | Fixed timestep (numerical) |
|---|---|---|
| Accuracy | Exact within each state (closed form). Collision times from polynomial roots | O(dt) errors; positions depend on dt |
| Tunneling | None | 13 m/s break: 5.4 cm per step at 240 Hz (about one ball diameter). Needs ≥1 kHz substeps or CCD |
| Determinism / prediction | Same inputs give the same event list. Aim-line prediction and AI use the same engine exactly | Prediction drifts from the real shot unless both run the identical stepper |
| Cost | Per event: O(N) re-detection for the balls involved. 16 balls: 120 pairs + 16·(about 18 cushion segments + 6 pockets) | 16 balls × substeps × pairs every frame. Fine, but wasteful when balls are idle |
| Complexity | Higher: quartic solver, event cache, edge cases | Lower; easy to bolt on any force law |
| Rendering | Sample the analytic trajectory at frame time t, independent of frame rate | Interpolate between steps |

### 8.2 How pooltool does it ([PT] `evolution/event_based/simulate.py`, `detect/*`; same scheme as [LG06])
Loop:
1. `detector.get_next_event()` finds the earliest event among the candidates below.
2. Evolve every ball analytically by `dt = t_event − t` (`evolve_ball_motion`, §2).
3. `resolver.resolve(event)` applies the physics model (impulse model or state change).
4. Update `TransitionCache` and `CollisionCache`, invalidating only the balls involved.

Candidate events:
- state transitions (analytic τ, §2);
- ball-ball (quartic in t: each relative position is quadratic);
- ball-linear cushion (quadratic);
- ball-circular cushion (quartic);
- ball-pocket (quartic);
- ball-table for airborne balls (quadratic).

Quartics use [Q1010] (about 2.8 M solves/s in numba). The smallest real positive root is chosen with
relative and absolute tolerances (`get_real_positive_smallest_root`). Rendering uses `continuize()` to
sample at fixed dt after the fact.

### 8.3 Recommendation for AimPool: event-based analytic engine, in a Web Worker
Justification:
1. **Aim prediction and AI** need many fast, exact rollouts. The event engine computes a whole shot in a
   few hundred events, with no per-frame cost.
2. **No tunneling** at break speeds, at any frame rate. Low-end phones and throttled 30 fps tabs still get
   identical outcomes.
3. **Rendering is decoupled.** The worker returns an event timeline. The main thread evaluates closed-form
   `r(t)` per ball per frame, which is cheap and smooth at 120 Hz.
4. Proven design: [LG06], pooltool.

Structure: `BallState{r,v,ω,state,t0}` → `nextEvent()` (cached per ball and per pair) → `evolve(dt)` →
`resolve()`. Physics models are pluggable interfaces:
- ball-ball: frictional inelastic (§4);
- cushion: Han 2005, with Mathavan as an optional "sim" quality setting (§5);
- strike: instantaneous point plus squirt (§3).

### 8.4 Numerical pitfalls (and fixes)
- **Time origin.** Store each ball's polynomial relative to its own last-event time, and build quartic
  coefficients relative to the current time, never absolute shot time. This keeps coefficients well
  conditioned. Use Float64 everywhere (JS `number`, fine).
- **Quartic robustness.**
  - Port [Q1010] or Ferrari with Newton polishing.
  - Degree-reduce when leading coefficients are about 0. For example, both balls rolling with parallel
    decelerations give a lower-degree polynomial; stationary pairs give a quadratic.
  - Accept a root only if the balls are **approaching** at that time (`(r2−r1)·(v2−v1) < 0`). This
    rejects grazing and separation roots and the spurious root right after a collision.
- **Re-collision after resolve.** Post-impact balls touch at distance exactly 2R. Either require
  approaching velocity (above) or ignore roots with t < ε (about 1e-9 s) for the same pair. Never "push
  apart" positions in an analytic engine.
- **Simultaneous events.** These come from break racks and frozen balls (Newton's-cradle chains).
  - Resolve events one at a time in a deterministic order. Re-detect after each one.
  - Put a hard cap on events per shot, and on zero-dt events.
  - pooltool loosened the [Q1010] discriminant threshold specifically for near-equal velocities in
    Newton's-cradle cases (see `ptmath/roots/_quartic_numba.py`).
  - Option: rack with tiny random gaps of about 1e-6 m.
- **Zero slip.** `û = u/|u|` is undefined at u = 0. Classify the state with a tolerance: |u| < 1e-9 m/s
  means rolling. When computing friction directions, guard every unit vector (pooltool `const.EPS`).
- **Spin clamp.** ωz must stop at 0 (no sign flip). Rolling ends when |v| reaches 0, not after it.
- **Cushion corners and jaws.** A ball can touch a linear segment and a jaw circle within 1e-12 s. Resolve
  the earliest one, then re-detect. Make sure segment endpoints meet the arc tangentially to avoid
  "double hits" through gaps.
- **Determinism across devices.** Basic IEEE ops are deterministic in JS, but `Math.sin`, `cos`, `exp`,
  `atan2` and `pow` are implementation-defined and can differ by one ULP across engines and CPUs. For
  online play, simulate on one authority (host or server) and broadcast the event timeline. Do not rely on
  lockstep re-simulation unless you ship your own trig and exp.
- **Mathavan step loop.** Bound the iterations (pooltool uses `max_steps` 5000 plus a binary-search
  refinement at the zero crossing) and fall back to Han if it does not converge.

---

## 9. Validation targets (unit and regression tests)

| # | Test | Expected | Source |
|---|---|---|---|
| 1 | 90° rule: stun CB, frictionless, e = 1, any cut | CB and OB separate at exactly 90°; CB keeps v sinφ along the tangent line | [TP 3.1] |
| 1b | Same with e_b = 0.95 | CB keeps `(1−e)/2·v cosφ` along the impact line, so separation is slightly under 90° (about 87.5° at a 30° cut, before friction) | derived from [TP 3.1]/§4.1 |
| 2 | 30° rule: rolling CB, final deflection `θ = atan(sinφ cosφ / (sin²φ + 2/5))` | 1/2-ball (φ = 30°): **33.67°**; 3/4-ball (14.48°): 27.63°; 1/4-ball (48.59°): 27.27°; max **33.75° at φ ≈ 28.1°** | [TP 3.3], [TP A.4 eq. 33] |
| 3 | Stun shot slide and roll | `τ = 2v/(7μs g)`, `d_slide = 12v²/(49μs g)`, roll speed 5v/7. For v = 1 m/s: 0.146 s, 0.125 m, 0.714 m/s | [TP 4.1], [TP B.6] |
| 4 | Natural roll from the strike | b = 0.4R gives Rω/v = 1 (no slide); b = 0.5R gives 1.25 | [TP A.30], §3.1 |
| 5 | Strike efficiency | Center hit, m/M = 1/3, e = 1: v_ball/V_cue = 1.5; limit 2 for M → ∞ | [TP A.30 eq. 8] |
| 6 | Squirt (m/m_e = 30) | a = 0.25: 1.04°; a = 0.5: 1.89° (m/m_e = 15: 1.89°, 3.47°) | [TP A.31], §3.2 |
| 7 | CIT, stun, no english, μ(v) fit (computed from §4.2) | v = 0.447 m/s: 5°→0.72°, 10°→1.44°, 20°→2.98°, 30°→4.72°, 45°→4.95°, 60°→4.62°. v = 1.341: 30°→3.55°, 45°→2.77°. v = 3.129: 30°→1.70°, 45°→1.13° | [TP A.14] |
| 7b | Qualitative CIT | Max about **5°** (about 1 in per ft of OB travel) for a slow stun near a 1/2-ball hit; CIT is speed-independent for cuts below about 20° and larger for slow shots at thin cuts | https://drdavepoolinfo.com/FAQ/throw/maximum/ |
| 7c | Rolling CB throws less than stun | e.g. v = 1.341 m/s, 30° cut: about 1.0° (rolling) vs 3.55° (stun) | §4.2 with ωx = v/R; FAQ "Do shots with backspin or topspin throw as much as stun?" https://drdavepoolinfo.com/?p=2625 |
| 7d | SIT gearing | `Rωz = v sinφ` gives throw = 0 | [TP A.14] |
| 8 | Masse/swerve final direction | `v_f = (5/7)v0 + (2/7)R(ω0×ẑ)` for any μs | [TP A.4 eq. 24] |
| 9 | Spin decay | α_sp ≈ 10.9 rad/s² (allowed 5–15) | [DD-PP], [PT] |
| 10 | Table speed | Firm center-ball lag from the head spot covers ≥ 4–4.5 table lengths | [WPA] §8, [TP B.6] |
| 11 | Han 2005 cushion regression (e_c = 0.85, μ = 0.2, h = 0.635·2R, 1 m/s; angles measured from the rail normal; "final" = after the post-rail slide settles) | **Rolling** in at 15/30/45/60° → out 12.3/26.6/43.7/61.8° immediately, **18.9/39.5/59.5/75.1°** final (follow "widens" the bank). **Stun** in at 15/30/45/60° → 14.6/29.3/44.1/62.1° immediately, **11.9/24.3/38.1/58.6°** final. Normal-speed ratio about 0.74–0.81 | Computed from [HAN05] as implemented in [PT]. Use as a regression lock, and compare qualitatively with Dr. Dave's rail high-speed videos (HSV B.15 cited in [TP B.6]) |
| 12 | Conservation sanity checks | Ball-ball: linear momentum conserved exactly; total kinetic energy (translational + rotational) never increases in any event; positions continuous across events | physics |
| 13 | Pocket capture | A ball rolling straight down the pocket axis at slow speed with center offset < (effective target)/2 is pocketed; compare the target width against [TP 3.6] (corner) and [TP 3.5] (side) | [TP 3.5/3.6] |

Note: rows 7, 7c, 11 and the worked numbers in §2.5 were computed here from the cited formulas. They pin
down the implementation; they are not independent measurements.
