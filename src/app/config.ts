import type { Settings } from '../progress/types';
import type { TableSpec } from '../table/geometry';

const INCH = 0.0254;

export const settingsToTableSpec = (s: Settings): TableSpec => ({
  size: s.tableSize,
  cornerMouth: s.cornerMouthIn * INCH,
  sideMouth: s.sideMouthIn * INCH,
});
