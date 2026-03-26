import { useEffect, useState } from "react";
import { getMonthlySummary } from "../../api/homeService";
import SummaryCard from "./SummaryCard";
import MissionCard from "./MissionCard";
import CarbonChartCard from "./CarbonChartCard";

export default function HomePage() {
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await getMonthlySummary();
        // axiosInstance 인터셉터 덕분에 response는 이미 data 알맹이입니다.
        setSummaryData(response); 
      } catch (error) {
        console.error("대시보드 로드 실패:", error);
      }
    };
    fetchHomeData();
  }, []);
  
  return (
    <div className="grid gap-5">
        
      {/* 타이틀 */}
      <div className="flex items-center justify-center py-1">
        <div className="h0 text-[var(--color-dark-green)]">COCO</div>
      </div>
        
      <div className="grid gap-8">
        {summaryData && (
          <>
            {/* API 명세서의 필드명 적용 */}
            <SummaryCard 
              totalEmission={summaryData.totalEmission} 
              totalCost={summaryData.totalCost} 
            />
            <MissionCard progress={summaryData.progressPercent} />
            <CarbonChartCard />
          </>
        )}
      </div>
    </div>
  );
}
