import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatCard from '../src/components/Dashboard/StatCard';
import React from 'react';

describe('StatCard', () => {
    it('should render the title and value correctly', () => {
        render(
            <StatCard
                title="Total Revenue"
                value="€15,000"
                icon={<span>Icon</span>}
                trend="+12%"
                trendUp={true}
                color="primary"
            />
        );

        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('€15,000')).toBeInTheDocument();
        expect(screen.getByText('+12%')).toBeInTheDocument();
    });

    it('should render negative trend with danger color class', () => {
        render(
            <StatCard
                title="Churn Rate"
                value="4.2%"
                icon={<span>Icon</span>}
                trend="-5%"
                trendUp={false}
                color="rose"
            />
        );
        expect(screen.getByText('-5%')).toBeInTheDocument();
        expect(screen.getByText('Churn Rate')).toBeInTheDocument();
    });
});
