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
export type RMGrade = "EN45A" | "60Si2Mn" | "SUP9" | "Chrome Vanadium" | "65Si7" | "Other";
export type RMStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface RawMaterial {
  id: string;
  heatNo: string;          // Heat number from steel mill
  grade: RMGrade;
  wireDiaMm: number;       // Wire diameter in mm
  coilWeightKg: number;    // Weight per coil
  quantityCoils: number;
  totalWeightKg: number;
  supplier: string;
  receivedDate: string;
  millTestCert: boolean;   // Mill test certificate received
  remarks?: string;
  status: RMStatus;
}

// ── Bill of Materials ────────────────────────────────────────────────────────
export type SpringType = "Compression" | "Extension" | "Torsion" | "Buffer" | "Draw Gear" | "Bogie" | "Volute";
export type CustomerType = "Railway" | "Local" | "Automotive" | "Industrial";

export interface BOMItem {
  id: string;
  drawingNo: string;        // RDSO drawing number or internal
  springName: string;
  springType: SpringType;
  customerType: CustomerType;
  rdsoSpec?: string;        // e.g. RDSO/2019/CG-05
  wireDiaMm: number;
  outerDiaMm: number;
  freeHeightMm: number;
  totalCoils: number;
  activeCoils: number;
  grade: RMGrade;
  springRateNMm: number;   // N/mm
  fittedLoadKg: number;
  fittedHeightMm: number;
  solidHeightMm: number;
  endType: string;         // e.g. "Closed & Ground"
  heatTreatment: string;   // e.g. "Q&T + Shot Peening"
  weightKgEach: number;
  rmConsumptionKg: number; // RM per spring
  remarks?: string;
  active: boolean;
}

// ── Production Orders ────────────────────────────────────────────────────────
export type ProductionStatus = "planned" | "in_progress" | "completed" | "on_hold" | "cancelled";

export interface ProductionOrder {
  id: string;
  orderNo: string;
  bomId: string;
  drawingNo: string;
  springName: string;
  plannedQty: number;
  producedQty: number;
  rejectedQty: number;
  rawMaterialId?: string;
  heatNo?: string;
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

export interface QCRecord {
  id: string;
  productionOrderId: string;
  batchNo: string;
  drawingNo: string;
  springName: string;
  inspectedQty: number;
  passedQty: number;
  rejectedQty: number;
  // Dimensional checks
  wireDiaActual: number;
  outerDiaActual: number;
  freeHeightActual: number;
  totalCoilsActual: number;
  // Load test
  loadTestKg: number;
  loadTestHeight: number;
  loadResult: QCResult;
  // Hardness
  hardnessHRC?: number;
  hardnessResult: QCResult;
  // Overall
  overallResult: QCResult;
  inspectionDate: string;
  inspectorName: string;
  inspectionAgency?: string;   // RITES / RDSO / Internal
  certificateNo?: string;
  remarks?: string;
}

// ── Finished Goods ───────────────────────────────────────────────────────────
export interface FinishedGood {
  id: string;
  bomId: string;
  drawingNo: string;
  springName: string;
  batchNo: string;
  qcRecordId: string;
  quantityNos: number;
  weightKgTotal: number;
  location: string;        // Rack / bin
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
  drawingNo: string;
  springName: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface SalesOrder {
  id: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  poNo: string;            // Customer PO number
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
  drawingNo: string;
  springName: string;
  batchNo: string;
  qty: number;
  weightKg: number;
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
  totalWeightKg: number;
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
  items: { description: string; grade: string; qty: number; unit: string; unitPrice: number; amount: number }[];
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
  items: { drawingNo: string; springName: string; qty: number; unitPrice: number; taxPct: number; amount: number }[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: "draft" | "sent" | "partial" | "paid" | "overdue";
}

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
