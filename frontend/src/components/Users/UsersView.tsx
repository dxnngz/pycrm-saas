import { useState, useEffect, useCallback } from 'react';
import { Shield, Trash2, Loader2, UserCog } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'sonner';
import type { User } from '../../types';
import { Table, type Column } from '../UI/Table';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';

const UsersView = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.users.getAll();
            const safeData = Array.isArray(data) ? data : [];
            setUsers(safeData);
        } catch (error) {
            console.error(error);
            setUsers([]);
            toast.error('No se pudieron cargar los usuarios');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleRoleChange = async (userId: number, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'empleado' : 'admin';
        try {
            await api.users.updateRole(userId, newRole);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast.success(`Rol actualizado a ${newRole}`);
        } catch (error) {
            console.error(error);
            toast.error('No se pudo actualizar el rol');
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('¿Seguro que quieres eliminar este usuario? Esta acción no se puede deshacer.')) return;
        try {
            await api.users.delete(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            toast.success('Usuario eliminado correctamente');
        } catch (error) {
            console.error(error);
            toast.error('No se pudo eliminar el usuario');
        }
    };

    const columns: Column<User>[] = [
        {
            header: 'Usuario',
            accessor: (user: User) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-surface-muted-bg flex items-center justify-center text-[10px] font-bold text-surface-muted border border-surface-border">
                        {user.name.charAt(0)}
                    </div>
                    <div className="font-medium text-surface-text">{user.name}</div>
                </div>
            ),
        },
        {
            header: 'Email',
            accessor: 'email',
            className: 'text-surface-muted',
        },
        {
            header: 'Rol',
            align: 'center',
            accessor: (user: User) => (
                <button
                    onClick={() => handleRoleChange(user.id, user.role)}
                    className="focus:outline-none"
                    title="Cambiar rol"
                >
                    <Badge variant={user.role === 'admin' ? 'success' : 'secondary'}>
                        {user.role}
                    </Badge>
                </button>
            ),
        },
        {
            header: 'Acciones',
            align: 'right',
            accessor: (user: User) => (
                <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-1.5 text-surface-muted hover:text-red-600 rounded-md transition-colors"
                    title="Eliminar"
                >
                    <Trash2 size={16} />
                </button>
            ),
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-surface-text">Usuarios</h1>
                    <p className="text-sm text-surface-muted mt-1 flex items-center gap-1.5">
                        <Shield size={14} className="text-primary-500" />
                        Gestión de accesos (RBAC) - Vista de administrador
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="md"
                    onClick={() => loadUsers()}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <UserCog size={16} className="mr-2" />}
                    Actualizar
                </Button>
            </div>

            <Table
                data={users}
                columns={columns}
                isLoading={loading}
                emptyMessage="No hay usuarios registrados."
            />
        </div>
    );
};

export default UsersView;
