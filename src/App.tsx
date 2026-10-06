import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginScreen, SignUpScreen } from "./components/auth/LoginScreen";
import SaveCircleSplash from "./components/landing/SplasScreen";
import Dashboard from "./pages/Dashboard";
// import SaveCircleOnboarding from "./components/onboarding/SaveCircleOnboarding";
import OnboardingFlow from "./pages/OnboardingFlow";
import DashboardLayout from "./components/layout/DashboardLayout";
import GroupsPage from "./pages/GroupsPage";
import CreateGroupPage from "./pages/CreateGroup";
import MembersPage from "./pages/Members";
import GroupDetailsPage from "./pages/Groupdetailspage";
import PaymentDetailsPage from "./pages/Paymentdetails";
import PaymentsPage from "./pages/Paymentpage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SaveCircleSplash />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/onboarding" element={<OnboardingFlow />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/new" element={<CreateGroupPage />} />
          <Route path="/groups/:id" element={<GroupDetailsPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/payments/:id" element={<PaymentDetailsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>

    // <AuthPage />
  );
}
