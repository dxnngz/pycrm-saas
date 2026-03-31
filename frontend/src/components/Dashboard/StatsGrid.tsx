import React from 'react';
import { TrendingUp, Target, DollarSign, Activity } from 'lucide-react';
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
                title="Total Sales"
                value={`$${stats.totalSales.toLocaleString()}`}
                icon={<DollarSign size={20} />}
                trend="+12.5%"
                trendUp={true}
                color="primary"
            />
            <StatCard
                title="Active Opportunities"
                value={stats.activeOpportunities.toString()}
                icon={<Target size={20} />}
                trend="+3 new"
                trendUp={true}
                color="indigo"
            />
            <StatCard
                title="Pipeline Win Rate"
                value={`${Number(stats.winRate).toFixed(1)}%`}
                icon={<TrendingUp size={20} />}
                trend="-2.4%"
                trendUp={false}
                color="emerald"
            />
            <StatCard
                title="Pending Tasks"
                value={stats.pendingTasks.toString()}
                icon={<Activity size={20} />}
                trend="Normal"
                trendUp={true}
                color="amber"
            />
        </div>
    );
};
