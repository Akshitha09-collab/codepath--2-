/**
 * components/ProtectedRoute.jsx
 * -----------------------------
 * Redirects to /login if there is no authenticated user, and wraps
 * authenticated pages with the shared Sidebar layout.
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  );
}
