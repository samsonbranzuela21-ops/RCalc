import FlangedBeamAnalysisPage from "@/components/calculators/analysis/flanged-beam-analysis/FlangedBeamAnalysisPage";
import { readLBeamDesignTransfer } from "@/lib/t-beam-design-transfer";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <FlangedBeamAnalysisPage shape="L" prefill={readLBeamDesignTransfer(params)} />;
}
