import React, { useState } from 'react';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';

interface RegisterFormProps {
    onSubmit: (data: { name: string; email: string; pass: string; company: string }) => Promise<void>;
    isLoading: boolean;
    onBack: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, isLoading, onBack }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [company, setCompany] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, email, pass: password, company });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Company name"
                placeholder="Your corporate name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
            />
            <Input
                label="Full name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />
            <Input
                label="Work email"
                type="email"
                placeholder="john@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <Input
                label="Password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
            />
            <Button type="submit" fullWidth isLoading={isLoading} className="mt-2">
                Create account
            </Button>
            <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={onBack}
                className="text-xs"
            >
                Already have an account? Sign in
            </Button>
        </form>
    );
};
