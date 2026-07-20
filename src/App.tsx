import React, { useState } from "react";
import {
  LayoutDashboard, Package, BookOpen, Factory, ShieldCheck,
  Warehouse, ShoppingCart, Banknote, Settings, LogOut, Menu, X, ChevronRight
} from "lucide-react";
import type { User, RawMaterial, BOMItem, ProductionOrder, QCRecord, FinishedGood, Customer, SalesOrder, Dispatch, Supplier, PurchaseOrder, Invoice } from "./types";
import { DEMO_USERS, MOCK_RAW_MATERIALS, MOCK_BOM, MOCK_PRODUCTION_ORDERS, MOCK_QC, MOCK_FINISHED_GOODS, MOCK_CUSTOMERS, MOCK_SALES_ORDERS, MOCK_DISPATCHES, MOCK_SUPPLIERS, MOCK_PO, MOCK_INVOICES } from "./mockData";
import LoginPage from "./components/LoginPage";
import DashboardView from "./components/dashboard/DashboardView";
import RawMaterialView from "./components/rawmaterial/RawMaterialView";
import BOMView from "./components/bom/BOMView";
import ProductionView from "./components/production/ProductionView";
import QualityView from "./components/quality/QualityView";
import FinishedGoodsView from "./components/finished/FinishedGoodsView";
import SalesView from "./components/sales/SalesView";
import FinanceView from "./components/finance/FinanceView";
import SettingsView from "./components/settings/SettingsView";

type Module = "dashboard" | "rawmaterial" | "bom" | "production" | "quality" | "finished" | "sales" | "finance" | "settings";

const NAV = [
  { id: "dashboard",   label: "Dashboard",       icon: LayoutDashboard, roles: ["superadmin","manager","sales","operator","readonly"] },
  { id: "rawmaterial", label: "Raw Material",     icon: Package,         roles: ["superadmin","manager","operator","readonly"] },
  { id: "bom",         label: "BOM / Specs",      icon: BookOpen,        roles: ["superadmin","manager","readonly"] },
  { id: "production",  label: "Production",       icon: Factory,         roles: ["superadmin","manager","operator","readonly"] },
  { id: "quality",     label: "Quality Control",  icon: ShieldCheck,     roles: ["superadmin","manager","operator","readonly"] },
  { id: "finished",    label: "Finished Goods",   icon: Warehouse,       roles: ["superadmin","manager","sales","readonly"] },
  { id: "sales",       label: "Sales & Dispatch", icon: ShoppingCart,    roles: ["superadmin","manager","sales","readonly"] },
  { id: "finance",     label: "Finance",          icon: Banknote,        roles: ["superadmin","manager","readonly"] },
  { id: "settings",    label: "Settings",         icon: Settings,        roles: ["superadmin"] },
] as const;

const ROLE_BADGE: Record<string, string> = {
  superadmin: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  manager:    "bg-blue-500/20 text-blue-300 border-blue-500/30",
  sales:      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  operator:   "bg-amber-500/20 text-amber-300 border-amber-500/30",
  readonly:   "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<Module>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(MOCK_RAW_MATERIALS);
  const [boms, setBoms] = useState<BOMItem[]>(MOCK_BOM);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>(MOCK_PRODUCTION_ORDERS);
  const [qcRecords, setQcRecords] = useState<QCRecord[]>(MOCK_QC);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>(MOCK_FINISHED_GOODS);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(MOCK_SALES_ORDERS);
  const [dispatches, setDispatches] = useState<Dispatch[]>(MOCK_DISPATCHES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(MOCK_PO);
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [users, setUsers] = useState<User[]>(DEMO_USERS);

  if (!currentUser) return <LoginPage users={users} onLogin={setCurrentUser} />;

  const canAccess = (id: string) => NAV.find(n => n.id === id)?.roles.includes(currentUser.role) ?? false;
  const visibleNav = NAV.filter(n => n.roles.includes(currentUser.role));

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden">
      <aside className={`${sidebarOpen ? "w-60" : "w-16"} flex-shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-200`}>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0">
            <Factory className="h-4 w-4 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-xs font-black text-white font-mono tracking-wide truncate">DEINRIM MFG</p>
              <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Spring Manufacturing</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto text-slate-500 hover:text-white cursor-pointer shrink-0">
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {visibleNav.map(({ id, label, icon: Icon }) => {
            const active = activeModule === id;
            return (
              <button key={id} onClick={() => setActiveModule(id as Module)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${active ? "bg-orange-600/20 text-orange-300 border border-orange-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800/60"}`}>
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-orange-400" : ""}`} />
                {sidebarOpen && <span className="truncate">{label}</span>}
                {sidebarOpen && active && <ChevronRight className="h-3 w-3 ml-auto text-orange-400" />}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-3">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                </div>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border font-mono uppercase tracking-widest inline-block ${ROLE_BADGE[currentUser.role]}`}>{currentUser.role}</span>
              <button onClick={() => setCurrentUser(null)} className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-[10px] font-bold cursor-pointer transition-colors">
                <LogOut className="h-3 w-3" /> Sign Out
              </button>
            </div>
          ) : (
            <button onClick={() => setCurrentUser(null)} className="flex justify-center w-full text-slate-500 hover:text-red-400 cursor-pointer">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[1400px] mx-auto">
          {activeModule === "dashboard"   && <DashboardView rawMaterials={rawMaterials} boms={boms} productionOrders={productionOrders} qcRecords={qcRecords} finishedGoods={finishedGoods} salesOrders={salesOrders} invoices={invoices} />}
          {activeModule === "rawmaterial" && <RawMaterialView rawMaterials={rawMaterials} setRawMaterials={setRawMaterials} currentUser={currentUser} />}
          {activeModule === "bom"         && <BOMView boms={boms} setBoms={setBoms} currentUser={currentUser} />}
          {activeModule === "production"  && <ProductionView productionOrders={productionOrders} setProductionOrders={setProductionOrders} boms={boms} rawMaterials={rawMaterials} currentUser={currentUser} />}
          {activeModule === "quality"     && <QualityView qcRecords={qcRecords} setQcRecords={setQcRecords} productionOrders={productionOrders} setFinishedGoods={setFinishedGoods} boms={boms} currentUser={currentUser} />}
          {activeModule === "finished"    && <FinishedGoodsView finishedGoods={finishedGoods} setFinishedGoods={setFinishedGoods} boms={boms} currentUser={currentUser} />}
          {activeModule === "sales"       && <SalesView salesOrders={salesOrders} setSalesOrders={setSalesOrders} dispatches={dispatches} setDispatches={setDispatches} customers={customers} setCustomers={setCustomers} boms={boms} finishedGoods={finishedGoods} currentUser={currentUser} />}
          {activeModule === "finance"     && <FinanceView invoices={invoices} setInvoices={setInvoices} purchaseOrders={purchaseOrders} setPurchaseOrders={setPurchaseOrders} suppliers={suppliers} setSuppliers={setSuppliers} customers={customers} salesOrders={salesOrders} currentUser={currentUser} />}
          {activeModule === "settings"    && canAccess("settings") && <SettingsView users={users} setUsers={setUsers} currentUser={currentUser} />}
        </div>
      </main>
    </div>
  );
}
