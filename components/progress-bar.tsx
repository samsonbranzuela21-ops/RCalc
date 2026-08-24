export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="ml-auto flex-shrink-0 text-right">
      <div className="mb-1 h-[2px] w-[48px] overflow-hidden rounded-full bg-[#2a2b36]">
        <img src="/rcalc-icon.svg" alt="RCalc logo" className="h-5 w-5" />
        <span className="block h-full bg-[#4d7cff]" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[9px] text-[#8b8d9b]">{percent}%</span>
    </div>
  );
}