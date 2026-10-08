/**
 * pages/Profile.jsx
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, setUser } = useAuth();

  // Refresh from /auth/me on mount so a recent Codeforces sync (done on the
  // Upload page) or streak update is reflected here without a full re-login.
  useEffect(() => {
    api.get("/auth/me").then((res) => setUser(res.data.user)).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-extrabold">Profile</h1>
        <p className="text-[color:var(--soft)] text-sm mt-1">Your account details.</p>
      </div>

      <div className="card space-y-5">
        <div>
          <p className="text-xs font-bold text-[color:var(--soft)]">Name</p>
          <p className="font-semibold mt-0.5">{user?.name}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-[color:var(--soft)]">Email</p>
          <p className="font-semibold mt-0.5">{user?.email}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-[color:var(--soft)]">Current Difficulty Level</p>
          <p className="font-semibold mt-0.5">{user?.currentDifficultyLevel}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-[color:var(--soft)]">Coding Streak</p>
          <p className="font-semibold mt-0.5">
            {user?.streak?.current || 0} day(s) current · {user?.streak?.longest || 0} day(s) longest
          </p>
        </div>
        <div>
          <p className="text-xs font-bold text-[color:var(--soft)]">Member Since</p>
          <p className="font-semibold mt-0.5">
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold text-[color:var(--soft)]">Codeforces</p>
          {user?.codeforcesHandle ? (
            <p className="font-semibold mt-0.5">
              <a
                href={`https://codeforces.com/profile/${user.codeforcesHandle}`}
                target="_blank"
                rel="noreferrer"
                className="text-[color:var(--violet)] underline"
              >
                {user.codeforcesHandle}
              </a>
              {user.codeforcesLastSyncedAt && (
                <span className="text-xs text-[color:var(--soft)] ml-2">
                  last synced {new Date(user.codeforcesLastSyncedAt).toLocaleDateString()}
                </span>
              )}
            </p>
          ) : (
            <p className="text-[color:var(--soft)] mt-0.5 text-sm">
              Not linked —{" "}
              <Link to="/upload" className="text-[color:var(--violet)] underline">
                sync your handle
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
