import { useState, useEffect } from 'react';
import { Shield, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';

import { toast } from 'sonner';

import type { User } from '../../types';

const UsersView = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await api.users.getAll();
            const safeData = Array.isArray(data) ? data : [];
            setUsers(safeData);
        } catch (error) {
            console.error(error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: number, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'empleado' : 'admin';
        try {
            await api.users.updateRole(userId, newRole);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast.success('Privilegios actualizados correctamente.');
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('¿Atención! ¿Deseas revocar el acceso y eliminar permanentemente a este usuario de PyCRM?')) return;
        try {
            await api.users.delete(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            toast.success('Identidad eliminada con éxito del registro.');
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-primary-600" size={40} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Identidades</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 flex items-center gap-2">
                        <Shield size={18} className="text-primary-500" />
                        Centro de Control de Acceso (RBAC) - Solo nivel Administrador
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-sm premium-shadow p-8 border border-slate-100 dark:border-slate-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-slate-100 dark:border-slate-800">
                                <th className="pb-4 font-black text-xs uppercase tracking-widest text-slate-400 px-6">Identidad</th>
                                <th className="pb-4 font-black text-xs uppercase tracking-widest text-slate-400 px-6">Email Corportativo</th>
                                <th className="pb-4 font-black text-xs uppercase tracking-widest text-slate-400 px-6 text-center">Nivel de Acceso</th>
                                <th className="pb-4 font-black text-xs uppercase tracking-widest text-slate-400 px-6 text-right">Acciones Peligrosas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {users.map(user => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                >
                                    <td className="py-6 px-6 font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                                            {user.name.charAt(0)}
                                        </div>
                                        {user.name}
                                    </td>
                                    <td className="py-6 px-6 text-slate-500 font-medium">
                                        {user.email}
                                    </td>
                                    <td className="py-6 px-6 text-center">
                                        <button
                                            onClick={() => handleRoleChange(user.id, user.role)}
                                            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${user.role === 'admin' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                                        >
                                            {user.role}
                                        </button>
                                    </td>
                                    <td className="py-6 px-6 text-right">
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="p-3 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UsersView;
