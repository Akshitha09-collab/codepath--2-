/**
 * pages/Progress.jsx
 * ------------------
 * Shows improvement over time per topic (e.g. Graphs: 33% -> 52%) using
 * the Performance.history snapshots recorded every time performance is
 * recomputed after a new submission.
 */

import { useEffect, useState } from "react";
import api from "../api/axios";
import ProgressChart from "../components/ProgressChart";
import { SKILL } from "../utils/ui";

export default function Progress() {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/performance/progress").then((res) => setProgress(res.data.progress || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-[color:var(--soft)]">Loading progress...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Your progress</h1>
        <p className="text-[color:var(--soft)] text-sm mt-1">See how each topic has improved as you practice.</p>
      </div>

      {progress.length === 0 ? (
        <div className="card text-[color:var(--soft)] text-sm">
          No progress data yet — solve a few problems and check back here.
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {progress.map((p) => {
              const s = SKILL[p.skillLevel] || SKILL.Medium;
              const hasStart = p.history.length >= 2;
              const d = p.improvement;
              return (
                <div key={p.topic} className="card lift">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-extrabold">{p.topic}</h3>
                    <span className={`badge ${s.badge}`}>{p.skillLevel}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasStart && (
                      <>
                        <span className="num text-lg text-[color:var(--soft)]">{Math.round(p.history[0].score)}%</span>
                        <span className="text-[color:var(--soft)]">→</span>
                      </>
                    )}
                    <span className="num text-4xl font-bold" style={{ color: s.color }}>{Math.round(p.current)}%</span>
                  </div>
                  <div className="bar mt-4">
                    <i className={s.grad} style={{ width: `${p.current}%` }} />
                  </div>
                  {d > 0 ? (
                    <p className="text-sm mt-3 font-bold text-[#17785D]">▲ <span className="num">{d}%</span> improvement</p>
                  ) : d < 0 ? (
                    <p className="text-sm mt-3 font-bold text-[#B03A5C]">▼ <span className="num">{Math.abs(d)}%</span> drop</p>
                  ) : (
                    <p className="text-sm mt-3 text-[color:var(--soft)]">No change yet — solve a few more!</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="card">
            <h2 className="text-lg font-extrabold mb-3">Performance trend</h2>
            <ProgressChart topics={progress} />
          </div>
        </>
      )}
    </div>
  );
}
