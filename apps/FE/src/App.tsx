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
          <Route path="/personal/analyzation" element={<AnalyzationPage />} />
          <Route
            path="/personal/analyzation/scenario"
            element={<ScenarioPage />}
          />
          
          <Route path="/home" element={<HomePage />} />

          <Route path="/input" element={<InputPage />} />
          <Route path="/input/transport" element={<TransportInputPage />} />
          <Route path="/input/electricity" element={<ElectricityInputPage />} />
          <Route path="/input/consumption" element={<ConsumptionInputPage />} />
          <Route path="/input/consumption/manual" element={<ManualConsumptionPage />} />
          <Route path="/analyzation" element={<AnalyzationPage />} />
          <Route path="/analyzation/scenario" element={<ScenarioPage />} />
        </Routes>
      </div>
      {showPersonalNavbar && <Navbar />}
    </div>
  );
}

export default App;
