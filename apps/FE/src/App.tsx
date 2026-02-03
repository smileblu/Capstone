import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "../src/layout/Navbar";
import AnalyzationPage from "./pages//Analyzation/AnalyzationPage";
import ScenarioPage from "./pages/Analyzation/ScenarioPage";

function App() {
  return (
    <div className="mx-auto w-[402px] min-h-screen bg-[var(--color-grey-50)]">
      <div className="pt-14 pb-20 px-5">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/analyzation" element={<AnalyzationPage />} />
          <Route path="/analyzation/scenario" element={<ScenarioPage />} />
        </Routes>
      </div>
      <Navbar />
    </div>
  );
}

export default App;
