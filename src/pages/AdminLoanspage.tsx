import { Navigate } from "react-router-dom";
import { useOrganisation } from "../lib/OrgStore";
import LoansPage from "./Loanspage";

export default function AdminLoansPage() {
  const { organisation } = useOrganisation();
  const eligible = organisation?.type === "cooperative" || organisation?.type === "business";
  return eligible ? <LoansPage /> : <Navigate to="/dashboard" replace />;
}
