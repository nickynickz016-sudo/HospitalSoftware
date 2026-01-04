import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Briefcase, Coffee } from 'lucide-react';
import { DoctorShift } from '../types';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: DoctorShift) => void;
  doctorId: string;
  date: string;
  existingShift?: DoctorShift;
  defaultStart?: string;
  defaultEnd?: string;
}

const ShiftModal: React.FC<ShiftModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  doctorId, 
  date, 
  existingShift,
  defaultStart = '09:00',
  defaultEnd = '17:00'
}) => {
  const [type, setType] = useState<'Work' | 'Off'>('Work');
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (existingShift) {
        setType(existingShift.type);
        setStartTime(existingShift.startTime);
        setEndTime(existingShift.endTime);
        setNote(existingShift.note || '');
      } else {
        setType('Work');
        setStartTime(defaultStart);
        setEndTime(defaultEnd);
        setNote('');
      }
    }
  }, [isOpen, existingShift, defaultStart, defaultEnd]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: existingShift?.id || `shift-${Date.now()}`,
      doctorId,
      date,
      type,
      startTime: type === 'Work' ? startTime : '',
      endTime: type === 'Work' ? endTime : '',
      note
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-850 rounded-t-xl">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Calendar size={16} className="text-purple-400" />
            Edit Schedule: {new Date(date).toLocaleDateString()}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('Work')}
              className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                type === 'Work' 
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Briefcase size={20} />
              <span className="text-sm font-medium">Working</span>
            </button>
            <button
              type="button"
              onClick={() => setType('Off')}
              className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                type === 'Off' 
                  ? 'bg-gray-600/20 border-gray-500 text-gray-300' 
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Coffee size={20} />
              <span className="text-sm font-medium">Day Off</span>
            </button>
          </div>

          {type === 'Work' && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-medium">Start Time</label>
                <div className="relative">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-medium">End Time</label>
                <div className="relative">
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">Note (Optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="e.g. Half day, Covering ER"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-white text-gray-900 font-bold hover:bg-gray-100 transition-colors mt-2"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShiftModal;