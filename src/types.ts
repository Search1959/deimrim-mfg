// ── Auth ────────────────────────────────────────────────────────────────────
export type UserRole = "superadmin" | "manager" | "sales" | "operator" | "readonly";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  active: boolean;
}

// ── Raw Material ─────────────────────────────────────────────────────────────
export type RMCategory =
  | "Alloy Steel" | "Mild Steel" | "Stainless Steel" | "Aluminium" | "Copper"
  | "Plastic / Polymer" | "Rubber" | "Fabric / Textile" | "Chemical" | "Packaging" | "Other";

export type RMUnit = "kg" | "ton" | "meter" | "litre" | "pcs" | "set" | "roll" | "sheet" | "box";
export type RMStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface RawMaterial {
  id: string;
  code: string;           // e.g. RM-001
  name: string;           // e.g. 60Si2Mn Wire Rod 36mm / Cotton Fabric 120gsm
  category: RMCategory;
  unit: RMUnit;
  quantity: number;
  unitCost: number;       // ₹ per unit
  totalValue: number;     // quantity × unitCost
  supplier: string;
  receivedDate: string;
  batchNo?: string;
  status: RMStatus;
  minStock: number;       // reorder point
  location?: string;
  remarks?: string;
}

// ── Bill of Materials ────────────────────────────────────────────────────────
export type CustomerType = "Railway" | "Automotive" | "Industrial" | "Construction" | "Consumer" | "Export" | "Other";

export interface BOMRawMaterial {
  materialId: string;
  materialName: string;
  qtyPerUnit: number;
  unit: string;
}

export interface BOMItem {
  id: string;
  productCode: string;      // e.g. RDSO/SK-73006 or SMC-001
  productName: string;      // e.g. Bogie Outer Spring / T-Shirt Size M
  category: string;         // Springs / Garments / Pipes / Castings
  unit: string;             // pcs / kg / meter / set
  customerType: CustomerType;
  specifications: string;   // Free text — any factory fills what's relevant
  rawMaterials: BOMRawMaterial[];
  labourHrsPerUnit: number;
  machineHrsPerUnit: number;
  costPerUnit: number;
  revision: string;         // Rev A, Rev 2, etc.
  status: "active" | "draft" | "obsolete";
  remarks?: string;
}

// ── Production Orders ────────────────────────────────────────────────────────
export type ProductionStatus = "planned" | "in_progress" | "completed" | "on_hold" | "cancelled";

export interface ProductionOrder {
  id: string;
  orderNo: string;
  bomId: string;
  productCode: string;
  productName: string;
  plannedQty: number;
  producedQty: number;
  rejectedQty: number;
  batchNo: string;
  machine: string;
  operatorId: string;
  operatorName: string;
  startDate: string;
  targetDate: string;
  completedDate?: string;
  status: ProductionStatus;
  remarks?: string;
}

// ── Quality Control ──────────────────────────────────────────────────────────
export type QCResult = "Pass" | "Fail" | "Conditional Pass";

export interface QCCheckItem {
  parameter: string;    // e.g. "Outer Diameter", "Tensile Strength", "Weight"
  specification: string;// e.g. "212 ± 1 mm"
  actual: string;       // e.g. "211.8 mm"
  result: QCResult;
}

export interface QCRecord {
  id: string;
  productionOrderId: string;
  batchNo: string;
  productCode: string;
  productName: string;
  inspectedQty: number;
  passedQty: number;
  rejectedQty: number;
  checks: QCCheckItem[];   // flexible parameter list — works for any product
  overallResult: QCResult;
  inspectionDate: string;
  inspectorName: string;
  inspectionAgency?: string;
  certificateNo?: string;
  remarks?: string;
}

// ── Finished Goods ───────────────────────────────────────────────────────────
export interface FinishedGood {
  id: string;
  bomId: string;
  productCode: string;
  productName: string;
  batchNo: string;
  qcRecordId: string;
  quantityNos: number;
  unit: string;
  location: string;
  receivedDate: string;
  remarks?: string;
}

// ── Customers / Orders ───────────────────────────────────────────────────────
export interface Customer {
  id: string;
  code: string;
  name: string;
  type: CustomerType;
  gstin?: string;
  address: string;
  contactPerson: string;
  phone: string;
  email?: string;
  creditDays: number;
}

export type OrderStatus = "pending" | "confirmed" | "in_production" | "ready" | "dispatched" | "invoiced";

export interface SalesOrderItem {
  bomId: string;
  productCode: string;
  productName: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface SalesOrder {
  id: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  poNo: string;
  poDate: string;
  items: SalesOrderItem[];
  totalAmount: number;
  deliveryDate: string;
  status: OrderStatus;
  createdAt: string;
  remarks?: string;
}

// ── Dispatch / Challan ───────────────────────────────────────────────────────
export interface DispatchItem {
  productCode: string;
  productName: string;
  batchNo: string;
  qty: number;
  unit: string;
}

export interface Dispatch {
  id: string;
  challanNo: string;
  salesOrderId?: string;
  customerId: string;
  customerName: string;
  dispatchDate: string;
  items: DispatchItem[];
  totalQty: number;
  vehicleNo?: string;
  driverName?: string;
  eWayBillNo?: string;
  remarks?: string;
}

// ── Finance ──────────────────────────────────────────────────────────────────
export interface Supplier {
  id: string;
  code: string;
  name: string;
  gstin?: string;
  address: string;
  contactPerson: string;
  phone: string;
  creditDays: number;
}

export interface PurchaseOrder {
  id: string;
  poNo: string;
  supplierId: string;
  supplierName: string;
  items: { materialId?: string; description: string; qty: number; unit: string; unitPrice: number; amount: number }[];
  totalAmount: number;
  poDate: string;
  expectedDate: string;
  status: "draft" | "sent" | "received" | "closed";
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  salesOrderId?: string;
  customerId: string;
  customerName: string;
  gstin?: string;
  invoiceDate: string;
  dueDate: string;
  items: { productCode: string; productName: string; qty: number; unit: string; unitPrice: number; taxPct: number; amount: number }[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: "draft" | "sent" | "partial" | "paid" | "overdue";
}

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
