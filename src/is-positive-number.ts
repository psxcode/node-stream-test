export const isPositiveNumber = (num?: number): boolean =>
  num !== undefined && Number.isFinite(num) && num >= 0;
