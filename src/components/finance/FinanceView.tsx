import React, { useState } from "react";
import { Banknote, Plus, X, Download, Building2 } from "lucide-react";
import type { Invoice, PurchaseOrder, Supplier, Customer, SalesOrder, User } from "../../types";
import { formatINR } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  invoices: Invoice[]; setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  purchaseOrders: PurchaseOrder[]; setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  suppliers: Supplier[]; setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  customers: Customer[]; salesOrders: SalesOrder[]; currentUser: User;
}

type Tab = "invoices" | "purchase" | "suppliers";

const INV_STATUS_BADGE: Record<string, string> = {
  draft:"bg-slate-500/20 text-slate-400 border-slate-500/30", sent:"bg-blue-500/20 text-blue-400 border-blue-500/30",
  partial:"bg-amber-500/20 text-amber-400 border-amber-500/30", paid:"bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  overdue:"bg-red-500/20 text-red-400 border-red-500/30",
};

const PO_STATUS_BADGE: Record<string, string> = {
  draft:"bg-slate-500/20 text-slate-400 border-slate-500/30", sent:"bg-blue-500/20 text-blue-400 border-blue-500/30",
  received:"bg-emerald-500/20 text-emerald-400 border-emerald-500/30", closed:"bg-slate-700/50 text-slate-500 border-slate-600/30",
};

export default function FinanceView({ invoices, setInvoices, purchaseOrders, setPurchaseOrders, suppliers, setSuppliers, customers, currentUser }: Props) {
  const [tab, setTab] = useState<Tab>("invoices");
  const [showSupModal, setShowSupModal] = useState(false);
  const canWrite = ["superadmin","manager"].includes(currentUser.role);

  const totalSales = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const outstanding = totalSales - totalPaid;
  const totalPurchase = purchaseOrders.reduce((s, p) => s + p.totalAmount, 0);

  // Supplier form
  const BLANK_SUP = () => ({ code:`SUP-${String(suppliers.length+1).padStart(3,"0")}`, name:"", gstin:"", address:"", contactPerson:"", phone:"", creditDays:30 });
  const [supForm, setSupForm] = useState(BLANK_SUP());
  const sf = (k: string, v: any) => setSupForm(p => ({...p,[k]:v}));

  const saveSup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supForm.name) { toast.error("Supplier name required"); return; }
    setSuppliers(prev => [{ id:`sup-${Date.now()}`, ...supForm }, ...prev]);
    toast.success("Supplier Added", supForm.name); setShowSupModal(false);
  };

  const markPaid = (id: string) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, paidAmount: i.totalAmount, balanceAmount: 0, status: "paid" } : i));
    toast.success("Marked as Paid");
  };

  const markPORec = (id: string) => {
    setPurchaseOrders(prev => prev.map(p => p.id === id ? { ...p, status: "received" } : p));
    toast.success("PO marked as Received");
  };

  const exportInvoices = async () => {
    const XLSX = await import("xlsx");
    const rows = invoices.map(i => ({
      "Invoice No": i.invoiceNo, "Customer": i.customerName, "Date": i.invoiceDate,
      "Due": i.dueDate, "Subtotal": i.subtotal, "Tax": i.taxAmount,
      "Total": i.totalAmount, "Paid": i.paidAmount, "Balance": i.balanceAmount, "Status": i.status,
    }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Invoices");
    XLSX.writeFile(wb, "Invoices_Export.xlsx"); toast.success("Exported");
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Banknote className="h-6 w-6 text-orange-400" /> Finance</h1>
          <p className="text-slate-400 text-sm mt-1">Sales invoices · Purchase orders · Supplier ledger</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportInvoices} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Download className="h-3.5 w-3.5" /> Export</button>
          {canWrite && tab === "suppliers" && <button onClick={() => { setSupForm(BLANK_SUP()); setShowSupModal(true); }} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Plus className="h-3.5 w-3.5" /> Add Supplier</button>}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:"Total Invoiced",value:formatINR(totalSales),color:"text-white"},
          {label:"Total Received",value:formatINR(totalPaid),color:"text-emerald-400"},
          {label:"Outstanding",value:formatINR(outstanding),color:outstanding>0?"text-amber-400":"text-emerald-400"},
          {label:"Total Purchase",value:formatINR(totalPurchase),color:"text-blue-400"},
        ].map(c => (
          <div key={c.label} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
            <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([["invoices","Sales Invoices"],["purchase","Purchase Orders"],["suppliers","Suppliers"]] as [Tab,string][]).map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer border transition-all ${tab===t ? "bg-orange-600/20 border-orange-500/30 text-orange-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"}`}>{l}</button>
        ))}
      </div>

      {/* Invoices */}
      {tab === "invoices" && (
        <div className="space-y-3">
          {invoices.length === 0 && <div className="text-center py-16 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">No invoices yet</div>}
          {invoices.map(inv => (
            <div key={inv.id} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-black text-white">{inv.invoiceNo}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono uppercase ${INV_STATUS_BADGE[inv.status]}`}>{inv.status}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-200">{inv.customerName}</p>
                  <p className="text-[10px] text-slate-500">Invoice: {inv.invoiceDate} · Due: {inv.dueDate}</p>
                  {inv.gstin && <p className="text-[10px] font-mono text-slate-500">GSTIN: {inv.gstin}</p>}
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white">{formatINR(inv.totalAmount)}</p>
                  <p className="text-[10px] text-slate-400">Paid: <span className="text-emerald-400 font-bold">{formatINR(inv.paidAmount)}</span></p>
                  {inv.balanceAmount > 0 && <p className="text-[10px] text-amber-400 font-bold">Due: {formatINR(inv.balanceAmount)}</p>}
                </div>
              </div>
              {canWrite && inv.status !== "paid" && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <button onClick={() => markPaid(inv.id)} className="px-3 py-1 rounded bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold cursor-pointer hover:bg-emerald-500/30">✓ Mark as Paid</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Purchase Orders */}
      {tab === "purchase" && (
        <div className="space-y-3">
          {purchaseOrders.map(po => (
            <div key={po.id} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-black text-white">{po.poNo}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono uppercase ${PO_STATUS_BADGE[po.status]}`}>{po.status}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-200">{po.supplierName}</p>
                  <p className="text-[10px] text-slate-500">PO Date: {po.poDate} · Expected: {po.expectedDate}</p>
                  {po.items.map((item, i) => (
                    <p key={i} className="text-[10px] text-slate-400 mt-0.5">{item.description} · {item.grade} · {item.qty} {item.unit}</p>
                  ))}
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white">{formatINR(po.totalAmount)}</p>
                  {canWrite && po.status === "sent" && (
                    <button onClick={() => markPORec(po.id)} className="mt-2 px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold cursor-pointer">✓ Mark Received</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suppliers */}
      {tab === "suppliers" && (
        <div className="space-y-3">
          {suppliers.map(s => (
            <div key={s.id} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-400" /><p className="text-sm font-bold text-white">{s.name}</p></div>
                  <p className="text-[10px] text-slate-400 mt-1">{s.contactPerson} · {s.phone}</p>
                  <p className="text-[10px] text-slate-500">{s.address}</p>
                  {s.gstin && <p className="text-[10px] font-mono text-slate-500 mt-0.5">GSTIN: {s.gstin}</p>}
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p className="font-mono">{s.code}</p>
                  <p>{s.creditDays} days credit</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Supplier Modal */}
      {showSupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Add Supplier</h3>
              <button onClick={() => setShowSupModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={saveSup} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[{label:"Supplier Name *",key:"name"},{label:"Contact Person",key:"contactPerson"},{label:"Phone",key:"phone"},{label:"GSTIN",key:"gstin"},{label:"Credit Days",key:"creditDays"}].map(({label,key}) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">{label}</label>
                    <input value={(supForm as any)[key]} onChange={e => sf(key, e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Address</label>
                <input value={supForm.address} onChange={e => sf("address", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowSupModal(false)} className="flex-1 rounded-lg border border-slate-700 text-slate-400 py-2 text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white py-2 text-xs font-bold cursor-pointer">Add Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
