import React, { useState } from "react";
import { Package, Plus, X, Download, Edit, Trash2, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import type { RawMaterial, RMCategory, RMUnit, RMStatus, User } from "../../types";
import { formatINR } from "../../types";
import { toast } from "../../utils/toast";

interface Props { rawMaterials: RawMaterial[]; setRawMaterials: React.Dispatch<React.SetStateAction<RawMaterial[]>>; currentUser: User; }

const CATEGORIES: RMCategory[] = ["Alloy Steel","Mild Steel","Stainless Steel","Aluminium","Copper","Plastic / Polymer","Rubber","Fabric / Textile","Chemical","Packaging","Other"];
const UNITS: RMUnit[] = ["kg","ton","meter","litre","pcs","set","roll","sheet","box"];

const STATUS_ICON: Record<RMStatus, React.ReactElement> = {
  in_stock:     <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />,
  low_stock:    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
  out_of_stock: <XCircle className="h-3.5 w-3.5 text-red-400" />,
};
const STATUS_BADGE: Record<RMStatus, string> = {
  in_stock:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  low_stock:    "bg-amber-500/10 text-amber-400 border-amber-500/20",
  out_of_stock: "bg-red-500/10 text-red-400 border-red-500/20",
};

const BLANK = (): Omit<RawMaterial,"id"> => ({
  code: "", name: "", category: "Alloy Steel", unit: "kg",
  quantity: 0, unitCost: 0, totalValue: 0,
  supplier: "", receivedDate: new Date().toISOString().split("T")[0],
  batchNo: "", status: "in_stock", minStock: 0, location: "", remarks: "",
});

export default function RawMaterialView({ rawMaterials, setRawMaterials, currentUser }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RawMaterial | null>(null);
  const [form, setForm] = useState(BLANK());
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const canWrite = ["superadmin","manager"].includes(currentUser.role);

  const f = (k: string, v: any) => setForm(p => {
    const updated = { ...p, [k]: v };
    updated.totalValue = updated.quantity * updated.unitCost;
    if (updated.quantity === 0) updated.status = "out_of_stock";
    else if (updated.minStock > 0 && updated.quantity <= updated.minStock) updated.status = "low_stock";
    else updated.status = "in_stock";
    return updated;
  });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) { toast.error("Code and name are required"); return; }
    if (editing) {
      setRawMaterials(prev => prev.map(r => r.id === editing.id ? { ...editing, ...form } : r));
      toast.success("Updated", form.name);
    } else {
      setRawMaterials(prev => [{ id: `rm-${Date.now()}`, ...form }, ...prev]);
      toast.success("Added", form.name);
    }
    setShowModal(false);
  };

  const del = (id: string) => {
    if (confirm("Delete this material?")) { setRawMaterials(prev => prev.filter(r => r.id !== id)); toast.warning("Deleted"); }
  };

  const openEdit = (r: RawMaterial) => {
    setEditing(r);
    setForm({ code:r.code, name:r.name, category:r.category, unit:r.unit, quantity:r.quantity, unitCost:r.unitCost, totalValue:r.totalValue, supplier:r.supplier, receivedDate:r.receivedDate, batchNo:r.batchNo||"", status:r.status, minStock:r.minStock, location:r.location||"", remarks:r.remarks||"" });
    setShowModal(true);
  };
  const openNew = () => { setEditing(null); setForm(BLANK()); setShowModal(true); };

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = rawMaterials.map(r => ({ "Code":r.code, "Name":r.name, "Category":r.category, "Unit":r.unit, "Qty":r.quantity, "Unit Cost (₹)":r.unitCost, "Total Value (₹)":r.totalValue, "Supplier":r.supplier, "Batch No":r.batchNo||"", "Received":r.receivedDate, "Min Stock":r.minStock, "Location":r.location||"", "Status":r.status, "Remarks":r.remarks||"" }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "RawMaterials");
    XLSX.writeFile(wb, "RawMaterial_Inventory.xlsx"); toast.success("Exported");
  };

  const categories = ["All", ...Array.from(new Set(rawMaterials.map(r => r.category)))];
  const filtered = rawMaterials.filter(r => {
    const s = search.toLowerCase();
    const matchSearch = !search || r.name.toLowerCase().includes(s) || r.code.toLowerCase().includes(s) || r.supplier.toLowerCase().includes(s);
    const matchCat = filterCat === "All" || r.category === filterCat;
    return matchSearch && matchCat;
  });

  const totalValue = rawMaterials.reduce((s,r) => s+r.totalValue, 0);

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Package className="h-6 w-6 text-orange-400" /> Raw Material</h1>
          <p className="text-slate-400 text-sm mt-1">Input materials — any type, any unit, any industry</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Download className="h-3.5 w-3.5" /> Export</button>
          {canWrite && <button onClick={openNew} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Plus className="h-3.5 w-3.5" /> Add Material</button>}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Total SKUs",   value: rawMaterials.length + " items",                                        color:"text-blue-400" },
          { label:"Stock Value",  value: formatINR(totalValue),                                                  color:"text-emerald-400" },
          { label:"Low Stock",    value: rawMaterials.filter(r=>r.status==="low_stock").length + " items",       color:"text-amber-400" },
          { label:"Out of Stock", value: rawMaterials.filter(r=>r.status==="out_of_stock").length + " items",   color:"text-red-400" },
        ].map(c => (
          <div key={c.label} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
            <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, code, supplier…"
          className="flex-1 min-w-[200px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500" />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-x-auto">
        <table className="min-w-full text-xs divide-y divide-slate-800">
          <thead className="bg-slate-950 text-slate-400 font-bold text-left">
            <tr>{["Code","Name / Location","Category","Qty","Unit","Unit Cost","Stock Value","Supplier","Status",""].map(h => <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-orange-400 whitespace-nowrap">{r.code}</td>
                <td className="px-4 py-3">
                  <p className="text-white font-bold">{r.name}</p>
                  {r.location && <p className="text-[10px] text-slate-500 mt-0.5">{r.location}</p>}
                  {r.batchNo && <p className="text-[10px] text-slate-600 font-mono">{r.batchNo}</p>}
                </td>
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{r.category}</td>
                <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">
                  <span className={r.status === "out_of_stock" ? "text-red-400" : r.status === "low_stock" ? "text-amber-400" : "text-slate-200"}>
                    {r.quantity.toLocaleString()}
                  </span>
                  {r.minStock > 0 && <p className="text-[10px] text-slate-600">min: {r.minStock}</p>}
                </td>
                <td className="px-4 py-3 text-slate-400">{r.unit}</td>
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap">₹{r.unitCost.toLocaleString()}/{r.unit}</td>
                <td className="px-4 py-3 text-emerald-400 font-bold whitespace-nowrap">{formatINR(r.totalValue)}</td>
                <td className="px-4 py-3 text-slate-300 max-w-[140px]"><p className="truncate">{r.supplier}</p></td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded border text-[10px] font-bold font-mono uppercase ${STATUS_BADGE[r.status]}`}>
                    {STATUS_ICON[r.status]}{r.status.replace("_"," ")}
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
            {filtered.length === 0 && <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-500">No materials found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h3 className="font-bold text-white text-sm">{editing ? "Edit" : "Add"} Raw Material</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {([
                  ["Material Code *","code","text","RM-001"],
                  ["Material Name *","name","text","60Si2Mn Wire Rod 38mm"],
                  ["Supplier *","supplier","text","SAIL / Tata Steel"],
                  ["Batch / Heat No","batchNo","text","HT-2026-001"],
                  ["Quantity *","quantity","number",""],
                  ["Unit Cost (₹) *","unitCost","number",""],
                  ["Min Stock (reorder)","minStock","number",""],
                  ["Location","location","text","RM Store A"],
                  ["Received Date","receivedDate","date",""],
                ] as [string,string,string,string][]).map(([label,key,type,ph]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">{label}</label>
                    <input type={type} placeholder={ph} value={(form as any)[key]}
                      onChange={e => f(key, type === "number" ? Number(e.target.value) : e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Category</label>
                  <select value={form.category} onChange={e => f("category", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Unit of Measure</label>
                  <select value={form.unit} onChange={e => f("unit", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              {form.quantity > 0 && form.unitCost > 0 && (
                <div className="bg-slate-800/50 rounded-lg px-4 py-2 flex justify-between text-xs">
                  <span className="text-slate-400">Total Stock Value</span>
                  <span className="font-black text-orange-400">{formatINR(form.totalValue)}</span>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Remarks</label>
                <input value={form.remarks||""} onChange={e => f("remarks", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
              </div>
              <div className="flex gap-2 pt-1">
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
