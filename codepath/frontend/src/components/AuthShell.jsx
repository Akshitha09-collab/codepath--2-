/**
 * components/AuthShell.jsx
 * ------------------------
 * Split-screen layout shared by Login and Register: form on the left,
 * brand panel with floating topic cards on the right (desktop only).
 */

export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl g-brand flex items-center justify-center text-white font-extrabold">C</div>
            <span className="font-extrabold text-xl">CodePath</span>
          </div>
          {children}
        </div>
      </div>

      <div className="hidden lg:flex flex-1 g-brand relative overflow-hidden items-center justify-center p-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-20 w-[28rem] h-[28rem] rounded-full bg-white/10" />
        <div className="relative text-white max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight">Practice smarter, not randomly.</h2>
          <p className="text-white/80 mt-3">We find your weak topics and recommend exactly what to solve next.</p>
          <div className="mt-8 space-y-3">
            <div className="glass rounded-2xl p-4 flex items-center justify-between floaty">
              <span className="font-bold">Graphs</span>
              <span className="badge bg-white text-[#B03A5C]">Weak · 41%</span>
            </div>
            <div className="glass rounded-2xl p-4 flex items-center justify-between floaty" style={{ animationDelay: "-1.6s" }}>
              <span className="font-bold">Trees</span>
              <span className="badge bg-white text-[#946611]">Medium · 58%</span>
            </div>
            <div className="glass rounded-2xl p-4 flex items-center justify-between floaty" style={{ animationDelay: "-3.2s" }}>
              <span className="font-bold">Arrays</span>
              <span className="badge bg-white text-[#17785D]">Strong · 92%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
