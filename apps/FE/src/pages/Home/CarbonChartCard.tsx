import { useState, useEffect } from "react";
import MonthlyLineChart from "./chart/MonthlyLineChart";
import CategoryPieChart from "./chart/CategoryPieChart";
import { getMonthlyTrend, getCategoryRatio } from "../../api/homeService";

type Mode = "monthly" | "category";
type MonthlyTrend = {
  month: string;
  emission: number;
};
type CategoryRatio = {
  category: string;
  emission: number;
};

export default function CarbonChartCard() {
  const [mode, setMode] = useState<Mode>("monthly");
  const [monthlyData, setMonthlyData] = useState<MonthlyTrend[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryRatio[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        if (mode === "monthly") {
          const data = await getMonthlyTrend(); // GET /api/v1/dashboard/monthly-trend
          setMonthlyData(data);
        } else {
          const data = await getCategoryRatio(); // GET /api/v1/dashboard/category-ratio
          setCategoryData(data);
        }
      } catch (error) {
        console.error("그래프 데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [mode]);

  return (
    <section>
      <h2 className="title1 text-[var(--color-black)]">탄소 그래프</h2>

      {/* 토글 */}
      <div className="mt-3 flex gap-[6px]">
        <ToggleButton
          active={mode === "monthly"}
          onClick={() => setMode("monthly")}
        >
          월별
        </ToggleButton>

        <ToggleButton
          active={mode === "category"}
          onClick={() => setMode("category")}
        >
          카테고리별
        </ToggleButton>
      </div>

      {/* 그래프 카드 */}
      <div className="mt-4 rounded-2xl border border-[var(--color-grey-250)] bg-[var(--color-white)] p-4 shadow-sm min-h-[300px] flex flex-col justify-center">
        {loading ? (
          <div className="text-center body2 text-[var(--color-grey-500)]">로딩 중...</div>
        ) : (
          <>
            <div className="py-2 text-center body2 text-[var(--color-grey-650)]">
              {mode === "monthly" ? "월별 배출 추이 그래프" : "카테고리별 배출 그래프"}
            </div>
            {(mode === "monthly" ? monthlyData : categoryData).length === 0 ? (
              <div className="flex h-[220px] items-center justify-center">
                <p className="body2 text-[var(--color-grey-450)]">
                  아직 입력된 배출 데이터가 없습니다.
                </p>
              </div>
            ) : mode === "monthly" ? (
              <MonthlyLineChart chartData={monthlyData} />
            ) : (
              <CategoryPieChart chartData={categoryData} />
            )}
          </>
        )}
      </div>
    </section>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "h-[30px] rounded-[16px] px-4 caption1 leading-none flex items-center justify-center bg-[var(--color-green)] text-white"
          : "h-[30px] rounded-[16px] px-4 caption1 leading-none flex items-center justify-center bg-[var(--color-white)] text-[var(--color-grey-550)] border border-[var(--color-grey-350)]"
      }
    >
      {children}
    </button>
  );
}
