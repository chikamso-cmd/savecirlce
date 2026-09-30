import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginScreen, SignUpScreen } from "./components/auth/LoginScreen";
import SaveCircleSplash from "./components/landing/SplasScreen";
import MainLayout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SaveCircleSplash />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/groups" element={<Groups />} />
        </Route>
      </Routes>
    </BrowserRouter>

    // <AuthPage />
  );
}
