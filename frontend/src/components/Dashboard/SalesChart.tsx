import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface SalesChartProps {
    data: { name: string; sales: number }[];
}

const SalesChart = ({ data }: SalesChartProps) => {
    const safeData = Array.isArray(data) ? data : [];

    return (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow h-[450px]">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <TrendingUp size={20} className="text-primary-500" />
                        Ventas Semanales
                    </h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Rendimiento en Tiempo Real</p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={safeData}>
                    <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.5} />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                        dy={10} 
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                        tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            borderRadius: '24px', 
                            border: 'none', 
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                            backgroundColor: '#0f172a',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            padding: '16px'
                        }} 
                        itemStyle={{ color: '#fff' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#6366f1" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorSales)" 
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SalesChart;
