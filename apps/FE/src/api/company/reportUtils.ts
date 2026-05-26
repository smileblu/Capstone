export async function downloadReportPdf(reportId: number) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`/api/v1/company/report/${reportId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "COCO_ESG_보고서.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
