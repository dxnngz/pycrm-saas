import React from 'react';
import { TrendingUp, Target, Trophy, CheckSquare } from 'lucide-react';
import StatCard from './StatCard';

interface StatsGridProps {
    stats: {
        totalSales: number;
        activeOpportunities: number;
        winRate: number;
        pendingTasks: number;
    };
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Revenue"
                value={`${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(stats.totalSales)}`}
                icon={<TrendingUp size={16} />}
                trend="+12.5%"
                color="primary"
            />
            <StatCard
                title="Active Deals"
                value={stats.activeOpportunities.toString()}
                icon={<Target size={16} />}
                trend="+3 new"
                color="amber"
            />
            <StatCard
                title="Win Rate"
                value={`${stats.winRate.toFixed(1)}%`}
                icon={<Trophy size={16} />}
                trend="Stable"
                color="emerald"
            />
            <StatCard
                title="Pending Tasks"
                value={stats.pendingTasks.toString()}
                icon={<CheckSquare size={16} />}
                trend="Due soon"
                color="indigo"
            />
        </div>
    );
};
