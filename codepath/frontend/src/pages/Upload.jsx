/**
 * pages/Upload.jsx
 * ----------------
 * Two ways to bring coding history into CodePath:
 *   1. Sync directly from a Codeforces handle (pulls real submissions via
 *      the Codeforces API, mapped onto our topic/difficulty vocabulary).
 *   2. Upload a CSV file manually (format guidance + per-row error reporting).
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Upload() {
  const navigate = useNavigate();

  // --- Codeforces sync state ---
  const [cfHandle, setCfHandle] = useState("");
  const [cfStatus, setCfStatus] = useState(null); // { handle, lastSyncedAt }
  const [cfSyncing, setCfSyncing] = useState(false);
  const [cfResult, setCfResult] = useState(null);
  const [cfError, setCfError] = useState("");

  // --- CSV upload state ---
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/codeforces/status").then((res) => {
      setCfStatus(res.data);
      if (res.data.handle) setCfHandle(res.data.handle);
    });
  }, []);

  async function handleCfSync(e) {
    e.preventDefault();
    if (!cfHandle.trim()) {
      setCfError("Please enter a Codeforces handle.");
      return;
    }
    setCfError("");
    setCfResult(null);
    setCfSyncing(true);
    try {
      const { data } = await api.post("/codeforces/sync", { handle: cfHandle.trim() });
      setCfResult(data);
      setCfStatus({ handle: data.handle, lastSyncedAt: new Date().toISOString() });
    } catch (err) {
      setCfError(err.response?.data?.message || "Sync failed. Double-check the handle and try again.");
    } finally {
      setCfSyncing(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a CSV file first.");
      return;
    }
    setError("");
    setResult(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/upload/csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please check your file and try again.");
      if (err.response?.data?.errors) {
        setResult({ rowErrors: err.response.data.errors, inserted: 0 });
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold">Import Coding History</h1>
        <p className="text-[color:var(--soft)] text-sm mt-1">
          Sync directly from Codeforces, or upload a CSV file manually.
        </p>
      </div>

      {/* ============== CODEFORCES SYNC ============== */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Sync from Codeforces</h2>
          <span className="text-lg">⚔️</span>
        </div>
        <p className="text-sm text-[color:var(--soft)]">
          Enter your Codeforces handle and we'll pull your real submissions,
          map each problem's tags/rating onto our topics and difficulty
          levels, and feed them into your performance analysis automatically.
        </p>

        {cfStatus?.handle && (
          <p className="text-xs text-[color:var(--soft)]">
            Currently linked: <span className="font-bold text-[color:var(--ink)]">{cfStatus.handle}</span>
            {cfStatus.lastSyncedAt && (
              <> · last synced {new Date(cfStatus.lastSyncedAt).toLocaleString()}</>
            )}
          </p>
        )}

        <form onSubmit={handleCfSync} className="flex gap-2">
          <input
            className="input-field"
            placeholder="e.g. tourist"
            value={cfHandle}
            onChange={(e) => setCfHandle(e.target.value)}
          />
          <button type="submit" disabled={cfSyncing} className="btn btn-p whitespace-nowrap">
            {cfSyncing ? "Syncing..." : "Sync Now"}
          </button>
        </form>

        {cfError && <p className="text-sm text-[#B03A5C]">{cfError}</p>}

        {cfResult && (
          <div className="bg-[#E3EBFD] border border-[#C9D8FB] rounded-xl p-3 space-y-2">
            <p className="text-sm text-[color:var(--ink)]">{cfResult.message}</p>
            <div className="flex gap-4 text-sm">
              <p><span className="font-semibold text-strong">{cfResult.inserted}</span> new</p>
              <p><span className="font-semibold text-medium">{cfResult.updated}</span> updated</p>
              <p><span className="font-semibold text-[color:var(--violet)]">{cfResult.total}</span> total synced</p>
            </div>
            <button onClick={() => navigate("/analysis")} className="btn btn-p text-sm">
              View Updated Analysis →
            </button>
          </div>
        )}

        <p className="text-xs text-[color:var(--soft)]">
          Re-sync any time to pull your latest submissions — problems you've
          already imported get refreshed (not duplicated) if their status changed.
        </p>
      </div>

      <div className="flex items-center gap-3 text-xs text-[color:var(--soft)]">
        <div className="flex-1 h-px bg-[color:var(--line)]" /> OR <div className="flex-1 h-px bg-[color:var(--line)]" />
      </div>

      {/* ============== CSV UPLOAD ============== */}
      <div className="card">
        <h2 className="text-lg font-extrabold mb-2">Upload a CSV File</h2>
        <pre className="bg-[#F5F7FB] border border-[color:var(--line)] rounded-xl p-3 text-xs overflow-x-auto text-[color:var(--ink)]">
{`problem_id,title,topic,difficulty,status,attempts,time_taken,date
1,Two Sum,Arrays,Easy,Solved,1,15,2026-09-01
2,Number of Islands,Graphs,Medium,Failed,3,40,2026-09-02
3,Knapsack,DP,Hard,Failed,5,60,2026-09-03`}
        </pre>
        <ul className="text-xs text-[color:var(--soft)] mt-2 list-disc list-inside space-y-0.5">
          <li>difficulty must be Easy, Medium, or Hard</li>
          <li>status must be Solved, Failed, or Attempted</li>
          <li>date should be in YYYY-MM-DD format</li>
          <li>Rows with errors are skipped and reported individually — the rest of the file still imports</li>
        </ul>
      </div>

      <form onSubmit={handleUpload} className="card space-y-4">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm text-[color:var(--ink)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#E3EBFD] file:text-[#2A50CF] file:font-bold"
        />
        {error && <p className="text-sm text-[#B03A5C]">{error}</p>}
        <button type="submit" disabled={uploading} className="btn btn-p">
          {uploading ? "Uploading..." : "Upload CSV"}
        </button>
      </form>

      {result && (
        <div className="card space-y-3">
          <h2 className="text-lg font-extrabold">Upload Result</h2>
          {result.message && <p className="text-sm text-[color:var(--ink)]">{result.message}</p>}
          <div className="flex gap-4 text-sm">
            <p><span className="font-semibold text-strong">{result.inserted || 0}</span> imported</p>
            <p><span className="font-semibold text-medium">{result.skippedDuplicates || 0}</span> duplicates skipped</p>
            <p><span className="font-semibold text-weak">{result.rowErrors?.length || 0}</span> errors</p>
          </div>

          {result.rowErrors?.length > 0 && (
            <div className="bg-[#FBE3E9] rounded-xl p-3 max-h-48 overflow-y-auto">
              <ul className="text-xs text-[#B03A5C] space-y-1">
                {result.rowErrors.map((e, i) => (
                  <li key={i}>Row {e.row}: {e.message}</li>
                ))}
              </ul>
            </div>
          )}

          {result.inserted > 0 && (
            <button onClick={() => navigate("/analysis")} className="btn btn-p text-sm">
              View Updated Analysis →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
