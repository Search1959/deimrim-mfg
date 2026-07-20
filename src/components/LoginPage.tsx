import React, { useState } from "react";
import { Factory, Lock, Mail, Eye, EyeOff } from "lucide-react";
import type { User } from "../types";

interface Props { users: User[]; onLogin: (u: User) => void; }

export default function LoginPage({ users, onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === email && u.password === password && u.active);
    if (user) { onLogin(user); }
    else { setError("Invalid email or password"); }
  };

  const quickLogin = (u: User) => { setEmail(u.email); setPassword(u.password); setError(""); };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20">
            <Factory className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">DEINRIM MFG</h1>
            <p className="text-slate-400 text-sm">Spring Manufacturing Operations System</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-bold text-white mb-5">Sign in to your account</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} required
                  placeholder="Enter your email"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input type={showPw ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }} required
                  placeholder="Enter your password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-9 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer">
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all cursor-pointer shadow-lg shadow-orange-500/20">
              Sign In
            </button>
          </form>
        </div>

        {/* Demo Users */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-mono">Demo Users — Click to auto-fill</p>
          <div className="space-y-1.5">
            {users.map(u => (
              <button key={u.id} onClick={() => quickLogin(u)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer text-left">
                <div>
                  <p className="text-xs font-bold text-white">{u.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{u.email}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border font-mono uppercase ${
                  u.role === "superadmin" ? "bg-violet-500/20 text-violet-300 border-violet-500/30" :
                  u.role === "manager"    ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                  u.role === "sales"      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                  u.role === "operator"   ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                  "bg-slate-500/20 text-slate-300 border-slate-500/30"
                }`}>{u.role}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-600 font-mono">DEINRIM Solutions · deinrim360.in/production</p>
      </div>
    </div>
  );
}
