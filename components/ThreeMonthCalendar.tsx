import React from 'react';
import { ChevronLeft, ChevronRight, Clock, Coffee } from 'lucide-react';
import { Appointment, DoctorAvailability, DoctorShift } from '../types';

interface ThreeMonthCalendarProps {
  mode: 'appointments' | 'availability';
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  appointments?: Appointment[];
  availability?: DoctorAvailability; // Base weekly schedule
  shifts?: DoctorShift[]; // Specific daily overrides
  onDayClick: (date: string) => void;
  selectedDoctorId?: string;
}

const ThreeMonthCalendar: React.FC<ThreeMonthCalendarProps> = ({
  mode,
  currentDate,
  onNavigate,
  appointments = [],
  availability,
  shifts = [],
  onDayClick,
  selectedDoctorId
}) => {
  const monthsToDisplay = [0, 1, 2]; // Current, +1, +2

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Helper to check if a doctor works on a specific date
  const getDoctorScheduleForDay = (dateStr: string, dayOfWeekIndex: number) => {
    // 1. Check for specific shift override
    const shift = shifts.find(s => s.date === dateStr && s.doctorId === selectedDoctorId);
    if (shift) return shift;

    // 2. Fallback to weekly base schedule
    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = daysMap[dayOfWeekIndex];
    
    if (availability && availability.days.includes(dayName)) {
      return { type: 'Work', startTime: availability.startTime, endTime: availability.endTime } as DoctorShift;
    }

    return { type: 'Off' } as DoctorShift;
  };

  return (
    <div className="space-y-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => onNavigate('prev')} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-white">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })} - {' '}
          {new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => onNavigate('next')} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {monthsToDisplay.map((offset) => {
          const displayDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
          const year = displayDate.getFullYear();
          const month = displayDate.getMonth();
          const daysInMonth = getDaysInMonth(year, month);
          const firstDay = getFirstDayOfMonth(year, month); // 0 = Sun
          
          const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
          const blanksArray = Array.from({ length: firstDay }, (_, i) => i);

          return (
            <div key={offset} className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-lg flex flex-col h-full">
              <div className="p-4 bg-gray-900/50 border-b border-gray-800 text-center">
                <h3 className="font-bold text-white">{displayDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
              </div>
              
              <div className="grid grid-cols-7 text-xs font-semibold text-gray-500 bg-gray-900/30 border-b border-gray-800">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="py-2 text-center">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                {blanksArray.map(b => <div key={`blank-${b}`} className="bg-gray-900/20 border-b border-r border-gray-800/50" />)}
                
                {daysArray.map(day => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayOfWeek = new Date(year, month, day).getDay();
                  const isToday = dateStr === new Date().toISOString().split('T')[0];

                  let content = null;
                  let cellClass = "hover:bg-gray-800/50 cursor-pointer transition-colors relative min-h-[80px] p-2 border-b border-r border-gray-800/50 flex flex-col";

                  if (mode === 'appointments') {
                    const dayAppts = appointments.filter(a => a.date === dateStr);
                    content = (
                      <div className="mt-1 space-y-1 overflow-hidden">
                        {dayAppts.slice(0, 3).map(apt => (
                          <div key={apt.id} className={`text-[10px] truncate px-1 rounded ${apt.type === 'Emergency' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                            {apt.time} {apt.patientName.split(' ')[0]}
                          </div>
                        ))}
                        {dayAppts.length > 3 && (
                          <div className="text-[10px] text-gray-500 pl-1">+{dayAppts.length - 3} more</div>
                        )}
                      </div>
                    );
                  } else if (mode === 'availability' && selectedDoctorId) {
                    const schedule = getDoctorScheduleForDay(dateStr, dayOfWeek);
                    
                    if (schedule.type === 'Off') {
                      cellClass += " bg-gray-900/40";
                      content = (
                        <div className="flex-1 flex items-center justify-center opacity-30">
                          <Coffee size={16} />
                        </div>
                      );
                    } else {
                      content = (
                        <div className="mt-2 flex-1 flex flex-col justify-center">
                          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded text-center py-1">
                            <span className="block text-[10px] text-emerald-400 font-mono">{schedule.startTime}</span>
                            <span className="block text-[10px] text-emerald-400 font-mono">{schedule.endTime}</span>
                          </div>
                          {schedule.note && <div className="mt-1 w-full h-1 bg-purple-500 rounded-full" title={schedule.note} />}
                        </div>
                      );
                    }
                  }

                  return (
                    <div 
                      key={day} 
                      className={`${cellClass} ${isToday ? 'bg-blue-900/10 box-content ring-1 ring-inset ring-blue-500/50' : ''}`}
                      onClick={() => onDayClick(dateStr)}
                    >
                      <span className={`text-xs font-bold ${isToday ? 'text-blue-400' : 'text-gray-400'}`}>{day}</span>
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ThreeMonthCalendar;