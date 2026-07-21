import React, { useState } from "react";
import { BookOpen, Plus, X, Download, Edit, Trash2, Eye, Package } from "lucide-react";
import type { BOMItem, BOMRawMaterial, CustomerType, RawMaterial, User } from "../../types";
import { formatINR } from "../../types";
import { toast } from "../../utils/toast";

interface Props { boms: BOMItem[]; setBoms: React.Dispatch<React.SetStateAction<BOMItem[]>>; rawMaterials: RawMaterial[]; currentUser: User; }

const CUSTOMER_TYPES: CustomerType[] = ["Railway","Automotive","Industrial","Construction","Consumer","Export","Other"];

const BLANK_RM = (): BOMRawMaterial => ({ materialId: "", materialName: "", qtyPerUnit: 0, unit: "kg" });

const BLANK = (): Omit<BOMItem,"id"> => ({
  productCode: "", productName: "", category: "", unit: "pcs",
  customerType: "Industrial", specifications: "", rawMaterials: [BLANK_RM()],
  labourHrsPerUnit: 0, machineHrsPerUnit: 0, costPerUnit: 0,
  revision: "Rev A", status: "active", remarks: "",
});

const STATUS_BADGE: Record<BOMItem["status"], string> = {
  active:   "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  draft:    "bg-amber-500/20 text-amber-400 border-amber-500/30",
  obsolete: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const CTYPE_COLOR: Record<CustomerType, string> = {
  Railway:       "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Automotive:    "bg-violet-500/20 text-violet-400 border-violet-500/30",
  Industrial:    "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Construction:  "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Consumer:      "bg-pink-500/20 text-pink-400 border-pink-500/30",
  Export:        "bg-teal-500/20 text-teal-400 border-teal-500/30",
  Other:         "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export default function BOMView({ boms, setBoms, rawMaterials, currentUser }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [viewing, setViewing] = useState<BOMItem | null>(null);
  const [editing, setEditing] = useState<BOMItem | null>(null);
  const [form, setForm] = useState(BLANK());
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const canWrite = ["superadmin","manager"].includes(currentUser.role);

  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const updateRM = (idx: number, key: keyof BOMRawMaterial, val: any) => {
    const rms = [...form.rawMaterials];
    if (key === "materialId") {
      const mat = rawMaterials.find(r => r.id === val);
      rms[idx] = { ...rms[idx], materialId: val, materialName: mat?.name || "", unit: mat?.unit || "kg" };
    } else {
      (rms[idx] as any)[key] = val;
    }
    setForm(p => ({ ...p, rawMaterials: rms }));
  };

  const addRM = () => setForm(p => ({ ...p, rawMaterials: [...p.rawMaterials, BLANK_RM()] }));
  const removeRM = (idx: number) => setForm(p => ({ ...p, rawMaterials: p.rawMaterials.filter((_,i) => i !== idx) }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productCode || !form.productName) { toast.error("Product code and name required"); return; }
    if (editing) {
      setBoms(prev => prev.map(b => b.id === editing.id ? { ...editing, ...form } : b));
      toast.success("Updated", form.productName);
    } else {
      setBoms(prev => [{ id: `bom-${Date.now()}`, ...form }, ...prev]);
      toast.success("Added", form.productName);
    }
    setShowModal(false);
  };

  const del = (id: string) => {
    if (confirm("Delete this BOM?")) { setBoms(prev => prev.filter(b => b.id !== id)); toast.warning("Deleted"); }
  };

  const openEdit = (b: BOMItem) => {
    setEditing(b);
    setForm({ productCode:b.productCode, productName:b.productName, category:b.category, unit:b.unit, customerType:b.customerType, specifications:b.specifications, rawMaterials:b.rawMaterials.length ? b.rawMaterials : [BLANK_RM()], labourHrsPerUnit:b.labourHrsPerUnit, machineHrsPerUnit:b.machineHrsPerUnit, costPerUnit:b.costPerUnit, revision:b.revision, status:b.status, remarks:b.remarks||"" });
    setShowModal(true);
  };
  const openNew = () => { setEditing(null); setForm(BLANK()); setShowModal(true); };

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = boms.map(b => ({ "Product Code":b.productCode, "Product Name":b.productName, "Category":b.category, "Unit":b.unit, "Customer Type":b.customerType, "Specifications":b.specifications, "Raw Materials":b.rawMaterials.map(r=>`${r.materialName} x${r.qtyPerUnit}${r.unit}`).join("; "), "Labour Hrs":b.labourHrsPerUnit, "Machine Hrs":b.machineHrsPerUnit, "Cost/Unit":b.costPerUnit, "Revision":b.revision, "Status":b.status }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "BOM");
    XLSX.writeFile(wb, "BOM_Register.xlsx"); toast.success("Exported");
  };

  const categories = ["All", ...Array.from(new Set(boms.map(b => b.category).filter(Boolean)))];
  const filtered = boms.filter(b => {
    const s = search.toLowerCase();
    const matchSearch = !search || b.productName.toLowerCase().includes(s) || b.productCode.toLowerCase().includes(s) || b.category.toLowerCase().includes(s);
    const matchCat = filterCat === "All" || b.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><BookOpen className="h-6 w-6 text-orange-400" /> BOM / Product Specs</h1>
          <p className="text-slate-400 text-sm mt-1">Bill of Materials — specifications, raw material consumption, cost</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Download className="h-3.5 w-3.5" /> Export</button>
          {canWrite && <button onClick={openNew} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Plus className="h-3.5 w-3.5" /> Add Product</button>}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Total Products",    value: boms.length,                                        color:"text-blue-400" },
          { label:"Active",            value: boms.filter(b=>b.status==="active").length,          color:"text-emerald-400" },
          { label:"Categories",        value: new Set(boms.map(b=>b.category)).size,               color:"text-orange-400" },
          { label:"Avg Cost / Unit",   value: boms.length ? formatINR(boms.reduce((s,b)=>s+b.costPerUnit,0)/boms.length) : "—", color:"text-violet-400" },
        ].map(c => (
          <div key={c.label} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
            <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product name, code, category…"
          className="flex-1 min-w-[200px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500" />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* BOM Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(b => (
          <div key={b.id} className={`bg-slate-950/40 border rounded-xl p-5 hover:border-slate-600 transition-all ${b.status==="obsolete" ? "opacity-60 border-slate-800" : "border-slate-800"}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-[10px] font-bold text-orange-400">{b.productCode}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono uppercase ${STATUS_BADGE[b.status]}`}>{b.status}</span>
                  <span className="text-[9px] text-slate-500 font-mono">{b.revision}</span>
                </div>
                <p className="text-sm font-bold text-white leading-snug">{b.productName}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {b.category && <span className="text-[9px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{b.category}</span>}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${CTYPE_COLOR[b.customerType]}`}>{b.customerType}</span>
                </div>
              </div>
            </div>

            {/* Specifications */}
            {b.specifications && (
              <p className="text-[10px] text-slate-400 leading-relaxed mb-3 line-clamp-3">{b.specifications}</p>
            )}

            {/* RM list */}
            {b.rawMaterials.length > 0 && (
              <div className="mb-3 space-y-1">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Package className="h-3 w-3" /> Raw Materials</p>
                {b.rawMaterials.map((rm, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] bg-slate-900/50 rounded px-2 py-1">
                    <span className="text-slate-300 truncate">{rm.materialName || "—"}</span>
                    <span className="text-orange-400 font-bold ml-2 shrink-0">{rm.qtyPerUnit} {rm.unit}/unit</span>
                  </div>
                ))}
              </div>
            )}

            {/* Cost & hours */}
            <div className="grid grid-cols-3 gap-2 text-[10px] border-t border-slate-800 pt-3">
              <div><p className="text-slate-500">Cost/unit</p><p className="font-bold text-white">{formatINR(b.costPerUnit)}</p></div>
              <div><p className="text-slate-500">Labour hrs</p><p className="font-bold text-slate-200">{b.labourHrsPerUnit}h</p></div>
              <div><p className="text-slate-500">Machine hrs</p><p className="font-bold text-slate-200">{b.machineHrsPerUnit}h</p></div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800">
              <button onClick={() => setViewing(b)} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer px-2 py-1 rounded hover:bg-slate-800 transition-all"><Eye className="h-3.5 w-3.5" /> View</button>
              {canWrite && <>
                <button onClick={() => openEdit(b)} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-400 cursor-pointer px-2 py-1 rounded hover:bg-slate-800 transition-all"><Edit className="h-3.5 w-3.5" /> Edit</button>
                <button onClick={() => del(b.id)} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-red-400 cursor-pointer px-2 py-1 rounded hover:bg-slate-800 transition-all ml-auto"><Trash2 className="h-3.5 w-3.5" /></button>
              </>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-3 text-center py-16 bg-slate-950/40 rounded-xl border border-slate-800 text-slate-500 text-xs">No products found</div>}
      </div>

      {/* View Detail Modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900">
              <div>
                <p className="font-mono text-xs text-orange-400">{viewing.productCode} · {viewing.revision}</p>
                <h3 className="font-bold text-white text-sm mt-0.5">{viewing.productName}</h3>
              </div>
              <button onClick={() => setViewing(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2 flex-wrap">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border font-mono uppercase ${STATUS_BADGE[viewing.status]}`}>{viewing.status}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${CTYPE_COLOR[viewing.customerType]}`}>{viewing.customerType}</span>
                {viewing.category && <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold">{viewing.category}</span>}
                <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold">Unit: {viewing.unit}</span>
              </div>

              {viewing.specifications && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Specifications</p>
                  <p className="text-xs text-slate-300 bg-slate-800/50 rounded-lg p-3 leading-relaxed">{viewing.specifications}</p>
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Raw Material Consumption</p>
                {viewing.rawMaterials.length > 0 ? (
                  <div className="space-y-2">
                    {viewing.rawMaterials.map((rm,i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-lg text-xs">
                        <span className="text-slate-200">{rm.materialName || "—"}</span>
                        <span className="font-bold text-orange-400">{rm.qtyPerUnit} {rm.unit} / unit</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-500">No raw materials defined</p>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[["Cost / Unit", formatINR(viewing.costPerUnit)],["Labour", viewing.labourHrsPerUnit + " hrs/unit"],["Machine", viewing.machineHrsPerUnit + " hrs/unit"]].map(([l,v]) => (
                  <div key={l} className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <p className="text-xs font-bold text-white">{v}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{l}</p>
                  </div>
                ))}
              </div>

              {viewing.remarks && <p className="text-[10px] text-slate-400 italic">{viewing.remarks}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h3 className="font-bold text-white text-sm">{editing ? "Edit" : "Add"} Product / BOM</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {([
                  ["Product Code *","productCode","text","SMC-001 / RDSO/SK-73006"],
                  ["Product Name *","productName","text","Bogie Spring / T-Shirt Size M"],
                  ["Category","category","text","Railway Springs / Garments"],
                  ["Unit of Output","unit","text","pcs / kg / meter / set"],
                  ["Revision","revision","text","Rev A"],
                  ["Cost per Unit (₹)","costPerUnit","number",""],
                  ["Labour Hrs / Unit","labourHrsPerUnit","number",""],
                  ["Machine Hrs / Unit","machineHrsPerUnit","number",""],
                ] as [string,string,string,string][]).map(([label,key,type,ph]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">{label}</label>
                    <input type={type} placeholder={ph} value={(form as any)[key]}
                      onChange={e => f(key, type === "number" ? Number(e.target.value) : e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Customer Type</label>
                  <select value={form.customerType} onChange={e => f("customerType", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                    {CUSTOMER_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Status</label>
                  <select value={form.status} onChange={e => f("status", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                    <option value="active">Active</option><option value="draft">Draft</option><option value="obsolete">Obsolete</option>
                  </select>
                </div>
              </div>

              {/* Specifications — free text */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Specifications (free text — dimensions, grade, standards, etc.)</label>
                <textarea value={form.specifications} onChange={e => f("specifications", e.target.value)} rows={3} placeholder="Wire Dia: 38mm | OD: 220mm | Grade: 60Si2Mn | Spec: RDSO/2019/CG-05&#10;— or —&#10;Fabric: 100% Cotton 120 GSM | Colour: Navy Blue | Size: M" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 resize-none" />
              </div>

              {/* Raw Materials */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Raw Materials Consumed</label>
                  <button type="button" onClick={addRM} className="text-[10px] font-bold text-orange-400 hover:text-orange-300 cursor-pointer flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
                </div>
                {form.rawMaterials.map((rm, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5 space-y-1">
                      <label className="text-[10px] text-slate-500">Material</label>
                      <select value={rm.materialId} onChange={e => updateRM(idx, "materialId", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-orange-500">
                        <option value="">Select…</option>
                        {rawMaterials.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3 space-y-1">
                      <label className="text-[10px] text-slate-500">Qty / unit</label>
                      <input type="number" value={rm.qtyPerUnit} onChange={e => updateRM(idx, "qtyPerUnit", Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-orange-500" />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <label className="text-[10px] text-slate-500">Unit</label>
                      <input value={rm.unit} onChange={e => updateRM(idx, "unit", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-orange-500" />
                    </div>
                    <div className="col-span-1 flex justify-end pb-0.5">
                      {form.rawMaterials.length > 1 && <button type="button" onClick={() => removeRM(idx)} className="text-slate-600 hover:text-red-400 cursor-pointer"><X className="h-3.5 w-3.5" /></button>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Remarks</label>
                <input value={form.remarks||""} onChange={e => f("remarks", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-700 text-slate-400 py-2 text-xs font-bold cursor-pointer hover:text-white">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white py-2 text-xs font-bold cursor-pointer">Save BOM</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
