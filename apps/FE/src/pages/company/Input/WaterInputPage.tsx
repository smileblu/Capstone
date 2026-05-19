import InputFormPage from "./InputFormPage";

export default function WaterInputPage() {
  return (
    <InputFormPage
      title="용수 입력"
      logType="BUSINESS_WATER"
      memoHelp="수도 고지서, 계량기 수치 등 입력 근거를 기록해주세요."
      fields={[
        {
          type: "number",
          name: "waterUsage",
          title: "사용량",
          unit: "ton",
          initialValue: 0,
        },
        {
          type: "select",
          name: "unit",
          title: "단위 선택",
          options: ["ton", "m3", "L"],
        },
        {
          type: "select",
          name: "purpose",
          title: "사용 목적",
          options: ["생산", "세척", "냉각", "생활용수", "기타"],
        },
      ]}
    />
  );
}
