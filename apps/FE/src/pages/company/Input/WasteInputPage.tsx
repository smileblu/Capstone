import InputFormPage from "./InputFormPage";

export default function WasteInputPage() {
  return (
    <InputFormPage
      title="폐기물 입력"
      logType="BUSINESS_WASTE"
      memoHelp="폐기물 처리 방식 또는 배출 근거를 기록해주세요."
      fields={[
        {
          type: "select",
          name: "wasteType",
          title: "폐기물 종류",
          options: ["일반", "플라스틱", "폐유", "금속", "종이", "기타"],
        },
        {
          type: "number",
          name: "amount",
          title: "처리량",
          unit: "kg",
          initialValue: 0,
        },
        {
          type: "select",
          name: "unit",
          title: "단위 선택",
          options: ["kg", "ton", "m3"],
        },
        {
          type: "select",
          name: "disposalMethod",
          title: "처리 방식",
          options: ["소각", "재활용", "매립", "위탁 처리"],
          columns: 2,
        },
      ]}
    />
  );
}
