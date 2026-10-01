import type { PhysicsParams } from '../physics/params';
import type { TableGeometry, TableSpec } from '../table/geometry';

export interface ExerciseEnv { geometry: TableGeometry; params: PhysicsParams; tableSpec: TableSpec }
