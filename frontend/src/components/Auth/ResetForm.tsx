import React, { useState } from 'react';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';

interface ResetFormProps {
    onSubmit: (newPassword: string) => Promise<void>;
    isLoading: boolean;
    onBack: () => void;
    success: boolean;
}

export const ResetForm: React.FC<ResetFormProps> = ({ onSubmit, isLoading, onBack, success }) => {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [localError, setLocalError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        if (password.length < 8) {
            setLocalError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirm) {
            setLocalError('Passwords do not match');
            return;
        }
        await onSubmit(password);
    };

    if (success) {
        return (
            <div className="text-center space-y-4 py-4">
                <p className="text-sm text-surface-muted">
                    Your password has been updated. You can sign in now.
                </p>
                <Button
                    variant="outline"
                    fullWidth
                    onClick={onBack}
                >
                    Back to sign in
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="New password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <Input
                label="Confirm new password"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
            />
            {localError ? (
                <div className="text-xs font-bold text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center">
                    {localError}
                </div>
            ) : null}
            <Button type="submit" fullWidth isLoading={isLoading}>
                Update password
            </Button>
            <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={onBack}
                className="text-[10px] font-bold uppercase tracking-widest text-surface-muted"
            >
                Back to sign in
            </Button>
        </form>
    );
};

