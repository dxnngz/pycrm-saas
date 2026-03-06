import { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  MapPin,
  Trash2,
  CalendarDays
} from 'lucide-react';
import { api } from '../../services/api';
import type { Event as CalendarEvent } from '../../types';
import { toast } from 'sonner';
import { Button } from '../UI/Button';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const res = await api.events.getAll(firstDay, lastDay);
      setEvents(res || []);
    } catch {
      console.error('Error loading events');
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.events.delete(id);
      toast.success('Event deleted successfully');
      loadEvents();
    } catch {
      toast.error('Failed to delete event');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Sales Calendar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <CalendarIcon size={14} className="text-primary-500" />
            Manage meetings and strategic commercial events.
          </p>
        </div>
        <Button variant="primary" size="md">
          <Plus size={18} className="mr-2" />
          New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-slate-50 dark:bg-slate-950 p-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {day}
              </div>
            ))}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white dark:bg-slate-900 p-2 min-h-[100px]"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = events.filter(e => new Date(e.start_date).getDate() === day);
              const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

              return (
                <div key={day} className={`bg-white dark:bg-slate-900 p-2 min-h-[100px] border-t border-l border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group relative overflow-y-auto max-h-[120px] ${isToday ? 'bg-primary-50/20 dark:bg-primary-500/5' : ''}`}>
                  <span className={`text-xs font-bold ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`}>{day}</span>
                  <div className="mt-1.5 space-y-1">
                    {dayEvents.map(event => {
                      const eventTime = new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={event.id} className="group/event relative">
                          <div className="text-[9px] p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 truncate font-semibold" title={event.title}>
                            <span className="text-primary-600 dark:text-primary-400 mr-1">{eventTime.split(' ')[0]}</span>
                            {event.title}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <CalendarDays size={16} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Upcoming Events</h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-lg animate-pulse border border-slate-200 dark:border-slate-800"></div>
              ))}
            </div>
          ) : events.filter(e => new Date(e.start_date) >= new Date()).length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
              <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-md flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-200 dark:border-slate-700">
                <CalendarIcon size={18} className="text-slate-300" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {events
                .filter(e => new Date(e.start_date) >= new Date())
                .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                .map(event => {
                  const eventDate = new Date(event.start_date);
                  const timeString = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateString = eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                  return (
                    <div key={event.id} className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary-500/50 transition-all group relative">
                      <button onClick={() => handleDelete(event.id)} className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="shrink-0 w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded flex items-center justify-center border border-slate-100 dark:border-slate-700">
                          <Clock size={16} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">{dateString} • {timeString}</p>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate max-w-[140px]">{event.title}</h4>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {event.client_id && (
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium font-mono">
                            <User size={12} />
                            <span>CID: #{event.client_id.toString().padStart(4, '0')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                          <MapPin size={12} className="shrink-0" />
                          <span>{event.description || 'No location provided'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;