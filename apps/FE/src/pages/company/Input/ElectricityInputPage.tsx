import InputFormPage from "./InputFormPage";

const TEXT = {
  title: "\uC804\uAE30 \uC785\uB825",
  memoHelp:
    "\uC785\uB825\uAC12\uC758 \uADFC\uAC70 \uB610\uB294 \uCC38\uACE0 \uB0B4\uC6A9\uC744 \uAE30\uB85D\uD574\uC8FC\uC138\uC694.",
  unitTitle: "\uB2E8\uC704 \uC120\uD0DD",
  usageTitle: "\uC0AC\uC6A9\uB7C9",
};

export default function BusinessElectricityInputPage() {
  return (
    <InputFormPage
      title={TEXT.title}
      logType="BUSINESS_ELECTRICITY"
      memoHelp={TEXT.memoHelp}
      fields={[
        {
          type: "number",
          name: "usage",
          title: TEXT.usageTitle,
          unit: "kWh",
          initialValue: 12340,
        },
        {
          type: "select",
          name: "unit",
          title: TEXT.unitTitle,
          options: ["kWh", "MWh", "GWh"],
        },
      ]}
    />
  );
}
