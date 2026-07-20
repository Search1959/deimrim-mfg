import React from "react";
import { Package, Factory, ShieldCheck, Warehouse, ShoppingCart, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import type { RawMaterial, BOMItem, ProductionOrder, QCRecord, FinishedGood, SalesOrder, Invoice } from "../../types";
import { formatINR } from "../../types";

interface Props {
  rawMaterials: RawMaterial[]; boms: BOMItem[]; productionOrders: ProductionOrder[];
  qcRecords: QCRecord[]; finishedGoods: FinishedGood[]; salesOrders: SalesOrder[]; invoices: Invoice[];
}

export default function DashboardView({ rawMaterials, productionOrders, qcRecords, finishedGoods, salesOrders, invoices }: Props) {
  const lowStock = rawMaterials.filter(r => r.status === "low_stock" || r.status === "out_of_stock");
  const activeProduction = productionOrders.filter(p => p.status === "in_progress");
  const pendingQC = productionOrders.filter(p => p.status === "completed" && !qcRecords.find(q => q.productionOrderId === p.id));
  const totalFGQty = finishedGoods.reduce((s, f) => s + f.quantityNos, 0);
  const pendingOrders = salesOrders.filter(o => !["dispatched","invoiced"].includes(o.status));
  const totalSales = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalOutstanding = totalSales - totalPaid;

  const STATS = [
    { label: "RM Alerts", value: lowStock.length, sub: "Low / Out of stock", icon: Package, color: lowStock.length > 0 ? "text-red-400" : "text-emerald-400", bg: lowStock.length > 0 ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Active Production", value: activeProduction.length, sub: "Orders in progress", icon: Factory, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
    { label: "Pending QC", value: pendingQC.length, sub: "Awaiting inspection", icon: ShieldCheck, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { label: "Finished Goods", value: totalFGQty.toLocaleString(), sub: "Units in stock", icon: Warehouse, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Pending Orders", value: pendingOrders.length, sub: "To be dispatched", icon: ShoppingCart, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
    { label: "Outstanding", value: formatINR(totalOutstanding), sub: "Total receivable", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-white">Operations Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Live overview — Spring Manufacturing Unit</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {STATS.map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <s.icon className={`h-5 w-5 mb-2 ${s.color}`} />
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs font-bold text-white mt-0.5">{s.label}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Status */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Factory className="h-4 w-4 text-orange-400" /> Production Orders</h3>
          <div className="space-y-2">
            {productionOrders.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-lg border border-slate-800">
                <div>
                  <p className="text-xs font-bold text-white">{o.orderNo}</p>
                  <p className="text-[10px] text-slate-400">{o.springName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-200">{o.producedQty}/{o.plannedQty}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${
                    o.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                    o.status === "in_progress" ? "bg-orange-500/20 text-orange-400" :
                    o.status === "planned" ? "bg-blue-500/20 text-blue-400" :
                    "bg-slate-500/20 text-slate-400"
                  }`}>{o.status.replace("_"," ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RM Alerts */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-400" /> Raw Material Status</h3>
          <div className="space-y-2">
            {rawMaterials.map(r => (
              <div key={r.id} className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-lg border border-slate-800">
                <div>
                  <p className="text-xs font-bold text-white">{r.grade} · {r.wireDiaMm}mm</p>
                  <p className="text-[10px] text-slate-400">Heat: {r.heatNo} · {r.supplier.split("(")[0].trim()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-200">{r.totalWeightKg.toLocaleString()} kg</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${
                    r.status === "in_stock" ? "bg-emerald-500/20 text-emerald-400" :
                    r.status === "low_stock" ? "bg-amber-500/20 text-amber-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>{r.status.replace("_"," ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Sales Orders */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-violet-400" /> Active Sales Orders</h3>
          <div className="space-y-2">
            {salesOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-lg border border-slate-800">
                <div>
                  <p className="text-xs font-bold text-white">{o.orderNo}</p>
                  <p className="text-[10px] text-slate-400">{o.customerName.split("(")[0].trim()} · PO: {o.poNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-200">{formatINR(o.totalAmount)}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${
                    o.status === "dispatched" ? "bg-emerald-500/20 text-emerald-400" :
                    o.status === "in_production" ? "bg-orange-500/20 text-orange-400" :
                    o.status === "confirmed" ? "bg-blue-500/20 text-blue-400" :
                    "bg-slate-500/20 text-slate-400"
                  }`}>{o.status.replace("_"," ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QC Summary */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-400" /> QC Inspection Log</h3>
          {qcRecords.length === 0 ? (
            <p className="text-center py-8 text-slate-500 text-xs">No QC records yet</p>
          ) : (
            <div className="space-y-2">
              {qcRecords.map(q => (
                <div key={q.id} className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white">{q.batchNo}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${q.overallResult === "Pass" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>{q.overallResult}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{q.springName} · Insp: {q.inspectionAgency}</p>
                  <div className="flex gap-3 mt-1.5 text-[10px]">
                    <span className="text-slate-400">Inspected: <span className="text-white font-bold">{q.inspectedQty}</span></span>
                    <span className="text-emerald-400">Pass: <span className="font-bold">{q.passedQty}</span></span>
                    <span className="text-red-400">Reject: <span className="font-bold">{q.rejectedQty}</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
