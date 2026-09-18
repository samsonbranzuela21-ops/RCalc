import type { FlexuralBeamResult } from "./flexural-beam";

export interface RectangularBeamDesignPrefill {
  b: number;
  h: number;
  clearCover: number;
  stirrupDiameter: number;
  fc: number;
  fy: number;
  Es: number;
  Mu: number;
  tensionBarDiameter: number;
  tensionRows: number[];
  isDoubly: boolean;
  compressionBarDiameter: number;
  compressionRows: number[];
}

type SearchValues = Record<string, string | string[] | undefined>;

export function rectangularBeamAnalysisHref(result: FlexuralBeamResult): string {
  const params = new URLSearchParams({
    source: "flexural-beam-design",
    b: String(result.input.b),
    h: String(result.input.h),
    cover: String(result.input.cover),
    stirrup: String(result.input.stirrupDiameter),
    fc: String(result.input.fc),
    fy: String(result.input.fy),
    Es: String(result.input.Es),
    mu: String(result.input.Mu),
    tensionDiameter: String(result.input.barDiameter),
    tensionRows: result.tensionBarsPerLayer.join(","),
    doubly: result.compressionBarsRequired > 0 ? "1" : "0",
    compressionDiameter: String(result.input.compressionBarDiameter),
    compressionRows: result.compressionBarsPerLayer.join(","),
  });
  return `/calculators/rectangular-beam-analysis?${params.toString()}`;
}

export function readRectangularBeamDesignTransfer(params: SearchValues): RectangularBeamDesignPrefill | undefined {
  if (single(params.source) !== "flexural-beam-design") return undefined;

  const b = positiveNumber(params.b);
  const h = positiveNumber(params.h);
  const clearCover = positiveNumber(params.cover);
  const stirrupDiameter = positiveNumber(params.stirrup);
  const fc = positiveNumber(params.fc);
  const fy = positiveNumber(params.fy);
  const Es = positiveNumber(params.Es) ?? 200000;
  const Mu = positiveNumber(params.mu);
  const tensionBarDiameter = positiveNumber(params.tensionDiameter);
  const compressionBarDiameter = positiveNumber(params.compressionDiameter);
  const tensionRows = barRows(params.tensionRows);
  const isDoubly = single(params.doubly) === "1";
  const compressionRows = isDoubly ? barRows(params.compressionRows) : [];

  if (
    [b, h, clearCover, stirrupDiameter, fc, fy, Mu, tensionBarDiameter, compressionBarDiameter].some((value) => value === null) ||
    tensionRows === null ||
    (isDoubly && compressionRows === null)
  ) return undefined;

  return {
    b: b!, h: h!, clearCover: clearCover!, stirrupDiameter: stirrupDiameter!,
    fc: fc!, fy: fy!, Es, Mu: Mu!, tensionBarDiameter: tensionBarDiameter!,
    tensionRows, isDoubly, compressionBarDiameter: compressionBarDiameter!,
    compressionRows: compressionRows ?? [],
  };
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function positiveNumber(value: string | string[] | undefined): number | null {
  const parsed = Number(single(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function barRows(value: string | string[] | undefined): number[] | null {
  const rows = single(value)?.split(",").map(Number) ?? [];
  return rows.length >= 1 && rows.every((count) => Number.isSafeInteger(count) && count > 0)
    ? rows
    : null;
}
