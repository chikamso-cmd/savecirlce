import { Navigate, Outlet, useLocation } from "react-router-dom";
import { tokenStore } from "../../services/Axios";

// Wrap routes that need a signed-in user. Without a token, send them to /login and
// remember where they were headed so login can bring them back (same ?next= as Axios.ts).
export default function ProtectedRoute() {
  const location = useLocation();

  if (!tokenStore.get()) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <Outlet />;
}
