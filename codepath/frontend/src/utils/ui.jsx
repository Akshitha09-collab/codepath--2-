/**
 * utils/ui.jsx
 * ------------
 * Small shared UI helpers for the refined CodePath look: icons, progress
 * rings and the Strong/Medium/Weak + difficulty colour maps.
 */

export const SKILL = {
  Strong: { badge: "b-strong", color: "#1F9D7A", grad: "g-teal" },
  Medium: { badge: "b-medium", color: "#E2A02D", grad: "g-orange" },
  Weak: { badge: "b-weak", color: "#D9577A", grad: "g-pink" },
};

export const DIFF = {
  Easy: { badge: "b-strong", grad: "g-teal" },
  Medium: { badge: "b-medium", grad: "g-orange" },
  Hard: { badge: "b-weak", grad: "g-pink" },
};

export const ICONS = {
  dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  problems: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  analysis: "M18 20V10M12 20V4M6 20v-6",
  recommendations:
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  progress: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  profile: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3",
  flame:
    "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z",
  warn: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
};

export function Icon({ d, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/** Circular progress ring with a centred percentage label. */
export function Ring({ pct, color, size = 64, stroke = 7, label = true }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const value = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}22`} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      {label && (
        <span className="absolute num font-bold" style={{ fontSize: size / 4.4, color }}>
          {value}%
        </span>
      )}
    </div>
  );
}
