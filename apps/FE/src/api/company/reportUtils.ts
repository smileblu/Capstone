export async function downloadReportPdf(reportId: number) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`/api/v1/company/report/${reportId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();

  // Content-Disposition 헤더에서 파일명 추출
  // BE가 filename*=UTF-8''... 형식으로 전달함
  const disposition = res.headers.get("content-disposition") ?? "";
  let filename = "ESG_리포트.pdf";
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) {
    filename = decodeURIComponent(utf8Match[1]);
  } else {
    const plainMatch = disposition.match(/filename="([^"]+)"/i);
    if (plainMatch) filename = plainMatch[1];
  }

  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
