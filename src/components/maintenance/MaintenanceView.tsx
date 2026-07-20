import React, { useState } from "react";
import { Wrench, Plus, X, AlertTriangle, CheckCircle, Clock, Download } from "lucide-react";
import { toast } from "../../utils/toast";
import type { User } from "../../types";

interface Machine {
  id: string; code: string; name: string; type: string; location: string;
  manufacturer: string; model: string; purchaseYear: number;
  status: "running" | "idle" | "breakdown" | "maintenance";
  lastMaintenance: string; nextMaintenance: string; amcExpiry: string;
}

interface MaintenanceRecord {
  id: string; machineId: string; machineName: string;
  type: "preventive" | "breakdown" | "oil_change" | "calibration" | "amc";
  date: string; description: string; technicianName: string;
  downtimeHrs: number; cost: number; status: "open" | "in_progress" | "closed";
  parts: string;
}

const MOCK_MACHINES: Machine[] = [
  { id:"m1", code:"CNC-01", name:"CNC Coiling Machine",      type:"Coiling",     location:"Shop Floor A", manufacturer:"Wafios",    model:"FMU-100",   purchaseYear:2019, status:"running",     lastMaintenance:"2026-06-15", nextMaintenance:"2026-09-15", amcExpiry:"2027-01-31" },
  { id:"m2", code:"CNC-02", name:"CNC Coiling Machine 2",    type:"Coiling",     location:"Shop Floor A", manufacturer:"Wafios",    model:"FMU-80",    purchaseYear:2021, status:"running",     lastMaintenance:"2026-07-01", nextMaintenance:"2026-10-01", amcExpiry:"2027-06-30" },
  { id:"m3", code:"HT-01",  name:"Heat Treatment Furnace",   type:"Furnace",     location:"HT Bay",       manufacturer:"Bysakh",    model:"BF-500",    purchaseYear:2018, status:"running",     lastMaintenance:"2026-05-20", nextMaintenance:"2026-08-20", amcExpiry:"2026-12-31" },
  { id:"m4", code:"SP-01",  name:"Shot Peening Machine",     type:"Surface",     location:"Surface Bay",  manufacturer:"Wheelabrator",model:"GOFF-42",  purchaseYear:2020, status:"idle",        lastMaintenance:"2026-06-30", nextMaintenance:"2026-09-30", amcExpiry:"2027-03-31" },
  { id:"m5", code:"LT-01",  name:"Load Testing Machine",     type:"Testing",     location:"QC Lab",       manufacturer:"Instron",   model:"8801",      purchaseYear:2022, status:"running",     lastMaintenance:"2026-07-10", nextMaintenance:"2026-10-10", amcExpiry:"2028-01-31" },
  { id:"m6", code:"GR-01",  name:"Surface Grinder",          type:"Grinding",    location:"Finishing Bay",manufacturer:"HMT",       model:"G-17",      purchaseYear:2016, status:"breakdown",   lastMaintenance:"2026-04-15", nextMaintenance:"2026-07-15", amcExpiry:"2026-09-30" },
];

const MOCK_RECORDS: MaintenanceRecord[] = [
  { id:"mr1", machineId:"m6", machineName:"Surface Grinder",       type:"breakdown",   date:"2026-07-18", description:"Spindle bearing failure — grinding wheel wobble detected",  technicianName:"Ramu Singh",   downtimeHrs:18, cost:12500, status:"in_progress", parts:"6206 Bearing, SKF" },
  { id:"mr2", machineId:"m1", machineName:"CNC Coiling Machine",   type:"preventive",  date:"2026-06-15", description:"Quarterly PM — lubrication, tension check, cam alignment",  technicianName:"Wafios AMC",   downtimeHrs:4,  cost:8000,  status:"closed",      parts:"Grease, Oil Filter" },
  { id:"mr3", machineId:"m3", machineName:"Heat Treatment Furnace",type:"calibration", date:"2026-05-20", description:"Thermocouple calibration, temperature uniformity survey",    technicianName:"NABL Lab",     downtimeHrs:6,  cost:15000, status:"closed",      parts:"Type-K Thermocouple" },
  { id:"mr4", machineId:"m5", machineName:"Load Testing Machine",  type:"calibration", date:"2026-07-10", description:"Annual load cell calibration — NABL certificate issued",    technicianName:"Instron AMC",  downtimeHrs:2,  cost:22000, status:"closed",      parts:"—" },
];

const STATUS_BADGE: Record<Machine["status"], string> = {
  running:     "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  idle:        "bg-slate-500/20 text-slate-400 border-slate-500/30",
  breakdown:   "bg-red-500/20 text-red-400 border-red-500/30",
  maintenance: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const REC_TYPE_BADGE: Record<MaintenanceRecord["type"], string> = {
  preventive: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  breakdown:  "bg-red-500/20 text-red-400 border-red-500/30",
  oil_change: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  calibration:"bg-violet-500/20 text-violet-400 border-violet-500/30",
  amc:        "bg-teal-500/20 text-teal-400 border-teal-500/30",
};

type Tab = "machines" | "records" | "calendar";

interface Props { currentUser: User; }

export default function MaintenanceView({ currentUser }: Props) {
  const [tab, setTab] = useState<Tab>("machines");
  const [machines, setMachines] = useState<Machine[]>(MOCK_MACHINES);
  const [records, setRecords] = useState<MaintenanceRecord[]>(MOCK_RECORDS);
  const [showRecModal, setShowRecModal] = useState(false);
  const [showMachModal, setShowMachModal] = useState(false);
  const canWrite = ["superadmin","manager"].includes(currentUser.role);

  const BLANK_REC = (): Omit<MaintenanceRecord,"id"> => ({
    machineId:"", machineName:"", type:"preventive", date:new Date().toISOString().split("T")[0],
    description:"", technicianName:"", downtimeHrs:0, cost:0, status:"open", parts:"",
  });
  const [recForm, setRecForm] = useState(BLANK_REC());
  const rf = (k: string, v: any) => setRecForm(p => ({...p,[k]:v}));

  const BLANK_MACH = (): Omit<Machine,"id"> => ({
    code:"", name:"", type:"Coiling", location:"", manufacturer:"", model:"", purchaseYear:2024,
    status:"running", lastMaintenance:"", nextMaintenance:"", amcExpiry:"",
  });
  const [machForm, setMachForm] = useState(BLANK_MACH());
  const mf = (k: string, v: any) => setMachForm(p => ({...p,[k]:v}));

  const saveRec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recForm.machineId || !recForm.description) { toast.error("Select machine and add description"); return; }
    const mach = machines.find(m => m.id === recForm.machineId);
    const rec: MaintenanceRecord = { id:`mr-${Date.now()}`, ...recForm, machineName: mach?.name || "" };
    setRecords(prev => [rec, ...prev]);
    if (recForm.type === "breakdown") {
      setMachines(prev => prev.map(m => m.id === recForm.machineId ? { ...m, status: "breakdown" } : m));
    }
    toast.success("Maintenance Record Added");
    setShowRecModal(false);
  };

  const saveMach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!machForm.code || !machForm.name) { toast.error("Machine code and name required"); return; }
    setMachines(prev => [...prev, { id:`m-${Date.now()}`, ...machForm }]);
    toast.success("Machine Added", machForm.name);
    setShowMachModal(false);
  };

  const closeRecord = (id: string) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: "closed" } : r));
    const rec = records.find(r => r.id === id);
    if (rec) setMachines(prev => prev.map(m => m.id === rec.machineId && m.status === "breakdown" ? { ...m, status:"running" } : m));
    toast.success("Record Closed");
  };

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = records.map(r => ({ "Machine":r.machineName, "Type":r.type, "Date":r.date, "Description":r.description, "Technician":r.technicianName, "Downtime (hrs)":r.downtimeHrs, "Cost (₹)":r.cost, "Parts":r.parts, "Status":r.status }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Maintenance");
    XLSX.writeFile(wb, "Maintenance_Log.xlsx"); toast.success("Exported");
  };

  const breakdowns = machines.filter(m => m.status === "breakdown").length;
  const totalDowntime = records.reduce((s,r) => s+r.downtimeHrs, 0);
  const totalCost = records.reduce((s,r) => s+r.cost, 0);
  const openTickets = records.filter(r => r.status !== "closed").length;

  // Upcoming maintenance (next 30 days)
  const today = new Date();
  const in30 = new Date(today.getTime() + 30 * 86400000);
  const upcoming = machines.filter(m => {
    const d = new Date(m.nextMaintenance);
    return d >= today && d <= in30;
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Wrench className="h-6 w-6 text-orange-400" /> Machine Maintenance</h1>
          <p className="text-slate-400 text-sm mt-1">Machine master · Breakdown log · AMC calendar</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Download className="h-3.5 w-3.5" /> Export</button>
          {canWrite && <button onClick={() => { setRecForm(BLANK_REC()); setShowRecModal(true); }} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Plus className="h-3.5 w-3.5" /> Log Maintenance</button>}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Total Machines",   value: machines.length,                                                  color:"text-blue-400" },
          { label:"Breakdowns",       value: breakdowns,                                                       color: breakdowns > 0 ? "text-red-400" : "text-emerald-400" },
          { label:"Open Tickets",     value: openTickets,                                                      color: openTickets > 0 ? "text-amber-400" : "text-emerald-400" },
          { label:"YTD Maint. Cost",  value: `₹${(totalCost/1000).toFixed(0)}k (${totalDowntime}h downtime)`, color:"text-violet-400" },
        ].map(c => (
          <div key={c.label} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
            <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming maintenance alert */}
      {upcoming.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-2"><Clock className="h-3.5 w-3.5" /> Maintenance Due in Next 30 Days</p>
          <div className="flex flex-wrap gap-2">
            {upcoming.map(m => (
              <span key={m.id} className="text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2 py-1 rounded-lg">{m.code} — {m.nextMaintenance}</span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {([["machines","Machines"],["records","Maintenance Log"],["calendar","AMC / Calendar"]] as [Tab,string][]).map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer border transition-all ${tab===t ? "bg-orange-600/20 border-orange-500/30 text-orange-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"}`}>{l}</button>
        ))}
        {canWrite && tab === "machines" && <button onClick={() => { setMachForm(BLANK_MACH()); setShowMachModal(true); }} className="ml-auto flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Plus className="h-3.5 w-3.5" /> Add Machine</button>}
      </div>

      {/* Machines Tab */}
      {tab === "machines" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {machines.map(m => (
            <div key={m.id} className={`bg-slate-950/40 border rounded-xl p-4 ${m.status === "breakdown" ? "border-red-500/30" : "border-slate-800"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-mono font-bold text-orange-400">{m.code}</p>
                  <p className="text-sm font-bold text-white mt-0.5">{m.name}</p>
                  <p className="text-[10px] text-slate-400">{m.manufacturer} · {m.model}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border font-mono uppercase ${STATUS_BADGE[m.status]}`}>{m.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="text-slate-500">Location</div><div className="text-slate-300 font-bold text-right">{m.location}</div>
                <div className="text-slate-500">Purchase Year</div><div className="text-slate-300 font-bold text-right">{m.purchaseYear}</div>
                <div className="text-slate-500">Last PM</div><div className="text-slate-300 font-bold text-right">{m.lastMaintenance}</div>
                <div className="text-slate-500">Next PM</div>
                <div className={`font-bold text-right ${new Date(m.nextMaintenance) < new Date() ? "text-red-400" : "text-emerald-400"}`}>{m.nextMaintenance}</div>
                <div className="text-slate-500">AMC Expiry</div>
                <div className={`font-bold text-right ${new Date(m.amcExpiry) < new Date() ? "text-red-400" : "text-slate-300"}`}>{m.amcExpiry || "—"}</div>
              </div>
              {m.status === "breakdown" && (
                <div className="mt-3 pt-3 border-t border-red-500/20">
                  <p className="text-[10px] text-red-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Machine down — maintenance in progress</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Records Tab */}
      {tab === "records" && (
        <div className="space-y-3">
          {records.map(r => (
            <div key={r.id} className={`bg-slate-950/40 border rounded-xl p-4 ${r.status === "open" || r.status === "in_progress" ? "border-red-500/20" : "border-slate-800"}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono uppercase ${REC_TYPE_BADGE[r.type]}`}>{r.type.replace("_"," ")}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono uppercase ${r.status==="closed" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : r.status==="in_progress" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>{r.status}</span>
                  </div>
                  <p className="text-sm font-bold text-white">{r.machineName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.description}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Technician: {r.technicianName} · Parts: {r.parts || "—"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">{r.date}</p>
                  <p className="text-xs font-bold text-white mt-1">{r.downtimeHrs}h downtime</p>
                  <p className="text-xs font-bold text-orange-400">₹{r.cost.toLocaleString()}</p>
                  {canWrite && r.status !== "closed" && (
                    <button onClick={() => closeRecord(r.id)} className="mt-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold cursor-pointer">
                      <CheckCircle className="h-3 w-3" /> Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {records.length === 0 && <div className="text-center py-16 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">No maintenance records yet</div>}
        </div>
      )}

      {/* Calendar / AMC Tab */}
      {tab === "calendar" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Upcoming Schedule — All Machines</p>
          {[...machines].sort((a,b) => new Date(a.nextMaintenance).getTime() - new Date(b.nextMaintenance).getTime()).map(m => {
            const pmDate = new Date(m.nextMaintenance);
            const amcDate = m.amcExpiry ? new Date(m.amcExpiry) : null;
            const pmOverdue = pmDate < today;
            const amcExpired = amcDate && amcDate < today;
            return (
              <div key={m.id} className={`bg-slate-950/40 border rounded-xl p-4 ${pmOverdue ? "border-red-500/30" : "border-slate-800"}`}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${pmOverdue ? "bg-red-500/20" : "bg-orange-500/10"}`}>
                      <Wrench className={`h-4 w-4 ${pmOverdue ? "text-red-400" : "text-orange-400"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{m.code} — {m.name}</p>
                      <p className="text-[10px] text-slate-400">{m.location} · {m.manufacturer} {m.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right flex-wrap">
                    <div>
                      <p className={`text-sm font-black ${pmOverdue ? "text-red-400" : "text-emerald-400"}`}>{m.nextMaintenance}</p>
                      <p className="text-[10px] text-slate-500">{pmOverdue ? "OVERDUE" : "Next PM"}</p>
                    </div>
                    {amcDate && (
                      <div>
                        <p className={`text-sm font-black ${amcExpired ? "text-red-400" : "text-blue-400"}`}>{m.amcExpiry}</p>
                        <p className="text-[10px] text-slate-500">{amcExpired ? "AMC EXPIRED" : "AMC Expiry"}</p>
                      </div>
                    )}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border font-mono uppercase ${STATUS_BADGE[m.status]}`}>{m.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log Maintenance Modal */}
      {showRecModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Log Maintenance</h3>
              <button onClick={() => setShowRecModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={saveRec} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Machine *</label>
                  <select value={recForm.machineId} onChange={e => rf("machineId", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                    <option value="">Select machine…</option>
                    {machines.map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Type</label>
                  <select value={recForm.type} onChange={e => rf("type", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                    {["preventive","breakdown","oil_change","calibration","amc"].map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Date</label>
                  <input type="date" value={recForm.date} onChange={e => rf("date", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Technician</label>
                  <input value={recForm.technicianName} onChange={e => rf("technicianName", e.target.value)} placeholder="Name / Vendor" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Cost (₹)</label>
                  <input type="number" value={recForm.cost} onChange={e => rf("cost", Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Downtime (hrs)</label>
                  <input type="number" value={recForm.downtimeHrs} onChange={e => rf("downtimeHrs", Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Description *</label>
                <textarea value={recForm.description} onChange={e => rf("description", e.target.value)} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 resize-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Parts Used</label>
                <input value={recForm.parts} onChange={e => rf("parts", e.target.value)} placeholder="e.g. Bearing SKF 6206, Oil filter" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowRecModal(false)} className="flex-1 rounded-lg border border-slate-700 text-slate-400 py-2 text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white py-2 text-xs font-bold cursor-pointer">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Machine Modal */}
      {showMachModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Add Machine</h3>
              <button onClick={() => setShowMachModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={saveMach} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[{l:"Machine Code *",k:"code",ph:"CNC-03"},{l:"Machine Name *",k:"name",ph:"CNC Coiling Machine"},{l:"Manufacturer",k:"manufacturer",ph:"Wafios"},{l:"Model",k:"model",ph:"FMU-100"},{l:"Location",k:"location",ph:"Shop Floor A"},{l:"Purchase Year",k:"purchaseYear",ph:"2024"},{l:"Last PM Date",k:"lastMaintenance",ph:""},{l:"Next PM Date",k:"nextMaintenance",ph:""},{l:"AMC Expiry",k:"amcExpiry",ph:""},].map(({l,k,ph}) => (
                  <div key={k} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">{l}</label>
                    <input value={(machForm as any)[k]} onChange={e => mf(k, e.target.value)} placeholder={ph} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowMachModal(false)} className="flex-1 rounded-lg border border-slate-700 text-slate-400 py-2 text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white py-2 text-xs font-bold cursor-pointer">Add Machine</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
