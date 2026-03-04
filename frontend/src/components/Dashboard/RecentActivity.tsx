import { History, ArrowUpRight, CheckSquare, Sparkles } from 'lucide-react';

interface Activity {
    id: string;
    type: 'sale' | 'task-done' | 'task-new';
    title: string;
    description: string;
    time: string;
    amount?: number;
}

interface RecentActivityProps {
    activities: Activity[];
}

const RecentActivity = ({ activities }: RecentActivityProps) => {
    return (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow h-full flex flex-col">
            <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-4">
                    <History size={24} className="text-primary-500" />
                    Flujo de Actividad
                </h3>
                <div className="flex items-center gap-2 bg-primary-500/10 text-primary-600 px-4 py-1.5 rounded-full border border-primary-500/20">
                    <Sparkles size={14} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">En Vivo</span>
                </div>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                {activities.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 py-10">
                        <History size={48} className="mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">Sin Actividad Reciente</p>
                    </div>
                ) : activities.map((activity) => (
                    <div key={activity.id} className="flex gap-5 group p-5 rounded-[2rem] hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                        <div className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center ${activity.type === 'sale'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                            } group-hover:scale-110 transition-transform shadow-sm`}>
                            {activity.type === 'sale' ? <ArrowUpRight size={20} /> : <CheckSquare size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight truncate pr-2">{activity.title}</h4>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">{activity.time}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-3 truncate leading-relaxed">{activity.description}</p>
                            {activity.amount && (
                                <span className="inline-flex items-center text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm">
                                    +{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(activity.amount)}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-10 py-5 text-[10px] font-black text-primary-500 hover:text-white transition-all uppercase tracking-[0.2em] border-2 border-primary-500/10 rounded-2xl hover:bg-primary-600 hover:border-primary-600 shadow-sm active:scale-[0.98]">
                Auditoría Completa de Eventos
            </button>
        </div>
    );
};

export default RecentActivity;
