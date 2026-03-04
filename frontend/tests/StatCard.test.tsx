import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatCard from '../src/components/Dashboard/StatCard';

describe('StatCard', () => {
    it('should render the title and value correctly', () => {
        render(
            <StatCard
                title="Total Revenue"
                value="€15,000"
                icon={<span>Icon</span>}
                trend="+15%"
                color="primary"
            />
        );

        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('€15,000')).toBeInTheDocument();
        expect(screen.getByText('+15%')).toBeInTheDocument();
    });
});
