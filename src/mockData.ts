import type {
  User, RawMaterial, BOMItem, ProductionOrder, QCRecord,
  FinishedGood, Customer, SalesOrder, Dispatch, Supplier, PurchaseOrder, Invoice
} from "./types";

// ── Users ────────────────────────────────────────────────────────────────────
export const DEMO_USERS: User[] = [
  { id: "u1", name: "Arun Jaiswal",  email: "admin@springmfg.com",    password: "Admin@123",    role: "superadmin", department: "Management",  active: true },
  { id: "u2", name: "Rajesh Kumar",  email: "manager@springmfg.com",  password: "Manager@123",  role: "manager",    department: "Production",  active: true },
  { id: "u3", name: "Sanjay Mehta",  email: "sales@springmfg.com",    password: "Sales@123",    role: "sales",      department: "Sales",       active: true },
  { id: "u4", name: "Ramesh Yadav",  email: "operator@springmfg.com", password: "Operator@123", role: "operator",   department: "Shop Floor",  active: true },
  { id: "u5", name: "Priya Sharma",  email: "readonly@springmfg.com", password: "Readonly@123", role: "readonly",   department: "Accounts",    active: true },
];

// ── Raw Materials ─────────────────────────────────────────────────────────────
export const MOCK_RAW_MATERIALS: RawMaterial[] = [
  { id: "rm1", heatNo: "HT-2026-001", grade: "60Si2Mn", wireDiaMm: 32, coilWeightKg: 1200, quantityCoils: 4, totalWeightKg: 4800, supplier: "SAIL (Bhilai Steel Plant)", receivedDate: "2026-07-01", millTestCert: true, status: "in_stock", remarks: "RDSO approved heat" },
  { id: "rm2", heatNo: "HT-2026-002", grade: "60Si2Mn", wireDiaMm: 38, coilWeightKg: 1500, quantityCoils: 3, totalWeightKg: 4500, supplier: "SAIL (Bhilai Steel Plant)", receivedDate: "2026-07-05", millTestCert: true, status: "in_stock" },
  { id: "rm3", heatNo: "HT-2026-003", grade: "EN45A",   wireDiaMm: 25, coilWeightKg: 900,  quantityCoils: 2, totalWeightKg: 1800, supplier: "Tata Steel Ltd",            receivedDate: "2026-07-08", millTestCert: true, status: "in_stock" },
  { id: "rm4", heatNo: "HT-2026-004", grade: "EN45A",   wireDiaMm: 19, coilWeightKg: 700,  quantityCoils: 1, totalWeightKg: 700,  supplier: "Tata Steel Ltd",            receivedDate: "2026-07-10", millTestCert: true, status: "low_stock", remarks: "Reorder required" },
  { id: "rm5", heatNo: "HT-2026-005", grade: "Chrome Vanadium", wireDiaMm: 16, coilWeightKg: 600, quantityCoils: 3, totalWeightKg: 1800, supplier: "JSW Steel Ltd", receivedDate: "2026-07-12", millTestCert: true, status: "in_stock" },
  { id: "rm6", heatNo: "HT-2026-006", grade: "60Si2Mn", wireDiaMm: 44, coilWeightKg: 2000, quantityCoils: 0, totalWeightKg: 0, supplier: "RINL (Vizag Steel)",         receivedDate: "2026-06-20", millTestCert: false, status: "out_of_stock", remarks: "Awaiting next consignment" },
];

// ── BOM ───────────────────────────────────────────────────────────────────────
export const MOCK_BOM: BOMItem[] = [
  {
    id: "bom1", drawingNo: "RDSO/SK-73006", springName: "Bogie Bolster Spring (Outer)", springType: "Bogie", customerType: "Railway",
    rdsoSpec: "RDSO/2019/CG-05", wireDiaMm: 38, outerDiaMm: 220, freeHeightMm: 450, totalCoils: 7.5, activeCoils: 5.5,
    grade: "60Si2Mn", springRateNMm: 142, fittedLoadKg: 3200, fittedHeightMm: 280, solidHeightMm: 295,
    endType: "Closed & Ground", heatTreatment: "Q&T + Shot Peening + Phosphating", weightKgEach: 18.5, rmConsumptionKg: 20.2, active: true
  },
  {
    id: "bom2", drawingNo: "RDSO/SK-73007", springName: "Bogie Bolster Spring (Inner)", springType: "Bogie", customerType: "Railway",
    rdsoSpec: "RDSO/2019/CG-05", wireDiaMm: 32, outerDiaMm: 155, freeHeightMm: 390, totalCoils: 8, activeCoils: 6,
    grade: "60Si2Mn", springRateNMm: 88, fittedLoadKg: 1800, fittedHeightMm: 250, solidHeightMm: 265,
    endType: "Closed & Ground", heatTreatment: "Q&T + Shot Peening + Phosphating", weightKgEach: 10.2, rmConsumptionKg: 11.5, active: true
  },
  {
    id: "bom3", drawingNo: "RDSO/SK-68100", springName: "Buffer Spring (ICF Coach)", springType: "Buffer", customerType: "Railway",
    rdsoSpec: "RDSO/2018/BG-12", wireDiaMm: 44, outerDiaMm: 280, freeHeightMm: 520, totalCoils: 6, activeCoils: 4,
    grade: "60Si2Mn", springRateNMm: 195, fittedLoadKg: 5500, fittedHeightMm: 350, solidHeightMm: 290,
    endType: "Closed & Ground", heatTreatment: "Q&T + Shot Peening", weightKgEach: 32.0, rmConsumptionKg: 35.5, active: true
  },
  {
    id: "bom4", drawingNo: "RDSO/SK-89201", springName: "Draw Gear Spring", springType: "Draw Gear", customerType: "Railway",
    rdsoSpec: "RDSO/2020/DG-03", wireDiaMm: 38, outerDiaMm: 200, freeHeightMm: 480, totalCoils: 9, activeCoils: 7,
    grade: "60Si2Mn", springRateNMm: 120, fittedLoadKg: 4200, fittedHeightMm: 310, solidHeightMm: 360,
    endType: "Closed & Ground", heatTreatment: "Q&T + Shot Peening + Phosphating", weightKgEach: 22.8, rmConsumptionKg: 25.0, active: true
  },
  {
    id: "bom5", drawingNo: "SMC-CS-001", springName: "Industrial Compression Spring 25mm", springType: "Compression", customerType: "Industrial",
    wireDiaMm: 4, outerDiaMm: 32, freeHeightMm: 120, totalCoils: 10, activeCoils: 8,
    grade: "Chrome Vanadium", springRateNMm: 18, fittedLoadKg: 45, fittedHeightMm: 90, solidHeightMm: 44,
    endType: "Closed & Squared", heatTreatment: "Stress Relieving", weightKgEach: 0.12, rmConsumptionKg: 0.14, active: true
  },
  {
    id: "bom6", drawingNo: "SMC-ES-002", springName: "Extension Spring 19mm Wire", springType: "Extension", customerType: "Local",
    wireDiaMm: 19, outerDiaMm: 95, freeHeightMm: 200, totalCoils: 12, activeCoils: 10,
    grade: "EN45A", springRateNMm: 55, fittedLoadKg: 280, fittedHeightMm: 160, solidHeightMm: 232,
    endType: "Open Hook", heatTreatment: "Stress Relieving + Zinc Plating", weightKgEach: 2.8, rmConsumptionKg: 3.1, active: true
  },
];

// ── Production Orders ─────────────────────────────────────────────────────────
export const MOCK_PRODUCTION_ORDERS: ProductionOrder[] = [
  { id: "po1", orderNo: "PRD-2026-001", bomId: "bom1", drawingNo: "RDSO/SK-73006", springName: "Bogie Bolster Spring (Outer)", plannedQty: 200, producedQty: 200, rejectedQty: 4, rawMaterialId: "rm2", heatNo: "HT-2026-002", batchNo: "B2026-001", machine: "CNC Coiling M/C #1", operatorId: "u4", operatorName: "Ramesh Yadav", startDate: "2026-07-01", targetDate: "2026-07-10", completedDate: "2026-07-09", status: "completed" },
  { id: "po2", orderNo: "PRD-2026-002", bomId: "bom2", drawingNo: "RDSO/SK-73007", springName: "Bogie Bolster Spring (Inner)", plannedQty: 200, producedQty: 186, rejectedQty: 6, rawMaterialId: "rm1", heatNo: "HT-2026-001", batchNo: "B2026-002", machine: "CNC Coiling M/C #2", operatorId: "u4", operatorName: "Ramesh Yadav", startDate: "2026-07-05", targetDate: "2026-07-14", status: "in_progress" },
  { id: "po3", orderNo: "PRD-2026-003", bomId: "bom4", drawingNo: "RDSO/SK-89201", springName: "Draw Gear Spring", plannedQty: 100, producedQty: 0, rejectedQty: 0, rawMaterialId: "rm2", heatNo: "HT-2026-002", batchNo: "B2026-003", machine: "CNC Coiling M/C #1", operatorId: "u4", operatorName: "Ramesh Yadav", startDate: "2026-07-18", targetDate: "2026-07-25", status: "planned" },
  { id: "po4", orderNo: "PRD-2026-004", bomId: "bom5", drawingNo: "SMC-CS-001", springName: "Industrial Compression Spring 25mm", plannedQty: 5000, producedQty: 5000, rejectedQty: 45, rawMaterialId: "rm5", heatNo: "HT-2026-005", batchNo: "B2026-004", machine: "Auto Coiling M/C #3", operatorId: "u4", operatorName: "Ramesh Yadav", startDate: "2026-07-06", targetDate: "2026-07-08", completedDate: "2026-07-08", status: "completed" },
];

// ── QC Records ─────────────────────────────────────────────────────────────────
export const MOCK_QC: QCRecord[] = [
  {
    id: "qc1", productionOrderId: "po1", batchNo: "B2026-001", drawingNo: "RDSO/SK-73006", springName: "Bogie Bolster Spring (Outer)",
    inspectedQty: 200, passedQty: 196, rejectedQty: 4,
    wireDiaActual: 38.1, outerDiaActual: 220.5, freeHeightActual: 451, totalCoilsActual: 7.5,
    loadTestKg: 3215, loadTestHeight: 280, loadResult: "Pass",
    hardnessHRC: 42, hardnessResult: "Pass", overallResult: "Pass",
    inspectionDate: "2026-07-10", inspectorName: "K.P. Mishra", inspectionAgency: "RITES", certificateNo: "RITES/2026/INS/0142",
  },
  {
    id: "qc2", productionOrderId: "po4", batchNo: "B2026-004", drawingNo: "SMC-CS-001", springName: "Industrial Compression Spring 25mm",
    inspectedQty: 500, passedQty: 496, rejectedQty: 4,
    wireDiaActual: 4.0, outerDiaActual: 32.1, freeHeightActual: 120.2, totalCoilsActual: 10,
    loadTestKg: 44.8, loadTestHeight: 90, loadResult: "Pass",
    hardnessResult: "Pass", overallResult: "Pass",
    inspectionDate: "2026-07-08", inspectorName: "Rajesh Kumar", inspectionAgency: "Internal",
  },
];

// ── Finished Goods ────────────────────────────────────────────────────────────
export const MOCK_FINISHED_GOODS: FinishedGood[] = [
  { id: "fg1", bomId: "bom1", drawingNo: "RDSO/SK-73006", springName: "Bogie Bolster Spring (Outer)", batchNo: "B2026-001", qcRecordId: "qc1", quantityNos: 196, weightKgTotal: 3626, location: "Rack A-1", receivedDate: "2026-07-10" },
  { id: "fg2", bomId: "bom5", drawingNo: "SMC-CS-001", springName: "Industrial Compression Spring 25mm", batchNo: "B2026-004", qcRecordId: "qc2", quantityNos: 4955, weightKgTotal: 594.6, location: "Rack C-3", receivedDate: "2026-07-08" },
];

// ── Customers ─────────────────────────────────────────────────────────────────
export const MOCK_CUSTOMERS: Customer[] = [
  { id: "c1", code: "CUST-001", name: "Indian Railways (Central Railway)", type: "Railway", gstin: "27AAAGM0289P1Z4", address: "CST Building, Mumbai – 400001", contactPerson: "Sh. A.K. Verma", phone: "9820012345", email: "procurement.cr@indianrailways.gov.in", creditDays: 60 },
  { id: "c2", code: "CUST-002", name: "Rail Coach Factory Kapurthala", type: "Railway", gstin: "03AABCR1234D1Z2", address: "RCF Campus, Kapurthala, Punjab – 144602", contactPerson: "Sh. P.S. Gill", phone: "9815098765", email: "stores.rcf@railnet.gov.in", creditDays: 45 },
  { id: "c3", code: "CUST-003", name: "RITES Limited", type: "Railway", gstin: "06AAACR1234P1Z5", address: "RITES Bhawan, Gurugram – 122001", contactPerson: "Ms. Sunita Rao", phone: "9810045678", creditDays: 30 },
  { id: "c4", code: "CUST-004", name: "Kolkata Engineering Works", type: "Industrial", gstin: "19AABCK4567G1Z8", address: "Howrah Industrial Area, Kolkata – 711101", contactPerson: "Arvind Ghosh", phone: "9830012345", creditDays: 30 },
  { id: "c5", code: "CUST-005", name: "Bengal Auto Parts", type: "Local", gstin: "19AABCB8901H1Z2", address: "Burrabazar, Kolkata – 700007", contactPerson: "Suresh Agarwal", phone: "9831234567", creditDays: 15 },
];

// ── Sales Orders ──────────────────────────────────────────────────────────────
export const MOCK_SALES_ORDERS: SalesOrder[] = [
  {
    id: "so1", orderNo: "SO-2026-001", customerId: "c1", customerName: "Indian Railways (Central Railway)",
    poNo: "CR/PROC/2026/SPR/0045", poDate: "2026-06-25",
    items: [
      { bomId: "bom1", drawingNo: "RDSO/SK-73006", springName: "Bogie Bolster Spring (Outer)", qty: 200, unitPrice: 4500, amount: 900000 },
      { bomId: "bom2", drawingNo: "RDSO/SK-73007", springName: "Bogie Bolster Spring (Inner)", qty: 200, unitPrice: 2800, amount: 560000 },
    ],
    totalAmount: 1460000, deliveryDate: "2026-07-20", status: "in_production", createdAt: "2026-06-26",
  },
  {
    id: "so2", orderNo: "SO-2026-002", customerId: "c2", customerName: "Rail Coach Factory Kapurthala",
    poNo: "RCF/STORES/2026/0312", poDate: "2026-07-02",
    items: [
      { bomId: "bom4", drawingNo: "RDSO/SK-89201", springName: "Draw Gear Spring", qty: 100, unitPrice: 6200, amount: 620000 },
    ],
    totalAmount: 620000, deliveryDate: "2026-07-28", status: "confirmed", createdAt: "2026-07-03",
  },
  {
    id: "so3", orderNo: "SO-2026-003", customerId: "c4", customerName: "Kolkata Engineering Works",
    poNo: "KEW/PO/2026/189", poDate: "2026-07-10",
    items: [
      { bomId: "bom5", drawingNo: "SMC-CS-001", springName: "Industrial Compression Spring 25mm", qty: 5000, unitPrice: 38, amount: 190000 },
    ],
    totalAmount: 190000, deliveryDate: "2026-07-15", status: "dispatched", createdAt: "2026-07-10",
  },
];

// ── Dispatch ──────────────────────────────────────────────────────────────────
export const MOCK_DISPATCHES: Dispatch[] = [
  {
    id: "d1", challanNo: "DC-2026-001", salesOrderId: "so3", customerId: "c4", customerName: "Kolkata Engineering Works",
    dispatchDate: "2026-07-14",
    items: [{ drawingNo: "SMC-CS-001", springName: "Industrial Compression Spring 25mm", batchNo: "B2026-004", qty: 5000, weightKg: 600 }],
    totalQty: 5000, totalWeightKg: 600, vehicleNo: "WB-02-AB-1234", driverName: "Sunil Das", eWayBillNo: "291426789012",
  },
];

// ── Suppliers ─────────────────────────────────────────────────────────────────
export const MOCK_SUPPLIERS: Supplier[] = [
  { id: "s1", code: "SUP-001", name: "SAIL (Bhilai Steel Plant)",   gstin: "22AABCS1234G1Z5", address: "Bhilai Steel Plant, Bhilai, CG – 490001", contactPerson: "R.K. Singh",     phone: "9893012345", creditDays: 30 },
  { id: "s2", code: "SUP-002", name: "Tata Steel Ltd",               gstin: "20AABCT9876H1Z3", address: "Tata Centre, 43 JN Road, Kolkata – 700071", contactPerson: "Amit Roy",     phone: "9830023456", creditDays: 45 },
  { id: "s3", code: "SUP-003", name: "JSW Steel Ltd",                gstin: "29AABCJ5432F1Z7", address: "JSW Centre, Bandra Kurla, Mumbai – 400051", contactPerson: "Rahul Shah",   phone: "9820034567", creditDays: 30 },
  { id: "s4", code: "SUP-004", name: "RINL (Vizag Steel)",           gstin: "37AABCR6543E1Z9", address: "Steel Plant Road, Visakhapatnam – 530031", contactPerson: "P. Narayana",   phone: "9866045678", creditDays: 45 },
];

// ── Purchase Orders ───────────────────────────────────────────────────────────
export const MOCK_PO: PurchaseOrder[] = [
  {
    id: "p1", poNo: "PO-2026-001", supplierId: "s1", supplierName: "SAIL (Bhilai Steel Plant)",
    items: [{ description: "Wire Rod 38mm dia", grade: "60Si2Mn IS-3195", qty: 5, unit: "MT", unitPrice: 72000, amount: 360000 }],
    totalAmount: 360000, poDate: "2026-06-25", expectedDate: "2026-07-05", status: "received",
  },
  {
    id: "p2", poNo: "PO-2026-002", supplierId: "s2", supplierName: "Tata Steel Ltd",
    items: [{ description: "Wire Rod 25mm dia", grade: "EN45A IS-3195", qty: 2, unit: "MT", unitPrice: 68000, amount: 136000 }],
    totalAmount: 136000, poDate: "2026-07-01", expectedDate: "2026-07-10", status: "received",
  },
  {
    id: "p3", poNo: "PO-2026-003", supplierId: "s1", supplierName: "SAIL (Bhilai Steel Plant)",
    items: [{ description: "Wire Rod 44mm dia", grade: "60Si2Mn IS-3195", qty: 6, unit: "MT", unitPrice: 74000, amount: 444000 }],
    totalAmount: 444000, poDate: "2026-07-15", expectedDate: "2026-07-28", status: "sent",
  },
];

// ── Invoices ──────────────────────────────────────────────────────────────────
export const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv1", invoiceNo: "SMC/INV/2026/001", salesOrderId: "so3", customerId: "c4", customerName: "Kolkata Engineering Works",
    gstin: "19AABCK4567G1Z8", invoiceDate: "2026-07-14", dueDate: "2026-08-13",
    items: [{ drawingNo: "SMC-CS-001", springName: "Industrial Compression Spring 25mm", qty: 5000, unitPrice: 38, taxPct: 18, amount: 190000 }],
    subtotal: 190000, taxAmount: 34200, totalAmount: 224200, paidAmount: 224200, balanceAmount: 0, status: "paid",
  },
];
