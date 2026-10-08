/**
 * pages/Dashboard.jsx
 * -------------------
 * Main student dashboard: welcome hero with overall success ring, stat
 * tiles, topic map (weakest first), recommended problems, recent activity.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { DIFF, ICONS, Icon, Ring, SKILL } from "../utils/ui";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [allTopics, setAllTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    api
      .get("/dashboard")
      .then((res) => mounted && setData(res.data))
      .catch(() => mounted && setError("Could not load dashboard data. Is the backend running?"))
      .finally(() => mounted && setLoading(false));
    api
      .get("/problems/topics")
      .then((res) => mounted && setAllTopics(res.data.topics || []))
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  if (loading) return <p className="text-[color:var(--soft)]">Loading dashboard...</p>;
  if (error) return <p className="text-[color:var(--coral)] font-semibold">{error}</p>;

  const hasData = data && data.totalAttempted > 0;
  const weak = data.weakTopics || [];
  const firstName = user?.name?.split(" ")[0];
  const success = Math.round(data.overallSuccessRate || 0);

  // Topic map: attempted topics weakest-first, then topics not tried yet.
  const attempted = [...(data.topicPerformance || [])].sort((a, b) => a.performanceScore - b.performanceScore);
  const attemptedNames = new Set(attempted.map((t) => t.topic));
  const notAttempted = allTopics.filter((t) => !attemptedNames.has(t));
  const tiles = [
    ...attempted.map((t) => ({ name: t.topic, score: t.performanceScore, level: t.skillLevel })),
    ...notAttempted.map((t) => ({ name: t, score: null, level: null })),
  ];

  const heroTitle = !hasData
    ? "Let's build your skill map"
    : weak.length > 0
    ? `${weak.length} topic${weak.length === 1 ? "" : "s"} need your focus today`
    : "You're on track — keep practicing";
  const heroSub = !hasData
    ? "Upload your coding history or log a solved problem to get personalized recommendations."
    : weak.length > 0
    ? `${weak.slice(0, 2).join(" and ")} ${weak.length === 1 ? "is" : "are"} your weakest. We picked problems to get you moving.`
    : "No weak topics right now. Keep solving to stay sharp.";

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="g-brand rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute right-24 -bottom-16 w-40 h-40 rounded-full bg-white/10" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="max-w-md">
            <p className="text-white/80 text-sm font-semibold">Good to see you, {firstName} 👋</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mt-1">{heroTitle}</h1>
            <p className="text-white/80 text-sm mt-2">{heroSub}</p>
            <button
              className="btn bg-white text-[color:var(--violet)] mt-5"
              onClick={() => navigate(hasData ? "/recommendations" : "/upload")}
            >
              {hasData ? "Start today's practice →" : "Add your history →"}
            </button>
          </div>
          <div className="relative shrink-0 self-center">
            <div className="glass rounded-3xl p-4 text-center">
              <div className="relative inline-flex items-center justify-center" style={{ width: 112, height: 112 }}>
                <svg width="112" height="112" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="10" />
                  <circle
                    cx="56" cy="56" r="48" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray="301.6" strokeDashoffset={301.6 * (1 - success / 100)}
                  />
                </svg>
                <span className="absolute num text-2xl font-bold">{success}%</span>
              </div>
              <p className="text-xs font-bold mt-2 text-white/90">Overall success</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Problems solved" value={data.totalSolved} sub={`of ${data.totalAttempted} attempted`} gradient="brand" icon={ICONS.check} />
        <StatCard label="Day streak" value={data.streak?.current || 0} sub={`Longest: ${data.streak?.longest || 0} days`} gradient="orange" icon={ICONS.flame} />
        <StatCard label="Success rate" value={`${success}%`} sub="across all topics" gradient="teal" icon={ICONS.progress} />
        <StatCard label="Weak topics" value={weak.length} sub={weak.join(", ") || "None"} gradient="pink" icon={ICONS.warn} />
      </div>

      {/* Topic map */}
      {tiles.length > 0 && (
        <div>
          <div className="mb-3">
            <h2 className="text-lg font-extrabold">Your topic map</h2>
            <p className="text-xs text-[color:var(--soft)]">Weakest first. Tap a topic to see what to solve.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tiles.map((x, i) => {
              const na = x.score === null;
              const col = na ? "#9AA3B8" : SKILL[x.level]?.color || "#9AA3B8";
              return (
                <button
                  key={x.name}
                  onClick={() => navigate("/recommendations")}
                  className="card lift pop text-left !p-4 relative overflow-hidden"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className="absolute top-0 left-0 right-0 h-1.5" style={{ background: col }} />
                  <div className="flex items-center justify-between mt-1">
                    {na ? (
                      <div className="w-16 h-16 rounded-full bg-[#EEF0F6] flex items-center justify-center text-[#9AA3B8] font-bold">—</div>
                    ) : (
                      <Ring pct={x.score} color={col} />
                    )}
                    <span className={`badge ${na ? "b-neutral" : SKILL[x.level]?.badge}`}>{na ? "Not tried" : x.level}</span>
                  </div>
                  <p className="font-extrabold text-sm mt-3 leading-tight">{x.name}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Up next + activity */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="card lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-extrabold">Up next for you</h2>
            <Link to="/recommendations" className="text-sm font-bold text-[color:var(--violet)]">See all →</Link>
          </div>
          {data.recommendedProblems?.length > 0 ? (
            <div className="space-y-3">
              {data.recommendedProblems.slice(0, 3).map((r) => {
                const d = DIFF[r.difficulty] || DIFF.Medium;
                return (
                  <div
                    key={r.problem_id}
                    onClick={() => navigate("/recommendations")}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-[#F5F7FB] hover:bg-[#E8EDF8] transition-colors cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-xl ${d.grad} text-white flex items-center justify-center shrink-0`}>
                      <Icon d={ICONS.code} size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{r.title}</p>
                      <p className="text-xs text-[color:var(--soft)]">{r.topic}</p>
                    </div>
                    <span className={`badge ${d.badge}`}>{r.difficulty}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[color:var(--soft)]">No recommendations yet — add some coding history first.</p>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h2 className="text-lg font-extrabold mb-4">Recent activity</h2>
          {data.recentActivity?.length > 0 ? (
            <ul className="space-y-3.5">
              {data.recentActivity.map((a) => (
                <li key={a._id} className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${a.status === "Solved" ? "bg-[#1F9D7A]" : "bg-[#D9577A]"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">{a.title}</p>
                    <p className="text-xs text-[color:var(--soft)]">{a.topic}</p>
                  </div>
                  <span className={`badge ${a.status === "Solved" ? "b-strong" : "b-weak"}`}>{a.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[color:var(--soft)]">No activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
