import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "../src/layout/Navbar";
import AnalyzationPage from "./pages//Analyzation/AnalyzationPage";
import ScenarioPage from "./pages/Analyzation/ScenarioPage";
import FirstPage from "./pages/Onboarding/FirstPage";
import LoginPage from "./pages/Onboarding/LoginPage";
import SignupPage from "./pages/Onboarding/SignupPage";

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
        </Routes>
      </div>
      {showPersonalNavbar && <Navbar />}
    </div>
  );
}

export default App;
