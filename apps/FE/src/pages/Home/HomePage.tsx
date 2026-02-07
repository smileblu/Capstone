import SummaryCard from "./SummaryCard";
import MissionCard from "./MissionCard";
import CarbonChartCard from "./CarbonChartCard";

export default function HomePage() {
  return (
    <div className="grid gap-5">
        
        {/* 타이틀 */}
        <div className="flex items-center justify-center py-1">
          <div className="h0 text-[var(--color-dark-green)]">COCO</div>
        </div>
        
        <div className="grid gap-8">
            <SummaryCard />
            <MissionCard />
            <CarbonChartCard />
        </div>

    </div>
  );
}
