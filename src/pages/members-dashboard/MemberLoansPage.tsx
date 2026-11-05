import { Navigate } from "react-router-dom";
import { useOrganisation } from "../../lib/OrgStore";
import LoansPage from "../Loanspage";

export default function MemberLoansPage() {
  const { organisation } = useOrganisation();
  const eligible = organisation?.type === "cooperative" || organisation?.type === "business";
  return eligible ? <LoansPage memberMode /> : <Navigate to="/member-dashboard" replace />;
}
