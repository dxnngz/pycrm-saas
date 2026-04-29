import React, { useState } from 'react';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';

interface ForgotFormProps {
    onSubmit: (email: string) => Promise<void>;
    isLoading: boolean;
    onBack: () => void;
    success: boolean;
}

export const ForgotForm: React.FC<ForgotFormProps> = ({ onSubmit, isLoading, onBack, success }) => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(email);
    };

    if (success) {
        return (
            <div className="text-center space-y-4 py-4">
                <p className="text-sm text-surface-muted">
                    If an account exists for {email}, you will receive a password reset link shortly.
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
                label="Email address"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <Button type="submit" fullWidth isLoading={isLoading}>
                Send reset link
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
