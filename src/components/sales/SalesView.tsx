import React, { useState } from "react";
import { ShoppingCart, Plus, X, Download, Truck, Building2 } from "lucide-react";
import type { SalesOrder, Dispatch, Customer, BOMItem, FinishedGood, User, OrderStatus, CustomerType } from "../../types";
import { formatINR } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  salesOrders: SalesOrder[]; setSalesOrders: React.Dispatch<React.SetStateAction<SalesOrder[]>>;
  dispatches: Dispatch[]; setDispatches: React.Dispatch<React.SetStateAction<Dispatch[]>>;
  customers: Customer[]; setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  boms: BOMItem[]; finishedGoods: FinishedGood[]; currentUser: User;
}

type Tab = "orders" | "dispatch" | "customers";

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_production: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ready: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  dispatched: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  invoiced: "bg-teal-500/20 text-teal-400 border-teal-500/30",
};

const CUST_TYPES: CustomerType[] = ["Railway","Local","Automotive","Industrial"];

export default function SalesView({ salesOrders, setSalesOrders, dispatches, setDispatches, customers, setCustomers, boms, finishedGoods, currentUser }: Props) {
  const [tab, setTab] = useState<Tab>("orders");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCustModal, setShowCustModal] = useState(false);
  const canWrite = ["superadmin","manager","sales"].includes(currentUser.role);

  // Customer Form
  const BLANK_CUST = () => ({ code: `CUST-${String(customers.length+1).padStart(3,"0")}`, name:"", type:"Railway" as CustomerType, gstin:"", address:"", contactPerson:"", phone:"", email:"", creditDays:30 });
  const [custForm, setCustForm] = useState(BLANK_CUST());
  const cf = (k: string, v: any) => setCustForm(p => ({...p,[k]:v}));

  const saveCust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.name) { toast.error("Customer name required"); return; }
    setCustomers(prev => [{ id:`cust-${Date.now()}`, ...custForm }, ...prev]);
    toast.success("Customer Added", custForm.name);
    setShowCustModal(false);
  };

  // Order items
  const [orderItems, setOrderItems] = useState([{ bomId:"", drawingNo:"", springName:"", qty:0, unitPrice:0, amount:0 }]);
  const [orderForm, setOrderForm] = useState({ orderNo:`SO-2026-${String(salesOrders.length+1).padStart(3,"0")}`, customerId:"", customerName:"", poNo:"", poDate: new Date().toISOString().split("T")[0], deliveryDate:"", remarks:"" });
  const of = (k: string, v: any) => setOrderForm(p => ({...p,[k]:v}));

  const handleCustSelect = (id: string) => {
    const c = customers.find(x => x.id === id);
    of("customerId", id);
    if (c) of("customerName", c.name);
  };

  const handleBOMSelect = (idx: number, bomId: string) => {
    const bom = boms.find(b => b.id === bomId);
    setOrderItems(prev => prev.map((item, i) => i === idx ? { ...item, bomId, drawingNo: bom?.drawingNo || "", springName: bom?.springName || "" } : item));
  };

  const updateItem = (idx: number, k: string, v: any) => {
    setOrderItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [k]: v };
      if (k === "qty" || k === "unitPrice") updated.amount = (k==="qty"?Number(v):item.qty) * (k==="unitPrice"?Number(v):item.unitPrice);
      return updated;
    }));
  };

  const saveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const total = orderItems.reduce((s, i) => s + i.amount, 0);
    const order: SalesOrder = {
      id: `so-${Date.now()}`, ...orderForm,
      items: orderItems.filter(i => i.bomId),
      totalAmount: total, status: "confirmed",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setSalesOrders(prev => [order, ...prev]);
    toast.success("Sales Order Created", order.orderNo);
    setShowOrderModal(false);
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setSalesOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    toast.success("Status Updated");
  };

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = salesOrders.map(o => ({
      "Order No": o.orderNo, "Customer": o.customerName, "PO No": o.poNo, "PO Date": o.poDate,
      "Total": o.totalAmount, "Delivery Date": o.deliveryDate, "Status": o.status,
    }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "SalesOrders");
    XLSX.writeFile(wb, "SalesOrders_Export.xlsx"); toast.success("Exported");
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><ShoppingCart className="h-6 w-6 text-orange-400" /> Sales & Dispatch</h1>
          <p className="text-slate-400 text-sm mt-1">Customer orders · Delivery challan · Dispatch register</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Download className="h-3.5 w-3.5" /> Export</button>
          {canWrite && tab === "orders" && <button onClick={() => setShowOrderModal(true)} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Plus className="h-3.5 w-3.5" /> New Order</button>}
          {canWrite && tab === "customers" && <button onClick={() => { setCustForm(BLANK_CUST()); setShowCustModal(true); }} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg px-3 py-2 text-xs font-bold cursor-pointer"><Plus className="h-3.5 w-3.5" /> Add Customer</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([["orders","Orders"],["dispatch","Dispatch"],["customers","Customers"]] as [Tab,string][]).map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer border transition-all ${tab===t ? "bg-orange-600/20 border-orange-500/30 text-orange-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"}`}>{l}</button>
        ))}
      </div>

      {/* Orders Tab */}
      {tab === "orders" && (
        <div className="space-y-3">
          {salesOrders.map(o => (
            <div key={o.id} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-black text-white">{o.orderNo}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono uppercase ${STATUS_BADGE[o.status]}`}>{o.status.replace("_"," ")}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-200">{o.customerName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">PO: {o.poNo} · {o.poDate}</p>
                  <div className="mt-2 space-y-1">
                    {o.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px] bg-slate-900/40 rounded px-2.5 py-1.5">
                        <span className="text-slate-300"><span className="font-mono text-slate-500">{item.drawingNo}</span> — {item.springName}</span>
                        <span className="text-white font-bold">{item.qty} nos × {formatINR(item.unitPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-orange-300">{formatINR(o.totalAmount)}</p>
                  <p className="text-[10px] text-slate-400">Delivery: {o.deliveryDate}</p>
                </div>
              </div>
              {canWrite && (
                <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-800">
                  {o.status === "confirmed" && <button onClick={() => updateOrderStatus(o.id, "in_production")} className="px-2.5 py-1 rounded bg-orange-500/20 border border-orange-500/20 text-orange-300 text-[10px] font-bold cursor-pointer">→ In Production</button>}
                  {o.status === "in_production" && <button onClick={() => updateOrderStatus(o.id, "ready")} className="px-2.5 py-1 rounded bg-violet-500/20 border border-violet-500/20 text-violet-300 text-[10px] font-bold cursor-pointer">→ Ready</button>}
                  {o.status === "ready" && <button onClick={() => updateOrderStatus(o.id, "dispatched")} className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold cursor-pointer flex items-center gap-1"><Truck className="h-3 w-3" /> Dispatch</button>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dispatch Tab */}
      {tab === "dispatch" && (
        <div className="space-y-3">
          {dispatches.length === 0 && <div className="text-center py-16 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">No dispatch records yet</div>}
          {dispatches.map(d => (
            <div key={d.id} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs font-black text-white">{d.challanNo}</p>
                  <p className="text-sm font-bold text-slate-200 mt-0.5">{d.customerName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{d.dispatchDate} · Vehicle: {d.vehicleNo || "—"}</p>
                  {d.eWayBillNo && <p className="text-[10px] text-blue-400 font-mono mt-0.5">e-Way: {d.eWayBillNo}</p>}
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold text-white">{d.totalQty.toLocaleString()} nos</p>
                  <p className="text-slate-400">{d.totalWeightKg} kg</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customers Tab */}
      {tab === "customers" && (
        <div className="space-y-3">
          {customers.map(c => (
            <div key={c.id} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-orange-400" />
                    <p className="text-sm font-bold text-white">{c.name}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono uppercase ${c.type==="Railway" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-slate-500/20 text-slate-300 border-slate-500/30"}`}>{c.type}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{c.contactPerson} · {c.phone}</p>
                  <p className="text-[10px] text-slate-500">{c.address}</p>
                  {c.gstin && <p className="text-[10px] font-mono text-slate-500 mt-0.5">GSTIN: {c.gstin}</p>}
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p className="font-mono">{c.code}</p>
                  <p>{c.creditDays} days credit</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900">
              <h3 className="font-bold text-white text-sm">New Sales Order</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={saveOrder} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Order No</label>
                  <input value={orderForm.orderNo} onChange={e => of("orderNo", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Customer *</label>
                  <select value={orderForm.customerId} onChange={e => handleCustSelect(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                    <option value="">— Select —</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">Customer PO No</label>
                  <input value={orderForm.poNo} onChange={e => of("poNo", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">PO Date</label>
                  <input type="date" value={orderForm.poDate} onChange={e => of("poDate", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400">Delivery Date</label>
                  <input type="date" value={orderForm.deliveryDate} onChange={e => of("deliveryDate", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Order Items</label>
                  <button type="button" onClick={() => setOrderItems(prev => [...prev, {bomId:"",drawingNo:"",springName:"",qty:0,unitPrice:0,amount:0}])}
                    className="text-[10px] text-orange-400 hover:text-orange-300 font-bold cursor-pointer">+ Add Item</button>
                </div>
                {orderItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 p-2.5 bg-slate-800/40 rounded-lg">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] text-slate-500">Spring (Drawing)</label>
                      <select value={item.bomId} onChange={e => handleBOMSelect(i, e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-[10px] text-white focus:outline-none">
                        <option value="">— Select —</option>
                        {boms.map(b => <option key={b.id} value={b.id}>{b.drawingNo} — {b.springName}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500">Qty (nos)</label>
                      <input type="number" value={item.qty} onChange={e => updateItem(i, "qty", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-[10px] text-white focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500">Unit Price ₹</label>
                      <input type="number" value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-[10px] text-white focus:outline-none" />
                    </div>
                    {item.amount > 0 && <div className="col-span-4 text-right text-[10px] text-orange-300 font-bold">Amount: {formatINR(item.amount)}</div>}
                  </div>
                ))}
                <div className="text-right text-sm font-black text-white">Total: {formatINR(orderItems.reduce((s,i)=>s+i.amount,0))}</div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 rounded-lg border border-slate-700 text-slate-400 py-2 text-xs font-bold cursor-pointer hover:text-white">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white py-2 text-xs font-bold cursor-pointer">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showCustModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Add Customer</h3>
              <button onClick={() => setShowCustModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={saveCust} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[{label:"Customer Name *",key:"name"},{label:"Contact Person",key:"contactPerson"},{label:"Phone",key:"phone"},{label:"Email",key:"email"},{label:"GSTIN",key:"gstin"},{label:"Credit Days",key:"creditDays"}].map(({label,key}) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">{label}</label>
                    <input value={(custForm as any)[key]} onChange={e => cf(key, e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Customer Type</label>
                <select value={custForm.type} onChange={e => cf("type", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                  {CUST_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Address</label>
                <input value={custForm.address} onChange={e => cf("address", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowCustModal(false)} className="flex-1 rounded-lg border border-slate-700 text-slate-400 py-2 text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white py-2 text-xs font-bold cursor-pointer">Add Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
