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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative w-full h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Activity size={16} className="text-primary-500" />
                        Commercial Traffic
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revenue Analysis</p>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-500/10">
                    <TrendingUp size={12} />
                    <span className="text-[9px] font-bold uppercase">+12.4%</span>
                </div>
            </div>

            <div className="flex-1 w-full relative min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200} debounce={50}>
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
