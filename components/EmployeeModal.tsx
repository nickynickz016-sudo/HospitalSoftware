import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Mail, Phone, Lock, Shield, Check } from 'lucide-react';
import { Employee, EmployeeRole, EmployeeStatus, ViewState } from '../types';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Omit<Employee, 'id' | 'joinDate'>) => void;
  initialData?: Employee | null;
}

const AVAILABLE_MODULES: { id: ViewState; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'prescriptions', label: 'Doctor Rx' },
  { id: 'clients', label: 'Client Database' },
  { id: 'employees', label: 'Staff Directory' },
  { id: 'inventory', label: 'Inventory Management' },
  { id: 'alerts', label: 'Alerts & Notifications' },
  { id: 'reports', label: 'System Reports' },
  { id: 'settings', label: 'Settings' },
];

const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: 'Doctor' as EmployeeRole,
    department: '',
    contact: '',
    email: '',
    status: 'Active' as EmployeeStatus,
    username: '',
    password: '',
    permissions: ['dashboard'] as ViewState[]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        role: initialData.role,
        department: initialData.department,
        contact: initialData.contact,
        email: initialData.email,
        status: initialData.status,
        username: initialData.username || '',
        password: initialData.password || '',
        permissions: initialData.permissions || ['dashboard']
      });
    } else {
      setFormData({
        name: '',
        role: 'Doctor',
        department: '',
        contact: '',
        email: '',
        status: 'Active',
        username: '',
        password: '',
        permissions: ['dashboard', 'prescriptions', 'inventory'] // defaults
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePermission = (moduleId: ViewState) => {
    setFormData(prev => {
      const perms = new Set(prev.permissions);
      if (perms.has(moduleId)) {
        perms.delete(moduleId);
      } else {
        perms.add(moduleId);
      }
      return { ...prev, permissions: Array.from(perms) };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex-none flex justify-between items-center p-6 border-b border-gray-800 bg-gray-850 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
               <Briefcase size={20} />
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-white">
              {initialData ? 'Edit Employee Access' : 'Register New Staff'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <form id="employee-form" onSubmit={handleSubmit} className="p-6 space-y-8">
            
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-800 pb-2">
                <User size={16} /> Personal Information
              </h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Full Name</label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Dr. Emily Stone"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Doctor">Doctor</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Admin">Admin</option>
                    <option value="Logistics">Logistics</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Department</label>
                  <input
                    required
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Cardiology"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Email</label>
                  <div className="relative">
                     <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="name@hospital.com"
                    />
                    <Mail size={18} className="absolute left-3 top-3 text-gray-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Phone</label>
                  <div className="relative">
                    <input
                      required
                      name="contact"
                      value={formData.contact}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="+1 555 0000"
                    />
                    <Phone size={18} className="absolute left-3 top-3 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Security Section */}
            <div className="space-y-4">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-800 pb-2">
                <Lock size={16} /> Account Security
              </h3>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Username</label>
                  <input
                    required
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Password</label>
                  <input
                    required
                    type="text" // Using text to make it visible for this demo; usually 'password'
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="password"
                  />
                </div>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="space-y-4">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-800 pb-2">
                <Shield size={16} /> Access Permissions
              </h3>
              
              <p className="text-xs text-gray-500 mb-3">Select the modules this staff member is authorized to access in the sidebar.</p>

              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_MODULES.map(module => (
                  <label 
                    key={module.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.permissions.includes(module.id)
                        ? 'bg-blue-500/10 border-blue-500/50 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                       formData.permissions.includes(module.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
                    }`}>
                      {formData.permissions.includes(module.id) && <Check size={14} className="text-white" />}
                    </div>
                    <input 
                      type="checkbox"
                      className="hidden"
                      checked={formData.permissions.includes(module.id)}
                      onChange={() => togglePermission(module.id)}
                    />
                    <span className="text-sm font-medium">{module.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-gray-400">Employment Status</label>
              <div className="flex gap-4 mt-2">
                {['Active', 'On Leave', 'Inactive'].map((status) => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={formData.status === status}
                      onChange={handleChange}
                      className="text-blue-500 focus:ring-blue-500 bg-gray-800 border-gray-700"
                    />
                    <span className={`text-sm ${
                      status === 'Active' ? 'text-emerald-400' : 
                      status === 'On Leave' ? 'text-amber-400' : 'text-gray-400'
                    }`}>{status}</span>
                  </label>
                ))}
              </div>
            </div>

          </form>
        </div>

        <div className="flex-none flex justify-end gap-3 p-6 border-t border-gray-800 bg-gray-850 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="employee-form"
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-lg shadow-blue-900/50 flex items-center gap-2"
          >
            {initialData ? 'Update Profile' : 'Create Staff Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeModal;