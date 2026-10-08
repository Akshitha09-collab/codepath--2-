/**
 * pages/Problems.jsx
 * ------------------
 * Browse the problem catalog, filter by topic/difficulty, and manually
 * log a solved/failed problem (the "Manually add solved problems" feature).
 */

import { useEffect, useState } from "react";
import api from "../api/axios";

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const STATUSES = ["Solved", "Failed", "Attempted"];

export default function Problems() {
  const [problems, setProblems] = useState([]);
  const [topics, setTopics] = useState([]);
  const [filters, setFilters] = useState({ topic: "", difficulty: "", search: "" });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    problemId: "", title: "", topic: "", difficulty: "Easy",
    status: "Solved", attempts: 1, timeTaken: 15, date: new Date().toISOString().slice(0, 10),
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/problems/topics").then((res) => setTopics(res.data.topics));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.topic) params.topic = filters.topic;
    if (filters.difficulty) params.difficulty = filters.difficulty;
    if (filters.search) params.search = filters.search;

    api
      .get("/problems", { params })
      .then((res) => setProblems(res.data.problems))
      .finally(() => setLoading(false));
  }, [filters]);

  function selectProblem(p) {
    setForm({
      ...form,
      problemId: p.problemId,
      title: p.title,
      topic: p.topic,
      difficulty: p.difficulty,
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await api.post("/submissions", {
        ...form,
        problemId: Number(form.problemId),
        attempts: Number(form.attempts),
        timeTaken: Number(form.timeTaken),
      });
      setMessage("Submission recorded! Your performance has been recalculated.");
      setShowForm(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to save submission.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Problem Catalog</h1>
          <p className="text-[color:var(--soft)] text-sm mt-1">Browse problems, or log one you've already attempted.</p>
        </div>
        <button className="btn btn-p" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add Submission"}
        </button>
      </div>

      {message && (
        <div className="card bg-[#E3EBFD] border-[#C9D8FB] text-sm text-[color:var(--ink)]">{message}</div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card grid md:grid-cols-3 gap-4">
          <Field label="Problem ID">
            <input required type="number" className="input-field" value={form.problemId}
              onChange={(e) => setForm({ ...form, problemId: e.target.value })} />
          </Field>
          <Field label="Title">
            <input required className="input-field" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Topic">
            <input required className="input-field" value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })} />
          </Field>
          <Field label="Difficulty">
            <select className="input-field" value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="input-field" value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Attempts">
            <input required type="number" min="1" className="input-field" value={form.attempts}
              onChange={(e) => setForm({ ...form, attempts: e.target.value })} />
          </Field>
          <Field label="Time Taken (minutes)">
            <input required type="number" min="0" className="input-field" value={form.timeTaken}
              onChange={(e) => setForm({ ...form, timeTaken: e.target.value })} />
          </Field>
          <Field label="Date">
            <input required type="date" className="input-field" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <div className="flex items-end">
            <button type="submit" disabled={submitting} className="btn btn-p w-full">
              {submitting ? "Saving..." : "Save Submission"}
            </button>
          </div>
        </form>
      )}

      <div className="card flex flex-wrap gap-3">
        <select className="input-field w-auto" value={filters.topic}
          onChange={(e) => setFilters({ ...filters, topic: e.target.value })}>
          <option value="">All Topics</option>
          {topics.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input-field w-auto" value={filters.difficulty}
          onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}>
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input className="input-field w-auto flex-1 min-w-[180px]" placeholder="Search by title..."
          value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
      </div>

      <div className="card !p-0 overflow-hidden overflow-x-auto">
        {loading ? (
          <p className="text-[color:var(--soft)] text-sm p-6">Loading problems...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[color:var(--soft)] bg-[#F5F7FB]">
                <th className="px-4 py-3 font-bold">Title</th>
                <th className="px-4 py-3 font-bold">Topic</th>
                <th className="px-4 py-3 font-bold">Difficulty</th>
                <th className="px-4 py-3 font-bold"></th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p) => (
                <tr key={p.problemId} className="border-t border-[color:var(--line)] hover:bg-[#F5F7FB]">
                  <td className="px-4 py-3.5 font-bold">{p.title}</td>
                  <td className="px-4 py-3.5 text-[color:var(--soft)]">{p.topic}</td>
                  <td className="px-4 py-3.5">
                    <span className={`badge ${p.difficulty === "Easy" ? "b-strong" : p.difficulty === "Medium" ? "b-medium" : "b-weak"}`}>
                      {p.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button onClick={() => selectProblem(p)} className="text-[color:var(--violet)] text-sm font-bold">
                      Log Attempt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-[color:var(--soft)] mb-1.5">{label}</label>
      {children}
    </div>
  );
}
