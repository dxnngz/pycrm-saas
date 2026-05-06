import React, { useState } from 'react';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';
import { Alert } from '../UI/Alert';

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
                    Tu contraseña se ha actualizado. Ya puedes iniciar sesión.
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
                label="Nueva contraseña"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <div className="text-[11px] font-semibold text-surface-muted">
                Usa al menos 8 caracteres.
            </div>
            <Input
                label="Confirmar contraseña"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
            />
            {localError ? (
                <Alert variant="danger">{localError}</Alert>
            ) : null}
            <Button type="submit" fullWidth isLoading={isLoading}>
                Actualizar contraseña
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
