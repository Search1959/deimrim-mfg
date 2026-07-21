import type {
  User, RawMaterial, BOMItem, ProductionOrder, QCRecord,
  FinishedGood, Customer, SalesOrder, Dispatch, Supplier, PurchaseOrder, Invoice
} from "./types";

// ── Users ────────────────────────────────────────────────────────────────────
export const DEMO_USERS: User[] = [
  { id: "u1", name: "Arun Jaiswal",  email: "admin@deinrim.com",    password: "Admin@123",    role: "superadmin", department: "Management",  active: true },
  { id: "u2", name: "Rajesh Kumar",  email: "manager@deinrim.com",  password: "Manager@123",  role: "manager",    department: "Production",  active: true },
  { id: "u3", name: "Sanjay Mehta",  email: "sales@deinrim.com",    password: "Sales@123",    role: "sales",      department: "Sales",       active: true },
  { id: "u4", name: "Ramesh Yadav",  email: "operator@deinrim.com", password: "Operator@123", role: "operator",   department: "Shop Floor",  active: true },
  { id: "u5", name: "Priya Sharma",  email: "readonly@deinrim.com", password: "Readonly@123", role: "readonly",   department: "Accounts",    active: true },
];

// ── Raw Materials (generic) ───────────────────────────────────────────────────
export const MOCK_RAW_MATERIALS: RawMaterial[] = [
  { id: "rm1", code: "RM-001", name: "60Si2Mn Wire Rod 38mm",       category: "Alloy Steel",  unit: "kg", quantity: 4500, unitCost: 72, totalValue: 324000, supplier: "SAIL (Bhilai Steel Plant)", receivedDate: "2026-07-05", batchNo: "HT-2026-002", status: "in_stock",     minStock: 1000, location: "RM Store A", remarks: "RDSO approved heat" },
  { id: "rm2", code: "RM-002", name: "60Si2Mn Wire Rod 32mm",       category: "Alloy Steel",  unit: "kg", quantity: 4800, unitCost: 72, totalValue: 345600, supplier: "SAIL (Bhilai Steel Plant)", receivedDate: "2026-07-01", batchNo: "HT-2026-001", status: "in_stock",     minStock: 1000, location: "RM Store A" },
  { id: "rm3", code: "RM-003", name: "EN45A Wire Rod 25mm",         category: "Alloy Steel",  unit: "kg", quantity: 1800, unitCost: 68, totalValue: 122400, supplier: "Tata Steel Ltd",             receivedDate: "2026-07-08", batchNo: "HT-2026-003", status: "in_stock",     minStock: 500,  location: "RM Store B" },
  { id: "rm4", code: "RM-004", name: "EN45A Wire Rod 19mm",         category: "Alloy Steel",  unit: "kg", quantity: 700,  unitCost: 68, totalValue: 47600,  supplier: "Tata Steel Ltd",             receivedDate: "2026-07-10", batchNo: "HT-2026-004", status: "low_stock",    minStock: 800,  location: "RM Store B", remarks: "Reorder required" },
  { id: "rm5", code: "RM-005", name: "Chrome Vanadium Wire Rod 4mm",category: "Alloy Steel",  unit: "kg", quantity: 1800, unitCost: 90, totalValue: 162000, supplier: "JSW Steel Ltd",              receivedDate: "2026-07-12", batchNo: "HT-2026-005", status: "in_stock",     minStock: 400,  location: "RM Store C" },
  { id: "rm6", code: "RM-006", name: "60Si2Mn Wire Rod 44mm",       category: "Alloy Steel",  unit: "kg", quantity: 0,    unitCost: 74, totalValue: 0,      supplier: "RINL (Vizag Steel)",         receivedDate: "2026-06-20", batchNo: "HT-2026-006", status: "out_of_stock", minStock: 2000, location: "RM Store A", remarks: "Awaiting next consignment" },
];

// ── BOM (generic — spring data kept as demo) ──────────────────────────────────
export const MOCK_BOM: BOMItem[] = [
  {
    id: "bom1", productCode: "RDSO/SK-73006", productName: "Bogie Bolster Spring (Outer)", category: "Railway Springs",
    unit: "pcs", customerType: "Railway", revision: "Rev C", status: "active",
    specifications: "Wire Dia: 38mm | OD: 220mm | Free Height: 450mm | Total Coils: 7.5 | Spring Rate: 142 N/mm | Fitted Load: 3200 kg | Heat Treatment: Q&T + Shot Peening + Phosphating | End: Closed & Ground | Spec: RDSO/2019/CG-05",
    rawMaterials: [{ materialId: "rm1", materialName: "60Si2Mn Wire Rod 38mm", qtyPerUnit: 20.2, unit: "kg" }],
    labourHrsPerUnit: 1.5, machineHrsPerUnit: 0.8, costPerUnit: 3800,
  },
  {
    id: "bom2", productCode: "RDSO/SK-73007", productName: "Bogie Bolster Spring (Inner)", category: "Railway Springs",
    unit: "pcs", customerType: "Railway", revision: "Rev B", status: "active",
    specifications: "Wire Dia: 32mm | OD: 155mm | Free Height: 390mm | Total Coils: 8 | Spring Rate: 88 N/mm | Fitted Load: 1800 kg | Heat Treatment: Q&T + Shot Peening + Phosphating | End: Closed & Ground | Spec: RDSO/2019/CG-05",
    rawMaterials: [{ materialId: "rm2", materialName: "60Si2Mn Wire Rod 32mm", qtyPerUnit: 11.5, unit: "kg" }],
    labourHrsPerUnit: 1.2, machineHrsPerUnit: 0.6, costPerUnit: 2400,
  },
  {
    id: "bom3", productCode: "RDSO/SK-68100", productName: "Buffer Spring (ICF Coach)", category: "Railway Springs",
    unit: "pcs", customerType: "Railway", revision: "Rev A", status: "active",
    specifications: "Wire Dia: 44mm | OD: 280mm | Free Height: 520mm | Total Coils: 6 | Spring Rate: 195 N/mm | Fitted Load: 5500 kg | Heat Treatment: Q&T + Shot Peening | End: Closed & Ground | Spec: RDSO/2018/BG-12",
    rawMaterials: [{ materialId: "rm6", materialName: "60Si2Mn Wire Rod 44mm", qtyPerUnit: 35.5, unit: "kg" }],
    labourHrsPerUnit: 2.0, machineHrsPerUnit: 1.2, costPerUnit: 5200,
  },
  {
    id: "bom4", productCode: "RDSO/SK-89201", productName: "Draw Gear Spring", category: "Railway Springs",
    unit: "pcs", customerType: "Railway", revision: "Rev A", status: "active",
    specifications: "Wire Dia: 38mm | OD: 200mm | Free Height: 480mm | Total Coils: 9 | Spring Rate: 120 N/mm | Fitted Load: 4200 kg | Heat Treatment: Q&T + Shot Peening + Phosphating | End: Closed & Ground | Spec: RDSO/2020/DG-03",
    rawMaterials: [{ materialId: "rm1", materialName: "60Si2Mn Wire Rod 38mm", qtyPerUnit: 25.0, unit: "kg" }],
    labourHrsPerUnit: 1.8, machineHrsPerUnit: 1.0, costPerUnit: 5000,
  },
  {
    id: "bom5", productCode: "SMC-CS-001", productName: "Industrial Compression Spring 25mm", category: "Industrial Springs",
    unit: "pcs", customerType: "Industrial", revision: "Rev A", status: "active",
    specifications: "Wire Dia: 4mm | OD: 32mm | Free Height: 120mm | Total Coils: 10 | Spring Rate: 18 N/mm | Fitted Load: 45 kg | Heat Treatment: Stress Relieving | End: Closed & Squared | Grade: Chrome Vanadium",
    rawMaterials: [{ materialId: "rm5", materialName: "Chrome Vanadium Wire Rod 4mm", qtyPerUnit: 0.14, unit: "kg" }],
    labourHrsPerUnit: 0.05, machineHrsPerUnit: 0.02, costPerUnit: 30,
  },
  {
    id: "bom6", productCode: "SMC-ES-002", productName: "Extension Spring 19mm Wire", category: "Industrial Springs",
    unit: "pcs", customerType: "Other", revision: "Rev A", status: "active",
    specifications: "Wire Dia: 19mm | OD: 95mm | Free Height: 200mm | Total Coils: 12 | Spring Rate: 55 N/mm | Fitted Load: 280 kg | Heat Treatment: Stress Relieving + Zinc Plating | End: Open Hook | Grade: EN45A",
    rawMaterials: [{ materialId: "rm4", materialName: "EN45A Wire Rod 19mm", qtyPerUnit: 3.1, unit: "kg" }],
    labourHrsPerUnit: 0.3, machineHrsPerUnit: 0.15, costPerUnit: 220,
  },
];

// ── Production Orders ─────────────────────────────────────────────────────────
export const MOCK_PRODUCTION_ORDERS: ProductionOrder[] = [
  { id: "po1", orderNo: "PRD-2026-001", bomId: "bom1", productCode: "RDSO/SK-73006", productName: "Bogie Bolster Spring (Outer)", plannedQty: 200, producedQty: 200, rejectedQty: 4,  batchNo: "B2026-001", machine: "CNC Coiling M/C #1", operatorId: "u4", operatorName: "Ramesh Yadav", startDate: "2026-07-01", targetDate: "2026-07-10", completedDate: "2026-07-09", status: "completed" },
  { id: "po2", orderNo: "PRD-2026-002", bomId: "bom2", productCode: "RDSO/SK-73007", productName: "Bogie Bolster Spring (Inner)", plannedQty: 200, producedQty: 186, rejectedQty: 6,  batchNo: "B2026-002", machine: "CNC Coiling M/C #2", operatorId: "u4", operatorName: "Ramesh Yadav", startDate: "2026-07-05", targetDate: "2026-07-14", status: "in_progress" },
  { id: "po3", orderNo: "PRD-2026-003", bomId: "bom4", productCode: "RDSO/SK-89201", productName: "Draw Gear Spring",            plannedQty: 100, producedQty: 0,   rejectedQty: 0,  batchNo: "B2026-003", machine: "CNC Coiling M/C #1", operatorId: "u4", operatorName: "Ramesh Yadav", startDate: "2026-07-18", targetDate: "2026-07-25", status: "planned" },
  { id: "po4", orderNo: "PRD-2026-004", bomId: "bom5", productCode: "SMC-CS-001",    productName: "Industrial Compression Spring 25mm", plannedQty: 5000, producedQty: 5000, rejectedQty: 45, batchNo: "B2026-004", machine: "Auto Coiling M/C #3", operatorId: "u4", operatorName: "Ramesh Yadav", startDate: "2026-07-06", targetDate: "2026-07-08", completedDate: "2026-07-08", status: "completed" },
];

// ── QC Records ────────────────────────────────────────────────────────────────
export const MOCK_QC: QCRecord[] = [
  {
    id: "qc1", productionOrderId: "po1", batchNo: "B2026-001", productCode: "RDSO/SK-73006", productName: "Bogie Bolster Spring (Outer)",
    inspectedQty: 200, passedQty: 196, rejectedQty: 4,
    checks: [
      { parameter: "Wire Diameter", specification: "38 ± 0.3 mm",  actual: "38.1 mm",  result: "Pass" },
      { parameter: "Outer Diameter", specification: "220 ± 2 mm",  actual: "220.5 mm", result: "Pass" },
      { parameter: "Free Height",   specification: "450 ± 3 mm",   actual: "451 mm",   result: "Pass" },
      { parameter: "Load Test",     specification: "3200 ± 5% kg", actual: "3215 kg",  result: "Pass" },
      { parameter: "Hardness",      specification: "40–45 HRC",    actual: "42 HRC",   result: "Pass" },
    ],
    overallResult: "Pass", inspectionDate: "2026-07-10", inspectorName: "K.P. Mishra",
    inspectionAgency: "RITES", certificateNo: "RITES/2026/INS/0142",
  },
  {
    id: "qc2", productionOrderId: "po4", batchNo: "B2026-004", productCode: "SMC-CS-001", productName: "Industrial Compression Spring 25mm",
    inspectedQty: 500, passedQty: 496, rejectedQty: 4,
    checks: [
      { parameter: "Wire Diameter", specification: "4 ± 0.05 mm",  actual: "4.0 mm",   result: "Pass" },
      { parameter: "Outer Diameter", specification: "32 ± 0.5 mm", actual: "32.1 mm",  result: "Pass" },
      { parameter: "Free Height",   specification: "120 ± 1.5 mm", actual: "120.2 mm", result: "Pass" },
      { parameter: "Load Test",     specification: "45 ± 3 kg",    actual: "44.8 kg",  result: "Pass" },
    ],
    overallResult: "Pass", inspectionDate: "2026-07-08", inspectorName: "Rajesh Kumar", inspectionAgency: "Internal",
  },
];

// ── Finished Goods ────────────────────────────────────────────────────────────
export const MOCK_FINISHED_GOODS: FinishedGood[] = [
  { id: "fg1", bomId: "bom1", productCode: "RDSO/SK-73006", productName: "Bogie Bolster Spring (Outer)", batchNo: "B2026-001", qcRecordId: "qc1", quantityNos: 196, unit: "pcs", location: "Rack A-1", receivedDate: "2026-07-10" },
  { id: "fg2", bomId: "bom5", productCode: "SMC-CS-001",    productName: "Industrial Compression Spring 25mm",  batchNo: "B2026-004", qcRecordId: "qc2", quantityNos: 4955, unit: "pcs", location: "Rack C-3", receivedDate: "2026-07-08" },
];

// ── Customers ─────────────────────────────────────────────────────────────────
export const MOCK_CUSTOMERS: Customer[] = [
  { id: "c1", code: "CUST-001", name: "Indian Railways (Central Railway)", type: "Railway",    gstin: "27AAAGM0289P1Z4", address: "CST Building, Mumbai – 400001",             contactPerson: "Sh. A.K. Verma",  phone: "9820012345", email: "procurement.cr@indianrailways.gov.in", creditDays: 60 },
  { id: "c2", code: "CUST-002", name: "Rail Coach Factory Kapurthala",    type: "Railway",    gstin: "03AABCR1234D1Z2", address: "RCF Campus, Kapurthala, Punjab – 144602",   contactPerson: "Sh. P.S. Gill",   phone: "9815098765", email: "stores.rcf@railnet.gov.in",             creditDays: 45 },
  { id: "c3", code: "CUST-003", name: "RITES Limited",                    type: "Railway",    gstin: "06AAACR1234P1Z5", address: "RITES Bhawan, Gurugram – 122001",           contactPerson: "Ms. Sunita Rao",  phone: "9810045678",                                                creditDays: 30 },
  { id: "c4", code: "CUST-004", name: "Kolkata Engineering Works",        type: "Industrial", gstin: "19AABCK4567G1Z8", address: "Howrah Industrial Area, Kolkata – 711101",  contactPerson: "Arvind Ghosh",    phone: "9830012345",                                                creditDays: 30 },
  { id: "c5", code: "CUST-005", name: "Bengal Auto Parts",                type: "Other",      gstin: "19AABCB8901H1Z2", address: "Burrabazar, Kolkata – 700007",              contactPerson: "Suresh Agarwal",  phone: "9831234567",                                                creditDays: 15 },
];

// ── Sales Orders ──────────────────────────────────────────────────────────────
export const MOCK_SALES_ORDERS: SalesOrder[] = [
  {
    id: "so1", orderNo: "SO-2026-001", customerId: "c1", customerName: "Indian Railways (Central Railway)",
    poNo: "CR/PROC/2026/SPR/0045", poDate: "2026-06-25",
    items: [
      { bomId: "bom1", productCode: "RDSO/SK-73006", productName: "Bogie Bolster Spring (Outer)", qty: 200, unitPrice: 4500, amount: 900000 },
      { bomId: "bom2", productCode: "RDSO/SK-73007", productName: "Bogie Bolster Spring (Inner)", qty: 200, unitPrice: 2800, amount: 560000 },
    ],
    totalAmount: 1460000, deliveryDate: "2026-07-20", status: "in_production", createdAt: "2026-06-26",
  },
  {
    id: "so2", orderNo: "SO-2026-002", customerId: "c2", customerName: "Rail Coach Factory Kapurthala",
    poNo: "RCF/STORES/2026/0312", poDate: "2026-07-02",
    items: [
      { bomId: "bom4", productCode: "RDSO/SK-89201", productName: "Draw Gear Spring", qty: 100, unitPrice: 6200, amount: 620000 },
    ],
    totalAmount: 620000, deliveryDate: "2026-07-28", status: "confirmed", createdAt: "2026-07-03",
  },
  {
    id: "so3", orderNo: "SO-2026-003", customerId: "c4", customerName: "Kolkata Engineering Works",
    poNo: "KEW/PO/2026/189", poDate: "2026-07-10",
    items: [
      { bomId: "bom5", productCode: "SMC-CS-001", productName: "Industrial Compression Spring 25mm", qty: 5000, unitPrice: 38, amount: 190000 },
    ],
    totalAmount: 190000, deliveryDate: "2026-07-15", status: "dispatched", createdAt: "2026-07-10",
  },
];

// ── Dispatch ──────────────────────────────────────────────────────────────────
export const MOCK_DISPATCHES: Dispatch[] = [
  {
    id: "d1", challanNo: "DC-2026-001", salesOrderId: "so3", customerId: "c4", customerName: "Kolkata Engineering Works",
    dispatchDate: "2026-07-14",
    items: [{ productCode: "SMC-CS-001", productName: "Industrial Compression Spring 25mm", batchNo: "B2026-004", qty: 5000, unit: "pcs" }],
    totalQty: 5000, vehicleNo: "WB-02-AB-1234", driverName: "Sunil Das", eWayBillNo: "291426789012",
  },
];

// ── Suppliers ─────────────────────────────────────────────────────────────────
export const MOCK_SUPPLIERS: Supplier[] = [
  { id: "s1", code: "SUP-001", name: "SAIL (Bhilai Steel Plant)", gstin: "22AABCS1234G1Z5", address: "Bhilai Steel Plant, Bhilai, CG – 490001",       contactPerson: "R.K. Singh",   phone: "9893012345", creditDays: 30 },
  { id: "s2", code: "SUP-002", name: "Tata Steel Ltd",            gstin: "20AABCT9876H1Z3", address: "Tata Centre, 43 JN Road, Kolkata – 700071",      contactPerson: "Amit Roy",     phone: "9830023456", creditDays: 45 },
  { id: "s3", code: "SUP-003", name: "JSW Steel Ltd",             gstin: "29AABCJ5432F1Z7", address: "JSW Centre, Bandra Kurla, Mumbai – 400051",      contactPerson: "Rahul Shah",   phone: "9820034567", creditDays: 30 },
  { id: "s4", code: "SUP-004", name: "RINL (Vizag Steel)",        gstin: "37AABCR6543E1Z9", address: "Steel Plant Road, Visakhapatnam – 530031",       contactPerson: "P. Narayana",  phone: "9866045678", creditDays: 45 },
];

// ── Purchase Orders ───────────────────────────────────────────────────────────
export const MOCK_PO: PurchaseOrder[] = [
  { id: "p1", poNo: "PO-2026-001", supplierId: "s1", supplierName: "SAIL (Bhilai Steel Plant)", items: [{ description: "60Si2Mn Wire Rod 38mm", qty: 5000, unit: "kg", unitPrice: 72, amount: 360000 }], totalAmount: 360000, poDate: "2026-06-25", expectedDate: "2026-07-05", status: "received" },
  { id: "p2", poNo: "PO-2026-002", supplierId: "s2", supplierName: "Tata Steel Ltd",            items: [{ description: "EN45A Wire Rod 25mm",    qty: 2000, unit: "kg", unitPrice: 68, amount: 136000 }], totalAmount: 136000, poDate: "2026-07-01", expectedDate: "2026-07-10", status: "received" },
  { id: "p3", poNo: "PO-2026-003", supplierId: "s1", supplierName: "SAIL (Bhilai Steel Plant)", items: [{ description: "60Si2Mn Wire Rod 44mm",    qty: 6000, unit: "kg", unitPrice: 74, amount: 444000 }], totalAmount: 444000, poDate: "2026-07-15", expectedDate: "2026-07-28", status: "sent" },
];

// ── Invoices ──────────────────────────────────────────────────────────────────
export const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv1", invoiceNo: "SMC/INV/2026/001", salesOrderId: "so3", customerId: "c4", customerName: "Kolkata Engineering Works",
    gstin: "19AABCK4567G1Z8", invoiceDate: "2026-07-14", dueDate: "2026-08-13",
    items: [{ productCode: "SMC-CS-001", productName: "Industrial Compression Spring 25mm", qty: 5000, unit: "pcs", unitPrice: 38, taxPct: 18, amount: 190000 }],
    subtotal: 190000, taxAmount: 34200, totalAmount: 224200, paidAmount: 224200, balanceAmount: 0, status: "paid",
  },
];
