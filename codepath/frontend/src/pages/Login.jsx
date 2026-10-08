/**
 * pages/Login.jsx
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const result = await login(form.email, form.password);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-extrabold leading-tight">
        Welcome back <span aria-hidden="true">👋</span>
      </h1>
      <p className="text-sm text-[color:var(--soft)] mt-2 mb-8">Log in and keep your practice streak alive.</p>

      {error && <div className="bg-[#FBE3E9] text-[#B03A5C] text-sm font-semibold rounded-xl px-4 py-3 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[color:var(--soft)] mb-1.5">Email</label>
          <input
            type="email"
            required
            className="input-field"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[color:var(--soft)] mb-1.5">Password</label>
          <input
            type="password"
            required
            className="input-field"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </div>
        <button type="submit" disabled={loading} className="btn btn-p w-full">
          {loading ? "Logging in..." : "Log In →"}
        </button>
      </form>

      <p className="text-xs text-center mt-6 text-[color:var(--soft)]">
        Demo account: demo@codepath.com / password123
      </p>
      <p className="text-sm text-center text-[color:var(--soft)] mt-4">
        Don't have an account?{" "}
        <Link to="/register" className="text-[color:var(--violet)] font-bold">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
