import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "../src/layout/Navbar";
import CompanyNavbar from "../src/layout/CompanyNavbar";
import AnalyzationPage from "./pages//Analyzation/AnalyzationPage";
import ScenarioPage from "./pages/Analyzation/ScenarioPage";
import FirstPage from "./pages/Onboarding/FirstPage";
import LoginPage from "./pages/Onboarding/LoginPage";
import SignupPage from "./pages/Onboarding/SignupPage";
import HomePage from "./pages/Home/HomePage";
import InputPage from "./pages/Input/InputPage";
import TransportInputPage from "./pages/Input/TransportInputPage";
import ElectricityInputPage from "./pages/Input/ElectricityInputPage";
import ConsumptionInputPage from "./pages/Input/ConsumptionInputPage";
import ManualConsumptionPage from "./pages/Input/ManualConsumptionPage";
import ReceiptUploadPage from "./pages/Input/ReceiptUploadPage";
import ReceiptReviewPage from "./pages/Input/ReceiptReviewPage";
import InputSummaryPage from "./pages/Input/InputSummaryPage";
import RewardPage from "./pages/Reward/RewardPage";
import PointHistoryPage from "./pages/Reward/PointHistoryPage";
import MyPage from "./pages/My/MyPage";
import CompanyMyPage from "./pages/Company/My/CompanyMyPage";
import CompanyMyInfoPage from "./pages/Company/My/CompanyMyInfoPage";
import CompanyReportHistoryPage from "./pages/Company/My/CompanyReportHistoryPage";
import CompanyPlanPage from "./pages/Company/My/CompanyPlanPage";
import CompanySecurityPage from "./pages/Company/My/CompanySecurityPage";
import Company_HomePage from "./pages/company/HomePage";
import Company_InputPage from "./pages/company/Input/InputPage";
import Company_ElectricityInputPage from "./pages/company/Input/ElectricityInputPage";
import Company_AnalyzationPage from "./pages/company/AnalyzationPage";
import Company_StationaryCombustionInputPage from "./pages/company/Input/StationaryCombustionInputPage";
import Company_MobileCombustionInputPage from "./pages/company/Input/MobileCombustionInputPage";
import Company_GasInputPage from "./pages/company/Input/GasInputPage";
import Company_WasteInputPage from "./pages/company/Input/WasteInputPage";
import Company_WaterInputPage from "./pages/company/Input/WaterInputPage";
import CompanySignupPage from "./pages/Company/Onboarding/CompanySignupPage";

function App() {
  const location = useLocation();
  const showPersonalNavbar = location.pathname.startsWith("/personal");
  const showCompanyNavbar = location.pathname.startsWith("/company");

  return (
    <div className="relative mx-auto w-[402px] min-h-screen overflow-hidden bg-[var(--color-grey-50)]">
      <div className="pt-14 pb-20 px-5">
        <Routes>
          {/* 공용 */}
          <Route path="/" element={<FirstPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/company/signup" element={<CompanySignupPage />} />

          {/* 개인 */}
          <Route path="/personal/input" element={<InputPage />} />
          <Route
            path="/personal/input/transport"
            element={<TransportInputPage />}
          />
          <Route
            path="/personal/input/electricity"
            element={<ElectricityInputPage />}
          />
          <Route
            path="/personal/input/consumption"
            element={<ConsumptionInputPage />}
          />
          <Route
            path="/personal/input/consumption/manual"
            element={<ManualConsumptionPage />}
          />
          <Route
            path="/personal/input/consumption/receipt"
            element={<ReceiptUploadPage />}
          />
          <Route
            path="/personal/input/consumption/receipt/review"
            element={<ReceiptReviewPage />}
          />
          <Route
            path="/personal/input/summary"
            element={<InputSummaryPage />}
          />

          <Route path="/personal/analyzation" element={<AnalyzationPage />} />
          <Route
            path="/personal/analyzation/scenario"
            element={<ScenarioPage />}
          />

          <Route path="/personal/home" element={<HomePage />} />

          <Route path="/personal/reward" element={<RewardPage />} />
          <Route path="/personal/reward/point" element={<PointHistoryPage />} />

          <Route path="/personal/my" element={<MyPage />} />
          <Route path="/company/my" element={<CompanyMyPage />} />
          <Route path="/company/my/info" element={<CompanyMyInfoPage />} />
          <Route
            path="/company/my/report-history"
            element={<CompanyReportHistoryPage />}
          />
          <Route path="/company/my/plan" element={<CompanyPlanPage />} />
          <Route
            path="/company/my/security"
            element={<CompanySecurityPage />}
          />

          <Route path="/company/home" element={<Company_HomePage />} />
          <Route path="/company/input" element={<Company_InputPage />} />
          <Route
            path="/company/input/electricity"
            element={<Company_ElectricityInputPage />}
          />
          <Route
            path="/company/input/stationary-combustion"
            element={<Company_StationaryCombustionInputPage />}
          />
          <Route
            path="/company/input/mobile-combustion"
            element={<Company_MobileCombustionInputPage />}
          />
          <Route path="/company/input/gas" element={<Company_GasInputPage />} />
          <Route
            path="/company/input/waste"
            element={<Company_WasteInputPage />}
          />
          <Route
            path="/company/input/water"
            element={<Company_WaterInputPage />}
          />
          <Route
            path="/company/analyzation"
            element={<Company_AnalyzationPage />}
          />
        </Routes>
      </div>
      {showPersonalNavbar && <Navbar />}
      {showCompanyNavbar && <CompanyNavbar />}
    </div>
  );
}

export default App;
