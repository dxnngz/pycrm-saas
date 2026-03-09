import React, { useState } from 'react';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';

interface LoginFormProps {
    onSubmit: (email: string, pass: string) => Promise<void>;
    isLoading: boolean;
    onForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading, onForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(email, password);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Email address"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
            />
            <div className="space-y-1">
                <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Password
                    </label>
                    <button
                        type="button"
                        onClick={onForgotPassword}
                        className="text-[10px] font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 uppercase tracking-tight"
                    >
                        Forgot password?
                    </button>
                </div>
                <div className="relative">
                    <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            <Button type="submit" fullWidth isLoading={isLoading} className="mt-2">
                Sign in <ChevronRight size={14} className="ml-1" />
            </Button>
        </form>
    );
};
