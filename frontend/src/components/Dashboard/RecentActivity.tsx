import { History, ArrowUpRight, CheckSquare } from 'lucide-react';

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
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <History size={20} className="text-primary-500" />
                    Actividad Reciente
                </h3>
                <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">En Vivo</span>
            </div>
            <div className="space-y-6">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 group">
                        <div className={`mt-1 h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center ${activity.type === 'sale' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary-500/10 text-primary-500'
                            } group-hover:scale-110 transition-transform`}>
                            {activity.type === 'sale' ? <ArrowUpRight size={18} /> : <CheckSquare size={18} />}
                        </div>
                        <div className="border-b border-slate-50 dark:border-slate-800/50 pb-4 flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight">{activity.title}</h4>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{activity.time}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-2">{activity.description}</p>
                            {activity.amount && (
                                <span className="text-xs font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                    +{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(activity.amount)}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-8 py-4 text-xs font-black text-primary-500 hover:text-primary-600 transition-colors uppercase tracking-widest border-2 border-primary-500/10 rounded-2xl hover:bg-primary-500/5">
                Ver Historial Atómico
            </button>
        </div>
    );
};

export default RecentActivity;
