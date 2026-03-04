import { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  MapPin,
  Trash2
} from 'lucide-react';
import { api } from '../../services/api';
import type { Event as CalendarEvent } from '../../types';
import { toast } from 'sonner';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const res = await api.events.getAll(firstDay, lastDay);
      setEvents(res);
    } catch {
      console.error('Error loading events');
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
    if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) return;
    try {
      await api.events.delete(id);
      toast.success('Evento eliminado correctamente');
      loadEvents();
    } catch {
      toast.error('Error al eliminar el evento');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Agenda Comercial</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 flex items-center gap-2">
            <CalendarIcon size={18} className="text-primary-500" />
            Gestión de citas y eventos estratégicos
          </p>
        </div>
        <button className="flex items-center gap-3 bg-primary-600 text-white px-8 h-14 rounded-2xl font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30">
          <Plus size={24} />
          <span>Nuevo Evento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow p-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <ChevronLeft size={24} />
              </button>
              <button onClick={nextMonth} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="bg-slate-50 dark:bg-slate-950 p-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                {day}
              </div>
            ))}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white dark:bg-slate-900 p-4 min-h-[120px]"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = events.filter(e => new Date(e.start_date).getDate() === day);
              return (
                <div key={day} className="bg-white dark:bg-slate-900 p-4 min-h-[120px] border-t border-l border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors group relative overflow-y-auto max-h-[150px]">
                  <span className="text-sm font-black text-slate-400 group-hover:text-primary-500 transition-colors">{day}</span>
                  <div className="mt-2 space-y-1">
                    {dayEvents.map(event => {
                      const eventTime = new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={event.id} className="group/event relative">
                          <div className="text-[10px] p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg font-bold border border-primary-100 dark:border-primary-800 truncate" title={event.title}>
                            {eventTime} {event.title}
                          </div>
                          <button onClick={() => handleDelete(event.id)} className="absolute top-1 right-1 p-1 bg-white/80 dark:bg-slate-800/80 rounded opacity-0 group-hover/event:opacity-100 transition-opacity text-rose-500">
                            <Trash2 size={12} />
                          </button>
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
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter px-2">Próximas Citas</h3>
          {loading ? (
            <div className="text-center text-slate-500 px-2">Cargando eventos...</div>
          ) : events.length === 0 ? (
            <div className="bg-slate-50/50 dark:bg-slate-900/40 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-center shadow-sm">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 dark:border-slate-700">
                <CalendarIcon size={24} className="text-slate-400" />
              </div>
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm mb-2">Calendario Despejado</h4>
              <p className="text-xs font-bold text-slate-500">No hay compromisos agendados para este periodo.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {events.map(event => {
                const eventDate = new Date(event.start_date);
                const isPassed = eventDate < new Date();

                if (isPassed) return null; // Show only upcoming

                const timeString = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateString = eventDate.toLocaleDateString();

                return (
                  <div key={event.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative">
                    <button onClick={() => handleDelete(event.id)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-all">
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-primary-500 uppercase tracking-widest">{dateString} {timeString}</p>
                        <h4 className="font-bold text-slate-900 dark:text-white leading-tight max-w-[180px] truncate">{event.title}</h4>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {event.client_id && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <User size={14} />
                          <span>Cliente #{event.client_id}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium line-clamp-2">
                        <MapPin size={14} className="shrink-0" />
                        <span>{event.description || 'Sin ubicación / detalles'}</span>
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