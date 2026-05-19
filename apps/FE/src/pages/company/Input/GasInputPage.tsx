import InputFormPage from "./InputFormPage";

export default function ProcessGasInputPage() {
  return (
    <InputFormPage
      title="공정 가스 입력"
      logType="BUSINESS_PROCESS_GAS"
      memoHelp="가스 사용량의 근거 또는 측정 방식을 기록해주세요."
      fields={[
        {
          type: "select",
          name: "gasType",
          title: "가스 종류",
          options: ["CO2", "CH4", "N2O", "HFCs", "PFCs", "SF6"],
        },
        {
          type: "number",
          name: "amount",
          title: "사용량",
          unit: "kg",
        },
        {
          type: "select",
          name: "unit",
          title: "단위 선택",
          options: ["kg", "ton", "m3"],
        },
        {
          type: "select",
          name: "processType",
          title: "사용 공정",
          options: ["생산", "냉매", "화학 공정", "기타"],
          columns: 2,
        },
      ]}
    />
  );
}
