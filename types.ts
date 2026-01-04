export enum ItemCategory {
  PHARMACEUTICALS = 'Pharmaceuticals',
  SURGICAL_SUPPLIES = 'Surgical Supplies',
  PPE = 'PPE',
  DIAGNOSTICS = 'Diagnostics',
  EQUIPMENT = 'Equipment',
}

export enum StockStatus {
  IN_STOCK = 'In Stock',
  LOW_STOCK = 'Low Stock',
  OUT_OF_STOCK = 'Out of Stock',
  EXPIRED = 'Expired',
}

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  itemId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string; // ISO string
}

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  batchNumber: string;
  quantity: number;
  minLevel: number;
  unit: string;
  expiryDate: string; // YYYY-MM-DD
  location: string;
  supplier: string;
  lastUpdated: string;
  isLiquid?: boolean; // New flag for liquid logic
  totalVolumeMl?: number; // Total volume of a single unit/vial
}

// New Interface: Represents a physical vial on the shelf
export interface MedicationVial {
  id: string;
  inventoryItemId: string; // Links to the parent SKU
  batchNumber: string;
  expiryDate: string;
  totalVolumeMl: number;
  remainingVolumeMl: number;
  status: 'ACTIVE' | 'EMPTY' | 'EXPIRED' | 'QUARANTINED';
}

// New Interface: Audit trail for liquid deductions
export interface DispenseLog {
  id: string;
  prescriptionId: string;
  vialId: string;
  deductedMl: number;
  remainingAfter: number;
  timestamp: string;
}

export interface Prescription {
  id: string;
  patientName: string;
  patientAge: number;
  medicationId: string;
  medicationName: string;
  dosage: string; // Text description
  // New fields for liquid logic
  doseAmountMl?: number; 
  totalShots?: number;
  bufferMl?: number; // Extra volume for wastage/dead space
  
  dispenseQty: number; // Quantity in inventory units (e.g., number of tablets/vials)
  frequency: string;
  notes: string;
  target: 'pharmacy' | 'nursing'; // Pharmacy = Dispense/Sell, Nursing = Inject/Administer
  status: 'pending' | 'completed' | 'cancelled';
  timestamp: string;
  doctorName: string;
}

export interface MedicalHistoryRecord {
  id: string;
  date: string;
  medicationName: string;
  action: 'Dispensed' | 'Injected';
  dosage: string;
  doctorName: string;
  notes?: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodType?: string;
  contact: string;
  lastVisit: string;
  history: MedicalHistoryRecord[];
  // Client Portal Access
  username?: string;
  password?: string;
  // Identity Documents
  emiratesId?: string;
  passportId?: string;
  idExpiryDate?: string; // YYYY-MM-DD
}

export type EmployeeRole = 'Doctor' | 'Nurse' | 'Pharmacist' | 'Admin' | 'Logistics';
export type EmployeeStatus = 'Active' | 'On Leave' | 'Inactive';
export type ViewState = 'dashboard' | 'schedule' | 'inventory' | 'prescriptions' | 'clients' | 'employees' | 'alerts' | 'reports' | 'settings';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  department: string;
  contact: string;
  email: string;
  status: EmployeeStatus;
  joinDate: string;
  username: string;
  password: string; // Note: In a real production app, never store plain text passwords on the client.
  permissions: ViewState[];
}

export interface DoctorAvailability {
  doctorId: string;
  doctorName: string;
  days: string[]; // e.g., ['Mon', 'Tue', 'Fri']
  startTime: string; // "09:00"
  endTime: string; // "17:00"
}

// New Interface: Specific daily override for a doctor
export interface DoctorShift {
  id: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "08:00"
  endTime: string; // "14:00"
  type: 'Work' | 'Off';
  note?: string;
}

export interface Appointment {
  id: string;
  patientId?: string; // If registered
  patientName: string;
  contact: string;
  doctorId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: 'Checkup' | 'Consultation' | 'Emergency' | 'Follow-up';
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
  isNewPatient: boolean;
}

export interface AIAnalysisResult {
  summary: string;
  criticalAlerts: string[];
  restockRecommendations: { itemName: string; reason: string; suggestedQuantity: number }[];
  expiryWarnings: string[];
}