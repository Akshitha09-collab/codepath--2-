/**
 * pages/Analysis.jsx
 * ------------------
 * Detailed topic-wise performance: summary by skill level, score bars,
 * and a details table (attempted, solved, success rate, avg attempts,
 * avg time, recent success, ML-classified skill level).
 */

import { useEffect, useState } from "react";
import api from "../api/axios";
import { SKILL } from "../utils/ui";

function SummaryBox({ label, topics, badge, grad }) {
  return (
    <div className="card !p-0 overflow-hidden">
      <div className={`${grad} h-1.5`} />
      <div className="p-5">
        <div className="flex items-baseline justify-between mb-3">
          <p className="font-bold text-sm text-[color:var(--soft)]">{label}</p>
          <span className="num text-2xl font-bold">{topics.length}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {topics.length > 0 ? (
            topics.map((t) => <span key={t} className={`badge ${badge}`}>{t}</span>)
          ) : (
            <span className="text-xs text-[color:var(--soft)]">None</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Analysis() {
  const [data, setData] = useState(null);
  const [allTopics, setAllTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/problems/topics").then((res) => setAllTopics(res.data.topics || [])).catch(() => {});
    api.get("/performance/analysis").then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-[color:var(--soft)]">Analyzing your performance...</p>;

  const performance = data?.performance || [];
  const summary = data?.summary || { strong: [], medium: [], weak: [] };
  const attemptedNames = new Set(performance.map((p) => p.topic));
  const notAttempted = allTopics.filter((t) => !attemptedNames.has(t));
  const byScore = [...performance].sort((a, b) => b.performanceScore - a.performanceScore);
  const bySkill = [...performance].sort((a, b) => a.performanceScore - b.performanceScore);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Performance analysis</h1>
        <p className="text-[color:var(--soft)] text-sm mt-1">
          Topic-by-topic breakdown from our Random Forest classifier.
        </p>
      </div>

      {performance.length === 0 ? (
        <div className="card text-[color:var(--soft)] text-sm">
          No submissions yet. Add or upload coding history to see your analysis.
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryBox label="Strong" topics={summary.strong || []} badge="b-strong" grad="g-teal" />
            <SummaryBox label="Medium" topics={summary.medium || []} badge="b-medium" grad="g-orange" />
            <SummaryBox label="Weak" topics={summary.weak || []} badge="b-weak" grad="g-pink" />
            <SummaryBox label="Not attempted" topics={notAttempted} badge="b-neutral" grad="bg-[#9AA3B8]" />
          </div>

          <div className="card">
            <h2 className="text-lg font-extrabold mb-4">Score by topic</h2>
            <div className="space-y-4">
              {byScore.map((x) => (
                <div key={x.topic}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-bold">{x.topic}</span>
                    <span className="num font-bold" style={{ color: SKILL[x.skillLevel]?.color }}>
                      {Math.round(x.performanceScore)}%
                    </span>
                  </div>
                  <div className="bar">
                    <i className={SKILL[x.skillLevel]?.grad} style={{ width: `${x.performanceScore}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <h2 className="text-lg font-extrabold px-6 pt-6 pb-3">Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[color:var(--soft)] bg-[#F5F7FB]">
                    {["Topic", "Skill", "Attempted", "Solved", "Success", "Avg attempts", "Avg time (min)", "Recent success"].map((h) => (
                      <th key={h} className="px-6 py-3 font-bold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bySkill.map((p) => (
                    <tr key={p.topic} className="border-t border-[color:var(--line)] hover:bg-[#F5F7FB]">
                      <td className="px-6 py-3.5 font-bold">{p.topic}</td>
                      <td className="px-6 py-3.5">
                        <span className={`badge ${SKILL[p.skillLevel]?.badge}`}>{p.skillLevel}</span>
                      </td>
                      <td className="px-6 py-3.5 num">{p.attempted}</td>
                      <td className="px-6 py-3.5 num">{p.solved}</td>
                      <td className="px-6 py-3.5 num">{p.successRate}%</td>
                      <td className="px-6 py-3.5 num">{p.averageAttempts?.toFixed(1)}</td>
                      <td className="px-6 py-3.5 num">{p.averageTime?.toFixed(0)}</td>
                      <td className="px-6 py-3.5 num">{p.recentSuccessRate}%</td>
                    </tr>
                  ))}
                  {notAttempted.map((t) => (
                    <tr key={t} className="border-t border-[color:var(--line)] opacity-60">
                      <td className="px-6 py-3.5 font-bold">{t}</td>
                      <td className="px-6 py-3.5"><span className="badge b-neutral">Not attempted</span></td>
                      {[...Array(6)].map((_, i) => <td key={i} className="px-6 py-3.5 num">—</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
