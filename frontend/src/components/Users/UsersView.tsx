import { useState, useEffect, useCallback } from 'react';
import { Shield, Trash2, Loader2, UserCog, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'sonner';
import type { User } from '../../types';
import { Table, type Column } from '../UI/Table';
import { Button } from '../UI/Button';
import Modal from '../Common/Modal';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';

const UsersView = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('empleado');
    const [newPassword, setNewPassword] = useState('');

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

    const handleRoleChange = async (userId: number, role: string) => {
        try {
            await api.users.updateRole(userId, role);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
            toast.success(`Rol actualizado a ${role}`);
        } catch (error) {
            console.error(error);
            toast.error('No se pudo actualizar el rol');
        }
    };

    const resetCreateForm = () => {
        setNewName('');
        setNewEmail('');
        setNewRole('empleado');
        setNewPassword('');
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !newEmail.trim() || !newPassword) return;
        try {
            setIsCreateSubmitting(true);
            await api.users.create({
                name: newName.trim(),
                email: newEmail.trim(),
                password: newPassword,
                role: newRole
            });
            toast.success('Usuario creado correctamente');
            setIsCreateOpen(false);
            resetCreateForm();
            await loadUsers();
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || 'No se pudo crear el usuario');
        } finally {
            setIsCreateSubmitting(false);
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
            header: 'Correo',
            accessor: 'email',
            className: 'text-surface-muted',
        },
        {
            header: 'Rol',
            align: 'center',
            accessor: (user: User) => (
                <div className="min-w-[140px]">
                    <Select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    >
                        <option value="admin">admin</option>
                        <option value="manager">manager</option>
                        <option value="sales">sales</option>
                        <option value="empleado">empleado</option>
                        <option value="user">user</option>
                    </Select>
                </div>
            ),
        },
        {
            header: 'Acciones',
            align: 'right',
            accessor: (user: User) => (
                <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-1.5 text-surface-muted hover:text-danger-icon rounded-md transition-colors"
                    title="Eliminar"
                >
                    <Trash2 size={16} />
                </button>
            ),
        }
    ];

    return (
        <div className="space-y-6">
            <Modal
                isOpen={isCreateOpen}
                onClose={() => {
                    if (isCreateSubmitting) return;
                    setIsCreateOpen(false);
                }}
                title="Nuevo usuario"
                maxWidth="max-w-xl"
            >
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nombre"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                        />
                        <Select
                            label="Rol"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            required
                        >
                            <option value="empleado">empleado</option>
                            <option value="sales">sales</option>
                            <option value="manager">manager</option>
                            <option value="admin">admin</option>
                        </Select>
                    </div>

                    <Input
                        label="Correo"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required
                    />

                    <Input
                        label="Contraseña"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={8}
                        required
                        helperText="Mínimo 8 caracteres"
                    />

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                if (isCreateSubmitting) return;
                                setIsCreateOpen(false);
                                resetCreateForm();
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={isCreateSubmitting}>
                            Crear usuario
                        </Button>
                    </div>
                </form>
            </Modal>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-surface-text">Usuarios</h1>
                    <p className="text-sm text-surface-muted mt-1 flex items-center gap-1.5">
                        <Shield size={14} className="text-primary-500" />
                        Gestión de accesos (RBAC) - Vista de administrador
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="primary" size="md" onClick={() => setIsCreateOpen(true)}>
                        <Plus size={16} className="mr-2" />
                        Nuevo
                    </Button>
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
