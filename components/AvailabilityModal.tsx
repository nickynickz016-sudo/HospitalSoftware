import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar } from 'lucide-react';
import { DoctorAvailability, Employee } from '../types';

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (availability: DoctorAvailability) => void;
  doctor: Employee | null;
  initialAvailability?: DoctorAvailability;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const AvailabilityModal: React.FC<AvailabilityModalProps> = ({ isOpen, onClose, onSave, doctor, initialAvailability }) => {
  const [formData, setFormData] = useState<DoctorAvailability>({
    doctorId: '',
    doctorName: '',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    startTime: '09:00',
    endTime: '17:00'
  });

  useEffect(() => {
    if (doctor) {
      if (initialAvailability) {
        setFormData(initialAvailability);
      } else {
        setFormData({
          doctorId: doctor.id,
          doctorName: doctor.name,
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          startTime: '09:00',
          endTime: '17:00'
        });
      }
    }
  }, [doctor, initialAvailability, isOpen]);

  if (!isOpen || !doctor) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const toggleDay = (day: string) => {
    setFormData(prev => {
      const days = new Set<string>(prev.days);
      if (days.has(day)) days.delete(day);
      else days.add(day);
      
      // Sort days based on standard week order
      const sortedDays = Array.from(days).sort((a: string, b: string) => DAYS.indexOf(a) - DAYS.indexOf(b));
      return { ...prev, days: sortedDays };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl flex flex-col">
        
        <div className="flex-none flex justify-between items-center p-6 border-b border-gray-800 bg-gray-850 rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold text-white">Edit Availability</h2>
            <p className="text-sm text-gray-400">{doctor.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <form id="availability-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Calendar size={16} /> Working Days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${
                      formData.days.includes(day)
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                        : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Clock size={16} /> Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Clock size={16} /> End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
            form="availability-form"
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-lg shadow-blue-900/50"
          >
            Save Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityModal;