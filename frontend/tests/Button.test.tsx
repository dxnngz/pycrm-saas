import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../src/components/UI/Button';
import { UIProvider } from '../src/context/UIContext';

// Helper wrapper — Button consumes useUI() context
const renderButton = (props: React.ComponentProps<typeof Button>) =>
    render(
        <UIProvider>
            <Button {...props} />
        </UIProvider>
    );

describe('Button', () => {
    it('renders children correctly', () => {
        renderButton({ children: 'Submit', variant: 'primary' });
        expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('shows spinner and is disabled when isLoading=true', () => {
        renderButton({ children: 'Save', isLoading: true });
        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
        // Lucide Loader2 renders an SVG inside the button
        expect(btn.querySelector('svg')).toBeTruthy();
    });

    it('is disabled when disabled prop is set', () => {
        renderButton({ children: 'Save', disabled: true });
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('calls onClick when clicked', () => {
        const onClick = vi.fn();
        renderButton({ children: 'Click Me', onClick });
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
        const onClick = vi.fn();
        renderButton({ children: 'Click Me', disabled: true, onClick });
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).not.toHaveBeenCalled();
    });
});
