import InputFormPage from "./InputFormPage";

export default function MobileCombustionInputPage() {
  return (
    <InputFormPage
      title="이동 연소 입력"
      logType="BUSINESS_MOBILE_COMBUSTION"
      memoHelp="차량 운행 또는 물류 이동의 근거를 기록해주세요."
      fields={[
        {
          type: "select",
          name: "mobileType",
          title: "입력 기준",
          options: ["차량 기준", "물류 기준"],
          columns: 2,
        },
        {
          type: "select",
          name: "vehicleType",
          title: "차량 종류",
          options: ["승합차", "화물차", "승용차"],
        },
        {
          type: "select",
          name: "fuelType",
          title: "연료 종류",
          options: ["휘발유", "경유", "등유"],
        },
        {
          type: "number",
          name: "distanceKm",
          title: "이동 거리",
          unit: "km",
          initialValue: 320,
        },
        {
          type: "number",
          name: "fuelUsed",
          title: "연료 사용량 (선택)",
          unit: "L",
          initialValue: 40,
          optional: true,
        },
      ]}
    />
  );
}
