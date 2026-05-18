import InputFormPage from "./InputFormPage";

export default function BusinessStationaryCombustionInputPage() {
  return (
    <InputFormPage
      title="고정 연소 입력"
      logType="BUSINESS_STATIONARY_COMBUSTION"
      memoHelp="연료 사용량의 근거 또는 참고 내용을 기록해주세요."
      fields={[
        {
          type: "select",
          name: "fuelType",
          title: "연료 종류",
          options: ["LNG", "경유", "LPG"],
        },
        {
          type: "number",
          name: "amount",
          title: "사용량",
          unit: "Nm3",
          initialValue: 0,
        },
        {
          type: "select",
          name: "unit",
          title: "단위 선택",
          options: ["Nm3", "L", "kg"],
        },
        {
          type: "select",
          name: "usagePurpose",
          title: "사용 목적",
          options: ["난방", "생산", "기타"],
        },
      ]}
    />
  );
}
