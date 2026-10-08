/**
 * components/ProblemCard.jsx
 * ---------------------------
 * One recommended problem: coloured difficulty header, topic skill ring,
 * "Why this?" explanation, previous attempts, and View / Mark solved actions.
 * `skill` is the ML result for the problem's topic:
 *   { skill_level, confidence, performance_score }
 */

import { DIFF, SKILL, Ring } from "../utils/ui";

export default function ProblemCard({ problem, skill, onSolve, solving, index = 0 }) {
  const diff = DIFF[problem.difficulty] || DIFF.Medium;
  const level = skill?.skill_level && SKILL[skill.skill_level] ? skill.skill_level : null;
  const score = skill?.performance_score;
  const confidence = skill?.confidence;

  return (
    <div
      className="card lift !p-0 overflow-hidden flex flex-col pop"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={`${diff.grad} px-5 py-4 text-white flex items-start justify-between gap-3`}>
        <div>
          <p className="text-xs font-bold text-white/85">{problem.topic}</p>
          <h3 className="font-extrabold text-lg leading-snug mt-0.5">{problem.title}</h3>
        </div>
        <span className="badge bg-white/25 text-white shrink-0">{problem.difficulty}</span>
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        {level && (
          <div className="flex items-center gap-4">
            {typeof score === "number" && <Ring pct={score} color={SKILL[level].color} size={56} stroke={6} />}
            <div>
              <span className={`badge ${SKILL[level].badge}`}>{level}</span>
              {typeof confidence === "number" && (
                <p className="text-xs text-[color:var(--soft)] mt-1.5">
                  Model confidence{" "}
                  <b className="num text-[color:var(--ink)]">{Math.round(confidence * 100)}%</b>
                </p>
              )}
            </div>
            <div className="ml-auto flex flex-col items-end gap-1.5">
              {problem.is_retry && <span className="badge b-violet">Retry</span>}
              {problem.borrowed_from_topic && (
                <span className="badge b-violet">via {problem.borrowed_from_topic}</span>
              )}
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-[#F5F7FB] p-3.5 text-sm text-[color:var(--soft)] leading-relaxed">
          <span className="font-bold text-[color:var(--violet)]">Why this? </span>
          {problem.reason}
        </div>

        {problem.previous_attempts > 0 && (
          <p className="text-xs text-[color:var(--soft)]">
            Attempted <span className="num font-bold">{problem.previous_attempts}</span> time(s) before
          </p>
        )}

        <div className="flex gap-2 mt-auto">
          {problem.link && (
            <a href={problem.link} target="_blank" rel="noreferrer" className="btn btn-s text-sm flex-1">
              View
            </a>
          )}
          <button onClick={() => onSolve?.(problem)} disabled={solving} className="btn btn-p text-sm flex-1">
            {solving ? "Saving..." : "Mark solved"}
          </button>
        </div>
      </div>
    </div>
  );
}
