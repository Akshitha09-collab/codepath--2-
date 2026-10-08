/**
 * components/StatCard.jsx
 * Gradient metric tile used on the Dashboard (total solved, streak, etc.)
 */

import { Icon } from "../utils/ui";

const GRADIENTS = {
  brand: "g-brand",
  orange: "g-orange",
  teal: "g-teal",
  pink: "g-pink",
};

export default function StatCard({ label, value, sub, gradient = "brand", icon }) {
  return (
    <div className={`rounded-2xl p-5 text-white lift ${GRADIENTS[gradient] || "g-brand"} relative overflow-hidden`}>
      <div className="absolute -right-5 -bottom-5 w-20 h-20 rounded-full bg-white/15" />
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-white/90">{label}</p>
        {icon && (
          <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Icon d={icon} size={16} />
          </span>
        )}
      </div>
      <p className="num text-3xl font-bold mt-3">{value}</p>
      {sub && <p className="text-xs text-white/85 mt-1">{sub}</p>}
    </div>
  );
}
