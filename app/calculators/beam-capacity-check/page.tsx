import BeamCapacityCheckPage, { type BeamCapacityPrefill } from "@/components/calculators/analysis/beam-capacity-check/BeamCapacityCheckPage";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <BeamCapacityCheckPage prefill={readDesignTransfer(params)} />;
}

function readDesignTransfer(params: Awaited<SearchParams>): BeamCapacityPrefill | undefined {
  if (single(params.source) !== "flexural-beam-design") return undefined;

  const b = positiveNumber(params.b);
  const h = positiveNumber(params.h);
  const clearCover = positiveNumber(params.cover);
  const stirrupDiameter = positiveNumber(params.stirrup);
  const fc = positiveNumber(params.fc);
  const fy = positiveNumber(params.fy);
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
    b: b!,
    h: h!,
    clearCover: clearCover!,
    stirrupDiameter: stirrupDiameter!,
    fc: fc!,
    fy: fy!,
    Mu: Mu!,
    tensionBarDiameter: tensionBarDiameter!,
    tensionRows,
    isDoubly,
    compressionBarDiameter: compressionBarDiameter!,
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
  return rows.length >= 1 && rows.length <= 2 && rows.every((count) => Number.isInteger(count) && count > 0)
    ? rows
    : null;
}
