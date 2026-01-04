import React, { useState } from 'react';
import { X, Calendar, Clock, User, UserPlus, FileText } from 'lucide-react';
import { Appointment, ClientProfile, Employee } from '../types';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Omit<Appointment, 'id' | 'status'>) => void;
  clients: ClientProfile[];
  doctors: Employee[];
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, onSave, clients, doctors }) => {
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    contact: '',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'Consultation' as Appointment['type'],
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doctor = doctors.find(d => d.id === formData.doctorId);
    
    onSave({
      patientId: isNewPatient ? undefined : formData.patientId,
      patientName: formData.patientName,
      contact: formData.contact,
      doctorId: formData.doctorId,
      doctorName: doctor ? doctor.name : 'Unknown',
      date: formData.date,
      time: formData.time,
      type: formData.type,
      notes: formData.notes,
      isNewPatient
    });
    onClose();
    // Reset
    setFormData({
      patientId: '',
      patientName: '',
      contact: '',
      doctorId: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      type: 'Consultation',
      notes: ''
    });
    setIsNewPatient(false);
  };

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        patientId: clientId,
        patientName: client.name,
        contact: client.contact
      }));
    } else {
      setFormData(prev => ({ ...prev, patientId: '', patientName: '', contact: '' }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex-none flex justify-between items-center p-6 border-b border-gray-800 bg-gray-850 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
               <Calendar size={20} />
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-white">
              Schedule Appointment
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <form id="appointment-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Patient Type Toggle */}
            <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
              <button
                type="button"
                onClick={() => { setIsNewPatient(false); setFormData(prev => ({ ...prev, patientName: '', contact: '', patientId: '' })); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${!isNewPatient ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <User size={16} /> Registered Client
              </button>
              <button
                type="button"
                onClick={() => { setIsNewPatient(true); setFormData(prev => ({ ...prev, patientName: '', contact: '', patientId: '' })); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${isNewPatient ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <UserPlus size={16} /> New Patient
              </button>
            </div>

            {/* Patient Details */}
            <div className="space-y-4 border-b border-gray-800 pb-6">
              {!isNewPatient ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Select Patient</label>
                  <select
                    required={!isNewPatient}
                    onChange={handleClientSelect}
                    value={formData.patientId}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">-- Search Database --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Full Name</label>
                    <input
                      required={isNewPatient}
                      name="patientName"
                      value={formData.patientName}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Contact Number</label>
                    <input
                      required={isNewPatient}
                      name="contact"
                      value={formData.contact}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="e.g. +1 555 0000"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-gray-400">Doctor</label>
                <select
                  required
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Select Doctor...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} - {d.department}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Date</label>
                <input
                  required
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Time</label>
                <input
                  required
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-gray-400">Appointment Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="Consultation">Consultation</option>
                  <option value="Checkup">Regular Checkup</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-gray-400">Notes (Optional)</label>
                <textarea
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  placeholder="Reason for visit..."
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
            form="appointment-form"
            className="px-6 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors shadow-lg shadow-purple-900/50 flex items-center gap-2"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;