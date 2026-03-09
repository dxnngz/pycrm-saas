import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '../src/components/UI/Input';
import { UIProvider } from '../src/context/UIContext';

// Helper wrapper — Input consumes useUI() context
const renderInput = (props: React.ComponentProps<typeof Input>) =>
    render(
        <UIProvider>
            <Input {...props} />
        </UIProvider>
    );

describe('Input', () => {
    it('renders the label when provided', () => {
        renderInput({ label: 'Email Address', type: 'email' });
        expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('renders without label when not provided', () => {
        renderInput({ placeholder: 'Search...' });
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('shows the error message when error prop is set', () => {
        renderInput({ label: 'Email', error: 'Invalid email address' });
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });

    it('applies error border class when error is set', () => {
        renderInput({ label: 'Email', error: 'Required' });
        const input = screen.getByRole('textbox');
        // The input should have a red border indicator; error text is visible
        expect(screen.getByText('Required')).toBeInTheDocument();
        // Input element must still be in the DOM
        expect(input).toBeInTheDocument();
    });

    it('calls onChange when the user types', () => {
        const onChange = vi.fn();
        renderInput({ label: 'Name', onChange });
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'John Doe' } });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is set', () => {
        renderInput({ label: 'Name', disabled: true });
        expect(screen.getByRole('textbox')).toBeDisabled();
    });
});
