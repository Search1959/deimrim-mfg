import React, { useState } from "react";
import { Package, Plus, X, Download, Edit, Trash2, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import type { RawMaterial, RMGrade, User } from "../../types";
import { toast } from "../../utils/toast";

interface Props { rawMaterials: RawMaterial[]; setRawMaterials: React.Dispatch<React.SetStateAction<RawMaterial[]>>; currentUser: User; }

const GRADES: RMGrade[] = ["EN45A","60Si2Mn","SUP9","Chrome Vanadium","65Si7","Other"];
const BLANK = (): Omit<RawMaterial,"id"> => ({ heatNo:"", grade:"60Si2Mn", wireDiaMm:0, coilWeightKg:0, quantityCoils:0, totalWeightKg:0, supplier:"", receivedDate: new Date().toISOString().split("T")[0], millTestCert:false, status:"in_stock" });

export default function RawMaterialView({ rawMaterials, setRawMaterials, currentUser }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RawMaterial | null>(null);
  const [form, setForm] = useState(BLANK());
  const canWrite = ["superadmin","manager"].includes(currentUser.role);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.heatNo) { toast.error("Heat No is required"); return; }
    const total = form.coilWeightKg * form.quantityCoils;
    const status = form.quantityCoils === 0 ? "out_of_stock" : form.quantityCoils <= 1 ? "low_stock" : "in_stock";
    if (editing) {
      setRawMaterials(prev => prev.map(r => r.id === editing.id ? { ...editing, ...form, totalWeightKg: total, status } : r));
      toast.success("Updated", form.heatNo);
    } else {
      setRawMaterials(prev => [{ id: `rm-${Date.now()}`, ...form, totalWeightKg: total, status }, ...prev]);
      toast.success("Added", `Heat No: ${form.heatNo}`);
    }
    setShowModal(false);
  };

  const del = (id: string) => { if (confirm("Delete this RM entry?")) { setRawMaterials(prev => prev.filter(r => r.id !== id)); toast.warning("Deleted"); } };

  const openEdit = (r: RawMaterial) => { setEditing(r); setForm({ heatNo: r.heatNo, grade: r.grade, wireDiaMm: r.wireDiaMm, coilWeightKg: r.coilWeightKg, quantityCoils: r.quantityCoils, totalWeightKg: r.totalWeightKg, supplier: r.supplier, receivedDate: r.receivedDate, millTestCert: r.millTestCert, status: r.status, remarks: r.remarks }); setShowModal(true); };
  const openNew = () => { setEditing(null); setForm(BLANK()); setShowModal(true); };

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = rawMaterials.map(r => ({ "Heat No": r.heatNo, "Grade": r.grade, "Wire Dia (mm)": r.wireDiaMm, "Coil Wt (kg)": r.coilWeightKg, "Qty Coils": r.quantityCoils, "Total Wt (kg)": r.totalWeightKg, "Supplier": r.supplier, "Received": r.receivedDate, "Mill Cert": r.millTestCert ? "Yes" : "No", "Status": r.status, "Remarks": r.remarks || "" }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "RawMaterials");
    XLSX.writeFile(wb, "RawMaterial_Export.xlsx"); toast.success("Exported");
  };

  const STATUS_ICON = { in_stock: <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />, low_stock: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />, out_of_stock: <XCircle className="h-3.5 w-3.5 text-red-400" /> };
  const STATUS_BADGE = { in_stock: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", low_stock: "bg-amber-500/10 text-amber-400 border-amber-500/20", out_of_stock: "bg-red-500/10 text-red-400 border-red-500/20" };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Package className="h-6 w-6 text-orange-400" /> Raw Material</h1>
          <p className="text-slate-400 text-sm mt-1">Wire rod stock — heat-wise, grade-wise inventory</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          {canWrite && <button onClick={openNew} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg px-3 py-2 text-xs font-bold cursor-pointer">
            <Plus className="h-3.5 w-3.5" /> Add Receipt
          </button>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Stock", value: `${rawMaterials.reduce((s,r)=>s+r.totalWeightKg,0).toLocaleString()} kg`, color: "text-blue-400" },
          { label: "In Stock", value: rawMaterials.filter(r=>r.status==="in_stock").length + " heats", color: "text-emerald-400" },
          { label: "Low Stock", value: rawMaterials.filter(r=>r.status==="low_stock").length + " heats", color: "text-amber-400" },
          { label: "Out of Stock", value: rawMaterials.filter(r=>r.status==="out_of_stock").length + " heats", color: "text-red-400" },
        ].map(c => (
          <div key={c.label} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
            <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
        <table className="min-w-full text-xs divide-y divide-slate-800">
          <thead className="bg-slate-950 text-slate-400 font-bold text-left">
            <tr>
              {["Heat No","Grade","Wire Dia","Total Wt","Supplier","Received","Cert","Status",""].map(h => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {rawMaterials.map(r => (
              <tr key={r.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-white">{r.heatNo}</td>
                <td className="px-4 py-3 text-slate-200">{r.grade}</td>
                <td className="px-4 py-3 text-slate-200 font-mono">{r.wireDiaMm} mm</td>
                <td className="px-4 py-3 text-slate-200 font-mono">{r.totalWeightKg.toLocaleString()} kg <span className="text-slate-500">({r.quantityCoils} coils)</span></td>
                <td className="px-4 py-3 text-slate-300">{r.supplier.split("(")[0].trim()}</td>
                <td className="px-4 py-3 text-slate-400">{r.receivedDate}</td>
                <td className="px-4 py-3">{r.millTestCert ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-400" />}</td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded border text-[10px] font-bold font-mono uppercase ${STATUS_BADGE[r.status]}`}>
                    {STATUS_ICON[r.status]} {r.status.replace("_"," ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {canWrite && <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-1 text-slate-500 hover:text-blue-400 cursor-pointer"><Edit className="h-3.5 w-3.5" /></button>
                    <button onClick={() => del(r.id)} className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">{editing ? "Edit" : "Add"} Raw Material Receipt</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:"Heat No *", key:"heatNo", type:"text", placeholder:"HT-2026-XXX" },
                  { label:"Supplier *", key:"supplier", type:"text", placeholder:"SAIL / Tata Steel" },
                  { label:"Wire Dia (mm) *", key:"wireDiaMm", type:"number", placeholder:"32" },
                  { label:"Coil Weight (kg) *", key:"coilWeightKg", type:"number", placeholder:"1200" },
                  { label:"Qty Coils *", key:"quantityCoils", type:"number", placeholder:"4" },
                  { label:"Received Date", key:"receivedDate", type:"date" },
                ].map(f => (
                  <div key={f.key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Grade</label>
                <select value={form.grade} onChange={e => setForm(p => ({...p, grade: e.target.value as RMGrade}))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                  {GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.millTestCert} onChange={e => setForm(p => ({...p, millTestCert: e.target.checked}))} className="rounded" />
                <span className="text-xs text-slate-300 font-semibold">Mill Test Certificate Received</span>
              </label>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Remarks</label>
                <input type="text" value={form.remarks || ""} onChange={e => setForm(p => ({...p, remarks: e.target.value}))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
              </div>
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
