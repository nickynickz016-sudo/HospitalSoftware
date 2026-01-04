import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  Bell, 
  Search, 
  Plus, 
  Upload, 
  Download, 
  Trash2,
  Edit2,
  AlertOctagon,
  Calendar,
  Camera,
  FileText,
  Activity,
  History,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Eye,
  CheckSquare,
  XSquare,
  Save,
  Menu,
  X,
  Check,
  Info,
  Stethoscope,
  Pill,
  Syringe,
  User,
  Clock,
  Users,
  FileClock,
  ArrowLeft,
  Droplet,
  FileDown,
  Briefcase,
  Mail,
  Phone,
  CalendarDays,
  UserPlus,
  CreditCard,
  List,
  Grid
} from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { InventoryItem, ItemCategory, StockStatus, AIAnalysisResult, ViewState, AppNotification, Prescription, ClientProfile, Employee, EmployeeRole, EmployeeStatus, Appointment, DoctorAvailability, MedicationVial, DispenseLog, DoctorShift } from './types';
import StockChart from './components/StockChart';
import InventoryModal from './components/InventoryModal';
import PrescriptionModal from './components/PrescriptionModal';
import ClientModal from './components/ClientModal';
import EmployeeModal from './components/EmployeeModal';
import AppointmentModal from './components/AppointmentModal';
import AvailabilityModal from './components/AvailabilityModal';
import ShiftModal from './components/ShiftModal';
import ThreeMonthCalendar from './components/ThreeMonthCalendar';
import AIInsightPanel from './components/AIInsightPanel';
import { analyzeInventoryWithGemini } from './services/geminiService';
import { processLiquidDispensing } from './services/inventoryLogic';

// Mock Data
const MOCK_DATA: InventoryItem[] = [
  { id: '1', name: 'Paracetamol 500mg', category: ItemCategory.PHARMACEUTICALS, batchNumber: 'B-101', quantity: 5000, minLevel: 1000, unit: 'tablets', expiryDate: '2025-12-31', location: 'Shelf A-1', supplier: 'PharmaCorp', lastUpdated: '2023-10-25' },
  { id: '2', name: 'Surgical Masks (N95)', category: ItemCategory.PPE, batchNumber: 'PPE-22', quantity: 45, minLevel: 100, unit: 'boxes', expiryDate: '2024-05-15', location: 'Room 3', supplier: 'SafeMed', lastUpdated: '2023-10-24' },
  // Insulin is now marked as liquid
  { id: '3', name: 'Insulin Glargine', category: ItemCategory.PHARMACEUTICALS, batchNumber: 'INS-99', quantity: 12, minLevel: 20, unit: 'vials', expiryDate: '2023-11-10', location: 'Fridge 2', supplier: 'BioLife', lastUpdated: '2023-10-26', isLiquid: true, totalVolumeMl: 10 },
  { id: '4', name: 'Sterile Gloves (L)', category: ItemCategory.SURGICAL_SUPPLIES, batchNumber: 'GLV-05', quantity: 200, minLevel: 50, unit: 'pairs', expiryDate: '2026-01-20', location: 'Shelf B-2', supplier: 'GlovesInc', lastUpdated: '2023-10-20' },
  { id: '5', name: 'Amoxicillin 250mg', category: ItemCategory.PHARMACEUTICALS, batchNumber: 'AMX-44', quantity: 800, minLevel: 200, unit: 'capsules', expiryDate: '2024-08-30', location: 'Shelf A-3', supplier: 'PharmaCorp', lastUpdated: '2023-10-25' },
  { id: '6', name: 'Defibrillator Pads', category: ItemCategory.EQUIPMENT, batchNumber: 'DEF-01', quantity: 5, minLevel: 8, unit: 'sets', expiryDate: '2024-02-15', location: 'ER Storage', supplier: 'MedEquip', lastUpdated: '2023-10-27' },
];

// Mock Vials for Item 3 (Insulin)
// Scenario: We have 3 vials with different expiry dates and partial volumes.
const MOCK_VIALS: MedicationVial[] = [
  { id: 'v-101', inventoryItemId: '3', batchNumber: 'INS-BATCH-A', expiryDate: '2023-11-01', totalVolumeMl: 10, remainingVolumeMl: 1.5, status: 'ACTIVE' },
  { id: 'v-102', inventoryItemId: '3', batchNumber: 'INS-BATCH-B', expiryDate: '2023-12-15', totalVolumeMl: 10, remainingVolumeMl: 10, status: 'ACTIVE' },
  { id: 'v-103', inventoryItemId: '3', batchNumber: 'INS-BATCH-C', expiryDate: '2024-01-20', totalVolumeMl: 10, remainingVolumeMl: 10, status: 'ACTIVE' },
];

const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-1001',
    patientName: 'Alice Johnson',
    patientAge: 34,
    medicationId: '1',
    medicationName: 'Paracetamol 500mg',
    dosage: '1000mg',
    dispenseQty: 2,
    frequency: 'Every 6 hours',
    notes: 'For fever',
    target: 'pharmacy',
    status: 'pending',
    timestamp: '2023-10-27T09:30:00Z',
    doctorName: 'Dr. Sarah Cole'
  },
  {
    id: 'rx-1002',
    patientName: 'Robert Smith',
    patientAge: 62,
    medicationId: '3',
    medicationName: 'Insulin Glargine',
    dosage: '0.5mL x 10 shots',
    dispenseQty: 0, 
    doseAmountMl: 0.5,
    totalShots: 10,
    bufferMl: 0.2, // Mock existing buffer
    frequency: 'Once daily at bedtime',
    notes: 'Monitor glucose levels',
    target: 'nursing',
    status: 'pending',
    timestamp: '2023-10-27T10:15:00Z',
    doctorName: 'Dr. Sarah Cole'
  }
];

const MOCK_CLIENTS: ClientProfile[] = [
  {
    id: 'c-001',
    name: 'Alice Johnson',
    age: 34,
    gender: 'Female',
    bloodType: 'A+',
    contact: '+1 (555) 0123',
    lastVisit: '2023-10-25',
    username: 'alicej',
    password: 'password123',
    emiratesId: '784-1989-1234567-1',
    idExpiryDate: '2025-10-25', // Valid
    history: [
      { id: 'h-1', date: '2023-10-25', medicationName: 'Paracetamol 500mg', action: 'Dispensed', dosage: '500mg (20 tabs)', doctorName: 'Dr. Sarah Cole', notes: 'Patient complained of headache' },
      { id: 'h-2', date: '2023-09-10', medicationName: 'Amoxicillin 250mg', action: 'Dispensed', dosage: '250mg (14 caps)', doctorName: 'Dr. Mike Ross' }
    ]
  },
  {
    id: 'c-002',
    name: 'Robert Smith',
    age: 62,
    gender: 'Male',
    bloodType: 'O-',
    contact: '+1 (555) 0987',
    lastVisit: '2023-10-27',
    username: 'bobsmith',
    password: 'securepass',
    passportId: 'N987654321',
    idExpiryDate: '2023-11-01', // Near Expiry (assuming current mock date context)
    history: [
      { id: 'h-3', date: '2023-10-27', medicationName: 'Insulin Glargine', action: 'Injected', dosage: '10 units', doctorName: 'Dr. Sarah Cole', notes: 'Routine checkup injection' },
      { id: 'h-4', date: '2023-08-15', medicationName: 'Flu Vaccine', action: 'Injected', dosage: '0.5ml', doctorName: 'Nurse Jackie' }
    ]
  },
  {
    id: 'c-003',
    name: 'Emily Davis',
    age: 28,
    gender: 'Female',
    bloodType: 'B+',
    contact: '+1 (555) 4567',
    lastVisit: '2023-06-12',
    username: 'emilyd',
    password: 'password123',
    emiratesId: '784-1995-7654321-2',
    idExpiryDate: '2022-01-01', // Expired
    history: [
       { id: 'h-5', date: '2023-06-12', medicationName: 'Ibuprofen 400mg', action: 'Dispensed', dosage: '400mg (10 tabs)', doctorName: 'Dr. Sarah Cole' }
    ]
  }
];

const MOCK_EMPLOYEES: Employee[] = [
  { 
    id: 'e-1', 
    name: 'Dr. Sarah Cole', 
    role: 'Doctor', 
    department: 'General Practice', 
    contact: '+1 (555) 1001', 
    email: 'sarah.cole@medguard.com', 
    status: 'Active', 
    joinDate: '2020-03-15',
    username: 'scole',
    password: 'password123',
    permissions: ['dashboard', 'prescriptions', 'clients', 'inventory', 'reports', 'alerts']
  },
  { 
    id: 'e-2', 
    name: 'Nurse Jackie', 
    role: 'Nurse', 
    department: 'Emergency', 
    contact: '+1 (555) 1002', 
    email: 'jackie@medguard.com', 
    status: 'Active', 
    joinDate: '2021-06-20',
    username: 'njackie',
    password: 'password123',
    permissions: ['dashboard', 'prescriptions', 'clients', 'alerts']
  },
  { 
    id: 'e-3', 
    name: 'Mike Ross', 
    role: 'Pharmacist', 
    department: 'Pharmacy', 
    contact: '+1 (555) 1003', 
    email: 'mike.ross@medguard.com', 
    status: 'On Leave', 
    joinDate: '2019-11-01',
    username: 'mross',
    password: 'password123',
    permissions: ['dashboard', 'inventory', 'alerts', 'reports']
  },
  { 
    id: 'e-4', 
    name: 'John Doe', 
    role: 'Logistics', 
    department: 'Inventory', 
    contact: '+1 (555) 1004', 
    email: 'john.d@medguard.com', 
    status: 'Active', 
    joinDate: '2022-01-10',
    username: 'jdoe',
    password: 'password123',
    permissions: ['dashboard', 'inventory', 'alerts', 'settings']
  },
];

const MOCK_AVAILABILITY: DoctorAvailability[] = [
  { doctorId: 'e-1', doctorName: 'Dr. Sarah Cole', days: ['Mon', 'Tue', 'Thu', 'Fri'], startTime: '09:00', endTime: '17:00' },
];

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'apt-1', patientId: 'c-001', patientName: 'Alice Johnson', contact: '+1 (555) 0123', doctorId: 'e-1', doctorName: 'Dr. Sarah Cole', date: new Date().toISOString().split('T')[0], time: '10:00', type: 'Checkup', status: 'Scheduled', isNewPatient: false },
  { id: 'apt-2', patientName: 'New User Dave', contact: '+1 (555) 8888', doctorId: 'e-1', doctorName: 'Dr. Sarah Cole', date: new Date().toISOString().split('T')[0], time: '11:30', type: 'Consultation', status: 'Scheduled', isNewPatient: true },
];

function App() {
  const [items, setItems] = useState<InventoryItem[]>(MOCK_DATA);
  // Add State for Vials and Logs
  const [vials, setVials] = useState<MedicationVial[]>(MOCK_VIALS);
  const [dispenseLogs, setDispenseLogs] = useState<DispenseLog[]>([]);
  
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(MOCK_PRESCRIPTIONS);
  const [clients, setClients] = useState<ClientProfile[]>(MOCK_CLIENTS);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [view, setView] = useState<ViewState>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Scheduling State
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [availability, setAvailability] = useState<DoctorAvailability[]>(MOCK_AVAILABILITY);
  const [doctorShifts, setDoctorShifts] = useState<DoctorShift[]>([]); // New State for specific shifts
  
  const [scheduleTab, setScheduleTab] = useState<'calendar' | 'availability'>('calendar');
  const [appointmentViewMode, setAppointmentViewMode] = useState<'calendar' | 'list'>('calendar');
  const [scheduleCalendarDate, setScheduleCalendarDate] = useState(new Date()); // Calendar View Pointer
  const [selectedDoctorIdForSchedule, setSelectedDoctorIdForSchedule] = useState<string>(''); // For Availability View

  // Client Management State
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null); // New State for edit

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false); // New Modal state
  const [selectedShiftDate, setSelectedShiftDate] = useState(''); // Temp state for shift modal
  
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingAvailability, setEditingAvailability] = useState<Employee | null>(null);
  
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [alertFilter, setAlertFilter] = useState<boolean>(false);
  
  // Table State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quickEditMode, setQuickEditMode] = useState(false);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);
  const notifPanelRef = useRef<HTMLDivElement>(null);

  // Helper to check ID expiry
  const checkIdValidity = (client: ClientProfile): 'valid' | 'expired' | 'near_expiry' | 'none' => {
    if (!client.idExpiryDate) return 'none';
    const today = new Date();
    today.setHours(0,0,0,0);
    const expiry = new Date(client.idExpiryDate);
    
    if (expiry < today) return 'expired';
    
    const d30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (expiry <= d30) return 'near_expiry';
    
    return 'valid';
  };

  // Generate Notifications Logic
  useEffect(() => {
    const newNotifs: AppNotification[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const d30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 1. Inventory Alerts
    items.forEach(item => {
      // Critical Stock Alert
      if (item.quantity <= item.minLevel) {
        const id = `low-${item.id}`;
        if (!dismissedIds.has(id)) {
           newNotifs.push({
             id,
             itemId: item.id,
             title: 'Critical Stock Level',
             message: `${item.name} is below minimum threshold (${item.quantity} / ${item.minLevel} ${item.unit})`,
             severity: 'critical',
             timestamp: new Date().toISOString()
           });
        }
      }

      // Expiry Alerts
      const expDate = new Date(item.expiryDate);
      expDate.setHours(0,0,0,0);

      if (expDate < today) {
         const id = `exp-${item.id}`;
         if (!dismissedIds.has(id)) {
           newNotifs.push({
             id,
             itemId: item.id,
             title: 'Item Expired',
             message: `${item.name} expired on ${item.expiryDate}`,
             severity: 'critical',
             timestamp: new Date().toISOString()
           });
         }
      } else if (expDate <= d30) {
         const id = `soon-${item.id}`;
         if (!dismissedIds.has(id)) {
           // Calculate days remaining
           const diffTime = Math.abs(expDate.getTime() - today.getTime());
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
           
           newNotifs.push({
             id,
             itemId: item.id,
             title: 'Expiring Soon',
             message: `${item.name} expires in ${diffDays} days`,
             severity: 'warning',
             timestamp: new Date().toISOString()
           });
         }
      }
    });

    // 2. Client ID Alerts
    clients.forEach(client => {
      const status = checkIdValidity(client);
      if (status === 'expired') {
        const id = `id-exp-${client.id}`;
        if (!dismissedIds.has(id)) {
          newNotifs.push({
            id,
            itemId: client.id,
            title: 'Client ID Expired',
            message: `${client.name}'s ID expired on ${client.idExpiryDate}. Services blocked.`,
            severity: 'critical',
            timestamp: new Date().toISOString()
          });
        }
      } else if (status === 'near_expiry') {
        const id = `id-soon-${client.id}`;
        if (!dismissedIds.has(id)) {
          newNotifs.push({
            id,
            itemId: client.id,
            title: 'Client ID Expiring',
            message: `${client.name}'s ID expires on ${client.idExpiryDate}.`,
            severity: 'warning',
            timestamp: new Date().toISOString()
          });
        }
      }
    });
    
    // Sort: Critical first, then by date
    newNotifs.sort((a, b) => {
        if (a.severity === 'critical' && b.severity !== 'critical') return -1;
        if (a.severity !== 'critical' && b.severity === 'critical') return 1;
        return 0;
    });

    setNotifications(newNotifs);
  }, [items, clients, dismissedIds]);

  // Click outside listener for notification panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifPanelRef.current && !notifPanelRef.current.contains(event.target as Node)) {
        setIsNotifPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Stats Logic
  const stats = useMemo(() => {
    const today = new Date();
    const d7 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const d30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const d90 = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    let totalItems = items.length;
    let criticalStock = 0;
    let exp7 = 0;
    let exp30 = 0;
    let exp90 = 0;

    items.forEach(i => {
      if (i.quantity <= i.minLevel) criticalStock++;
      
      const expDate = new Date(i.expiryDate);
      // Check if item is expiring in future (or today) but within range
      if (expDate >= today) { 
        if (expDate <= d7) exp7++;
        if (expDate <= d30) exp30++;
        if (expDate <= d90) exp90++;
      }
    });

    return { totalItems, criticalStock, exp7, exp30, exp90 };
  }, [items]);

  // Recent Updates Logic
  const recentUpdates = useMemo(() => {
    return [...items]
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 5);
  }, [items]);

  // Filtering Logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      
      let matchesAlert = true;
      if (alertFilter || view === 'alerts') {
        matchesAlert = item.quantity <= item.minLevel || 
                       new Date(item.expiryDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      }

      return matchesSearch && matchesCategory && matchesAlert;
    });
  }, [items, searchQuery, filterCategory, alertFilter, view]);

  // Handlers
  const handleAddItem = (newItem: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const item: InventoryItem = {
      ...newItem,
      id: Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setItems(prev => [...prev, item]);
  };

  const handleUpdateItem = (updatedItemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    if (!editingItem) return;
    setItems(prev => prev.map(item => 
      item.id === editingItem.id 
        ? { ...item, ...updatedItemData, lastUpdated: new Date().toISOString().split('T')[0] } 
        : item
    ));
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} items?`)) {
      setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
      setSelectedIds(new Set());
    }
  };

  const handleInlineUpdate = (id: string, field: keyof InventoryItem, value: any) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, [field]: value, lastUpdated: new Date().toISOString().split('T')[0] } 
        : item
    ));
  };

  const handleCreatePrescription = (newRx: Omit<Prescription, 'id' | 'timestamp' | 'status'>) => {
    // Check Client Validity
    const client = clients.find(c => c.name === newRx.patientName);
    if (client) {
      const idStatus = checkIdValidity(client);
      if (idStatus === 'expired') {
        alert(`BLOCKED: Patient ${client.name} has an expired ID (${client.idExpiryDate}). Cannot create prescription.`);
        return;
      }
    }

    const rx: Prescription = {
      ...newRx,
      id: `rx-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    setPrescriptions(prev => [rx, ...prev]);
    
    // Add to patient history if they exist in DB
    if (client) {
      setClients(prev => prev.map(c => {
        if (c.id === client.id) {
          return {
            ...c,
            lastVisit: new Date().toISOString().split('T')[0],
            history: [
              {
                id: `h-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                medicationName: newRx.medicationName,
                action: newRx.target === 'pharmacy' ? 'Dispensed' : 'Injected',
                dosage: newRx.dosage,
                doctorName: newRx.doctorName,
                notes: newRx.notes
              },
              ...c.history
            ]
          };
        }
        return c;
      }));
    }
  };

  const handleCompletePrescription = (rxId: string) => {
    const rx = prescriptions.find(p => p.id === rxId);
    if (!rx || rx.status !== 'pending') return;
  
    // 1. Check Patient ID Status before administering/dispensing
    const client = clients.find(c => c.name === rx.patientName);
    if (client) {
      const idStatus = checkIdValidity(client);
      if (idStatus === 'expired') {
        alert(`ACTION BLOCKED: Patient ${client.name} has an expired ID (${client.idExpiryDate}). Cannot administer or dispense.`);
        return;
      }
    }

    const itemIndex = items.findIndex(i => i.id === rx.medicationId);
    if (itemIndex === -1) {
      alert("Medication not found in inventory. Cannot dispense.");
      return;
    }
  
    const item = items[itemIndex];

    // Branch: Liquid Logic vs Unit Logic
    if (item.isLiquid && rx.doseAmountMl && rx.totalShots) {
      // 1. Process liquid logic
      const result = processLiquidDispensing(
        vials,
        item.id,
        rx.id,
        rx.doseAmountMl,
        rx.totalShots,
        rx.bufferMl || 0 // New buffer param
      );

      if (!result.success) {
        alert(result.message); // e.g. "Insufficient volume..."
        return;
      }

      // 2. Commit transaction (Update Vials State)
      setVials(prev => {
        const newVials = [...prev];
        result.updatedVials.forEach(updated => {
          const index = newVials.findIndex(v => v.id === updated.id);
          if (index !== -1) newVials[index] = updated;
        });
        return newVials;
      });

      // 3. Add Logs
      setDispenseLogs(prev => [...prev, ...result.logs]);

      // 4. Update parent aggregate quantity (optional visual sync)
      // Recalculate total quantity roughly based on Active vials count
      const activeVialsCount = vials.filter(v => v.inventoryItemId === item.id && v.status === 'ACTIVE').length;
      
      const updatedItems = [...items];
      updatedItems[itemIndex] = {
        ...item,
        quantity: activeVialsCount, // Or sum of volume, but keeping units consistent for now
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      setItems(updatedItems);

      // 5. Update Prescription
      setPrescriptions(prev => prev.map(p => 
        p.id === rxId ? { ...p, status: 'completed' } : p
      ));

      alert(result.message); // Success message

    } else {
      // Standard Unit Deduction Logic
      if (item.quantity < rx.dispenseQty) {
        alert(`Insufficient stock! Current: ${item.quantity} ${item.unit}, Required: ${rx.dispenseQty} ${item.unit}`);
        return;
      }
    
      // Update inventory
      const updatedItems = [...items];
      updatedItems[itemIndex] = {
        ...item,
        quantity: item.quantity - rx.dispenseQty,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      setItems(updatedItems);
    
      // Update prescription status
      setPrescriptions(prev => prev.map(p => 
        p.id === rxId ? { ...p, status: 'completed' } : p
      ));
    }
  };

  const handleRegisterClient = (newClientData: Omit<ClientProfile, 'id' | 'history' | 'lastVisit'>) => {
    const newClient: ClientProfile = {
      ...newClientData,
      id: `c-${Date.now()}`,
      lastVisit: 'N/A',
      history: []
    };
    setClients(prev => [...prev, newClient]);
  };

  const handleUpdateClient = (updatedData: Omit<ClientProfile, 'id' | 'history' | 'lastVisit'>) => {
    if (!editingClient) return;
    setClients(prev => prev.map(c => 
      c.id === editingClient.id 
        ? { ...c, ...updatedData } 
        : c
    ));
    setEditingClient(null);
  };

  const handleAddEmployee = (newEmployeeData: Omit<Employee, 'id' | 'joinDate'>) => {
    const newEmployee: Employee = {
      ...newEmployeeData,
      id: `e-${Date.now()}`,
      joinDate: new Date().toISOString().split('T')[0]
    };
    setEmployees(prev => [...prev, newEmployee]);
  };

  const handleUpdateEmployee = (updatedEmployeeData: Omit<Employee, 'id' | 'joinDate'>) => {
    if (!editingEmployee) return;
    setEmployees(prev => prev.map(emp => 
      emp.id === editingEmployee.id 
        ? { ...updatedEmployeeData, id: emp.id, joinDate: emp.joinDate } 
        : emp
    ));
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = (id: string) => {
     if (window.confirm('Are you sure you want to remove this employee?')) {
       setEmployees(prev => prev.filter(e => e.id !== id));
     }
  };

  const handleCreateAppointment = (newApt: Omit<Appointment, 'id' | 'status'>) => {
    // Blocking Logic for Appointments
    if (newApt.patientId) {
      const client = clients.find(c => c.id === newApt.patientId);
      if (client) {
        const idStatus = checkIdValidity(client);
        if (idStatus === 'expired') {
          alert(`ACTION BLOCKED: Patient ${client.name} has an expired ID (${client.idExpiryDate}). Cannot schedule appointment.`);
          return;
        }
      }
    }

    const apt: Appointment = {
      ...newApt,
      id: `apt-${Date.now()}`,
      status: 'Scheduled'
    };
    setAppointments(prev => [...prev, apt].sort((a,b) => a.time.localeCompare(b.time)));
  };

  const handleUpdateAvailability = (newAvail: DoctorAvailability) => {
    setAvailability(prev => {
      const exists = prev.find(a => a.doctorId === newAvail.doctorId);
      if (exists) {
        return prev.map(a => a.doctorId === newAvail.doctorId ? newAvail : a);
      }
      return [...prev, newAvail];
    });
  };

  const handleUpdateShift = (newShift: DoctorShift) => {
    setDoctorShifts(prev => {
      const index = prev.findIndex(s => s.id === newShift.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = newShift;
        return updated;
      }
      // Check if one already exists for this date/doctor to update instead of add duplicate
      const duplicateIndex = prev.findIndex(s => s.doctorId === newShift.doctorId && s.date === newShift.date);
      if (duplicateIndex !== -1) {
        const updated = [...prev];
        updated[duplicateIndex] = { ...newShift, id: prev[duplicateIndex].id }; // keep old ID
        return updated;
      }
      return [...prev, newShift];
    });
  };

  // Calendar Navigation
  const handleCalendarNavigate = (direction: 'prev' | 'next') => {
    setScheduleCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  // Click on Day in Calendar
  const handleDayClick = (dateStr: string) => {
    if (scheduleTab === 'availability' && selectedDoctorIdForSchedule) {
      setSelectedShiftDate(dateStr);
      setIsShiftModalOpen(true);
    } else if (scheduleTab === 'calendar') {
      // In appointment mode, maybe filter view or open booking (not implemented yet for this view specifically)
      alert(`Appointments for ${dateStr}`);
    }
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(12, 74, 110); // medical-900
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("MedGuard System", 14, 15);
    doc.setFontSize(10);
    doc.text("Comprehensive Prescription Report", 14, 23);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 150, 15);

    // Stats
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    doc.text(`Total Records: ${prescriptions.length}`, 14, 40);

    const tableColumn = ["Rx ID", "Patient", "Medication", "Dosage", "Type", "Doctor", "Date", "Status"];
    const tableRows = prescriptions.map(rx => [
      rx.id,
      `${rx.patientName} (${rx.patientAge})`,
      rx.medicationName,
      rx.dosage,
      rx.target === 'pharmacy' ? 'Dispensed' : 'Administered',
      rx.doctorName,
      new Date(rx.timestamp).toLocaleDateString(),
      rx.status
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { 
        fillColor: [2, 132, 199], // medical-600
        textColor: 255,
        fontSize: 10
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 3 
      },
      alternateRowStyles: {
        fillColor: [240, 249, 255]
      }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
    }

    doc.save(`medguard_rx_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeInventoryWithGemini(items);
      setAiResult(result);
    } catch (error) {
      alert("Analysis failed. Please check your API key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').slice(1);
        const newItems: InventoryItem[] = [];
        
        lines.forEach(line => {
          const cols = line.split(',');
          if (cols.length >= 5) {
             newItems.push({
               id: Math.random().toString(36).substr(2, 9),
               name: cols[0] || 'Unknown',
               category: ItemCategory.PHARMACEUTICALS,
               batchNumber: cols[1] || 'BATCH-UNK',
               quantity: parseInt(cols[2]) || 0,
               minLevel: 10,
               unit: 'units',
               expiryDate: cols[3] || '2025-01-01',
               location: 'Receiving',
               supplier: 'Unknown',
               lastUpdated: new Date().toISOString().split('T')[0]
             });
          }
        });
        
        if (newItems.length > 0) {
          setItems(prev => [...prev, ...newItems]);
          alert(`Successfully imported ${newItems.length} items.`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadCSV = () => {
    const headers = [
      'ID', 'Name', 'Category', 'Batch Number', 'Quantity', 
      'Min Level', 'Unit', 'Expiry Date', 'Location', 'Supplier', 'Last Updated'
    ];
    
    const csvContent = [
      headers.join(','),
      ...items.map(item => [
        item.id,
        `"${item.name.replace(/"/g, '""')}"`, // Escape quotes
        `"${item.category}"`,
        `"${item.batchNumber}"`,
        item.quantity,
        item.minLevel,
        `"${item.unit}"`,
        item.expiryDate,
        `"${item.location}"`,
        `"${item.supplier}"`,
        item.lastUpdated
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNavClick = (viewId: ViewState) => {
    setView(viewId);
    setSelectedClient(null); // Reset client detail view on nav change
    setIsMobileMenuOpen(false);
  };

  const handleDismissNotification = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
  };

  const handleClearAllNotifications = () => {
    const newDismissed = new Set(dismissedIds);
    notifications.forEach(n => newDismissed.add(n.id));
    setDismissedIds(newDismissed);
    setIsNotifPanelOpen(false);
  };

  // Status Helper
  const getStatus = (item: InventoryItem): StockStatus => {
    if (item.quantity === 0) return StockStatus.OUT_OF_STOCK;
    if (new Date(item.expiryDate) < new Date()) return StockStatus.EXPIRED;
    if (item.quantity <= item.minLevel) return StockStatus.LOW_STOCK;
    return StockStatus.IN_STOCK;
  };

  const getStatusColor = (status: StockStatus) => {
    switch (status) {
      case StockStatus.IN_STOCK: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case StockStatus.LOW_STOCK: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case StockStatus.OUT_OF_STOCK: return 'bg-red-500/10 text-red-400 border-red-500/20';
      case StockStatus.EXPIRED: return 'bg-gray-700/50 text-gray-400 border-gray-600/30';
    }
  };

  const NavItem = ({ id, icon: Icon, label, count }: { id: ViewState, icon: any, label: string, count?: number }) => (
    <button 
      onClick={() => handleNavClick(id)}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all mb-1 ${
        view === id 
          ? 'bg-medical-900/40 text-medical-400 border border-medical-500/20 shadow-sm shadow-black/20' 
          : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={view === id ? 'text-medical-500' : 'text-gray-500'} />
        <span className="font-medium text-sm">{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <span className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full border border-gray-700">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans overflow-hidden selection:bg-medical-900 selection:text-white">
      
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0d111c] border-r border-gray-800 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-medical-600 to-medical-800 rounded-lg flex items-center justify-center shadow-lg shadow-medical-900/50">
              <Activity className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white leading-tight">MedGuard</h1>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Inventory AI</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="mb-6">
            <button 
              onClick={() => { setIsModalOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full bg-medical-600 hover:bg-medical-500 text-white rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-lg shadow-medical-900/30 border border-medical-500/50 group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" /> 
              Add New Item
            </button>
          </div>

          <div className="space-y-1">
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem id="schedule" icon={CalendarDays} label="Scheduling" />
            <NavItem id="prescriptions" icon={Stethoscope} label="Doctor Rx" />
            <NavItem id="clients" icon={Users} label="Client Database" />
            <NavItem id="employees" icon={Briefcase} label="Staff Directory" />
            <NavItem id="inventory" icon={Package} label="Inventory" count={stats.totalItems} />
            <NavItem id="alerts" icon={AlertOctagon} label="Alerts" count={stats.criticalStock} />
            <NavItem id="reports" icon={FileText} label="Reports" />
            <NavItem id="settings" icon={Settings} label="Settings" />
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800/50">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Quick Actions</div>
            <label className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 cursor-pointer transition-colors text-sm">
               <Upload size={16} /> Import CSV
               <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
            </label>
            <button onClick={handleDownloadCSV} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors text-sm">
               <Download size={16} /> Export CSV
            </button>
            <button onClick={() => alert("Camera permission required.")} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors text-sm">
               <Camera size={16} /> Scan Barcode
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0b0f19] w-full">
        {/* Top Header */}
        <header className="h-16 bg-[#0d111c]/80 backdrop-blur-xl border-b border-gray-800/50 flex items-center justify-between px-4 md:px-8 z-10 sticky top-0">
          <div className="flex items-center gap-3 md:gap-4">
             <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-gray-400 hover:text-white p-1">
               <Menu size={24} />
             </button>
             <h2 className="text-lg font-semibold text-white capitalize">
              {view === 'prescriptions' ? 'Prescription Management' : 
               view === 'clients' ? 'Client Database' : 
               view === 'employees' ? 'Staff Directory' :
               view === 'schedule' ? 'Scheduling System' : view}
             </h2>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="relative group hidden sm:block">
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800/50 border border-gray-700/50 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-medical-500/50 focus:border-medical-500/50 focus:bg-gray-800 outline-none w-32 sm:w-48 md:w-72 text-white transition-all placeholder:text-gray-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-500 group-focus-within:text-medical-400 transition-colors" size={16} />
            </div>
            
            <div className="flex items-center gap-3 md:gap-4 border-l border-gray-800 pl-3 md:pl-6 relative">
              
              {/* Notification Bell */}
              <button 
                onClick={() => setIsNotifPanelOpen(!isNotifPanelOpen)}
                className={`relative transition-colors p-2 rounded-lg ${isNotifPanelOpen ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white'}`}
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {isNotifPanelOpen && (
                <div 
                  ref={notifPanelRef}
                  className="absolute top-12 right-[-60px] md:right-0 w-80 md:w-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
                >
                  <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-850">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                       Notifications 
                       {notifications.length > 0 && <span className="bg-medical-600 text-xs px-2 py-0.5 rounded-full">{notifications.length}</span>}
                    </h3>
                    {notifications.length > 0 && (
                      <button 
                        onClick={handleClearAllNotifications}
                        className="text-xs text-gray-400 hover:text-white underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No new notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-800">
                        {notifications.map((notif) => (
                          <div key={notif.id} className="p-4 hover:bg-gray-800/50 transition-colors relative group">
                            <div className="flex gap-3">
                              <div className={`mt-0.5 min-w-[8px] h-2 rounded-full ${
                                notif.severity === 'critical' ? 'bg-red-500' : 
                                notif.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                              }`} />
                              <div className="flex-1">
                                <h4 className={`text-sm font-semibold mb-0.5 ${
                                  notif.severity === 'critical' ? 'text-red-400' : 
                                  notif.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'
                                }`}>
                                  {notif.title}
                                </h4>
                                <p className="text-xs text-gray-300 leading-snug mb-1">{notif.message}</p>
                                <span className="text-[10px] text-gray-600">{new Date(notif.timestamp).toLocaleString()}</span>
                              </div>
                              <button 
                                onClick={() => handleDismissNotification(notif.id)}
                                className="text-gray-500 hover:text-white p-1 self-start opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Dismiss"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-medium text-white">Dr. Sarah Cole</div>
                  <div className="text-xs text-gray-500">Logistics Manager</div>
                </div>
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-gray-600 shadow-sm"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Search Bar for Mobile (Visible below header only on small screens) */}
        <div className="sm:hidden p-4 border-b border-gray-800 bg-[#0d111c]/50">
           <div className="relative">
              <input 
                type="text" 
                placeholder="Search inventory..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-medical-500/50 outline-none text-white"
              />
              <Search className="absolute left-3 top-3 text-gray-500" size={16} />
            </div>
        </div>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
            
            {/* SCHEDULING VIEW */}
            {view === 'schedule' && (
              <div className="space-y-6">
                
                {/* Scheduling Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 bg-gray-900/50 p-1.5 rounded-xl border border-gray-800">
                    <button 
                      onClick={() => setScheduleTab('calendar')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        scheduleTab === 'calendar' 
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <CalendarDays size={16} /> Appointments
                    </button>
                    <button 
                      onClick={() => {
                        setScheduleTab('availability');
                        // Default to first doctor if none selected
                        if(!selectedDoctorIdForSchedule && employees.length > 0) {
                          const firstDoc = employees.find(e => e.role === 'Doctor');
                          if(firstDoc) setSelectedDoctorIdForSchedule(firstDoc.id);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        scheduleTab === 'availability' 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <Clock size={16} /> Doctor Availability
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {scheduleTab === 'calendar' && (
                      <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                        <button
                          onClick={() => setAppointmentViewMode('calendar')}
                          className={`p-2 rounded-md transition-all ${appointmentViewMode === 'calendar' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                          title="Calendar View"
                        >
                          <Grid size={18} />
                        </button>
                        <button
                          onClick={() => setAppointmentViewMode('list')}
                          className={`p-2 rounded-md transition-all ${appointmentViewMode === 'list' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                          title="List View"
                        >
                          <List size={18} />
                        </button>
                      </div>
                    )}

                    {scheduleTab === 'calendar' && (
                      <button 
                        onClick={() => setIsAppointmentModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-4 py-2.5 flex items-center gap-2 font-medium shadow-lg shadow-purple-900/30"
                      >
                        <Plus size={18} /> Book Appointment
                      </button>
                    )}
                  </div>
                </div>

                {/* Calendar Tab */}
                {scheduleTab === 'calendar' && (
                  <>
                    {appointmentViewMode === 'calendar' ? (
                      <ThreeMonthCalendar
                        mode="appointments"
                        currentDate={scheduleCalendarDate}
                        onNavigate={handleCalendarNavigate}
                        appointments={appointments}
                        onDayClick={handleDayClick}
                      />
                    ) : (
                      <div className="bg-[#111827] border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
                        {/* List View */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-0">
                            <thead>
                              <tr className="bg-gray-900/50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-800">
                                <th className="p-4 pl-6">Date & Time</th>
                                <th className="p-4">Patient</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Doctor</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Notes</th>
                                <th className="p-4 text-right pr-6">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50 text-sm">
                              {appointments
                                .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
                                .map(apt => (
                                  <tr key={apt.id} className="hover:bg-gray-800/40 transition-colors">
                                    <td className="p-4 pl-6">
                                      <div className="flex flex-col">
                                        <span className="font-bold text-white text-base">{apt.time}</span>
                                        <span className="text-xs text-gray-500">{new Date(apt.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <span className="font-medium text-white block">{apt.patientName}</span>
                                      <span className="text-xs text-gray-500">{apt.contact}</span>
                                    </td>
                                    <td className="p-4">
                                      <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                        apt.type === 'Emergency' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        apt.type === 'Checkup' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                        'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                      }`}>
                                        {apt.type}
                                      </span>
                                    </td>
                                    <td className="p-4 text-gray-300">
                                      <div className="flex items-center gap-2">
                                        <Stethoscope size={14} className="text-gray-500" />
                                        {apt.doctorName}
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <span className={`text-xs font-bold uppercase ${
                                        apt.status === 'Completed' ? 'text-emerald-400' :
                                        apt.status === 'Cancelled' ? 'text-red-400' :
                                        'text-blue-400'
                                      }`}>
                                        {apt.status}
                                      </span>
                                    </td>
                                    <td className="p-4 text-gray-400 text-xs italic max-w-xs truncate">
                                      {apt.notes || '-'}
                                    </td>
                                    <td className="p-4 text-right pr-6">
                                      <button className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors">
                                        <Edit2 size={16} />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              }
                              {appointments.length === 0 && (
                                <tr>
                                  <td colSpan={7} className="p-12 text-center text-gray-500">
                                    No appointments found.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Availability Tab */}
                {scheduleTab === 'availability' && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      
                      {/* Left: Doctor Selection & Base Stats */}
                      <div className="md:w-1/4 space-y-6">
                        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Select Doctor</label>
                          <select 
                            value={selectedDoctorIdForSchedule}
                            onChange={(e) => setSelectedDoctorIdForSchedule(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none mb-6"
                          >
                            {employees.filter(e => e.role === 'Doctor').map(doc => (
                              <option key={doc.id} value={doc.id}>{doc.name}</option>
                            ))}
                          </select>

                          {selectedDoctorIdForSchedule && (() => {
                            const doc = employees.find(e => e.id === selectedDoctorIdForSchedule);
                            const avail = availability.find(a => a.doctorId === selectedDoctorIdForSchedule);
                            if(!doc) return null;
                            
                            return (
                              <div className="space-y-4">
                                <div className="flex items-center gap-4 border-b border-gray-800 pb-4">
                                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-400">
                                    {doc.name.split(' ').map(n=>n[0]).join('')}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-white">{doc.name}</h4>
                                    <p className="text-xs text-gray-500">{doc.department}</p>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-500 uppercase">Base Schedule</span>
                                    <button 
                                      onClick={() => { setEditingAvailability(doc); setIsAvailabilityModalOpen(true); }}
                                      className="text-blue-400 hover:text-blue-300 text-xs"
                                    >
                                      Edit Weekly
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                      <span key={day} className={`w-7 h-7 flex items-center justify-center rounded text-[10px] font-bold ${
                                        avail?.days.includes(day) 
                                          ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                                          : 'bg-gray-800 text-gray-600'
                                      }`}>
                                        {day.substring(0,1)}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="mt-2 text-xs text-gray-400 font-mono bg-gray-900 p-2 rounded border border-gray-800 text-center">
                                    {avail?.startTime || '--'} - {avail?.endTime || '--'}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        
                        <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-300">
                          <p className="font-semibold mb-1">How to edit:</p>
                          <ul className="list-disc pl-4 space-y-1 opacity-80">
                            <li>Set the base weekly schedule above.</li>
                            <li>Click any specific day on the calendar to override hours or set as a day off.</li>
                          </ul>
                        </div>
                      </div>

                      {/* Right: Calendar */}
                      <div className="flex-1">
                        {selectedDoctorIdForSchedule ? (
                          <ThreeMonthCalendar
                            mode="availability"
                            currentDate={scheduleCalendarDate}
                            onNavigate={handleCalendarNavigate}
                            shifts={doctorShifts}
                            availability={availability.find(a => a.doctorId === selectedDoctorIdForSchedule)}
                            onDayClick={handleDayClick}
                            selectedDoctorId={selectedDoctorIdForSchedule}
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-500">
                            Select a doctor to view schedule
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Client Database View */}
            {view === 'clients' && (
              <div className="space-y-6">
                {!selectedClient ? (
                  // Client List View
                  <>
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="text-medical-500" size={24} /> Client Directory
                      </h3>
                      <button 
                        onClick={() => { setEditingClient(null); setIsClientModalOpen(true); }}
                        className="bg-medical-600 hover:bg-medical-500 text-white rounded-xl px-4 py-2.5 flex items-center gap-2 font-medium shadow-lg shadow-medical-900/30"
                      >
                        <Plus size={18} /> Add New Client
                      </button>
                    </div>

                    <div className="bg-[#111827] border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-0">
                          <thead>
                            <tr className="bg-gray-900/50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-800">
                              <th className="p-4 pl-6">Client Name</th>
                              <th className="p-4">Contact</th>
                              <th className="p-4">Age / Gender</th>
                              <th className="p-4">Identity Status</th>
                              <th className="p-4 text-center">Interactions</th>
                              <th className="p-4 text-right pr-6">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/50 text-sm">
                            {clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(client => {
                              const idStatus = checkIdValidity(client);
                              return (
                                <tr key={client.id} className="hover:bg-gray-800/40 transition-colors group cursor-pointer" onClick={() => setSelectedClient(client)}>
                                  <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-700 font-bold text-xs">
                                        {client.name.split(' ').map(n => n[0]).join('')}
                                      </div>
                                      <div>
                                        <p className="font-medium text-white">{client.name}</p>
                                        <p className="text-xs text-gray-500">ID: {client.id}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 text-gray-400">{client.contact}</td>
                                  <td className="p-4 text-gray-400">{client.age} / {client.gender}</td>
                                  <td className="p-4">
                                    {idStatus === 'expired' && <span className="bg-red-900/50 text-red-300 px-2 py-0.5 rounded text-xs border border-red-800 font-medium">ID EXPIRED</span>}
                                    {idStatus === 'near_expiry' && <span className="bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded text-xs border border-amber-800 font-medium">Expiring Soon</span>}
                                    {idStatus === 'valid' && <span className="text-emerald-400 text-xs flex items-center gap-1"><Check size={12} /> Valid</span>}
                                    {idStatus === 'none' && <span className="text-gray-500 text-xs">No ID Info</span>}
                                  </td>
                                  <td className="p-4 text-center text-gray-300 font-medium">{client.history.length}</td>
                                  <td className="p-4 text-right pr-6">
                                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                      <button 
                                        onClick={() => setSelectedClient(client)}
                                        className="text-medical-400 hover:text-medical-300 text-xs font-medium bg-medical-500/10 hover:bg-medical-500/20 px-3 py-1.5 rounded-lg transition-colors"
                                      >
                                        History
                                      </button>
                                      <button 
                                        onClick={() => { setEditingClient(client); setIsClientModalOpen(true); }}
                                        className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                                        title="Edit Details"
                                      >
                                        <Edit2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  // Client Detail/History View
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-center mb-6">
                      <button 
                        onClick={() => setSelectedClient(null)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <ArrowLeft size={18} /> Back to Directory
                      </button>
                      <button 
                        onClick={() => { setEditingClient(selectedClient); setIsClientModalOpen(true); }}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm border border-gray-700 transition-colors"
                      >
                        <Edit2 size={16} /> Edit Client Details
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Client Profile Card */}
                      <div className="lg:col-span-1 space-y-6">
                        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl text-center relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-gray-800 to-transparent"></div>
                          <div className="relative z-10">
                            <div className="w-24 h-24 rounded-full bg-gray-700 mx-auto border-4 border-[#111827] flex items-center justify-center text-3xl font-bold text-gray-400 shadow-xl mb-4">
                              {selectedClient.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <h2 className="text-2xl font-bold text-white">{selectedClient.name}</h2>
                            <p className="text-gray-500 text-sm mb-6">Patient ID: {selectedClient.id}</p>
                            
                            <div className="grid grid-cols-2 gap-4 text-left bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                              <div>
                                <p className="text-xs text-gray-500 uppercase">Age</p>
                                <p className="text-white font-medium">{selectedClient.age}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase">Gender</p>
                                <p className="text-white font-medium">{selectedClient.gender}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase">Blood Type</p>
                                <p className="text-white font-medium">{selectedClient.bloodType || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase">Contact</p>
                                <p className="text-white font-medium truncate" title={selectedClient.contact}>{selectedClient.contact}</p>
                              </div>
                            </div>
                            
                            {/* NEW: Identity Details */}
                            <div className="mt-4 pt-4 border-t border-gray-700 text-left space-y-3">
                              <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-500 uppercase">Identity Document</p>
                                {(() => {
                                  const status = checkIdValidity(selectedClient);
                                  if (status === 'expired') return <span className="text-[10px] bg-red-900 text-red-200 px-2 py-0.5 rounded font-bold">EXPIRED</span>;
                                  if (status === 'near_expiry') return <span className="text-[10px] bg-amber-900 text-amber-200 px-2 py-0.5 rounded font-bold">EXP SOON</span>;
                                  return null;
                                })()}
                              </div>
                              
                              {selectedClient.emiratesId && (
                                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                                  <span className="text-xs text-gray-500 block mb-1">Emirates ID</span>
                                  <span className="text-sm text-white font-mono">{selectedClient.emiratesId}</span>
                                </div>
                              )}
                              {selectedClient.passportId && (
                                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                                  <span className="text-xs text-gray-500 block mb-1">Passport No.</span>
                                  <span className="text-sm text-white font-mono">{selectedClient.passportId}</span>
                                </div>
                              )}
                              {selectedClient.idExpiryDate && (
                                <p className={`text-xs mt-1 ${checkIdValidity(selectedClient) === 'valid' ? 'text-gray-400' : 'text-red-400 font-bold'}`}>
                                  Expiry: {selectedClient.idExpiryDate}
                                </p>
                              )}
                            </div>

                            {/* Credentials Display (Admin View) */}
                            {selectedClient.username && (
                              <div className="mt-4 pt-4 border-t border-gray-700 text-left">
                                <p className="text-xs text-gray-500 uppercase mb-2">Portal Access</p>
                                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50 flex justify-between items-center">
                                  <span className="text-sm text-gray-300">@{selectedClient.username}</span>
                                  <span className="text-xs bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded border border-teal-500/20">Active</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Medical History Timeline */}
                      <div className="lg:col-span-2">
                        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl min-h-[500px]">
                          <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                            <FileClock className="text-medical-500" size={24} />
                            <h3 className="text-lg font-bold text-white">Medical History</h3>
                          </div>

                          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-700 before:to-transparent">
                            {selectedClient.history.map((record, idx) => (
                              <div key={record.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                {/* Timeline Icon */}
                                <div className="absolute left-0 md:left-1/2 flex items-center justify-center w-10 h-10 -ml-5 md:-translate-x-1/2 rounded-full border-4 border-[#111827] bg-gray-800 shadow-sm z-10 group-hover:scale-110 transition-transform">
                                  {record.action === 'Dispensed' ? (
                                    <Pill size={16} className="text-indigo-400" />
                                  ) : (
                                    <Syringe size={16} className="text-teal-400" />
                                  )}
                                </div>

                                {/* Content Card */}
                                <div className="ml-10 md:ml-0 md:w-[calc(50%-2rem)] bg-gray-800/30 p-4 rounded-xl border border-gray-700/50 hover:bg-gray-800/60 transition-colors">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                      record.action === 'Dispensed' 
                                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                                        : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                                    }`}>
                                      {record.action}
                                    </span>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock size={10} /> {record.date}
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-white text-sm">{record.medicationName}</h4>
                                  <p className="text-xs text-gray-400 mt-1">Dosage: <span className="text-gray-300">{record.dosage}</span></p>
                                  <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-700/50 flex items-center gap-1">
                                    <User size={10} /> Prescribed by: {record.doctorName}
                                  </p>
                                  {record.notes && (
                                    <div className="mt-2 text-xs text-gray-400 italic bg-gray-900/30 p-2 rounded">
                                      "{record.notes}"
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            {selectedClient.history.length === 0 && (
                              <div className="text-center py-10 text-gray-500 ml-10 md:ml-0">
                                No medical history recorded.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Other existing views... (Inventory, Reports, etc.) */}
            {/* Prescriptions View */}
            
            {view === 'prescriptions' && (
              <div className="space-y-6">
                 {/* Header & Action */}
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                       <Stethoscope className="text-medical-500" size={24} />
                       <div>
                          <h3 className="text-xl font-bold text-white">Active Prescriptions</h3>
                          <p className="text-sm text-gray-400">Manage patient orders for pharmacy and nursing</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => setIsPrescriptionModalOpen(true)}
                      className="bg-medical-600 hover:bg-medical-500 text-white rounded-xl px-4 py-2.5 flex items-center gap-2 font-medium shadow-lg shadow-medical-900/30"
                    >
                      <Plus size={18} /> New Prescription
                    </button>
                 </div>

                 {/* Prescriptions Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {prescriptions.map(rx => (
                      <div key={rx.id} className="bg-[#111827] border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors relative group overflow-hidden">
                        
                        {/* Status Stripe */}
                        <div className={`absolute top-0 left-0 w-1 h-full ${rx.target === 'pharmacy' ? 'bg-indigo-500' : 'bg-teal-500'}`}></div>

                        <div className="flex justify-between items-start mb-4 pl-3">
                           <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${rx.target === 'pharmacy' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-teal-500/10 text-teal-400'}`}>
                                 {rx.target === 'pharmacy' ? <Pill size={20} /> : <Syringe size={20} />}
                              </div>
                              <div>
                                 <h4 className="font-bold text-white text-base">{rx.patientName}</h4>
                                 <p className="text-xs text-gray-500">ID: {rx.id} • Age: {rx.patientAge}</p>
                              </div>
                           </div>
                           <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border 
                             ${rx.status === 'completed' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-gray-800 text-gray-300 border-gray-700'}`}>
                             {rx.status}
                           </span>
                        </div>

                        <div className="space-y-3 pl-3 mb-4">
                           <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                              <p className="text-sm font-medium text-white">{rx.medicationName}</p>
                              <div className="flex justify-between mt-1">
                                <span className="text-xs text-gray-400">{rx.dosage} • {rx.frequency}</span>
                                {rx.doseAmountMl ? (
                                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                                    <Droplet size={10} /> Liquid: {rx.doseAmountMl}mL x {rx.totalShots}
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-indigo-400">Qty: {rx.dispenseQty}</span>
                                )}
                              </div>
                           </div>
                           {rx.notes && (
                             <div className="flex gap-2 items-start text-xs text-gray-400 italic">
                               <Info size={12} className="mt-0.5 shrink-0" />
                               <p>{rx.notes}</p>
                             </div>
                           )}
                        </div>

                        <div className="pl-3 flex justify-between items-center text-xs text-gray-500 border-t border-gray-800 pt-3">
                           <div className="flex items-center gap-1">
                              <User size={12} /> {rx.doctorName}
                           </div>
                           <div className="flex items-center gap-1">
                              <Clock size={12} /> {new Date(rx.timestamp).toLocaleDateString()}
                           </div>
                        </div>

                        {/* Action Footer */}
                        <div className="mt-3 pl-3">
                          {rx.status === 'pending' ? (
                            <button 
                              onClick={() => handleCompletePrescription(rx.id)}
                              className={`w-full py-2 rounded-lg text-xs font-medium transition-colors border shadow-lg ${
                                rx.target === 'pharmacy' 
                                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-900/20' 
                                  : 'bg-teal-600 hover:bg-teal-500 text-white border-teal-500 shadow-teal-900/20'
                              }`}
                            >
                              {rx.target === 'pharmacy' ? 'Dispense Medication' : 'Mark Administered'}
                            </button>
                          ) : (
                            <button disabled className="w-full py-2 bg-gray-800 text-gray-500 rounded-lg text-xs font-medium border border-gray-700 cursor-not-allowed">
                              {rx.status === 'completed' ? 'Completed' : 'Cancelled'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Dashboard, Inventory, Alerts, Reports, Settings logic remains same as previous step, ensuring they are rendered correctly */}
            {view === 'dashboard' && (
              <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {/* Total Inventory */}
                  <div 
                    onClick={() => setView('inventory')}
                    className="bg-[#111827] border border-gray-800 rounded-2xl p-5 flex flex-col justify-between h-32 relative overflow-hidden group cursor-pointer hover:border-medical-500/50 transition-all"
                  >
                    <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-medical-500/10 to-transparent rounded-bl-full group-hover:from-medical-500/20 transition-all duration-500"></div>
                    <div className="flex justify-between items-start z-10">
                      <div>
                        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Total Inventory</p>
                        <h3 className="text-2xl md:text-3xl font-bold text-white">{stats.totalItems}</h3>
                      </div>
                      <div className="p-2 bg-gray-800/50 rounded-lg text-medical-400 border border-gray-700/50">
                        <Package size={20} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400 mt-2 z-10">
                      <TrendingUp size={14} />
                      <span>+12% vs last month</span>
                    </div>
                  </div>

                  {/* Critical Stock */}
                  <div 
                    onClick={() => setView('alerts')}
                    className="bg-[#111827] border border-gray-800 rounded-2xl p-5 flex flex-col justify-between h-32 relative overflow-hidden group cursor-pointer hover:border-red-500/50 transition-all"
                  >
                    <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full group-hover:from-red-500/20 transition-all duration-500"></div>
                    <div className="flex justify-between items-start z-10">
                      <div>
                        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Critical Stock</p>
                        <h3 className="text-2xl md:text-3xl font-bold text-white">{stats.criticalStock}</h3>
                      </div>
                      <div className="p-2 bg-gray-800/50 rounded-lg text-red-400 border border-gray-700/50">
                        <AlertOctagon size={20} />
                      </div>
                    </div>
                    <div className="text-xs text-red-400/80 mt-2 z-10">
                      Needs immediate attention
                    </div>
                  </div>

                  {/* Expiry Overview (Split) */}
                  <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 col-span-1 sm:col-span-2 lg:col-span-2 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                       <div className="flex items-center gap-2">
                          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Expiry Horizon</p>
                       </div>
                       <Calendar size={18} className="text-amber-500" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 md:gap-4 h-full">
                      <div className="bg-gray-800/30 rounded-lg p-2 md:p-3 border border-gray-700/30 flex flex-col justify-center items-center text-center hover:bg-gray-800/50 transition-colors">
                        <span className="text-xl md:text-2xl font-bold text-white mb-1">{stats.exp7}</span>
                        <span className="text-[9px] md:text-[10px] text-amber-500 font-medium uppercase">7 Days</span>
                      </div>
                      <div className="bg-gray-800/30 rounded-lg p-2 md:p-3 border border-gray-700/30 flex flex-col justify-center items-center text-center hover:bg-gray-800/50 transition-colors">
                        <span className="text-xl md:text-2xl font-bold text-white mb-1">{stats.exp30}</span>
                        <span className="text-[9px] md:text-[10px] text-amber-400 font-medium uppercase">30 Days</span>
                      </div>
                      <div className="bg-gray-800/30 rounded-lg p-2 md:p-3 border border-gray-700/30 flex flex-col justify-center items-center text-center hover:bg-gray-800/50 transition-colors">
                         <span className="text-xl md:text-2xl font-bold text-white mb-1">{stats.exp90}</span>
                         <span className="text-[9px] md:text-[10px] text-gray-400 font-medium uppercase">90 Days</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Dashboard Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    {/* Charts */}
                    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-4 md:p-6 shadow-xl">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                           Stock Distribution
                        </h3>
                      </div>
                      <StockChart data={items} />
                    </div>
                    
                    {/* AI Panel */}
                    <AIInsightPanel 
                      analysis={aiResult} 
                      isLoading={isAnalyzing} 
                      onAnalyze={handleRunAnalysis} 
                    />
                  </div>

                  <div className="lg:col-span-1 space-y-6">
                    {/* Recent Updates Feed */}
                    <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full min-h-[400px]">
                      <div className="p-4 md:p-5 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <History size={16} className="text-medical-500" /> Recent Updates
                        </h3>
                        <button className="text-xs text-medical-500 hover:text-medical-400">View All</button>
                      </div>
                      <div className="divide-y divide-gray-800/50">
                        {recentUpdates.map(item => (
                          <div key={item.id} className="p-4 hover:bg-gray-800/30 transition-colors group">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-medium text-gray-200 group-hover:text-white line-clamp-1">{item.name}</span>
                              <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">{item.lastUpdated}</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-xs text-gray-500">Batch: {item.batchNumber}</span>
                               <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getStatusColor(getStatus(item))}`}>
                                 {getStatus(item)}
                               </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-gray-900/30 mt-auto text-center border-t border-gray-800">
                         <button 
                           onClick={() => setView('inventory')}
                           className="text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1 mx-auto transition-colors"
                         >
                           Go to Inventory <ChevronRight size={12} />
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {(view === 'inventory' || view === 'alerts') && (
              <div className="bg-[#111827] border border-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[400px]">
                {/* Table Header Controls */}
                <div className="p-4 md:p-6 border-b border-gray-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-900/30">
                  <div className="flex flex-wrap items-center gap-3 md:gap-4">
                     <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                        {view === 'alerts' ? <><AlertTriangle size={20} className="text-red-400"/> Critical Alerts</> : 'Inventory'}
                     </h3>
                     
                     {/* Add New Item Button (Desktop view primarily, but visible on all if space allows) */}
                     {view === 'inventory' && (
                        <button 
                          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                          className="bg-medical-600 hover:bg-medical-500 text-white rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm font-medium shadow-lg shadow-medical-900/30 border border-medical-500/50 ml-2"
                        >
                          <Plus size={16} /> Add Item
                        </button>
                     )}

                     {selectedIds.size > 0 && (
                       <div className="flex items-center gap-2 bg-medical-900/30 border border-medical-500/30 px-3 py-1.5 rounded-lg ml-2">
                          <span className="text-xs md:text-sm text-medical-200 font-medium">{selectedIds.size}</span>
                          <div className="h-4 w-px bg-medical-500/30"></div>
                          <button onClick={handleBulkDelete} className="text-red-400 hover:text-red-300 transition-colors" title="Delete Selected">
                             <Trash2 size={16} />
                          </button>
                          <button onClick={() => setSelectedIds(new Set())} className="text-gray-400 hover:text-white transition-colors" title="Clear Selection">
                             <XSquare size={16} />
                          </button>
                       </div>
                     )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <button 
                      onClick={() => setQuickEditMode(!quickEditMode)}
                      className={`flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-lg border transition-all ${
                        quickEditMode 
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                          : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600 hover:text-white'
                      }`}
                    >
                      {quickEditMode ? <Save size={16} /> : <Edit2 size={16} />}
                      {quickEditMode ? 'Finish' : 'Edit Mode'}
                    </button>

                    <div className="hidden sm:block h-6 w-px bg-gray-700 mx-1"></div>

                    <div className="flex gap-2">
                      <select 
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="flex-1 sm:flex-none bg-gray-800 text-sm text-white border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500 transition-all"
                      >
                        <option value="All">All Cats</option>
                        {Object.values(ItemCategory).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      
                      {view !== 'alerts' && (
                        <button 
                          onClick={() => setAlertFilter(!alertFilter)}
                          className={`flex-1 sm:flex-none text-sm px-3 py-2 rounded-lg border transition-all ${alertFilter ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600 hover:text-white'}`}
                        >
                          Risks Only
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse min-w-[1000px] lg:min-w-0">
                    <thead>
                      <tr className="bg-gray-900/50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-800">
                        <th className="p-4 w-12 text-center">
                          <button onClick={toggleSelectAll} className="text-gray-500 hover:text-white transition-colors">
                            {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? <CheckSquare size={18} className="text-medical-500" /> : <div className="w-4 h-4 border-2 border-gray-600 rounded flex items-center justify-center"></div>}
                          </button>
                        </th>
                        <th className="p-4">Item Name</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Batch #</th>
                        <th className="p-4 text-center">Qty</th>
                        <th className="p-4 text-center">Min</th>
                        <th className="p-4">Expiry</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50 text-sm">
                      {filteredItems.map(item => {
                        const status = getStatus(item);
                        const isSelected = selectedIds.has(item.id);
                        
                        return (
                          <tr key={item.id} className={`transition-colors group ${isSelected ? 'bg-medical-900/10 hover:bg-medical-900/20' : 'hover:bg-gray-800/40'}`}>
                            <td className="p-4 text-center">
                              <button onClick={() => toggleSelection(item.id)} className="text-gray-500 hover:text-white transition-colors">
                                {isSelected ? <CheckSquare size={18} className="text-medical-500" /> : <div className="w-4 h-4 border-2 border-gray-600 rounded flex items-center justify-center hover:border-gray-400"></div>}
                              </button>
                            </td>
                            <td className="p-4 font-medium text-gray-200 group-hover:text-white transition-colors">
                              {item.name}
                              {item.isLiquid && <span className="ml-2 text-[10px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800">Liquid ({item.totalVolumeMl}mL)</span>}
                            </td>
                            <td className="p-4 text-gray-400">
                              <span className="bg-gray-800 px-2 py-1 rounded text-xs whitespace-nowrap">{item.category}</span>
                            </td>
                            <td className="p-4 text-gray-400 font-mono text-xs">{item.batchNumber}</td>
                            
                            {/* Editable Quantity */}
                            <td className="p-4 text-center">
                              {quickEditMode ? (
                                <input 
                                  type="number" 
                                  value={item.quantity}
                                  onChange={(e) => handleInlineUpdate(item.id, 'quantity', parseInt(e.target.value))}
                                  className="w-20 bg-gray-900 border border-indigo-500/50 rounded px-2 py-1 text-center text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              ) : (
                                <span className="font-semibold text-white">{item.quantity}</span>
                              )}
                              <span className="text-xs text-gray-500 ml-1 block">{item.unit}</span>
                            </td>

                            {/* Editable Min Level */}
                            <td className="p-4 text-center">
                               {quickEditMode ? (
                                <input 
                                  type="number" 
                                  value={item.minLevel}
                                  onChange={(e) => handleInlineUpdate(item.id, 'minLevel', parseInt(e.target.value))}
                                  className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-center text-gray-400 focus:text-white focus:border-indigo-500 focus:outline-none"
                                />
                              ) : (
                                <span className="text-gray-400">{item.minLevel}</span>
                              )}
                            </td>

                            <td className="p-4 text-gray-300 font-mono text-xs whitespace-nowrap">
                               {item.expiryDate}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${getStatusColor(status)} uppercase tracking-wide whitespace-nowrap`}>
                                {status}
                              </span>
                            </td>
                            <td className="p-4 text-right pr-6">
                              <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => { setEditingItem(item); setIsModalOpen(true); }} // Reusing modal for view/edit for now
                                  className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                                  title="View Details"
                                >
                                  <Eye size={16} />
                                </button>
                                <button 
                                  onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                                  className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                                  title="Edit Item"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-2 hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                  title="Delete Item"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredItems.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
                            <Package size={48} className="text-gray-800 mb-4" />
                            <p className="text-lg font-medium text-gray-400">No inventory found</p>
                            <p className="text-sm">Try adjusting your search or filters.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reports View */}
            {view === 'reports' && (
               <div className="space-y-6">
                 {/* Reports Logic (Unchanged) */}
                 <div className="flex justify-between items-center">
                   <div>
                     <h3 className="text-xl font-bold text-white flex items-center gap-2">
                       <FileText className="text-medical-500" size={24} /> System Reports
                     </h3>
                     <p className="text-sm text-gray-400 mt-1">Generate and download standard reports</p>
                   </div>
                 </div>
                 {/* ... Reports cards ... */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full group-hover:bg-indigo-500/10 transition-colors"></div>
                      <div className="relative z-10">
                        <div className="p-3 bg-indigo-500/10 rounded-xl inline-block text-indigo-400 mb-4">
                           <Stethoscope size={24} />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">Prescription History Report</h4>
                        <p className="text-sm text-gray-400 mb-6">
                           Detailed log of all dispensed and injected medications including patient details, doctor notes, and timestamps.
                        </p>
                        
                        <div className="flex gap-3">
                          <button 
                             onClick={handleGeneratePDF}
                             className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 transition-all"
                          >
                             <FileDown size={16} /> Download PDF
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group opacity-60">
                      <div className="relative z-10">
                        <div className="p-3 bg-gray-800 rounded-xl inline-block text-gray-500 mb-4">
                           <TrendingUp size={24} />
                        </div>
                        <h4 className="text-lg font-bold text-gray-300 mb-2">Inventory Analysis (Coming Soon)</h4>
                        <p className="text-sm text-gray-500 mb-6">
                           Comprehensive breakdown of stock levels, valuation, and expiry trends.
                        </p>
                        <button disabled className="w-full bg-gray-800 text-gray-500 py-2.5 rounded-lg text-sm font-medium cursor-not-allowed">
                           Not Available
                        </button>
                      </div>
                    </div>
                 </div>
                 {/* ... Report Preview Table ... */}
                 <div className="mt-8">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Report Preview: Active Prescriptions</h4>
                    <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden">
                       <div className="overflow-x-auto">
                         <table className="w-full text-left border-collapse text-sm">
                           <thead>
                             <tr className="bg-gray-900/50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-800">
                               <th className="p-4">Rx ID</th>
                               <th className="p-4">Patient</th>
                               <th className="p-4">Medication</th>
                               <th className="p-4">Type</th>
                               <th className="p-4">Date</th>
                               <th className="p-4">Status</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-800/50">
                             {prescriptions.slice(0, 5).map(rx => (
                               <tr key={rx.id} className="text-gray-400">
                                 <td className="p-4 font-mono text-xs">{rx.id}</td>
                                 <td className="p-4 text-white font-medium">{rx.patientName}</td>
                                 <td className="p-4">{rx.medicationName}</td>
                                 <td className="p-4">
                                   <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${rx.target === 'pharmacy' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-teal-500/10 text-teal-400 border-teal-500/20'}`}>
                                     {rx.target === 'pharmacy' ? 'Dispensed' : 'Administered'}
                                   </span>
                                 </td>
                                 <td className="p-4 text-xs">{new Date(rx.timestamp).toLocaleDateString()}</td>
                                 <td className="p-4 capitalize">{rx.status}</td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                         {prescriptions.length > 5 && (
                           <div className="p-3 text-center text-xs text-gray-500 bg-gray-900/30 border-t border-gray-800">
                             Showing 5 of {prescriptions.length} records. Download PDF for full report.
                           </div>
                         )}
                       </div>
                    </div>
                 </div>
               </div>
            )}

            {/* Settings Placeholder */}
            {view === 'settings' && (
               <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500 bg-[#111827] border border-gray-800 rounded-2xl p-6 text-center">
                  <Settings size={64} className="mb-4 opacity-20" />
                  <h3 className="text-xl font-bold text-gray-300 capitalize">{view} Module</h3>
                  <p className="max-w-md mt-2">This module is currently under development. Please check back later for enterprise reporting and configuration features.</p>
               </div>
            )}

          </div>
        </div>
      </main>

      {/* Modals */}
      <InventoryModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={editingItem ? handleUpdateItem : handleAddItem}
        initialData={editingItem}
      />

      <PrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        onSave={handleCreatePrescription}
        inventory={items}
        clients={clients}
      />
      
      <ClientModal 
        isOpen={isClientModalOpen}
        onClose={() => { setIsClientModalOpen(false); setEditingClient(null); }}
        onSave={editingClient ? handleUpdateClient : handleRegisterClient}
        initialData={editingClient}
      />

      <EmployeeModal 
        isOpen={isEmployeeModalOpen}
        onClose={() => { setIsEmployeeModalOpen(false); setEditingEmployee(null); }}
        onSave={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
        initialData={editingEmployee}
      />

      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={handleCreateAppointment}
        clients={clients}
        doctors={employees.filter(e => e.role === 'Doctor')}
      />

      <AvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => { setIsAvailabilityModalOpen(false); setEditingAvailability(null); }}
        onSave={handleUpdateAvailability}
        doctor={editingAvailability}
        initialAvailability={availability.find(a => a.doctorId === editingAvailability?.id)}
      />

      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => { setIsShiftModalOpen(false); setSelectedShiftDate(''); }}
        onSave={handleUpdateShift}
        doctorId={selectedDoctorIdForSchedule}
        date={selectedShiftDate}
        existingShift={doctorShifts.find(s => s.doctorId === selectedDoctorIdForSchedule && s.date === selectedShiftDate)}
        defaultStart={availability.find(a => a.doctorId === selectedDoctorIdForSchedule)?.startTime}
        defaultEnd={availability.find(a => a.doctorId === selectedDoctorIdForSchedule)?.endTime}
      />
    </div>
  );
}

export default App;