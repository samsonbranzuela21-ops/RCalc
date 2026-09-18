import type { FlangedBeamLayerInput } from "@/lib/flanged-beam-analysis";
import type { TBeamDesignInput, TBeamDesignResult, TBeamSteelLayerResult } from "@/lib/t-beam";

export interface TBeamAnalysisPrefill {
  bw: number;
  hf: number;
  d: number;
  flangeWidthMode: "calculated" | "given";
  bf?: number;
  span?: number;
  clearSpacingLeft?: number;
  clearSpacingRight?: number;
  fc: number;
  fy: number;
  Es: number;
  Mu: number;
  clearCover: number;
  stirrupDiameter: number;
  tensionLayers: FlangedBeamLayerInput[];
  compressionLayers: FlangedBeamLayerInput[];
}

function serializeLayers(layers: TBeamSteelLayerResult[]): string {
  return layers.map((layer) =>
    [layer.barCount, layer.diameter, layer.depth].join(":")).join(";");
}

export function tBeamAnalysisHref(input: TBeamDesignInput, result: TBeamDesignResult): string {
  const params = new URLSearchParams({
    source: "t-beam-design",
    bw: String(input.bw),
    hf: String(input.hf),
    d: String(input.d),
    flangeWidthMode: result.flangeWidthMode,
    fc: String(input.fc),
    fy: String(input.fy),
    Es: String(result.Es),
    mu: String(input.Mu),
    cover: String(input.clearCover ?? 40),
    stirrup: String(input.stirrupDiameter ?? 10),
    tensionLayers: serializeLayers(result.tensionLayers),
    compressionLayers: serializeLayers(result.compressionLayers),
  });
  if (result.flangeWidthMode === "given") {
    params.set("bf", String(result.beff));
  } else {
    params.set("span", String(input.span));
    params.set("clearSpacingLeft", String(input.clearSpacingLeft));
    params.set("clearSpacingRight", String(input.clearSpacingRight));
  }
  return "/calculators/t-beam-analysis?" + params.toString();
}

export function lBeamAnalysisHref(input: TBeamDesignInput, result: TBeamDesignResult): string {
  const params = new URLSearchParams({
    source: "l-beam-design",
    bw: String(input.bw),
    hf: String(input.hf),
    d: String(input.d),
    flangeWidthMode: result.flangeWidthMode,
    fc: String(input.fc),
    fy: String(input.fy),
    Es: String(result.Es),
    mu: String(input.Mu),
    cover: String(input.clearCover ?? 40),
    stirrup: String(input.stirrupDiameter ?? 10),
    tensionLayers: serializeLayers(result.tensionLayers),
    compressionLayers: serializeLayers(result.compressionLayers),
  });
  if (result.flangeWidthMode === "given") {
    params.set("bf", String(result.beff));
  } else {
    params.set("span", String(input.span));
    params.set("clearSpacingLeft", String(input.clearSpacingLeft));
  }
  return "/calculators/l-beam-analysis?" + params.toString();
}

type Query = Record<string, string | string[] | undefined>;

function single(value: Query[string]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function positiveNumber(value: Query[string]): number | null {
  const raw = single(value);
  if (raw === undefined || raw.trim() === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseLayers(value: Query[string], allowEmpty: boolean): FlangedBeamLayerInput[] | null {
  const raw = single(value);
  if (allowEmpty && raw === "") return [];
  if (!raw || raw.length > 300) return null;
  const rows = raw.split(";");
  if (rows.length < 1 || rows.length > 3) return null;
  const layers = rows.map((row) => {
    const parts = row.split(":");
    if (parts.length !== 3) return null;
    const barCount = Number(parts[0]);
    const barDiameter = Number(parts[1]);
    const depth = Number(parts[2]);
    if (!Number.isInteger(barCount) || barCount <= 0 ||
      !Number.isFinite(barDiameter) || barDiameter <= 0 ||
      !Number.isFinite(depth) || depth <= 0) return null;
    return { barCount, barDiameter, depth };
  });
  return layers.every((layer) => layer !== null) ? layers as FlangedBeamLayerInput[] : null;
}

function readDesignTransfer(params: Query, source: "t-beam-design" | "l-beam-design", requireRightSpacing: boolean): TBeamAnalysisPrefill | undefined {
  if (single(params.source) !== source) return undefined;
  const bw = positiveNumber(params.bw);
  const hf = positiveNumber(params.hf);
  const d = positiveNumber(params.d);
  const fc = positiveNumber(params.fc);
  const fy = positiveNumber(params.fy);
  const Es = positiveNumber(params.Es);
  const Mu = positiveNumber(params.mu);
  const clearCover = positiveNumber(params.cover);
  const stirrupDiameter = positiveNumber(params.stirrup);
  const flangeWidthMode = single(params.flangeWidthMode);
  const tensionLayers = parseLayers(params.tensionLayers, false);
  const compressionLayers = parseLayers(params.compressionLayers, true);
  if ([bw, hf, d, fc, fy, Es, Mu, clearCover, stirrupDiameter].some((value) => value === null) ||
    (flangeWidthMode !== "calculated" && flangeWidthMode !== "given") ||
    tensionLayers === null || compressionLayers === null ||
    hf! >= d! || tensionLayers.some((layer) => layer.depth <= hf!) ||
    compressionLayers.some((layer) => layer.depth >= Math.min(...tensionLayers.map((tension) => tension.depth)))) {
    return undefined;
  }
  const bf = flangeWidthMode === "given" ? positiveNumber(params.bf) : null;
  const span = flangeWidthMode === "calculated" ? positiveNumber(params.span) : null;
  const clearSpacingLeft = flangeWidthMode === "calculated" ? positiveNumber(params.clearSpacingLeft) : null;
  const clearSpacingRight = flangeWidthMode === "calculated" && requireRightSpacing ? positiveNumber(params.clearSpacingRight) : null;
  if (flangeWidthMode === "given" ? bf === null || bf < bw! :
    span === null || clearSpacingLeft === null || (requireRightSpacing && clearSpacingRight === null)) return undefined;

  return {
    bw: bw!, hf: hf!, d: d!, fc: fc!, fy: fy!, Es: Es!, Mu: Mu!,
    clearCover: clearCover!, stirrupDiameter: stirrupDiameter!,
    flangeWidthMode,
    ...(flangeWidthMode === "given" ? { bf: bf! } :
      { span: span!, clearSpacingLeft: clearSpacingLeft!, ...(requireRightSpacing ? { clearSpacingRight: clearSpacingRight! } : {}) }),
    tensionLayers, compressionLayers,
  };
}

export function readTBeamDesignTransfer(params: Query): TBeamAnalysisPrefill | undefined {
  return readDesignTransfer(params, "t-beam-design", true);
}

export function readLBeamDesignTransfer(params: Query): TBeamAnalysisPrefill | undefined {
  return readDesignTransfer(params, "l-beam-design", false);
}
