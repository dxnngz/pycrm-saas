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
                    Si existe una cuenta para {email}, recibirás un enlace para restablecer la contraseña en unos segundos.
                </p>
                <Button
                    variant="outline"
                    fullWidth
                    onClick={onBack}
                >
                    Volver a iniciar sesión
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <Button type="submit" fullWidth isLoading={isLoading}>
                Enviar enlace
            </Button>
            <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={onBack}
                className="text-[10px] font-bold uppercase tracking-widest text-surface-muted"
            >
                Volver a iniciar sesión
            </Button>
        </form>
    );
};
