/**
 * pages/Recommendations.jsx
 * -------------------------
 * Personalized recommendations as cards (with explanations), a topic
 * filter, and the Daily Practice section.
 */

import { useEffect, useState } from "react";
import api from "../api/axios";
import ProblemCard from "../components/ProblemCard";

const DAILY_GRADS = ["g-pink", "g-orange", "g-blue"];

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [skillLevels, setSkillLevels] = useState({});
  const [dailyPractice, setDailyPractice] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [solvingId, setSolvingId] = useState(null);

  async function loadRecommendations(topic = "") {
    setLoading(true);
    try {
      const params = { topN: 6 };
      if (topic) params.topic = topic;
      const { data } = await api.get("/recommendations", { params });
      setRecommendations(data.recommendations || []);
      if (data.skillLevels) setSkillLevels(data.skillLevels);
      setMessage(data.message || "");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get("/problems/topics").then((res) => setTopics(res.data.topics));
    api.get("/recommendations/daily").then((res) => setDailyPractice(res.data.dailyPractice || []));
    loadRecommendations();
  }, []);

  function pickTopic(t) {
    setSelectedTopic(t);
    loadRecommendations(t);
  }

  async function handleSolve(problem) {
    setSolvingId(problem.problem_id);
    try {
      await api.post("/submissions", {
        problemId: problem.problem_id,
        title: problem.title,
        topic: problem.topic,
        difficulty: problem.difficulty,
        status: "Solved",
        attempts: 1,
        timeTaken: 20,
        date: new Date().toISOString().slice(0, 10),
      });
      // Refresh recommendations dynamically -- this problem should no longer appear
      await loadRecommendations(selectedTopic);
    } finally {
      setSolvingId(null);
    }
  }

  const levels = Object.values(skillLevels);
  const needFocus = levels.filter((s) => s.skill_level === "Weak").length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="g-brand rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/10" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <span className="badge bg-white/20 text-white">✨ Powered by your skill classifier</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">Personalized for you</h1>
            <p className="text-white/80 text-sm mt-1.5 max-w-lg">
              Weak topics first, difficulty matched to your level, solved problems never repeated.
            </p>
          </div>
          {levels.length > 0 && (
            <div className="flex gap-3 shrink-0">
              <div className="glass rounded-2xl px-5 py-3 text-center">
                <p className="num text-2xl font-bold">{levels.length}</p>
                <p className="text-xs text-white/80">topics</p>
              </div>
              <div className="glass rounded-2xl px-5 py-3 text-center">
                <p className="num text-2xl font-bold">{needFocus}</p>
                <p className="text-xs text-white/80">need focus</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily practice */}
      {dailyPractice.length > 0 && (
        <div>
          <h2 className="text-lg font-extrabold mb-3">🔥 Today's practice</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {dailyPractice.map((p, i) => (
              <div key={p.problem_id} className={`rounded-2xl p-5 text-white lift ${DAILY_GRADS[i % DAILY_GRADS.length]}`}>
                <p className="text-xs font-bold text-white/85">{p.topic}</p>
                <p className="font-extrabold text-lg mt-1 leading-snug">{p.title}</p>
                <span className="badge bg-white/25 text-white mt-3">{p.difficulty}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic filter chips */}
      <div className="flex flex-wrap gap-2">
        {["", ...topics].map((t) => (
          <button key={t || "all"} className={`chip ${selectedTopic === t ? "on" : ""}`} onClick={() => pickTopic(t)}>
            {t || "All weak & medium"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[color:var(--soft)]">Generating recommendations...</p>
      ) : message && recommendations.length === 0 ? (
        <div className="card text-[color:var(--soft)] text-sm">{message}</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {recommendations.map((p, i) => (
            <ProblemCard
              key={p.problem_id}
              index={i}
              problem={p}
              skill={skillLevels[p.topic]}
              onSolve={handleSolve}
              solving={solvingId === p.problem_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
