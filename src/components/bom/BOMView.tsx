import React, { useState } from "react";
import { BookOpen, Plus, X, Download, Edit, Trash2, Eye } from "lucide-react";
import type { BOMItem, SpringType, CustomerType, RMGrade, User } from "../../types";
import { toast } from "../../utils/toast";

interface Props { boms: BOMItem[]; setBoms: React.Dispatch<React.SetStateAction<BOMItem[]>>; currentUser: User; }

const SPRING_TYPES: SpringType[] = ["Compression","Extension","Torsion","Buffer","Draw Gear","Bogie","Volute"];
const CUST_TYPES: CustomerType[] = ["Railway","Local","Automotive","Industrial"];
const GRADES: RMGrade[] = ["EN45A","60Si2Mn","SUP9","Chrome Vanadium","65Si7","Other"];

const BLANK = (): Omit<BOMItem,"id"> => ({
  drawingNo:"", springName:"", springType:"Bogie", customerType:"Railway", grade:"60Si2Mn",
  wireDiaMm:0, outerDiaMm:0, freeHeightMm:0, totalCoils:0, activeCoils:0,
  springRateNMm:0, fittedLoadKg:0, fittedHeightMm:0, solidHeightMm:0,
  endType:"Closed & Ground", heatTreatment:"Q&T + Shot Peening + Phosphating",
  weightKgEach:0, rmConsumptionKg:0, active:true,
});

export default function BOMView({ boms, setBoms, currentUser }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [viewing, setViewing] = useState<BOMItem | null>(null);
  const [editing, setEditing] = useState<BOMItem | null>(null);
  const [form, setForm] = useState(BLANK());
  const [filter, setFilter] = useState<CustomerType | "all">("all");
  const canWrite = ["superadmin","manager"].includes(currentUser.role);

  const f = (key: string, val: any) => setForm(p => ({...p, [key]: val}));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.drawingNo || !form.springName) { toast.error("Drawing No and Name required"); return; }
    if (editing) {
      setBoms(prev => prev.map(b => b.id === editing.id ? { ...editing, ...form } : b));
      toast.success("BOM Updated", form.springName);
    } else {
      setBoms(prev => [{ id: `bom-${Date.now()}`, ...form }, ...prev]);
      toast.success("BOM Added", form.springName);
    }
    setShowModal(false);
  };

  const del = (id: string) => { if (confirm("Delete this BOM?")) { setBoms(prev => prev.filter(b => b.id !== id)); toast.warning("Deleted"); } };
  const openEdit = (b: BOMItem) => { setEditing(b); setForm({...b}); setShowModal(true); };
  const openNew = () => { setEditing(null); setForm(BLANK()); setShowModal(true); };

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = boms.map(b => ({
      "Drawing No": b.drawingNo, "Spring Name": b.springName, "Type": b.springType, "Customer Type": b.customerType,
      "RDSO Spec": b.rdsoSpec || "", "Wire Dia (mm)": b.wireDiaMm, "Outer Dia (mm)": b.outerDiaMm,
      "Free Height (mm)": b.freeHeightMm, "Total Coils": b.totalCoils, "Grade": b.grade,
      "Spring Rate (N/mm)": b.springRateNMm, "Fitted Load (kg)": b.fittedLoadKg,
      "Weight Each (kg)": b.weightKgEach, "RM Consumption (kg)": b.rmConsumptionKg,
    }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "BOM");
    XLSX.writeFile(wb, "BOM_Export.xlsx"); toast.success("Exported");
  };

  const filtered = filter === "all" ? boms : boms.filter(b => b.customerType === filter);

  const CUST_BADGE: Record<CustomerType, string> = {
    Railway: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    Local: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    Automotive: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    Industrial: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><BookOpen className="h-6 w-6 text-orange-400" /> BOM / Spring Specifications</h1>
          <p className="text-slate-400 text-sm mt-1">Bill of Materials — RDSO drawings and local specs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          {canWrite && <button onClick={openNew} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg px-3 py-2 text-xs font-bold cursor-pointer">
            <Plus className="h-3.5 w-3.5" /> Add BOM
          </button>}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", ...CUST_TYPES] as const).map(t => (
          <button key={t} onClick={() => setFilter(t as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border transition-all ${filter === t ? "bg-orange-600/20 border-orange-500/30 text-orange-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"}`}>
            {t === "all" ? "All" : t} {t !== "all" && `(${boms.filter(b => b.customerType === t).length})`}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(b => (
          <div key={b.id} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-black text-white font-mono">{b.drawingNo}</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">{b.springName}</p>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono uppercase ${CUST_BADGE[b.customerType]}`}>{b.customerType}</span>
            </div>
            {b.rdsoSpec && <p className="text-[10px] text-slate-500 font-mono mb-2">RDSO: {b.rdsoSpec}</p>}
            <div className="grid grid-cols-3 gap-2 text-[10px] mb-3">
              <div className="bg-slate-900 rounded-lg p-2 text-center">
                <p className="text-slate-500">Wire Ø</p>
                <p className="text-white font-bold font-mono">{b.wireDiaMm}mm</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-2 text-center">
                <p className="text-slate-500">Free Ht</p>
                <p className="text-white font-bold font-mono">{b.freeHeightMm}mm</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-2 text-center">
                <p className="text-slate-500">Load</p>
                <p className="text-white font-bold font-mono">{b.fittedLoadKg}kg</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-2 text-center">
                <p className="text-slate-500">Grade</p>
                <p className="text-orange-300 font-bold font-mono text-[9px]">{b.grade}</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-2 text-center">
                <p className="text-slate-500">Rate</p>
                <p className="text-white font-bold font-mono">{b.springRateNMm}N/mm</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-2 text-center">
                <p className="text-slate-500">Wt Each</p>
                <p className="text-white font-bold font-mono">{b.weightKgEach}kg</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mb-3 truncate">{b.heatTreatment}</p>
            <div className="flex gap-1.5">
              <button onClick={() => setViewing(b)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer border border-slate-700">
                <Eye className="h-3 w-3" /> View
              </button>
              {canWrite && <>
                <button onClick={() => openEdit(b)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-[10px] font-bold cursor-pointer border border-blue-500/20"><Edit className="h-3 w-3" /> Edit</button>
                <button onClick={() => del(b.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer border border-red-500/20"><Trash2 className="h-3 w-3" /></button>
              </>}
            </div>
          </div>
        ))}
      </div>

      {/* View Modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <p className="text-xs font-mono text-slate-400">{viewing.drawingNo}</p>
                <h3 className="font-bold text-white">{viewing.springName}</h3>
              </div>
              <button onClick={() => setViewing(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {viewing.rdsoSpec && <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3"><p className="text-xs font-bold text-blue-300">RDSO Specification: {viewing.rdsoSpec}</p></div>}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ["Spring Type", viewing.springType], ["Customer Type", viewing.customerType],
                  ["Wire Diameter", `${viewing.wireDiaMm} mm`], ["Outer Diameter", `${viewing.outerDiaMm} mm`],
                  ["Free Height", `${viewing.freeHeightMm} mm`], ["Solid Height", `${viewing.solidHeightMm} mm`],
                  ["Total Coils", viewing.totalCoils], ["Active Coils", viewing.activeCoils],
                  ["Material Grade", viewing.grade], ["Spring Rate", `${viewing.springRateNMm} N/mm`],
                  ["Fitted Load", `${viewing.fittedLoadKg} kg`], ["Fitted Height", `${viewing.fittedHeightMm} mm`],
                  ["End Type", viewing.endType], ["Weight Each", `${viewing.weightKgEach} kg`],
                  ["RM/Spring", `${viewing.rmConsumptionKg} kg`], ["Heat Treatment", viewing.heatTreatment],
                ].map(([k, v]) => (
                  <div key={String(k)} className="bg-slate-800/40 rounded-lg p-2.5">
                    <p className="text-slate-500 text-[10px]">{k}</p>
                    <p className="text-white font-bold mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900">
              <h3 className="font-bold text-white text-sm">{editing ? "Edit" : "Add"} BOM / Spring Specification</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {label:"Drawing No *", key:"drawingNo", type:"text", placeholder:"RDSO/SK-73006"},
                  {label:"Spring Name *", key:"springName", type:"text", placeholder:"Bogie Bolster Spring"},
                  {label:"RDSO Spec", key:"rdsoSpec", type:"text", placeholder:"RDSO/2019/CG-05"},
                  {label:"Wire Dia (mm)", key:"wireDiaMm", type:"number"},
                  {label:"Outer Dia (mm)", key:"outerDiaMm", type:"number"},
                  {label:"Free Height (mm)", key:"freeHeightMm", type:"number"},
                  {label:"Total Coils", key:"totalCoils", type:"number"},
                  {label:"Active Coils", key:"activeCoils", type:"number"},
                  {label:"Spring Rate (N/mm)", key:"springRateNMm", type:"number"},
                  {label:"Fitted Load (kg)", key:"fittedLoadKg", type:"number"},
                  {label:"Fitted Height (mm)", key:"fittedHeightMm", type:"number"},
                  {label:"Solid Height (mm)", key:"solidHeightMm", type:"number"},
                  {label:"Weight Each (kg)", key:"weightKgEach", type:"number"},
                  {label:"RM/Spring (kg)", key:"rmConsumptionKg", type:"number"},
                ].map(({label, key, type, placeholder}) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">{label}</label>
                    <input type={type} placeholder={placeholder} value={(form as any)[key]}
                      onChange={e => f(key, type==="number" ? Number(e.target.value) : e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {label:"Spring Type", key:"springType", opts:SPRING_TYPES},
                  {label:"Customer Type", key:"customerType", opts:CUST_TYPES},
                  {label:"Material Grade", key:"grade", opts:GRADES},
                ].map(({label, key, opts}) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">{label}</label>
                    <select value={(form as any)[key]} onChange={e => f(key, e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              {[
                {label:"End Type", key:"endType", placeholder:"Closed & Ground"},
                {label:"Heat Treatment", key:"heatTreatment", placeholder:"Q&T + Shot Peening + Phosphating"},
              ].map(({label, key, placeholder}) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">{label}</label>
                  <input type="text" placeholder={placeholder} value={(form as any)[key]}
                    onChange={e => f(key, e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-700 text-slate-400 py-2 text-xs font-bold cursor-pointer hover:text-white">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white py-2 text-xs font-bold cursor-pointer">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
