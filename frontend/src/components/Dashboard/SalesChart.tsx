import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

interface SalesChartProps {
    data: { name: string; sales: number }[];
}

const SalesChart = ({ data }: SalesChartProps) => {
    const safeData = Array.isArray(data) ? data : [];

    return (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow h-full min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-4">
                        <Activity size={24} className="text-primary-500" />
                        Tráfico Comercial
                    </h3>
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-[0.25em]">Histórico de Ingresos Proyectados</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-1.5 rounded-full border border-emerald-500/20">
                    <TrendingUp size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">+12.4% vs Mes Anterior</span>
                </div>
            </div>

            <div className="flex-1 w-full relative min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={0}>
                    <AreaChart data={safeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.3} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                            dy={15}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                            tickFormatter={(value) => `€${value >= 1000 ? (value / 1000) + 'k' : value}`}
                            dx={-10}
                        />
                        <Tooltip
                            cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }}
                            contentStyle={{
                                borderRadius: '24px',
                                border: '1px solid rgba(99, 102, 241, 0.1)',
                                boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)',
                                backgroundColor: '#0f172a',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                padding: '16px'
                            }}
                            itemStyle={{ color: '#818cf8' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="sales"
                            stroke="#6366f1"
                            strokeWidth={5}
                            fillOpacity={1}
                            fill="url(#colorSales)"
                            animationDuration={2000}
                            activeDot={{ r: 8, strokeWidth: 0, fill: '#6366f1' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SalesChart;
