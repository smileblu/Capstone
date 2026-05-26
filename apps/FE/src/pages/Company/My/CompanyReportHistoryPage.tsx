import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import CompanyPageHeader from "../CompanyPageHeader";
import axiosInstance from "../../../api/axiosInstance";
import { downloadReportPdf } from "../../../api/company/reportUtils";

type ReportItem = {
  id: number;
  createdAt: string;
  reportPeriod: string;
  fileSizeBytes: number | null;
};

export default function CompanyReportHistoryPage() {
  const [reportList, setReportList]   = useState<ReportItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    axiosInstance.get<any, ReportItem[]>("/company/report/list")
      .then((data) => setReportList(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (id: number) => {
    setDownloadingId(id);
    try {
      await downloadReportPdf(id);
    } catch {
      alert("다운로드에 실패했습니다.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      <CompanyPageHeader title="보고서 히스토리" showBack />

      <div className="mt-6 pb-24">
        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-[var(--color-green)]" />
          </div>
        ) : reportList.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center gap-3">
            <FileText className="h-12 w-12 text-[var(--color-grey-350)]" />
            <p className="body1 text-[var(--color-grey-450)]">아직 생성된 보고서가 없어요</p>
            <p className="caption2 text-[var(--color-grey-350)]">
              탄소 배출 분석 후 보고서를 생성할 수 있어요
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {reportList.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-[var(--color-grey-250)] bg-white px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} className="shrink-0 text-[var(--color-green)]" />
                  <div>
                    <p className="body2 font-semibold text-[var(--color-black)]">
                      {r.reportPeriod}
                    </p>
                    <p className="caption2 text-[var(--color-grey-550)]">
                      {r.createdAt}
                      {r.fileSizeBytes != null &&
                        ` · ${Math.round(r.fileSizeBytes / 1024)}KB`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload(r.id)}
                  disabled={downloadingId === r.id}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--color-green)]
                             px-3 py-1.5 caption1 text-[var(--color-green)]
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingId === r.id
                    ? <Loader2 size={13} className="animate-spin" />
                    : null}
                  다운로드
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
