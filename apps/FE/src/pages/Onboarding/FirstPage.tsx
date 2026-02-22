import { useNavigate } from "react-router-dom";

export default function SelectUserTypePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-56px-80px)] flex items-center justify-center">
      <div>
        <h1 className="text-center h0 text-[var(--color-dark-green)]">COCO</h1>

        <div className="mt-7 space-y-8">
          <div
            onClick={() => navigate("/login?type=personal")}
            className="flex flex-col items-center justify-center cursor-pointer rounded-[12px] bg-[#E5ECD6] px-6 py-10 h-50 text-center active:scale-[0.99]"
          >
            <div className="title1 text-[var(--color-black)]">개인 사용자</div>
            <div className="mt-[10px] label2 text-[var(--color-black)]">
              나의 소비와 이동으로
              <br />
              탄소배출량을 확인하고 포인트를 관리하세요
            </div>
          </div>

          <div
            onClick={() => navigate("/login?type=company")}
            className="flex flex-col items-center justify-center cursor-pointer rounded-[12px] bg-[#E5ECD6] px-6 py-10 h-50 text-center active:scale-[0.99]"
          >
            <div className="title1 text-[var(--color-black)]">기업 사용자</div>
            <div className="mt-[10px] label2 text-[var(--color-black)]">
              우리 회사의 탄소배출 현황과
              <br />
              ESG 지표를 한 눈에 확인하세요
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
