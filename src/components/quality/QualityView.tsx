import React, { useState } from "react";
import { ShieldCheck, Plus, X, Download } from "lucide-react";
import type { QCRecord, QCResult, ProductionOrder, BOMItem, FinishedGood, User } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  qcRecords: QCRecord[]; setQcRecords: React.Dispatch<React.SetStateAction<QCRecord[]>>;
  productionOrders: ProductionOrder[]; setFinishedGoods: React.Dispatch<React.SetStateAction<FinishedGood[]>>;
  boms: BOMItem[]; currentUser: User;
}

const AGENCIES = ["Internal","RITES","RDSO","Third Party"];
const QC_RESULTS: QCResult[] = ["Pass","Fail","Conditional Pass"];

export default function QualityView({ qcRecords, setQcRecords, productionOrders, setFinishedGoods, boms, currentUser }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const canWrite = ["superadmin","manager","operator"].includes(currentUser.role);

  const completedOrders = productionOrders.filter(o => o.status === "completed");
  const pendingInspection = completedOrders.filter(o => !qcRecords.find(q => q.productionOrderId === o.id));

  const BLANK_QC = (order: ProductionOrder) => {
    const bom = boms.find(b => b.id === order.bomId);
    return {
      productionOrderId: order.id, batchNo: order.batchNo,
      drawingNo: order.drawingNo, springName: order.springName,
      inspectedQty: order.producedQty, passedQty: 0, rejectedQty: 0,
      wireDiaActual: bom?.wireDiaMm || 0, outerDiaActual: bom?.outerDiaMm || 0,
      freeHeightActual: bom?.freeHeightMm || 0, totalCoilsActual: bom?.totalCoils || 0,
      loadTestKg: 0, loadTestHeight: 0, loadResult: "Pass" as QCResult,
      hardnessHRC: undefined, hardnessResult: "Pass" as QCResult,
      overallResult: "Pass" as QCResult,
      inspectionDate: new Date().toISOString().split("T")[0],
      inspectorName: currentUser.name, inspectionAgency: "Internal",
    };
  };

  const [form, setForm] = useState<any>({});
  const f = (k: string, v: any) => setForm((p: any) => ({...p, [k]: v}));

  const openInspect = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setForm(BLANK_QC(order));
    setShowModal(true);
  };

  const computeOverall = (loadRes: QCResult, hardRes: QCResult): QCResult => {
    if (loadRes === "Fail" || hardRes === "Fail") return "Fail";
    if (loadRes === "Conditional Pass" || hardRes === "Conditional Pass") return "Conditional Pass";
    return "Pass";
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const overall = computeOverall(form.loadResult, form.hardnessResult);
    const record: QCRecord = { id: `qc-${Date.now()}`, ...form, overallResult: overall, rejectedQty: form.inspectedQty - form.passedQty };

    setQcRecords(prev => [record, ...prev]);

    if (overall !== "Fail") {
      const bom = boms.find(b => b.id === selectedOrder!.bomId);
      setFinishedGoods(prev => [{
        id: `fg-${Date.now()}`, bomId: selectedOrder!.bomId,
        drawingNo: record.drawingNo, springName: record.springName,
        batchNo: record.batchNo, qcRecordId: record.id,
        quantityNos: record.passedQty,
        weightKgTotal: parseFloat(((bom?.weightKgEach || 0) * record.passedQty).toFixed(1)),
        location: "Pending Allocation", receivedDate: record.inspectionDate,
      }, ...prev]);
      toast.success("QC Passed", `${record.passedQty} springs moved to Finished Goods`);
    } else {
      toast.error("QC Failed", `Batch ${record.batchNo} rejected`);
    }
    setShowModal(false);
  };

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = qcRecords.map(q => ({
      "Batch No": q.batchNo, "Drawing No": q.drawingNo, "Spring": q.springName,
      "Inspected": q.inspectedQty, "Passed": q.passedQty, "Rejected": q.rejectedQty,
      "Wire Dia Actual": q.wireDiaActual, "OD Actual": q.outerDiaActual,
      "Free Ht Actual": q.freeHeightActual, "Load Test (kg)": q.loadTestKg,
      "Load Result": q.loadResult, "Hardness (HRC)": q.hardnessHRC || "",
      "Overall": q.overallResult, "Inspector": q.inspectorName,
      "Agency": q.inspectionAgency || "", "Cert No": q.certificateNo || "",
      "Date": q.inspectionDate,
    }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "QC");
    XLSX.writeFile(wb, "QC_Records_Export.xlsx"); toast.success("Exported");
  };

  const RESULT_BADGE: Record<QCResult, string> = {
    "Pass": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "Fail": "bg-red-500/20 text-red-400 border-red-500/30",
    "Conditional Pass": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-orange-400" /> Quality Control</h1>
          <p className="text-slate-400 text-sm mt-1">Dimensional check · Load test · Hardness · RDSO inspection log</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Download className="h-3.5 w-3.5" /> Export</button>
      </div>

      {/* Pending Inspection */}
      {pendingInspection.length > 0 && canWrite && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-400 mb-3">{pendingInspection.length} batch(es) awaiting QC inspection</p>
          <div className="space-y-2">
            {pendingInspection.map(o => (
              <div key={o.id} className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                <div>
                  <p className="text-xs font-bold text-white">{o.orderNo} · Batch: {o.batchNo}</p>
                  <p className="text-[10px] text-slate-400">{o.springName} · {o.producedQty} nos produced</p>
                </div>
                <button onClick={() => openInspect(o)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer">
                  <Plus className="h-3 w-3" /> Inspect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QC Records */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Inspection Records ({qcRecords.length})</h3>
        {qcRecords.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">No QC records yet</div>
        ) : qcRecords.map(q => (
          <div key={q.id} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-black text-white">{q.batchNo}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono uppercase ${RESULT_BADGE[q.overallResult]}`}>{q.overallResult}</span>
                </div>
                <p className="text-sm font-bold text-slate-200">{q.springName}</p>
                <p className="text-[10px] text-slate-500 font-mono">{q.drawingNo}</p>
              </div>
              <div className="text-right text-[10px] space-y-0.5">
                <p className="text-slate-400">{q.inspectionDate}</p>
                <p className="text-slate-300 font-bold">{q.inspectorName}</p>
                {q.inspectionAgency && <p className="text-blue-400 font-bold">{q.inspectionAgency}</p>}
                {q.certificateNo && <p className="text-slate-500 font-mono">{q.certificateNo}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
              <div className="bg-slate-900/40 rounded-lg p-2 text-center text-[10px]">
                <p className="text-slate-500">Inspected</p><p className="text-white font-bold">{q.inspectedQty}</p>
              </div>
              <div className="bg-slate-900/40 rounded-lg p-2 text-center text-[10px]">
                <p className="text-slate-500">Passed</p><p className="text-emerald-400 font-bold">{q.passedQty}</p>
              </div>
              <div className="bg-slate-900/40 rounded-lg p-2 text-center text-[10px]">
                <p className="text-slate-500">Rejected</p><p className="text-red-400 font-bold">{q.rejectedQty}</p>
              </div>
              <div className="bg-slate-900/40 rounded-lg p-2 text-center text-[10px]">
                <p className="text-slate-500">Load Test</p>
                <p className={`font-bold ${q.loadResult === "Pass" ? "text-emerald-400" : "text-red-400"}`}>{q.loadTestKg}kg — {q.loadResult}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-2 text-[10px] text-slate-400">
              <span>Wire Ø: <span className="text-white font-mono">{q.wireDiaActual}mm</span></span>
              <span>OD: <span className="text-white font-mono">{q.outerDiaActual}mm</span></span>
              <span>Free Ht: <span className="text-white font-mono">{q.freeHeightActual}mm</span></span>
              {q.hardnessHRC && <span>Hardness: <span className="text-white font-mono">{q.hardnessHRC} HRC</span></span>}
            </div>
          </div>
        ))}
      </div>

      {/* Inspection Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900">
              <div>
                <h3 className="font-bold text-white text-sm">QC Inspection — {selectedOrder.batchNo}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{selectedOrder.springName}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div className="bg-slate-800/40 rounded-lg p-3 text-xs">
                <p className="text-slate-400">Order: <span className="text-white font-bold">{selectedOrder.orderNo}</span> · Produced: <span className="text-white font-bold">{selectedOrder.producedQty} nos</span></p>
              </div>

              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Inspection Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Inspected Qty</label>
                  <input type="number" value={form.inspectedQty || 0} onChange={e => f("inspectedQty", Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Passed Qty</label>
                  <input type="number" value={form.passedQty || 0} onChange={e => f("passedQty", Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
              </div>

              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Dimensional Checks (Actual)</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {label:"Wire Dia (mm)",key:"wireDiaActual"},{label:"Outer Dia (mm)",key:"outerDiaActual"},
                  {label:"Free Height (mm)",key:"freeHeightActual"},{label:"Total Coils",key:"totalCoilsActual"},
                ].map(({label,key}) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">{label}</label>
                    <input type="number" step="0.1" value={form[key] || 0} onChange={e => f(key, Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                  </div>
                ))}
              </div>

              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Load Test</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Load (kg)</label>
                  <input type="number" value={form.loadTestKg || 0} onChange={e => f("loadTestKg", Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">At Height (mm)</label>
                  <input type="number" value={form.loadTestHeight || 0} onChange={e => f("loadTestHeight", Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Result</label>
                  <select value={form.loadResult} onChange={e => f("loadResult", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                    {QC_RESULTS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Hardness (HRC)</label>
                  <input type="number" value={form.hardnessHRC || ""} onChange={e => f("hardnessHRC", Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Hardness Result</label>
                  <select value={form.hardnessResult} onChange={e => f("hardnessResult", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                    {QC_RESULTS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Inspector Name</label>
                  <input value={form.inspectorName || ""} onChange={e => f("inspectorName", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Inspection Agency</label>
                  <select value={form.inspectionAgency} onChange={e => f("inspectionAgency", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                    {AGENCIES.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Certificate No (RITES/RDSO)</label>
                <input value={form.certificateNo || ""} onChange={e => f("certificateNo", e.target.value)} placeholder="RITES/2026/INS/XXXX" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-700 text-slate-400 py-2 text-xs font-bold cursor-pointer hover:text-white">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white py-2 text-xs font-bold cursor-pointer">Submit Inspection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
