import React from 'react';
import { TrendingUp, Target, DollarSign, Activity } from 'lucide-react';
import StatCard from './StatCard';
import { formatMoney } from '../../utils/format';

interface StatsGridProps {
    period?: 'monthly' | 'yearly';
    stats: {
        totalSales: number;
        activeOpportunities: number;
        winRate: number;
        pendingTasks: number;
    };
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, period = 'monthly' }) => {
    const salesTitle = period === 'yearly' ? 'Ventas del año' : 'Ventas (6 meses)';
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title={salesTitle}
                value={formatMoney(stats.totalSales, { maximumFractionDigits: 0 })}
                icon={<DollarSign size={20} />}
                color="primary"
            />
            <StatCard
                title="Oportunidades activas"
                value={stats.activeOpportunities.toString()}
                icon={<Target size={20} />}
                color="indigo"
            />
            <StatCard
                title="Tasa de cierre"
                value={`${Number(stats.winRate).toFixed(1)}%`}
                icon={<TrendingUp size={20} />}
                color="emerald"
            />
            <StatCard
                title="Tareas pendientes"
                value={stats.pendingTasks.toString()}
                icon={<Activity size={20} />}
                color="amber"
            />
        </div>
    );
};

export default StatsGrid;
