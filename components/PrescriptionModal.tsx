import React, { useState, useEffect } from 'react';
import { X, Pill, Syringe, User, AlertCircle } from 'lucide-react';
import { InventoryItem, Prescription, ClientProfile } from '../types';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prescription: Omit<Prescription, 'id' | 'timestamp' | 'status'>) => void;
  inventory: InventoryItem[];
  clients: ClientProfile[];
}

const PrescriptionModal: React.FC<PrescriptionModalProps> = ({ isOpen, onClose, onSave, inventory, clients }) => {
  const [formData, setFormData] = useState({
    patientName: '',
    patientAge: '',
    medicationId: '',
    dosage: '',
    dispenseQty: 1, // Units/Vials (Legacy)
    doseAmountMl: 0.5, // For Liquids
    totalShots: 1, // For Liquids
    bufferMl: 0, // Buffer/Wastage
    frequency: '',
    notes: '',
    target: 'pharmacy' as 'pharmacy' | 'nursing',
    doctorName: 'Dr. Sarah Cole', 
    selectedClientId: ''
  });

  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>(undefined);

  useEffect(() => {
    const item = inventory.find(i => i.id === formData.medicationId);
    setSelectedItem(item);
  }, [formData.medicationId, inventory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct dosage string automatically for liquids if not provided
    let finalDosage = formData.dosage;
    if (selectedItem?.isLiquid && (!finalDosage || finalDosage === '')) {
      finalDosage = `${formData.doseAmountMl}mL x ${formData.totalShots} shots`;
      if (formData.bufferMl > 0) {
        finalDosage += ` (+${formData.bufferMl}mL buffer)`;
      }
    }

    onSave({
      patientName: formData.patientName,
      patientAge: parseInt(formData.patientAge) || 0,
      medicationId: formData.medicationId,
      medicationName: selectedItem ? selectedItem.name : 'Unknown',
      dosage: finalDosage,
      dispenseQty: Number(formData.dispenseQty),
      doseAmountMl: selectedItem?.isLiquid ? Number(formData.doseAmountMl) : undefined,
      totalShots: selectedItem?.isLiquid ? Number(formData.totalShots) : undefined,
      bufferMl: selectedItem?.isLiquid ? Number(formData.bufferMl) : undefined,
      frequency: formData.frequency,
      notes: formData.notes,
      target: formData.target,
      doctorName: formData.doctorName
    });
    onClose();
    // Reset form
    setFormData({
      patientName: '',
      patientAge: '',
      medicationId: '',
      dosage: '',
      dispenseQty: 1,
      doseAmountMl: 0.5,
      totalShots: 1,
      bufferMl: 0,
      frequency: '',
      notes: '',
      target: 'pharmacy',
      doctorName: 'Dr. Sarah Cole',
      selectedClientId: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: (name === 'dispenseQty' || name === 'doseAmountMl' || name === 'totalShots' || name === 'bufferMl') ? Number(value) : value 
    }));
  };

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        selectedClientId: clientId,
        patientName: client.name,
        patientAge: client.age.toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedClientId: '',
        patientName: '',
        patientAge: ''
      }));
    }
  };

  // Calculate total volume for display
  const totalVolume = selectedItem?.isLiquid 
    ? (formData.doseAmountMl * formData.totalShots + formData.bufferMl).toFixed(2)
    : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex-none flex justify-between items-center p-6 border-b border-gray-800 bg-gray-850 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
               <User size={20} />
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-white">
              New Prescription
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <form id="prescription-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Target Selection */}
            <div className="grid grid-cols-2 gap-4">
              <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-3 transition-all ${formData.target === 'pharmacy' ? 'bg-indigo-500/10 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-800/80'}`}>
                <input 
                  type="radio" 
                  name="target" 
                  value="pharmacy" 
                  checked={formData.target === 'pharmacy'} 
                  onChange={handleChange}
                  className="hidden" 
                />
                <Pill size={32} className={formData.target === 'pharmacy' ? 'text-indigo-400' : 'text-gray-500'} />
                <span className="font-medium">To Pharmacy</span>
                <span className="text-xs opacity-60">Dispense / Sell</span>
              </label>

              <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-3 transition-all ${formData.target === 'nursing' ? 'bg-teal-500/10 border-teal-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-800/80'}`}>
                <input 
                  type="radio" 
                  name="target" 
                  value="nursing" 
                  checked={formData.target === 'nursing'} 
                  onChange={handleChange}
                  className="hidden" 
                />
                <Syringe size={32} className={formData.target === 'nursing' ? 'text-teal-400' : 'text-gray-500'} />
                <span className="font-medium">To Nurse</span>
                <span className="text-xs opacity-60">Inject / Administer</span>
              </label>
            </div>

            {/* Quick Select Client */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Select Registered Patient (Optional)</label>
              <select
                value={formData.selectedClientId}
                onChange={handleClientSelect}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">-- Manual Entry --</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} (ID: {client.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Details */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Patient Name</label>
                <input
                  required
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleChange}
                  readOnly={!!formData.selectedClientId}
                  className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none ${formData.selectedClientId ? 'opacity-70 cursor-not-allowed' : ''}`}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Age</label>
                <input
                  required
                  type="number"
                  name="patientAge"
                  value={formData.patientAge}
                  onChange={handleChange}
                  readOnly={!!formData.selectedClientId}
                  className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none ${formData.selectedClientId ? 'opacity-70 cursor-not-allowed' : ''}`}
                  placeholder="e.g. 45"
                />
              </div>

              {/* Medication Selection */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-400">Medication (Inventory)</label>
                <select
                  required
                  name="medicationId"
                  value={formData.medicationId}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select Medication...</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} {item.isLiquid ? '(Liquid)' : `(Stock: ${item.quantity} ${item.unit})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Liquid Logic vs Standard Logic */}
              {selectedItem?.isLiquid ? (
                <div className="col-span-2 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-400">
                      <Syringe size={18} />
                      <span className="font-semibold text-sm">Liquid Formulation</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Dose per Shot (mL)</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        name="doseAmountMl"
                        value={formData.doseAmountMl}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Total Shots</label>
                      <input
                        required
                        type="number"
                        name="totalShots"
                        value={formData.totalShots}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300" title="Additional volume to account for dead space or priming">
                        Buffer / Loss (mL)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="bufferMl"
                        value={formData.bufferMl}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-blue-500/30">
                     <span className="text-blue-300 opacity-70 flex items-center gap-1">
                        <AlertCircle size={12} /> Buffer includes needle dead space or priming.
                     </span>
                     <div className="text-gray-400">
                      Total Deduction: <span className="text-white font-bold text-sm ml-1">{totalVolume} mL</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Prescribed Dosage</label>
                    <input
                      required
                      name="dosage"
                      value={formData.dosage}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g. 500mg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">
                       Quantity to {formData.target === 'pharmacy' ? 'Dispense' : 'Administer'}
                       {selectedItem && <span className="text-xs text-indigo-400 ml-1">({selectedItem.unit})</span>}
                    </label>
                    <input
                      required
                      type="number"
                      name="dispenseQty"
                      value={formData.dispenseQty}
                      min="1"
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Frequency</label>
                <input
                  required
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Twice daily"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-400">Instructions / Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Take after meals. Monitor blood pressure."
                />
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
            form="prescription-form"
            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-lg shadow-indigo-900/50 flex items-center gap-2"
          >
            Create Prescription
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionModal;