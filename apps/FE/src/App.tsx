import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "../src/layout/Navbar";
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

function App() {
  const location = useLocation();
  const showPersonalNavbar = location.pathname.startsWith("/personal");

  return (
    <div className="mx-auto w-[402px] min-h-screen bg-[var(--color-grey-50)]">
      <div className="pt-14 pb-20 px-5">
        <Routes>
          <Route path="/" element={<FirstPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

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
          <Route 
            path="/personal/reward/point" 
            element={<PointHistoryPage />} 
          />

        </Routes>
      </div>
      {showPersonalNavbar && <Navbar />}
    </div>
  );
}

export default App;
