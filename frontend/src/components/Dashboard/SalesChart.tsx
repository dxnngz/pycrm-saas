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
    const isDark = document.documentElement.classList.contains('dark');

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative w-full h-full flex flex-col overflow-hidden transition-colors">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Activity size={16} className="text-primary-500" />
                        Commercial Traffic
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revenue Analysis</p>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/10">
                    <TrendingUp size={12} />
                    <span className="text-[9px] font-bold uppercase">+12.4%</span>
                </div>
            </div>

            <div className="flex-1 w-full relative min-h-[350px] rounded-lg overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                    <AreaChart data={safeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            vertical={false} 
                            stroke={isDark ? '#1e293b' : '#e2e8f0'} 
                            opacity={0.5} 
                        />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 700 }}
                            dy={15}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 700 }}
                            tickFormatter={(value) => `€${value >= 1000 ? (value / 1000) + 'k' : value}`}
                            dx={-10}
                        />
                        <Tooltip
                            cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }}
                            contentStyle={{
                                borderRadius: '16px',
                                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                color: isDark ? '#f8fafc' : '#0f172a',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                padding: '12px'
                            }}
                            itemStyle={{ color: '#6366f1' }}
                            labelStyle={{ color: isDark ? '#94a3b8' : '#64748b', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="sales"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorSales)"
                            animationDuration={1500}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SalesChart;
