import { Package, Factory, ShieldCheck, Warehouse, ShoppingCart, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { RawMaterial, BOMItem, ProductionOrder, QCRecord, FinishedGood, SalesOrder, Invoice } from "../../types";
import { formatINR } from "../../types";

const CHART_COLORS = ["#f97316","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-slate-400 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }} className="font-bold">{p.name}: {typeof p.value === "number" && p.value > 1000 ? formatINR(p.value) : p.value}</p>
      ))}
    </div>
  );
};

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
    { label: "RM Alerts",         value: lowStock.length,             sub: "Low / Out of stock",  icon: Package,      color: lowStock.length > 0 ? "text-red-400" : "text-emerald-400", bg: lowStock.length > 0 ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Active Production", value: activeProduction.length,     sub: "Orders in progress",  icon: Factory,      color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
    { label: "Pending QC",        value: pendingQC.length,            sub: "Awaiting inspection", icon: ShieldCheck,  color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
    { label: "Finished Goods",    value: totalFGQty.toLocaleString(), sub: "Units in stock",      icon: Warehouse,    color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Pending Orders",    value: pendingOrders.length,        sub: "To be dispatched",    icon: ShoppingCart, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
    { label: "Outstanding",       value: formatINR(totalOutstanding), sub: "Total receivable",    icon: TrendingUp,   color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20" },
  ];

  const prodStatusData = [
    { name: "Planned",     value: productionOrders.filter(p => p.status === "planned").length,     fill: "#3b82f6" },
    { name: "In Progress", value: productionOrders.filter(p => p.status === "in_progress").length, fill: "#f97316" },
    { name: "Completed",   value: productionOrders.filter(p => p.status === "completed").length,   fill: "#f59e0b" },
    { name: "QC Pass",     value: qcRecords.filter(q => q.overallResult === "Pass").length,        fill: "#10b981" },
    { name: "QC Fail",     value: qcRecords.filter(q => q.overallResult === "Fail").length,        fill: "#ef4444" },
  ];

  const rmByGrade: Record<string, number> = {};
  rawMaterials.forEach(r => { rmByGrade[r.grade] = (rmByGrade[r.grade] || 0) + r.totalWeightKg; });
  const rmChartData = Object.entries(rmByGrade).map(([grade, kg]) => ({ name: grade, kg }));

  const revenueData = [
    { month: "Feb", revenue: 285000, received: 210000 },
    { month: "Mar", revenue: 340000, received: 290000 },
    { month: "Apr", revenue: 410000, received: 350000 },
    { month: "May", revenue: 380000, received: 320000 },
    { month: "Jun", revenue: 520000, received: 480000 },
    { month: "Jul", revenue: totalSales, received: totalPaid },
  ];

  const orderByType: Record<string, number> = {};
  salesOrders.forEach(o => {
    const ct = (o.customerName.includes("Railway") || o.customerName.includes("RCF") || o.customerName.includes("RITES")) ? "Railway" : "Local / Other";
    orderByType[ct] = (orderByType[ct] || 0) + o.totalAmount;
  });
  const pieData = Object.entries(orderByType).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><BarChart3 className="h-6 w-6 text-orange-400" /> Operations Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Live overview — Spring Manufacturing Unit</p>
        </div>
        <p className="text-xs font-mono text-slate-400">{new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}</p>
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

      {/* Revenue + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-950/40 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-400" /> Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <XAxis dataKey="month" tick={{ fill:"#64748b", fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#64748b", fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenue"  name="Invoiced" stroke="#f97316" strokeWidth={2} dot={{ fill:"#f97316", r:3 }} />
              <Line type="monotone" dataKey="received" name="Received" stroke="#10b981" strokeWidth={2} dot={{ fill:"#10b981", r:3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-3 h-0.5 bg-orange-500 inline-block rounded" />Invoiced</span>
            <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />Received</span>
          </div>
        </div>

        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-violet-400" /> Sales by Type</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2 h-2 rounded-full inline-block" style={{ background: CHART_COLORS[i] }} />{d.name}</span>
                <span className="font-bold text-white">{formatINR(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Production Status + RM Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Factory className="h-4 w-4 text-orange-400" /> Production Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={prodStatusData} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fill:"#64748b", fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill:"#94a3b8", fontSize:10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Count" radius={[0,4,4,0]}>
                {prodStatusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Package className="h-4 w-4 text-blue-400" /> Raw Material Stock (kg)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={rmChartData} barSize={26}>
              <XAxis dataKey="name" tick={{ fill:"#94a3b8", fontSize:9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#64748b", fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}t`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="kg" name="Stock (kg)" radius={[4,4,0,0]}>
                {rmChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-400" /> Alerts & Attention Required</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {lowStock.map(r => (
            <div key={r.id} className="flex items-start gap-2.5 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-300">Low Stock: {r.grade}</p>
                <p className="text-[10px] text-slate-400">{r.wireDiaMm}mm · {r.totalWeightKg} kg left</p>
              </div>
            </div>
          ))}
          {pendingQC.map(o => (
            <div key={o.id} className="flex items-start gap-2.5 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-300">QC Pending: {o.orderNo}</p>
                <p className="text-[10px] text-slate-400">{o.producedQty} pcs waiting inspection</p>
              </div>
            </div>
          ))}
          {pendingOrders.map(o => (
            <div key={o.id} className="flex items-start gap-2.5 p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl">
              <ShoppingCart className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-violet-300">{o.orderNo}</p>
                <p className="text-[10px] text-slate-400">{o.customerName.split("(")[0].trim()} · {formatINR(o.totalAmount)}</p>
              </div>
            </div>
          ))}
          {lowStock.length === 0 && pendingQC.length === 0 && pendingOrders.length === 0 && (
            <p className="text-slate-500 text-xs col-span-3 py-4 text-center">All clear — no alerts</p>
          )}
        </div>
      </div>
    </div>
  );
}
