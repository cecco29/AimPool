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
