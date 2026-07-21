import { FileSpreadsheet, Download, TrendingUp, Factory, Package, ShieldCheck, ShoppingCart, Banknote } from "lucide-react";
import type { RawMaterial, ProductionOrder, QCRecord, FinishedGood, SalesOrder, Invoice, PurchaseOrder, BOMItem, User } from "../../types";
import { formatINR } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  rawMaterials: RawMaterial[]; productionOrders: ProductionOrder[]; qcRecords: QCRecord[];
  finishedGoods: FinishedGood[]; salesOrders: SalesOrder[]; invoices: Invoice[];
  purchaseOrders: PurchaseOrder[]; boms: BOMItem[]; currentUser: User;
}

export default function ReportsView({ rawMaterials, productionOrders, qcRecords, finishedGoods, salesOrders, invoices, purchaseOrders, boms }: Props) {

  const exportXLSX = async (rows: object[], sheetName: string, filename: string) => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheetName);
    XLSX.writeFile(wb, filename);
    toast.success("Report Downloaded", filename);
  };

  const reports = [
    {
      id: "production-summary",
      title: "Production Summary",
      description: "All production orders — status, qty produced, rejection, batch details",
      icon: Factory, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20",
      generate: async () => {
        const rows = productionOrders.map(o => ({
          "Order No": o.orderNo, "Product Code": o.productCode, "Product Name": o.productName,
          "Batch No": o.batchNo, "Planned Qty": o.plannedQty, "Produced Qty": o.producedQty,
          "Rejected Qty": o.rejectedQty, "Good Qty": o.producedQty - o.rejectedQty,
          "Machine": o.machine, "Operator": o.operatorName,
          "Start Date": o.startDate, "Target Date": o.targetDate, "Status": o.status,
          "Efficiency %": o.plannedQty > 0 ? ((o.producedQty / o.plannedQty) * 100).toFixed(1) : "—",
        }));
        await exportXLSX(rows, "Production", "Production_Summary.xlsx");
      },
    },
    {
      id: "raw-material",
      title: "Raw Material Inventory",
      description: "Current RM stock — category-wise, with supplier and stock value",
      icon: Package, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20",
      generate: async () => {
        const rows = rawMaterials.map(r => ({
          "Code": r.code, "Name": r.name, "Category": r.category, "Unit": r.unit,
          "Qty": r.quantity, "Unit Cost (₹)": r.unitCost, "Stock Value (₹)": r.totalValue,
          "Min Stock": r.minStock, "Supplier": r.supplier,
          "Batch No": r.batchNo || "", "Received Date": r.receivedDate,
          "Location": r.location || "", "Status": r.status.replace("_"," "),
          "Remarks": r.remarks || "",
        }));
        await exportXLSX(rows, "RawMaterial", "RawMaterial_Inventory.xlsx");
      },
    },
    {
      id: "quality-report",
      title: "Quality Inspection Report",
      description: "All QC records — parameter checks, pass/fail, inspection agency, certificates",
      icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20",
      generate: async () => {
        const rows = qcRecords.map(q => ({
          "Batch No": q.batchNo, "Product Code": q.productCode, "Product Name": q.productName,
          "Inspected Qty": q.inspectedQty, "Passed Qty": q.passedQty, "Rejected Qty": q.rejectedQty,
          "Parameters Checked": q.checks.length,
          "Failed Parameters": q.checks.filter(c => c.result === "Fail").map(c => c.parameter).join(", ") || "None",
          "Overall Result": q.overallResult, "Inspector": q.inspectorName,
          "Agency": q.inspectionAgency || "", "Certificate No": q.certificateNo || "—",
          "Inspection Date": q.inspectionDate,
        }));
        await exportXLSX(rows, "QC", "Quality_Inspection_Report.xlsx");
      },
    },
    {
      id: "sales-order",
      title: "Sales Order Register",
      description: "All sales orders — customer, amount, status, PO reference, dispatch",
      icon: ShoppingCart, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20",
      generate: async () => {
        const rows = salesOrders.map(o => ({
          "Order No": o.orderNo, "Customer": o.customerName, "PO No": o.poNo,
          "PO Date": o.poDate, "Delivery Date": o.deliveryDate,
          "Total Amount": o.totalAmount, "Status": o.status.replace("_"," "),
          "Items": o.items.map(i => `${i.productCode} — ${i.productName} x${i.qty}`).join("; "),
        }));
        await exportXLSX(rows, "SalesOrders", "Sales_Order_Register.xlsx");
      },
    },
    {
      id: "invoice-register",
      title: "Invoice Register",
      description: "All sales invoices — invoiced, received, outstanding, GST details",
      icon: Banknote, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20",
      generate: async () => {
        const rows = invoices.map(i => ({
          "Invoice No": i.invoiceNo, "Customer": i.customerName, "GSTIN": i.gstin || "—",
          "Invoice Date": i.invoiceDate, "Due Date": i.dueDate,
          "Subtotal": i.subtotal, "Tax": i.taxAmount, "Total": i.totalAmount,
          "Paid": i.paidAmount, "Balance": i.balanceAmount, "Status": i.status,
        }));
        await exportXLSX(rows, "Invoices", "Invoice_Register.xlsx");
      },
    },
    {
      id: "finished-goods",
      title: "Finished Goods Stock",
      description: "FG inventory — product-wise qty, unit, location",
      icon: Package, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20",
      generate: async () => {
        const rows = finishedGoods.map(f => ({
          "Product Code": f.productCode, "Product Name": f.productName,
          "Qty": f.quantityNos, "Unit": f.unit,
          "Location": f.location, "Batch No": f.batchNo,
          "Received Date": f.receivedDate, "Remarks": f.remarks || "",
        }));
        await exportXLSX(rows, "FinishedGoods", "Finished_Goods_Stock.xlsx");
      },
    },
    {
      id: "purchase-register",
      title: "Purchase Order Register",
      description: "All POs — supplier, items, amount, status, expected delivery",
      icon: ShoppingCart, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20",
      generate: async () => {
        const rows = purchaseOrders.map(p => ({
          "PO No": p.poNo, "Supplier": p.supplierName, "PO Date": p.poDate,
          "Expected Date": p.expectedDate, "Total Amount": p.totalAmount, "Status": p.status,
          "Items": p.items.map(i => `${i.description} x${i.qty} ${i.unit}`).join("; "),
        }));
        await exportXLSX(rows, "PurchaseOrders", "Purchase_Order_Register.xlsx");
      },
    },
    {
      id: "bom-register",
      title: "BOM / Product Spec Register",
      description: "All products — specifications, raw materials, cost per unit",
      icon: FileSpreadsheet, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20",
      generate: async () => {
        const rows = boms.map(b => ({
          "Product Code": b.productCode, "Product Name": b.productName,
          "Category": b.category, "Unit": b.unit, "Customer Type": b.customerType,
          "Specifications": b.specifications,
          "Raw Materials": b.rawMaterials.map(r => `${r.materialName} x${r.qtyPerUnit}${r.unit}`).join("; "),
          "Labour Hrs/Unit": b.labourHrsPerUnit, "Machine Hrs/Unit": b.machineHrsPerUnit,
          "Cost/Unit (₹)": b.costPerUnit, "Revision": b.revision, "Status": b.status,
        }));
        await exportXLSX(rows, "BOM", "BOM_Product_Register.xlsx");
      },
    },
    {
      id: "management-summary",
      title: "Management Summary",
      description: "One-file executive report — production, sales, finance, quality KPIs",
      icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20",
      generate: async () => {
        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();

        const kpi = [
          ["KPI", "Value"],
          ["Total Production Orders", productionOrders.length],
          ["Completed Orders", productionOrders.filter(p => p.status === "completed").length],
          ["In Progress", productionOrders.filter(p => p.status === "in_progress").length],
          ["Total Produced (pcs)", productionOrders.reduce((s,p) => s+p.producedQty,0)],
          ["Total Rejected (pcs)", productionOrders.reduce((s,p) => s+p.rejectedQty,0)],
          ["", ""],
          ["Total Sales (₹)", invoices.reduce((s,i) => s+i.totalAmount,0)],
          ["Total Received (₹)", invoices.reduce((s,i) => s+i.paidAmount,0)],
          ["Outstanding (₹)", invoices.reduce((s,i) => s+i.balanceAmount,0)],
          ["", ""],
          ["RM Stock Value (₹)", rawMaterials.reduce((s,r) => s+r.totalValue,0)],
          ["FG Stock (pcs)", finishedGoods.reduce((s,f) => s+f.quantityNos,0)],
          ["QC Pass Rate", qcRecords.length > 0 ? `${((qcRecords.filter(q=>q.overallResult==="Pass").length/qcRecords.length)*100).toFixed(1)}%` : "—"],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kpi), "KPI Summary");

        const prodRows = productionOrders.map(o => ({ "Order No":o.orderNo,"Product":o.productName,"Status":o.status,"Produced":o.producedQty,"Planned":o.plannedQty }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodRows), "Production");

        const invRows = invoices.map(i => ({ "Invoice":i.invoiceNo,"Customer":i.customerName,"Total":i.totalAmount,"Paid":i.paidAmount,"Balance":i.balanceAmount,"Status":i.status }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invRows), "Finance");

        XLSX.writeFile(wb, "Management_Summary.xlsx");
        toast.success("Management Summary Downloaded");
      },
    },
  ];

  const totalInvoiced    = invoices.reduce((s,i) => s+i.totalAmount,0);
  const totalOutstanding = invoices.reduce((s,i) => s+i.balanceAmount,0);
  const qcPassRate       = qcRecords.length > 0 ? ((qcRecords.filter(q=>q.overallResult==="Pass").length/qcRecords.length)*100).toFixed(0) : "—";
  const totalProduced    = productionOrders.reduce((s,p) => s+p.producedQty,0);

  return (
    <div className="space-y-5 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><FileSpreadsheet className="h-6 w-6 text-orange-400" /> Reports</h1>
        <p className="text-slate-400 text-sm mt-1">One-click Excel export for all modules</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Total Invoiced",  value: formatINR(totalInvoiced),   color:"text-white" },
          { label:"Outstanding",     value: formatINR(totalOutstanding), color: totalOutstanding > 0 ? "text-amber-400" : "text-emerald-400" },
          { label:"QC Pass Rate",    value: qcPassRate + "%",            color:"text-emerald-400" },
          { label:"Total Produced",  value: totalProduced + " pcs",      color:"text-blue-400" },
        ].map(c => (
          <div key={c.label} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
            <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reports.map(r => (
          <div key={r.id} className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className={`h-9 w-9 rounded-lg border flex items-center justify-center ${r.bg}`}>
                <r.icon className={`h-4 w-4 ${r.color}`} />
              </div>
              <button onClick={r.generate}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold cursor-pointer transition-all">
                <Download className="h-3 w-3" /> Download
              </button>
            </div>
            <p className="text-sm font-bold text-white">{r.title}</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{r.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 text-center">
        <p className="text-xs text-slate-500">All reports export as <span className="text-orange-400 font-bold">.xlsx</span> — open in Microsoft Excel, Google Sheets, or LibreOffice</p>
      </div>
    </div>
  );
}
