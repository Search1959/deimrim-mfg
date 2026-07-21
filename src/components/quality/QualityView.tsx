import React, { useState } from "react";
import { ShieldCheck, Plus, X, Download, Trash2 } from "lucide-react";
import type { QCRecord, QCCheckItem, QCResult, ProductionOrder, BOMItem, FinishedGood, User } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  qcRecords: QCRecord[]; setQcRecords: React.Dispatch<React.SetStateAction<QCRecord[]>>;
  productionOrders: ProductionOrder[]; setFinishedGoods: React.Dispatch<React.SetStateAction<FinishedGood[]>>;
  boms: BOMItem[]; currentUser: User;
}

const AGENCIES = ["Internal","RITES","RDSO","Bureau Veritas","SGS","Third Party"];
const QC_RESULTS: QCResult[] = ["Pass","Fail","Conditional Pass"];

const RESULT_BADGE: Record<QCResult, string> = {
  "Pass": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Fail": "bg-red-500/20 text-red-400 border-red-500/30",
  "Conditional Pass": "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const BLANK_CHECK = (): QCCheckItem => ({ parameter: "", specification: "", actual: "", result: "Pass" });

export default function QualityView({ qcRecords, setQcRecords, productionOrders, setFinishedGoods, boms, currentUser }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const canWrite = ["superadmin","manager","operator"].includes(currentUser.role);

  const completedOrders = productionOrders.filter(o => o.status === "completed");
  const pendingInspection = completedOrders.filter(o => !qcRecords.find(q => q.productionOrderId === o.id));

  const [form, setForm] = useState<{
    inspectedQty: number; passedQty: number;
    checks: QCCheckItem[];
    overallResult: QCResult;
    inspectionDate: string; inspectorName: string;
    inspectionAgency: string; certificateNo: string; remarks: string;
  }>({
    inspectedQty: 0, passedQty: 0,
    checks: [BLANK_CHECK()],
    overallResult: "Pass",
    inspectionDate: new Date().toISOString().split("T")[0],
    inspectorName: currentUser.name, inspectionAgency: "Internal",
    certificateNo: "", remarks: "",
  });

  const openInspect = (order: ProductionOrder) => {
    setSelectedOrder(order);
    const bom = boms.find(b => b.id === order.bomId);
    // Pre-fill checks from BOM specs if available
    const defaultChecks: QCCheckItem[] = [{ parameter: "Visual Inspection", specification: "No surface defects", actual: "", result: "Pass" }];
    if (bom?.specifications) {
      // Parse "Key: value | Key: value" pattern for auto-fill
      const parts = bom.specifications.split("|").map(s => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        const parsed = parts.map(p => {
          const [param, spec] = p.split(":").map(s => s.trim());
          return { parameter: param || p, specification: spec || "", actual: "", result: "Pass" as QCResult };
        });
        defaultChecks.push(...parsed);
      }
    }
    setForm({
      inspectedQty: order.producedQty, passedQty: 0,
      checks: defaultChecks,
      overallResult: "Pass",
      inspectionDate: new Date().toISOString().split("T")[0],
      inspectorName: currentUser.name, inspectionAgency: "Internal",
      certificateNo: "", remarks: "",
    });
    setShowModal(true);
  };

  const updateCheck = (idx: number, key: keyof QCCheckItem, val: any) => {
    setForm(p => ({ ...p, checks: p.checks.map((c, i) => i === idx ? { ...c, [key]: val } : c) }));
  };
  const addCheck = () => setForm(p => ({ ...p, checks: [...p.checks, BLANK_CHECK()] }));
  const removeCheck = (idx: number) => setForm(p => ({ ...p, checks: p.checks.filter((_, i) => i !== idx) }));

  const computeOverall = (checks: QCCheckItem[]): QCResult => {
    if (checks.some(c => c.result === "Fail")) return "Fail";
    if (checks.some(c => c.result === "Conditional Pass")) return "Conditional Pass";
    return "Pass";
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const overall = computeOverall(form.checks);
    const record: QCRecord = {
      id: `qc-${Date.now()}`,
      productionOrderId: selectedOrder!.id,
      batchNo: selectedOrder!.batchNo,
      productCode: selectedOrder!.productCode,
      productName: selectedOrder!.productName,
      inspectedQty: form.inspectedQty,
      passedQty: form.passedQty,
      rejectedQty: form.inspectedQty - form.passedQty,
      checks: form.checks,
      overallResult: overall,
      inspectionDate: form.inspectionDate,
      inspectorName: form.inspectorName,
      inspectionAgency: form.inspectionAgency || undefined,
      certificateNo: form.certificateNo || undefined,
      remarks: form.remarks || undefined,
    };
    setQcRecords(prev => [record, ...prev]);

    if (overall !== "Fail") {
      const bom = boms.find(b => b.id === selectedOrder!.bomId);
      setFinishedGoods(prev => [{
        id: `fg-${Date.now()}`,
        bomId: selectedOrder!.bomId,
        productCode: record.productCode,
        productName: record.productName,
        batchNo: record.batchNo,
        qcRecordId: record.id,
        quantityNos: record.passedQty,
        unit: bom?.unit || "pcs",
        location: "Pending Allocation",
        receivedDate: record.inspectionDate,
      }, ...prev]);
      toast.success("QC Passed", `${record.passedQty} ${bom?.unit || "pcs"} moved to Finished Goods`);
    } else {
      toast.error("QC Failed", `Batch ${record.batchNo} rejected`);
    }
    setShowModal(false);
  };

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = qcRecords.map(q => ({
      "Batch No": q.batchNo, "Product Code": q.productCode, "Product": q.productName,
      "Inspected": q.inspectedQty, "Passed": q.passedQty, "Rejected": q.rejectedQty,
      "Checks": q.checks.map(c => `${c.parameter}: ${c.actual} (${c.result})`).join("; "),
      "Overall": q.overallResult, "Inspector": q.inspectorName,
      "Agency": q.inspectionAgency || "", "Cert No": q.certificateNo || "",
      "Date": q.inspectionDate,
    }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "QC");
    XLSX.writeFile(wb, "QC_Records_Export.xlsx"); toast.success("Exported");
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-orange-400" /> Quality Control</h1>
          <p className="text-slate-400 text-sm mt-1">Inspection log — flexible parameter checks, any product type</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Download className="h-3.5 w-3.5" /> Export</button>
      </div>

      {pendingInspection.length > 0 && canWrite && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-400 mb-3">{pendingInspection.length} batch(es) awaiting QC inspection</p>
          <div className="space-y-2">
            {pendingInspection.map(o => (
              <div key={o.id} className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                <div>
                  <p className="text-xs font-bold text-white">{o.orderNo} · Batch: {o.batchNo}</p>
                  <p className="text-[10px] text-slate-400">{o.productName} · {o.producedQty} produced</p>
                </div>
                <button onClick={() => openInspect(o)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer">
                  <Plus className="h-3 w-3" /> Inspect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Inspection Records ({qcRecords.length})</h3>
        {qcRecords.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">No QC records yet</div>
        ) : qcRecords.map(q => (
          <div key={q.id} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs font-black text-white">{q.batchNo}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono uppercase ${RESULT_BADGE[q.overallResult]}`}>{q.overallResult}</span>
                </div>
                <p className="text-sm font-bold text-slate-200">{q.productName}</p>
                <p className="text-[10px] text-slate-500 font-mono">{q.productCode}</p>
              </div>
              <div className="text-right text-[10px] space-y-0.5">
                <p className="text-slate-400">{q.inspectionDate}</p>
                <p className="text-slate-300 font-bold">{q.inspectorName}</p>
                {q.inspectionAgency && <p className="text-blue-400 font-bold">{q.inspectionAgency}</p>}
                {q.certificateNo && <p className="text-slate-500 font-mono">{q.certificateNo}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[["Inspected",q.inspectedQty,"text-white"],["Passed",q.passedQty,"text-emerald-400"],["Rejected",q.rejectedQty,"text-red-400"]].map(([l,v,c]) => (
                <div key={l as string} className="bg-slate-900/40 rounded-lg p-2 text-center text-[10px]">
                  <p className="text-slate-500">{l}</p><p className={`font-bold ${c}`}>{v}</p>
                </div>
              ))}
            </div>
            {q.checks.length > 0 && (
              <div className="mt-3 space-y-1">
                {q.checks.slice(0,4).map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] bg-slate-900/40 rounded px-2.5 py-1">
                    <span className="text-slate-400">{c.parameter}: <span className="text-slate-300">{c.actual || "—"}</span></span>
                    <span className={`font-bold ${c.result === "Pass" ? "text-emerald-400" : c.result === "Fail" ? "text-red-400" : "text-amber-400"}`}>{c.result}</span>
                  </div>
                ))}
                {q.checks.length > 4 && <p className="text-[9px] text-slate-600 text-center">+{q.checks.length - 4} more checks</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <div>
                <h3 className="font-bold text-white text-sm">QC Inspection — {selectedOrder.batchNo}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{selectedOrder.productName} · {selectedOrder.productCode}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div className="bg-slate-800/40 rounded-lg p-3 text-xs">
                <p className="text-slate-400">Order: <span className="text-white font-bold">{selectedOrder.orderNo}</span> · Produced: <span className="text-white font-bold">{selectedOrder.producedQty}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Inspected Qty</label>
                  <input type="number" value={form.inspectedQty} onChange={e => setForm(p => ({...p, inspectedQty: Number(e.target.value)}))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Passed Qty</label>
                  <input type="number" value={form.passedQty} onChange={e => setForm(p => ({...p, passedQty: Number(e.target.value)}))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inspection Parameters</p>
                  <button type="button" onClick={addCheck} className="text-[10px] font-bold text-orange-400 hover:text-orange-300 cursor-pointer flex items-center gap-1"><Plus className="h-3 w-3" /> Add Row</button>
                </div>
                <div className="text-[9px] text-slate-500 grid grid-cols-12 gap-1 px-1">
                  <span className="col-span-3">Parameter</span>
                  <span className="col-span-3">Specification</span>
                  <span className="col-span-3">Actual Value</span>
                  <span className="col-span-2">Result</span>
                  <span></span>
                </div>
                {form.checks.map((c, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1 items-center">
                    <input value={c.parameter} onChange={e => updateCheck(idx, "parameter", e.target.value)} placeholder="Wire Diameter" className="col-span-3 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-orange-500" />
                    <input value={c.specification} onChange={e => updateCheck(idx, "specification", e.target.value)} placeholder="38 ± 0.3 mm" className="col-span-3 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-orange-500" />
                    <input value={c.actual} onChange={e => updateCheck(idx, "actual", e.target.value)} placeholder="38.1 mm" className="col-span-3 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-orange-500" />
                    <select value={c.result} onChange={e => updateCheck(idx, "result", e.target.value as QCResult)} className="col-span-2 bg-slate-800 border border-slate-700 rounded px-1 py-1.5 text-[10px] text-white focus:outline-none focus:border-orange-500">
                      {QC_RESULTS.map(r => <option key={r}>{r}</option>)}
                    </select>
                    {form.checks.length > 1 && <button type="button" onClick={() => removeCheck(idx)} className="text-slate-600 hover:text-red-400 cursor-pointer flex justify-center"><Trash2 className="h-3.5 w-3.5" /></button>}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Inspector Name</label>
                  <input value={form.inspectorName} onChange={e => setForm(p => ({...p, inspectorName: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Inspection Agency</label>
                  <select value={form.inspectionAgency} onChange={e => setForm(p => ({...p, inspectionAgency: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                    {AGENCIES.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Inspection Date</label>
                  <input type="date" value={form.inspectionDate} onChange={e => setForm(p => ({...p, inspectionDate: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Certificate No</label>
                  <input value={form.certificateNo} onChange={e => setForm(p => ({...p, certificateNo: e.target.value}))} placeholder="RITES/2026/INS/XXXX" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Remarks</label>
                <input value={form.remarks} onChange={e => setForm(p => ({...p, remarks: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
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
