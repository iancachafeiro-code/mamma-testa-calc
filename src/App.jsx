import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CalculatorGate from "./pages/CalculatorGate";
import CalculatorApp from "./pages/CalculatorApp";

// Simple protection wrapper
const ProtectedRoute = () => {
    // In a real app, this would verify a token.
    // Here we just check for the session flag set by the gate.
    const isAuthorized = localStorage.getItem("mt_invite_session") === "valid";

    // If not authorized, redirect to the gate
    return isAuthorized ? <Outlet /> : <Navigate to="/calculator" replace />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/calculator" element={<CalculatorGate />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/calculator/app" element={<CalculatorApp />} />
                </Route>

                {/* Catch-all redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
