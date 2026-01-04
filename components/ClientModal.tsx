import React, { useState, useEffect } from 'react';
import { X, User, Phone, Heart, Lock, Key, ScanLine, CreditCard, Calendar, RefreshCw } from 'lucide-react';
import { ClientProfile } from '../types';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Omit<ClientProfile, 'id' | 'history' | 'lastVisit'>) => void;
  initialData?: ClientProfile | null;
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    bloodType: '',
    contact: '',
    username: '',
    password: '',
    emiratesId: '',
    passportId: '',
    idExpiryDate: ''
  });

  const [isScanning, setIsScanning] = useState(false);

  // Load initial data for editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        age: initialData.age.toString(),
        gender: initialData.gender,
        bloodType: initialData.bloodType || '',
        contact: initialData.contact,
        username: initialData.username || '',
        password: initialData.password || '',
        emiratesId: initialData.emiratesId || '',
        passportId: initialData.passportId || '',
        idExpiryDate: initialData.idExpiryDate || ''
      });
    } else {
      setFormData({
        name: '',
        age: '',
        gender: 'Male',
        bloodType: '',
        contact: '',
        username: '',
        password: '',
        emiratesId: '',
        passportId: '',
        idExpiryDate: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      age: parseInt(formData.age) || 0,
      gender: formData.gender as 'Male' | 'Female' | 'Other',
      bloodType: formData.bloodType,
      contact: formData.contact,
      username: formData.username,
      password: formData.password,
      emiratesId: formData.emiratesId,
      passportId: formData.passportId,
      idExpiryDate: formData.idExpiryDate
    });
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Mock Scan Functionality
  const simulateScan = (type: 'emirates' | 'passport') => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const randomId = Math.floor(Math.random() * 1000000000).toString();
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 2);
      
      setFormData(prev => ({
        ...prev,
        [type === 'emirates' ? 'emiratesId' : 'passportId']: type === 'emirates' ? `784-${randomId.slice(0,4)}-${randomId.slice(4)}` : `N${randomId.slice(0,8)}`,
        idExpiryDate: nextYear.toISOString().split('T')[0]
      }));
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex-none flex justify-between items-center p-6 border-b border-gray-800 bg-gray-850 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
               <User size={20} />
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-white">
              {initialData ? 'Update Client Details' : 'Register New Client'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <form id="client-form" onSubmit={handleSubmit} className="p-6 space-y-8">
            
            {/* ID Scanning Section */}
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <ScanLine size={16} className="text-teal-400" /> Identity Verification
              </h3>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => simulateScan('emirates')}
                  disabled={isScanning}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-teal-500 text-gray-300 py-3 rounded-lg flex flex-col items-center gap-2 transition-all group"
                >
                  <CreditCard size={24} className={isScanning ? 'animate-pulse text-teal-500' : 'text-gray-400 group-hover:text-teal-400'} />
                  <span className="text-xs font-medium">{isScanning ? 'Reading Card...' : 'Scan Emirates ID'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => simulateScan('passport')}
                  disabled={isScanning}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-blue-500 text-gray-300 py-3 rounded-lg flex flex-col items-center gap-2 transition-all group"
                >
                  <ScanLine size={24} className={isScanning ? 'animate-pulse text-blue-500' : 'text-gray-400 group-hover:text-blue-400'} />
                  <span className="text-xs font-medium">{isScanning ? 'Scanning...' : 'Scan Passport'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Emirates ID</label>
                  <input
                    name="emiratesId"
                    value={formData.emiratesId}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-teal-500 outline-none font-mono text-sm"
                    placeholder="784-XXXX-XXXXXXX-X"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Passport No.</label>
                  <input
                    name="passportId"
                    value={formData.passportId}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-teal-500 outline-none font-mono text-sm"
                    placeholder="X0000000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 flex items-center gap-1">
                    ID Expiry <Calendar size={12} />
                  </label>
                  <input
                    type="date"
                    name="idExpiryDate"
                    value={formData.idExpiryDate}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-2">
                Personal Details
              </h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Full Name</label>
                <div className="relative">
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="e.g. Jane Doe"
                  />
                  <User size={18} className="absolute left-3 top-3 text-gray-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Age</label>
                  <input
                    required
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="e.g. 30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Blood Type</label>
                  <div className="relative">
                     <input
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500 outline-none"
                      placeholder="e.g. O+"
                    />
                    <Heart size={18} className="absolute left-3 top-3 text-gray-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Contact Number</label>
                  <div className="relative">
                    <input
                      required
                      name="contact"
                      value={formData.contact}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500 outline-none"
                      placeholder="e.g. +1 555 0000"
                    />
                    <Phone size={18} className="absolute left-3 top-3 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Client Portal Access Section */}
            <div className="space-y-4 pt-2">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-800 pb-2">
                <Lock size={16} /> Client Portal Access
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Username</label>
                  <div className="relative">
                    <input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500 outline-none"
                      placeholder="username"
                      autoComplete="off"
                    />
                    <User size={18} className="absolute left-3 top-3 text-gray-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Password</label>
                  <div className="relative">
                    <input
                      name="password"
                      type="text" // Using text to allow visibility in this mock setting
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500 outline-none"
                      placeholder="password"
                      autoComplete="off"
                    />
                    <Key size={18} className="absolute left-3 top-3 text-gray-500" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 italic">Credentials allow the patient to access their history online.</p>
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
            form="client-form"
            className="px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors shadow-lg shadow-teal-900/50 flex items-center gap-2"
          >
            {initialData ? <><RefreshCw size={18} /> Update Details</> : 'Register Client'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientModal;