import React, { useState } from 'react';
import {
    CheckCircle2,
    Circle,
    Clock,
    AlertCircle,
    Plus,
    Trash2,
    Search,
    Filter,
    Users,
    Calendar,
    ChevronDown,
    ShieldCheck
} from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { usePermissions } from '../../hooks/usePermissions';
import { sanitizePayload } from '../../utils/sanitize';
import Modal from '../Common/Modal';
import type { Task } from '../../types';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { Select } from '../UI/Select';
import { ConfirmModal } from '../Common/ConfirmModal';
import { useVirtualizer } from '@tanstack/react-virtual';
import { toast } from 'sonner';
import { formatDate } from '../../utils/format';

const TasksView = () => {
    const { tasks, loading, createTask, toggleTask, deleteTask } = useTasks();
    const { canDeleteTask } = usePermissions();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState('All');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<number | null>(null);

    const parentRef = React.useRef<HTMLDivElement>(null);

    // Form state
    const [newTitle, setNewTitle] = useState('');
    const [newDeadline, setNewDeadline] = useState('');
    const [newPriority, setNewPriority] = useState<'Alta' | 'Media' | 'Baja'>('Media');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const taskData = sanitizePayload({
                title: newTitle,
                deadline: newDeadline,
                priority: newPriority
            });
            await createTask(taskData);
            setIsModalOpen(false);
            setNewTitle('');
            setNewDeadline('');
            setNewPriority('Media');
        } catch (error: unknown) {
            console.error(error);
            toast.error('No se pudo crear la tarea. Inténtalo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggle = async (id: number) => {
        try {
            await toggleTask(id);
        } catch (error: unknown) {
            console.error('Error toggling task:', error);
            toast.error('No se pudo actualizar el estado.');
        }
    };

    const handleDeleteClick = (id: number) => {
        setTaskToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!taskToDelete) return;
        setIsSubmitting(true);
        try {
            await deleteTask(taskToDelete);
            setIsDeleteModalOpen(false);
            setTaskToDelete(null);
        } catch (error: unknown) {
            console.error('Error deleting task:', error);
            toast.error('No se pudo eliminar la tarea. Inténtalo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const safeTasks = Array.isArray(tasks) ? tasks : [];

    const filteredTasks = safeTasks.filter((task: Task) => {
        const matchesSearch = (task.title ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.client_name && (task.client_name ?? '').toLowerCase().includes(searchQuery.toLowerCase()));

        const priorityMap: Record<string, string> = {
            'All': 'All',
            'Alta': 'Alta',
            'Media': 'Media',
            'Baja': 'Baja'
        };
        const matchesPriority = filterPriority === 'All' || task.priority === priorityMap[filterPriority];
        return matchesSearch && matchesPriority;
    });

    const rowVirtualizer = useVirtualizer({
        count: filteredTasks.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 72,
        overscan: 5,
    });

    const stats = {
        pendientes: safeTasks.filter((t: Task) => !t.completed).length,
        completadas: safeTasks.filter((t: Task) => t.completed).length,
        urgentes: safeTasks.filter((t: Task) => !t.completed && t.priority === 'Alta').length
    };

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-surface-text">Tareas</h1>
                    <p className="text-sm text-surface-muted mt-1 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-success-icon" />
                        Organiza y prioriza tus tareas diarias.
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={18} className="mr-2" />
                    Nueva tarea
                </Button>
            </div>

            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <div className="bg-surface-card p-4 rounded-lg border border-surface-border flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-500/10 text-primary-600 rounded-md flex items-center justify-center">
                        <Clock size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-surface-muted font-bold uppercase tracking-wider">Pendientes</p>
                        <p className="text-xl font-bold text-surface-text tabular-nums">{stats.pendientes}</p>
                    </div>
                </div>
                <div className="bg-surface-card p-4 rounded-lg border border-surface-border flex items-center gap-4">
                    <div className="w-10 h-10 bg-success-bg text-success-icon rounded-md flex items-center justify-center">
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-surface-muted font-bold uppercase tracking-wider">Completadas</p>
                        <p className="text-xl font-bold text-surface-text tabular-nums">{stats.completadas}</p>
                    </div>
                </div>
                <div className="bg-surface-card p-4 rounded-lg border border-surface-border flex items-center gap-4">
                    <div className="w-10 h-10 bg-danger-bg text-danger-icon rounded-md flex items-center justify-center">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-surface-muted font-bold uppercase tracking-wider">Urgentes</p>
                        <p className="text-xl font-bold text-surface-text tabular-nums">{stats.urgentes}</p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center gap-3 shrink-0">
                <div className="relative group flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted group-focus-within:text-primary-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar tareas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-surface-input border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                    />
                </div>
                <div className="relative w-full md:w-64">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" size={14} />
                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="w-full h-10 pl-9 pr-8 bg-surface-input border border-surface-border rounded-lg text-xs font-bold text-surface-muted uppercase tracking-wider appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                    >
                        <option value="All">Todas</option>
                        <option value="Alta">Alta</option>
                        <option value="Media">Media</option>
                        <option value="Baja">Baja</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-muted pointer-events-none" size={14} />
                </div>
            </div>

            {/* Tasks List Container */}
            <div className="flex-1 min-h-0 bg-surface-card rounded-lg border border-surface-border shadow-sm overflow-hidden flex flex-col">
                {loading ? (
                    <div className="p-8 space-y-4 flex-1">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-16 bg-surface-muted-bg/50 rounded animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-surface-muted py-20">
                        <AlertCircle size={40} className="mb-4 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest opacity-60">No hay tareas</p>
                    </div>
                ) : (
                    <div
                        ref={parentRef}
                        className="flex-1 overflow-y-auto custom-scrollbar px-6"
                    >
                        <div
                            style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const task = filteredTasks[virtualRow.index];
                                return (
                                    <div
                                        key={virtualRow.key}
                                        className="absolute top-0 left-0 w-full hover:bg-surface-hover transition-colors flex items-center gap-6 border-b border-surface-border/60 last:border-0"
                                        style={{
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <button
                                            onClick={() => handleToggle(task.id)}
                                            className={`shrink-0 transition-transform hover:scale-110 ${task.completed ? 'text-success-icon' : 'text-surface-muted/50 hover:text-primary-500'}`}
                                        >
                                            {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-sm font-semibold truncate ${task.completed ? 'text-surface-muted line-through' : 'text-surface-text'}`}>
                                                {task.title}
                                            </h4>
                                            <div className="flex items-center gap-4 mt-1">
                                                <div className="flex items-center gap-1.5 text-[10px] text-surface-muted">
                                                    <Users size={12} />
                                                    <span className="truncate max-w-[120px]">{task.client_name || 'Personal'}</span>
                                                </div>
                                                {task.deadline && (
                                                    <div className="flex items-center gap-1.5 text-[10px] text-surface-muted">
                                                        <Calendar size={12} />
                                                        <span>{formatDate(task.deadline)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-4 pr-2">
                                            <Badge variant={
                                                task.priority === 'Alta' ? 'danger' :
                                                    task.priority === 'Media' ? 'warning' : 'secondary'
                                            }>
                                                {task.priority === 'Alta' ? 'Alta' : task.priority === 'Media' ? 'Media' : 'Baja'}
                                            </Badge>

                                            {canDeleteTask && (
                                                <button
                                                    onClick={() => handleDeleteClick(task.id)}
                                                    className="p-2 text-surface-muted hover:text-danger-icon rounded-md transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Creation Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nueva tarea"
                maxWidth="max-w-xl"
            >
                <form onSubmit={handleCreateTask} className="space-y-4">
                    <Input
                        label="Descripción"
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Ej: Llamar al cliente para seguimiento"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Fecha límite"
                            type="datetime-local"
                            required
                            value={newDeadline}
                            onChange={(e) => setNewDeadline(e.target.value)}
                        />
                        <Select
                            label="Prioridad"
                            value={newPriority}
                            onChange={(e) => setNewPriority(e.target.value as 'Alta' | 'Media' | 'Baja')}
                        >
                            <option value="Baja">Baja</option>
                            <option value="Media">Media</option>
                            <option value="Alta">Alta</option>
                        </Select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            isLoading={isSubmitting}
                        >
                            Crear tarea
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Eliminar tarea"
                message="¿Seguro que quieres eliminar esta tarea? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                variant="danger"
                isLoading={isSubmitting}
            />
        </div>
    );
};

export default TasksView;
