import React, { useState } from "react";
import { Factory, Plus, X, Download, Edit, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import type { ProductionOrder, ProductionStatus, BOMItem, User } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  productionOrders: ProductionOrder[]; setProductionOrders: React.Dispatch<React.SetStateAction<ProductionOrder[]>>;
  boms: BOMItem[]; currentUser: User;
}

const STATUS_COLORS: Record<ProductionStatus, string> = {
  planned: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  on_hold: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const MACHINES = ["Machine #1","Machine #2","Machine #3","Machine #4","Manual Station #1"];

export default function ProductionView({ productionOrders, setProductionOrders, boms, currentUser }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ProductionOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<ProductionStatus | "all">("all");
  const canWrite = ["superadmin","manager","operator"].includes(currentUser.role);
  const canAdmin = ["superadmin","manager"].includes(currentUser.role);

  const BLANK = (): Omit<ProductionOrder,"id"> => ({
    orderNo: `PRD-2026-${String(productionOrders.length + 1).padStart(3,"0")}`,
    bomId: boms[0]?.id || "",
    productCode: boms[0]?.productCode || "",
    productName: boms[0]?.productName || "",
    plannedQty: 0, producedQty: 0, rejectedQty: 0,
    batchNo: `B2026-${String(productionOrders.length + 1).padStart(3,"0")}`,
    machine: MACHINES[0], operatorId: currentUser.id, operatorName: currentUser.name,
    startDate: new Date().toISOString().split("T")[0],
    targetDate: "", status: "planned",
  });

  const [form, setForm] = useState(BLANK());
  const f = (k: string, v: any) => setForm(p => ({...p, [k]: v}));

  const handleBOMChange = (bomId: string) => {
    const bom = boms.find(b => b.id === bomId);
    setForm(p => ({ ...p, bomId, productCode: bom?.productCode || "", productName: bom?.productName || "" }));
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bomId || form.plannedQty <= 0) { toast.error("Select product BOM and enter planned qty"); return; }
    if (editing) {
      setProductionOrders(prev => prev.map(p => p.id === editing.id ? { ...editing, ...form } : p));
      toast.success("Updated", form.orderNo);
    } else {
      setProductionOrders(prev => [{ id: `prod-${Date.now()}`, ...form }, ...prev]);
      toast.success("Production Order Created", form.orderNo);
    }
    setShowModal(false);
  };

  const updateStatus = (id: string, status: ProductionStatus) => {
    setProductionOrders(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, status, ...(status === "completed" ? { completedDate: new Date().toISOString().split("T")[0] } : {}) };
    }));
    toast.success("Status Updated");
  };

  const openEdit = (o: ProductionOrder) => { setEditing(o); setForm({ ...o }); setShowModal(true); };
  const openNew = () => { setEditing(null); setForm(BLANK()); setShowModal(true); };

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = productionOrders.map(o => ({
      "Order No": o.orderNo, "Product Code": o.productCode, "Product Name": o.productName,
      "Batch No": o.batchNo, "Planned Qty": o.plannedQty, "Produced Qty": o.producedQty,
      "Rejected Qty": o.rejectedQty, "Machine": o.machine,
      "Operator": o.operatorName, "Start Date": o.startDate, "Target Date": o.targetDate,
      "Status": o.status,
    }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Production");
    XLSX.writeFile(wb, "Production_Export.xlsx"); toast.success("Exported");
  };

  const filtered = filterStatus === "all" ? productionOrders : productionOrders.filter(o => o.status === filterStatus);

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Factory className="h-6 w-6 text-orange-400" /> Production Orders</h1>
          <p className="text-slate-400 text-sm mt-1">Job cards — batch tracking, machine & operator log</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Download className="h-3.5 w-3.5" /> Export</button>
          {canWrite && <button onClick={openNew} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Plus className="h-3.5 w-3.5" /> New Order</button>}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all","planned","in_progress","completed","on_hold","cancelled"] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border transition-all ${filterStatus === s ? "bg-orange-600/20 border-orange-500/30 text-orange-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"}`}>
            {s === "all" ? `All (${productionOrders.length})` : `${s.replace("_"," ")} (${productionOrders.filter(o=>o.status===s).length})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(o => {
          const progress = o.plannedQty > 0 ? Math.round((o.producedQty / o.plannedQty) * 100) : 0;
          return (
            <div key={o.id} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs font-black text-white">{o.orderNo}</span>
                    <span className="text-slate-600">·</span>
                    <span className="font-mono text-xs text-slate-400">Batch: {o.batchNo}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono uppercase ${STATUS_COLORS[o.status]}`}>{o.status.replace("_"," ")}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-200">{o.productName}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{o.productCode}</p>
                  <div className="flex gap-4 mt-2 text-[10px] text-slate-400 flex-wrap">
                    <span>Machine: <span className="text-slate-200 font-semibold">{o.machine}</span></span>
                    <span>Operator: <span className="text-slate-200 font-semibold">{o.operatorName}</span></span>
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-xs text-slate-400">Target: <span className="font-bold text-white">{o.targetDate}</span></p>
                  <p className="text-xs">
                    <span className="text-emerald-400 font-bold">{o.producedQty}</span>
                    <span className="text-slate-500"> / {o.plannedQty}</span>
                    {o.rejectedQty > 0 && <span className="text-red-400 ml-1">(-{o.rejectedQty} rej)</span>}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Progress</span><span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${progress === 100 ? "bg-emerald-500" : "bg-orange-500"}`} style={{ width: `${progress}%` }} />
                </div>
              </div>

              {canAdmin && (
                <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-800">
                  {o.status === "planned" && <button onClick={() => updateStatus(o.id, "in_progress")} className="flex items-center gap-1 px-2.5 py-1 rounded bg-orange-600/20 border border-orange-500/20 text-orange-300 text-[10px] font-bold cursor-pointer hover:bg-orange-600/30"><Clock className="h-3 w-3" /> Start</button>}
                  {o.status === "in_progress" && <button onClick={() => updateStatus(o.id, "completed")} className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/20 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold cursor-pointer hover:bg-emerald-600/30"><CheckCircle className="h-3 w-3" /> Complete</button>}
                  {["planned","in_progress"].includes(o.status) && <button onClick={() => updateStatus(o.id, "on_hold")} className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600/20 border border-amber-500/20 text-amber-300 text-[10px] font-bold cursor-pointer hover:bg-amber-600/30"><AlertTriangle className="h-3 w-3" /> Hold</button>}
                  <button onClick={() => openEdit(o)} className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer hover:bg-slate-700"><Edit className="h-3 w-3" /> Edit</button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-16 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">No production orders</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900">
              <h3 className="font-bold text-white text-sm">{editing ? "Edit" : "New"} Production Order</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Order No</label>
                  <input value={form.orderNo} onChange={e => f("orderNo", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Batch No</label>
                  <input value={form.batchNo} onChange={e => f("batchNo", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Product (BOM) *</label>
                <select value={form.bomId} onChange={e => handleBOMChange(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                  <option value="">— Select Product —</option>
                  {boms.filter(b => b.status === "active").map(b => <option key={b.id} value={b.id}>{b.productCode} — {b.productName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[{label:"Planned Qty",key:"plannedQty"},{label:"Produced Qty",key:"producedQty"},{label:"Rejected Qty",key:"rejectedQty"}].map(({label,key}) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">{label}</label>
                    <input type="number" value={(form as any)[key]} onChange={e => f(key, Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Machine</label>
                <select value={form.machine} onChange={e => f("machine", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                  {MACHINES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{label:"Start Date",key:"startDate"},{label:"Target Date",key:"targetDate"}].map(({label,key}) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">{label}</label>
                    <input type="date" value={(form as any)[key]} onChange={e => f(key, e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                  </div>
                ))}
              </div>
              {canAdmin && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Status</label>
                  <select value={form.status} onChange={e => f("status", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                    {(["planned","in_progress","completed","on_hold","cancelled"] as ProductionStatus[]).map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Remarks</label>
                <input value={form.remarks||""} onChange={e => f("remarks", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
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
