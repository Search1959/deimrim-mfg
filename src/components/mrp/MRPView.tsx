import { useState } from "react";
import { GitBranch, AlertTriangle, CheckCircle, ShoppingCart, Download, RefreshCw } from "lucide-react";
import type { SalesOrder, BOMItem, RawMaterial, PurchaseOrder, Supplier, User } from "../../types";
import { formatINR } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  salesOrders: SalesOrder[]; boms: BOMItem[]; rawMaterials: RawMaterial[];
  purchaseOrders: PurchaseOrder[]; setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  suppliers: Supplier[]; currentUser: User;
}

interface MRPLine {
  materialId: string; materialName: string; unit: string;
  required: number; available: number; shortage: number;
  orders: { orderNo: string; productName: string; qty: number; rmNeeded: number }[];
}

export default function MRPView({ salesOrders, boms, rawMaterials, purchaseOrders, setPurchaseOrders, suppliers, currentUser }: Props) {
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState<MRPLine | null>(null);
  const canWrite = ["superadmin","manager"].includes(currentUser.role);

  // Calculate MRP from open sales orders × BOM rawMaterials[]
  const rmMap: Record<string, MRPLine> = {};

  salesOrders.filter(o => !["dispatched","invoiced"].includes(o.status)).forEach(order => {
    order.items.forEach(item => {
      const bom = boms.find(b => b.id === item.bomId || b.productCode === item.productCode);
      if (!bom) return;
      bom.rawMaterials.forEach(rm => {
        const needed = rm.qtyPerUnit * item.qty;
        if (!rmMap[rm.materialId]) {
          const stock = rawMaterials.find(r => r.id === rm.materialId);
          rmMap[rm.materialId] = {
            materialId: rm.materialId,
            materialName: rm.materialName,
            unit: rm.unit,
            required: 0,
            available: stock?.quantity ?? 0,
            shortage: 0,
            orders: [],
          };
        }
        rmMap[rm.materialId].required += needed;
        rmMap[rm.materialId].orders.push({ orderNo: order.orderNo, productName: item.productName, qty: item.qty, rmNeeded: needed });
      });
    });
  });

  const mrpLines: MRPLine[] = Object.values(rmMap).map(l => ({
    ...l,
    shortage: Math.max(0, l.required - l.available),
  }));

  const totalShortageLines = mrpLines.filter(l => l.shortage > 0).length;
  const pendingPOValue = purchaseOrders.filter(p => p.status === "sent").reduce((s, p) => s + p.totalAmount, 0);

  const createPO = (line: MRPLine) => {
    const sup = suppliers[0];
    if (!sup) { toast.error("No suppliers found — add a supplier first"); return; }
    const orderQty = Math.ceil(line.shortage * 1.1);
    const stock = rawMaterials.find(r => r.id === line.materialId);
    const unitPrice = stock?.unitCost ?? 100;
    const total = orderQty * unitPrice;
    const po: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNo: `PO-MRP-${String(purchaseOrders.length + 1).padStart(3,"0")}`,
      supplierId: sup.id, supplierName: sup.name,
      poDate: new Date().toISOString().split("T")[0],
      expectedDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      items: [{ materialId: line.materialId, description: line.materialName, qty: orderQty, unit: line.unit, unitPrice, amount: total }],
      totalAmount: total, status: "draft",
    };
    setPurchaseOrders(prev => [po, ...prev]);
    toast.success("Purchase Order Created", po.poNo);
    setShowPOModal(false);
  };

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = mrpLines.map(l => ({
      "Material": l.materialName, "Unit": l.unit,
      "Required": l.required.toFixed(2), "Available": l.available.toFixed(2),
      "Shortage": l.shortage.toFixed(2), "Status": l.shortage > 0 ? "SHORTAGE" : "OK",
    }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "MRP");
    XLSX.writeFile(wb, "MRP_Report.xlsx"); toast.success("Exported");
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><GitBranch className="h-6 w-6 text-orange-400" /> MRP — Material Planning</h1>
          <p className="text-slate-400 text-sm mt-1">Auto-calculated from open sales orders vs current RM stock</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Download className="h-3.5 w-3.5" /> Export</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Open Orders",      value: salesOrders.filter(o => !["dispatched","invoiced"].includes(o.status)).length + " orders", color:"text-blue-400" },
          { label:"RM Lines Needed",  value: mrpLines.length + " materials",  color:"text-orange-400" },
          { label:"Shortage Lines",   value: totalShortageLines > 0 ? `${totalShortageLines} materials` : "None", color: totalShortageLines > 0 ? "text-red-400" : "text-emerald-400" },
          { label:"POs In Transit",   value: formatINR(pendingPOValue),        color:"text-violet-400" },
        ].map(c => (
          <div key={c.label} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
            <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {mrpLines.length === 0 ? (
        <div className="text-center py-20 bg-slate-950/40 border border-slate-800 rounded-xl">
          <RefreshCw className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-bold">No open sales orders</p>
          <p className="text-slate-500 text-xs mt-1">Add confirmed sales orders with BOM-linked items to see requirements</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mrpLines.map((line) => (
            <div key={line.materialId} className={`bg-slate-950/40 border rounded-xl p-5 ${line.shortage > 0 ? "border-red-500/30" : "border-emerald-500/20"}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  {line.shortage > 0
                    ? <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                    : <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />}
                  <div>
                    <p className="text-sm font-black text-white">{line.materialName}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Used in {line.orders.length} order line{line.orders.length !== 1 ? "s" : ""} · {line.unit}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 flex-wrap">
                  <div className="text-center">
                    <p className="text-lg font-black text-white">{line.required.toFixed(1)} {line.unit}</p>
                    <p className="text-[10px] text-slate-400">Required</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-black ${line.available >= line.required ? "text-emerald-400" : "text-amber-400"}`}>{line.available.toFixed(1)} {line.unit}</p>
                    <p className="text-[10px] text-slate-400">Available</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-black ${line.shortage > 0 ? "text-red-400" : "text-emerald-400"}`}>{line.shortage > 0 ? `-${line.shortage.toFixed(1)} ${line.unit}` : "✓ OK"}</p>
                    <p className="text-[10px] text-slate-400">Shortage</p>
                  </div>
                  {canWrite && line.shortage > 0 && (
                    <button onClick={() => { setSelectedLine(line); setShowPOModal(true); }}
                      className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg px-3 py-2 text-xs font-bold cursor-pointer">
                      <ShoppingCart className="h-3.5 w-3.5" /> Create PO
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Stock coverage</span>
                  <span>{line.required > 0 ? Math.min(100, Math.round((line.available / line.required) * 100)) : 100}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${line.shortage > 0 ? "bg-red-500" : "bg-emerald-500"}`}
                    style={{ width: `${line.required > 0 ? Math.min(100, (line.available / line.required) * 100) : 100}%` }} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {line.orders.map((o, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-900/60 rounded-lg border border-slate-800 text-[10px]">
                    <div>
                      <span className="font-mono font-bold text-white">{o.orderNo}</span>
                      <p className="text-slate-400 truncate max-w-[120px]">{o.productName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-300 font-bold">{o.qty} pcs</p>
                      <p className="text-orange-400">{o.rmNeeded.toFixed(1)} {line.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showPOModal && selectedLine && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Create Purchase Order</h3>
              <p className="text-xs text-slate-400 mt-1">Auto-filled from MRP shortage · 10% buffer included</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-slate-800/50 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Material</span><span className="font-bold text-white">{selectedLine.materialName}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Shortage</span><span className="font-bold text-red-400">{selectedLine.shortage.toFixed(1)} {selectedLine.unit}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Order Qty (+10% buffer)</span><span className="font-bold text-white">{Math.ceil(selectedLine.shortage * 1.1)} {selectedLine.unit}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Supplier</span><span className="font-bold text-white">{suppliers[0]?.name || "—"}</span></div>
                <div className="flex justify-between border-t border-slate-700 pt-2">
                  <span className="text-slate-400">Est. Value</span>
                  <span className="font-black text-orange-400">{formatINR(Math.ceil(selectedLine.shortage * 1.1) * (rawMaterials.find(r => r.id === selectedLine.materialId)?.unitCost ?? 100))}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowPOModal(false)} className="flex-1 rounded-lg border border-slate-700 text-slate-400 py-2 text-xs font-bold cursor-pointer">Cancel</button>
                <button onClick={() => createPO(selectedLine)} className="flex-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white py-2 text-xs font-bold cursor-pointer">Create PO</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
