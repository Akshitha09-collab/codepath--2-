/**
 * components/Sidebar.jsx
 * ----------------------
 * Left-hand navigation on desktop, horizontal top bar on mobile.
 * Includes the streak card and the signed-in user footer.
 */

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icon, ICONS } from "../utils/ui";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: ICONS.dashboard },
  { to: "/problems", label: "Problems", icon: ICONS.problems },
  { to: "/upload", label: "Upload History", icon: ICONS.upload },
  { to: "/analysis", label: "Analysis", icon: ICONS.analysis },
  { to: "/recommendations", label: "Recommendations", icon: ICONS.recommendations },
  { to: "/progress", label: "Progress", icon: ICONS.progress },
  { to: "/profile", label: "Profile", icon: ICONS.profile },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const streak = user?.streak?.current || 0;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="md:w-64 shrink-0 bg-white/80 backdrop-blur border-b md:border-b-0 md:border-r border-[color:var(--line)] md:min-h-screen flex flex-col md:sticky md:top-0 md:h-screen">
      <div className="px-5 md:px-6 py-4 md:py-6 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl g-brand flex items-center justify-center text-white font-extrabold">C</div>
        <div>
          <p className="font-extrabold text-lg leading-none">CodePath</p>
          <p className="text-[11px] text-[color:var(--soft)] mt-1 hidden md:block">Personalized DSA practice</p>
        </div>
      </div>

      <nav className="md:flex-1 px-3 pb-3 md:py-2 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto md:overflow-x-visible">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav ${isActive ? "on" : ""}`}>
            <Icon d={link.icon} />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="hidden md:block m-4 p-4 rounded-2xl g-orange text-white">
        <p className="text-xs font-bold opacity-90">Current streak</p>
        <p className="num text-3xl font-bold mt-0.5">
          {streak} {streak === 1 ? "day" : "days"} 🔥
        </p>
        <p className="text-xs opacity-90 mt-1">
          {streak > 0 ? "Solve 1 more today to keep it!" : "Solve a problem today to start one!"}
        </p>
      </div>

      <div className="hidden md:flex items-center gap-3 px-5 py-4 border-t border-[color:var(--line)]">
        <div className="w-9 h-9 rounded-full g-pink flex items-center justify-center text-white font-bold text-sm">
          {user?.name?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate">{user?.name}</p>
          <button
            onClick={handleLogout}
            className="text-xs text-[color:var(--soft)] hover:text-[color:var(--violet)] cursor-pointer"
          >
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
