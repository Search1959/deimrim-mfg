import React, { useState, useRef } from "react";
import {
  Factory, Lock, Mail, Eye, EyeOff, Package, BookOpen, ShieldCheck,
  Warehouse, ShoppingCart, Banknote, GitBranch, CheckCircle,
  ArrowRight
} from "lucide-react";
import type { User } from "../types";

interface Props { users: User[]; onLogin: (u: User) => void; }

const MODULES = [
  { icon: Package,      name: "Raw Material",     desc: "RM stock · batches · reorder alerts · supplier tracking" },
  { icon: BookOpen,     name: "BOM / Specs",       desc: "Bill of Materials with RM linking · revision control" },
  { icon: Factory,      name: "Production",        desc: "Work orders · batch tracking · machine & operator assign" },
  { icon: ShieldCheck,  name: "Quality Control",   desc: "Flexible QC checks · inspection reports · pass/fail" },
  { icon: Warehouse,    name: "Finished Goods",    desc: "FG stock by batch · location · QC-linked receipts" },
  { icon: ShoppingCart, name: "Sales & Dispatch",  desc: "Orders · delivery challan · e-Way bill · FG deduction" },
  { icon: Banknote,     name: "Finance",           desc: "GST invoices · PO management · supplier ledger" },
  { icon: GitBranch,    name: "MRP / Planning",    desc: "Auto material requirement planning from open orders" },
];

const STEPS = [
  { n:"1", title:"Create BOM",         desc:"Define your product with raw material linkage, specs, and cost per unit." },
  { n:"2", title:"Sales Order",         desc:"Customer places order — linked to BOM. MRP auto-calculates RM requirement." },
  { n:"3", title:"Purchase → RM Stock", desc:"Raise PO for shortages. On receipt, RM stock auto-updates." },
  { n:"4", title:"Production Order",    desc:"Batch created, machine and operator assigned, progress tracked." },
  { n:"5", title:"QC Inspection",       desc:"Flexible parameter checks — pass/fail per batch. Failed qty marked rejected." },
  { n:"6", title:"Dispatch + Invoice",  desc:"Dispatch modal creates challan, deducts FG stock, and auto-raises GST invoice." },
];

const COMPARE = [
  ["Track raw materials", "❌ Excel sheet", "✅ Live stock with reorder alerts"],
  ["Material planning", "❌ Manual math", "✅ Auto MRP from open orders"],
  ["Production tracking", "❌ Whiteboard", "✅ Digital work orders + batches"],
  ["QC records", "❌ Paper register", "✅ Digital checks, auto-link to FG"],
  ["Dispatch + Challan", "❌ Manual Word doc", "✅ One-click challan + e-Way bill"],
  ["GST Invoicing", "❌ Tally or Excel", "✅ Auto GST invoice on dispatch"],
  ["Multi-role access", "❌ One shared file", "✅ 5 roles — operator to admin"],
  ["MRP planning", "❌ Manual BOM calc", "✅ Auto from sales orders"],
  ["Reports & export", "❌ Build manually", "✅ Live reports + Excel export"],
];

const INDUSTRIES = [
  "Springs & Suspension", "Auto Components", "Sheet Metal", "Castings & Forgings",
  "Garments", "Pharma / FMCG", "Pipes & Fittings", "Packaging", "Electronics", "MSME Any Product",
];

const PREVIEW_TABS = ["Dashboard", "Production", "MRP", "Quality"] as const;
type PreviewTab = typeof PREVIEW_TABS[number];

const ROLE_BADGE: Record<string, string> = {
  superadmin: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  manager:    "bg-blue-500/20 text-blue-300 border-blue-500/30",
  sales:      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  operator:   "bg-amber-500/20 text-amber-300 border-amber-500/30",
  readonly:   "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export default function LoginPage({ users, onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [previewTab, setPreviewTab] = useState<PreviewTab>("Dashboard");
  const loginRef = useRef<HTMLDivElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === email && u.password === password && u.active);
    if (user) { onLogin(user); }
    else { setError("Invalid email or password"); }
  };

  const tryDemo = () => { if (users[0]) onLogin(users[0]); };

  return (
    <div className="min-h-screen bg-[#020617] text-white">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Factory className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-white font-mono tracking-wide">DEINRIM MFG</p>
              <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Manufacturing OMS</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-xs font-bold text-slate-400">
            <a href="#modules" className="hover:text-white transition-colors">Modules</a>
            <a href="#flow" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href="https://wa.me/919836130393?text=I'm interested in DEINRIM MFG demo" target="_blank" rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-all">
              WhatsApp
            </a>
            <button onClick={() => loginRef.current?.scrollIntoView({ behavior:"smooth", block:"center" })}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-all">
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero — two column ──────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

          {/* Left — headline */}
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-xs font-bold text-orange-400 mb-6 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" /> Live · deinrim360.in/production
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
              Stop Managing<br />
              <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Spreadsheets.</span><br />
              Start Managing Your<br />Production Floor.
            </h1>
            <p className="text-slate-400 text-sm md:text-base mb-8 max-w-lg">
              DEINRIM MFG is a full-stack Manufacturing OMS — BOM to dispatch, MRP to GST invoice — built for Indian MSME factories.
            </p>
            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 text-[10px] font-bold font-mono">
              {["BOM Linked MRP","GST Compliant","Multi-Role Access","Delivery Challan","e-Way Bill","QC Inspection","RDSO / IS Standard","Excel Export","5 User Roles","Batch Tracking"].map(f => (
                <span key={f} className="bg-slate-800/80 border border-slate-700 rounded-full px-3 py-1 text-slate-300">{f}</span>
              ))}
            </div>
            <div className="mt-6">
              <a href="https://wa.me/919836130393?text=I'm interested in DEINRIM MFG demo" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer transition-all">
                WhatsApp Us
              </a>
            </div>
          </div>

          {/* Right — login panel */}
          <div ref={loginRef} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-black/40">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 mb-3">
                <Factory className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-base font-black text-white">Access Your Workspace</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Sign in or explore with demo accounts</p>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-3 mb-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} required
                    placeholder="Enter your email"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Password</label>
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

            {/* Demo users */}
            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Demo Users</p>
                <button onClick={tryDemo} className="text-[10px] font-bold text-orange-400 hover:text-orange-300 cursor-pointer transition-colors">✨ Auto-fill first</button>
              </div>
              <div className="space-y-1.5">
                {users.map(u => (
                  <button key={u.id} onClick={() => onLogin(u)}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer text-left">
                    <div>
                      <p className="text-xs font-bold text-white">{u.name}</p>
                      <p className="text-[9px] text-slate-500 font-mono">{u.email}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border font-mono uppercase ${ROLE_BADGE[u.role] || "bg-slate-500/20 text-slate-300 border-slate-500/30"}`}>{u.role}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Industries ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest font-mono mb-5">Built for every manufacturing business</p>
        <div className="flex flex-wrap justify-center gap-2">
          {INDUSTRIES.map(ind => (
            <span key={ind} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-bold hover:border-orange-500/30 hover:text-white transition-all">{ind}</span>
          ))}
        </div>
      </section>

      {/* ── Modules ────────────────────────────────────────── */}
      <section id="modules" className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-800">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white mb-2">Platform Modules</h2>
          <p className="text-slate-400 text-sm">8 fully connected modules — data flows automatically between them</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODULES.map(({ icon: Icon, name, desc }) => (
            <div key={name} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-orange-500/30 hover:bg-slate-900 transition-all group">
              <div className="h-9 w-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-3 group-hover:bg-orange-500/20 transition-all">
                <Icon className="h-4 w-4 text-orange-400" />
              </div>
              <p className="text-sm font-black text-white mb-1">{name}</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────── */}
      <section id="flow" className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-800">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white mb-2">How It Works</h2>
          <p className="text-slate-400 text-sm">End-to-end flow — every step auto-links to the next</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <div key={i} className="relative bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-orange-500/20 transition-all">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-sm font-black text-white mb-3">{s.n}</div>
              <p className="text-sm font-black text-white mb-1">{s.title}</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500/40 hidden lg:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-800">
        <div className="text-center mb-8">
          <p className="text-xs text-orange-400 font-bold font-mono mb-2">India's Manufacturing OMS</p>
          <h2 className="text-2xl font-black text-white mb-2">Why Factories Choose DEINRIM MFG</h2>
          <p className="text-slate-400 text-sm">Replace your Excel stack with one connected platform</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-900">
                <th className="text-left p-3 text-slate-400 font-bold">Feature</th>
                <th className="text-center p-3 text-slate-400 font-bold">Excel / Manual</th>
                <th className="text-center p-3 text-orange-300 font-bold">DEINRIM MFG</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([feat, bad, good], i) => (
                <tr key={i} className={`border-t border-slate-800 ${i % 2 === 0 ? "bg-slate-950/40" : ""}`}>
                  <td className="p-3 text-slate-300 font-bold">{feat}</td>
                  <td className="p-3 text-center text-slate-500">{bad}</td>
                  <td className="p-3 text-center text-emerald-400 font-bold">{good}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-center text-[10px] text-slate-500 mt-3 font-mono">DEINRIM MFG replaces your entire Excel + Tally workflow at a fraction of the cost</p>
      </section>

      {/* ── Pricing ────────────────────────────────────────── */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-800">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white mb-2">Simple Flat Pricing</h2>
          <p className="text-slate-400 text-sm">One factory, all modules, all users — one flat price</p>
        </div>
        <div className="max-w-sm mx-auto bg-gradient-to-b from-slate-900 to-slate-950 border border-orange-500/20 rounded-2xl p-8 text-center shadow-xl shadow-orange-500/5">
          <div className="text-4xl font-black text-white mb-1">₹1,500</div>
          <div className="text-slate-400 text-xs mb-6">/ factory / month</div>
          <div className="space-y-2 text-xs text-slate-300 text-left mb-6">
            {["All 8 modules included","Unlimited users & roles","GST invoicing","MRP auto-planning","Delivery challan + e-Way","Excel export all reports","Batch & QC tracking"].map(f => (
              <div key={f} className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />{f}</div>
            ))}
          </div>
          <a href="https://wa.me/919836130393?text=I want to subscribe to DEINRIM MFG" target="_blank" rel="noreferrer"
            className="block w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-3 rounded-xl text-sm transition-all cursor-pointer text-center">
            Get Started
          </a>
        </div>
      </section>

      {/* ── Live Preview ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-800">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white mb-2">Live Module Preview</h2>
          <p className="text-slate-400 text-sm">See exactly what you get — no sign-up required</p>
        </div>
        <div className="flex gap-2 mb-4 justify-center">
          {PREVIEW_TABS.map(t => (
            <button key={t} onClick={() => setPreviewTab(t)} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer border transition-all ${previewTab===t ? "bg-orange-600/20 border-orange-500/30 text-orange-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"}`}>{t}</button>
          ))}
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 max-w-3xl mx-auto">
          {previewTab === "Dashboard" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Factory className="h-4 w-4 text-orange-400" /><span className="text-sm font-black text-white">Production Dashboard</span></div>
                <span className="text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">LIVE</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[{v:"12",l:"Open Orders",c:"text-blue-400"},{v:"3",l:"In Production",c:"text-orange-400"},{v:"847",l:"FG Stock (pcs)",c:"text-emerald-400"},{v:"₹24.6L",l:"Month Revenue",c:"text-violet-400"}].map(k => (
                  <div key={k.l} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                    <p className={`text-xl font-black ${k.c}`}>{k.v}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{k.l}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">RM Low Stock Alerts</p>
                {[{m:"60Si2Mn Wire Rod 38mm",c:"Alloy Steel",q:"120 kg",a:"text-red-400"},{m:"Carbon Steel Sheet 3mm",c:"Mild Steel",q:"340 kg",a:"text-amber-400"}].map(r => (
                  <div key={r.m} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2 text-[10px]">
                    <span className="text-slate-300">{r.m} <span className="text-slate-500">· {r.c}</span></span>
                    <span className={`font-bold ${r.a}`}>{r.q}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {previewTab === "Production" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2"><Factory className="h-4 w-4 text-orange-400" /><span className="text-sm font-black text-white">Production Orders</span></div>
              {[
                {no:"WO-2026-001",p:"Bogie Bolster Spring (Outer)",batch:"BTH-0041",qty:"100 pcs",status:"in_progress",m:"Coiling Machine #1",sc:"text-orange-400",sb:"bg-orange-500/20 border-orange-500/20"},
                {no:"WO-2026-002",p:"Axle Box Spring",batch:"BTH-0042",qty:"200 pcs",status:"planned",m:"Coiling Machine #2",sc:"text-blue-400",sb:"bg-blue-500/20 border-blue-500/20"},
                {no:"WO-2026-003",p:"Buffer Spring",batch:"BTH-0043",qty:"50 pcs",status:"completed",m:"Coiling Machine #1",sc:"text-emerald-400",sb:"bg-emerald-500/20 border-emerald-500/20"},
              ].map(wo => (
                <div key={wo.no} className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-black text-white">{wo.no}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono uppercase ${wo.sb} ${wo.sc}`}>{wo.status}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-200">{wo.p}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Batch: {wo.batch} · {wo.qty} · {wo.m}</p>
                </div>
              ))}
            </div>
          )}
          {previewTab === "MRP" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2"><GitBranch className="h-4 w-4 text-orange-400" /><span className="text-sm font-black text-white">MRP — Material Requirement</span></div>
              <p className="text-[10px] text-slate-400">Auto-calculated from 5 open sales orders</p>
              {[
                {m:"60Si2Mn Wire Rod 38mm",req:"2,400 kg",avail:"120 kg",short:"2,280 kg",alert:true},
                {m:"60Si2Mn Wire Rod 45mm",req:"800 kg",avail:"950 kg",short:"—",alert:false},
                {m:"Corrosion Resistant Coat",req:"180 L",avail:"45 L",short:"135 L",alert:true},
              ].map(r => (
                <div key={r.m} className={`flex items-center justify-between bg-slate-800/40 border rounded-xl px-4 py-3 ${r.alert ? "border-red-500/20" : "border-emerald-500/15"}`}>
                  <div>
                    <p className="text-xs font-bold text-white">{r.m}</p>
                    <p className="text-[10px] text-slate-400">Required: {r.req} · Available: {r.avail}</p>
                  </div>
                  <span className={`text-xs font-black ${r.alert ? "text-red-400" : "text-emerald-400"}`}>{r.alert ? `−${r.short}` : "✓ OK"}</span>
                </div>
              ))}
              <p className="text-[10px] text-orange-400 font-bold text-center">→ Create PO for shortage materials from MRP module</p>
            </div>
          )}
          {previewTab === "Quality" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2"><ShieldCheck className="h-4 w-4 text-orange-400" /><span className="text-sm font-black text-white">QC Inspection Report</span></div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Batch: BTH-0041 · Bogie Bolster Spring (Outer)</span>
                <span className="bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">PASS</span>
              </div>
              <div className="space-y-2">
                {[
                  {p:"Outer Diameter",spec:"212 ± 1 mm",actual:"212.3 mm",r:"Pass"},
                  {p:"Free Length",spec:"395 ± 2 mm",actual:"394.8 mm",r:"Pass"},
                  {p:"Load at 303mm",spec:"7850 ± 3%",actual:"7920 N",r:"Pass"},
                  {p:"Surface Finish",spec:"Shot peened",actual:"Done",r:"Pass"},
                ].map(c => (
                  <div key={c.p} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2 text-[10px]">
                    <div><span className="text-white font-bold">{c.p}</span> <span className="text-slate-500">· spec: {c.spec}</span></div>
                    <div className="flex items-center gap-2"><span className="text-slate-300">{c.actual}</span><span className="text-emerald-400 font-bold">✓</span></div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 text-center">Inspected by: QC Inspector · 100 pcs passed → sent to Finished Goods</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center"><Factory className="h-3.5 w-3.5 text-white" /></div>
              <p className="text-xs font-black text-white font-mono">DEINRIM MFG</p>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">M/s Deinrim Solutionss (P) Ltd.<br />Kolkata, West Bengal (WB), India<br />Corporate Contact: +91 98361-30393</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">Platform & Legal</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">DEINRIM MFG is a product of Deinrim Solutionss. By using this platform you agree to our data privacy policy. All manufacturing data is factory-isolated with no cross-tenant access.</p>
            <div className="flex gap-3 mt-3">
              <a href="https://deinrim360.in" className="text-[10px] text-orange-400 hover:text-orange-300 font-bold transition-colors">deinrim360.in</a>
              <a href="https://wa.me/919836130393" className="text-[10px] text-orange-400 hover:text-orange-300 font-bold transition-colors">WhatsApp Support</a>
              <a href="mailto:deinrimsolutionss@gmail.com" className="text-[10px] text-orange-400 hover:text-orange-300 font-bold transition-colors">Email Us</a>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">Security & Compliance</p>
            <ul className="space-y-2 text-[10px] text-slate-500">
              <li>Each factory account operates in a fully isolated data partition.</li>
              <li>GST invoices comply with Indian tax rules — CGST+SGST / IGST as applicable.</li>
              <li>Delivery challans follow eInvoice / e-Way Bill guidelines for transport.</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 py-4 text-center">
          <p className="text-[10px] text-slate-600 font-mono">DEINRIM MFG Platform v2.0 · Manufacturing OMS for Indian MSME Factories</p>
          <p className="text-[9px] text-slate-700 font-mono mt-1">© 2026 M/s Deinrim Solutionss (P) Ltd. · All Rights Reserved · deinrim360.in/production</p>
        </div>
      </footer>
    </div>
  );
}
