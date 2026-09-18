import RectangularBeamAnalysisPage from "@/components/calculators/analysis/rectangular-beam-analysis/RectangularBeamAnalysisPage";
import { readRectangularBeamDesignTransfer } from "@/lib/rectangular-beam-design-transfer";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <RectangularBeamAnalysisPage prefill={readRectangularBeamDesignTransfer(params)} />;
}
