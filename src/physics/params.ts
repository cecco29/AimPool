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
