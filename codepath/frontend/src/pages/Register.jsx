/**
 * pages/Register.jsx
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const result = await register(form.name, form.email, form.password);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-extrabold leading-tight">
        Create your account <span aria-hidden="true">🚀</span>
      </h1>
      <p className="text-sm text-[color:var(--soft)] mt-2 mb-8">
        Get personalized recommendations based on your coding history.
      </p>

      {error && <div className="bg-[#FBE3E9] text-[#B03A5C] text-sm font-semibold rounded-xl px-4 py-3 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[color:var(--soft)] mb-1.5">Full name</label>
          <input
            type="text"
            required
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Shreeja Rao"
          />
        </div>
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
            minLength={6}
            className="input-field"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 6 characters"
          />
        </div>
        <button type="submit" disabled={loading} className="btn btn-p w-full">
          {loading ? "Creating account..." : "Create Account →"}
        </button>
      </form>

      <p className="text-sm text-center text-[color:var(--soft)] mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-[color:var(--violet)] font-bold">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
