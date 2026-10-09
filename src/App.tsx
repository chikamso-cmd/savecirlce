import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginScreen, SignUpScreen } from "./components/auth/LoginScreen";
import SaveCircleSplash from "./components/landing/SplasScreen";
import Dashboard from "./pages/Dashboard";
import OnboardingFlow from "./pages/OnboardingFlow";
import DashboardLayout from "./components/layout/DashboardLayout";
import GroupsPage from "./pages/GroupsPage";
import CreateGroupPage from "./pages/CreateGroup";
import MembersPage from "./pages/Members";
import GroupDetailsPage from "./pages/Groupdetailspage";
import PaymentDetailsPage from "./pages/Paymentdetails";
import PaymentsPage from "./pages/Paymentpage";
import UnmatchedDetailsPage from "./pages/Unmatcheddetailspage";
import UnmatchedPage from "./pages/Unmatched";
import WithdrawalsPage from "./pages/Withdrawalspage";
import WithdrawalDetailsPage from "./pages/Withdrawalsdetailpage";
import CashDetailsPage from "./pages/Cashdetailspage";
import CashPage from "./pages/Cashpage";
import ReconciliationPage from "./pages/Reconciliationpage";
import SettingsPage from "./pages/Settingspage";
import TeamPage from "./pages/Teamspage";
import ReportsPage from "./pages/Reportspage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import ResetPasswordPage from "./pages/forgotpassword/Resetpasswordpage";
import VerifyOtpPage from "./pages/forgotpassword/Verifyotppag";
import ForgotPasswordPage from "./pages/forgotpassword/Forgotpasswordpage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SaveCircleSplash />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/forgot-password/verify" element={<VerifyOtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingFlow />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/new" element={<CreateGroupPage />} />
            <Route path="/groups/:id" element={<GroupDetailsPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/payments/:id" element={<PaymentDetailsPage />} />
            <Route path="/unmatched" element={<UnmatchedPage />} />
            <Route path="/unmatched/:id" element={<UnmatchedDetailsPage />} />
            <Route path="/withdrawals" element={<WithdrawalsPage />} />
            <Route
              path="/withdrawals/:id"
              element={<WithdrawalDetailsPage />}
            />
            <Route path="/cash" element={<CashPage />} />
            <Route path="/cash/:id" element={<CashDetailsPage />} />
            <Route path="/reconciliation" element={<ReconciliationPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/team" element={<TeamPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastContainer autoClose={3000} position="top-right" />
    </BrowserRouter>

    // <AuthPage />
  );
}
