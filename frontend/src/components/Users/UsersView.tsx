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
            toast.error('Failed to load users');
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
            toast.success(`User role updated to ${newRole}`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update role');
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
        try {
            await api.users.delete(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            toast.success('User deleted successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete user');
        }
    };

    const columns: Column<User>[] = [
        {
            header: 'Identity',
            accessor: (user: User) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {user.name.charAt(0)}
                    </div>
                    <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                </div>
            ),
        },
        {
            header: 'Corporate Email',
            accessor: 'email',
            className: 'text-slate-500 dark:text-slate-400',
        },
        {
            header: 'Access Level',
            align: 'center',
            accessor: (user: User) => (
                <button
                    onClick={() => handleRoleChange(user.id, user.role)}
                    className="focus:outline-none"
                >
                    <Badge variant={user.role === 'admin' ? 'success' : 'secondary'}>
                        {user.role}
                    </Badge>
                </button>
            ),
        },
        {
            header: 'Actions',
            align: 'right',
            accessor: (user: User) => (
                <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
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
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">User Management</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <Shield size={14} className="text-primary-500" />
                        Role-Based Access Control (RBAC) - Administrator View
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="md"
                    onClick={() => loadUsers()}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <UserCog size={16} className="mr-2" />}
                    Refresh List
                </Button>
            </div>

            <Table
                data={users}
                columns={columns}
                isLoading={loading}
                emptyMessage="No users found in the registry."
            />
        </div>
    );
};

export default UsersView;
