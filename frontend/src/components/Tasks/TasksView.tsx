import React, { useState, useEffect } from 'react';
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

const TasksView = () => {
    const { tasks, loading, loadTasks, createTask, toggleTask, deleteTask } = useTasks();
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

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

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
            toast.error('Failed to create task. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggle = async (id: number) => {
        try {
            await toggleTask(id);
        } catch (error: unknown) {
            console.error('Error toggling task:', error);
            toast.error('Failed to update task status.');
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
            toast.error('Failed to delete task. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const safeTasks = Array.isArray(tasks) ? tasks : [];

    const filteredTasks = safeTasks.filter((task: Task) => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.client_name && task.client_name.toLowerCase().includes(searchQuery.toLowerCase()));

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
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Task Management</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        Track and prioritize your daily objectives.
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={18} className="mr-2" />
                    New Task
                </Button>
            </div>

            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-md flex items-center justify-center">
                        <Clock size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Pending</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{stats.pendientes}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md flex items-center justify-center">
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Completed</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{stats.completadas}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md flex items-center justify-center">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Urgent</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{stats.urgentes}</p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center gap-3 shrink-0">
                <div className="relative group flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                    />
                </div>
                <div className="relative w-full md:w-64">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="w-full h-10 pl-9 pr-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                    >
                        <option value="All">All Priorities</option>
                        <option value="Alta">High Priority</option>
                        <option value="Media">Medium Priority</option>
                        <option value="Baja">Low Priority</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            </div>

            {/* Tasks List Container */}
            <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                {loading ? (
                    <div className="p-8 space-y-4 flex-1">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-16 bg-slate-50 dark:bg-slate-800/50 rounded animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20">
                        <AlertCircle size={40} className="mb-4 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest opacity-60">No tasks found</p>
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
                                        className="absolute top-0 left-0 w-full hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-6 border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                                        style={{
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <button
                                            onClick={() => handleToggle(task.id)}
                                            className={`shrink-0 transition-transform hover:scale-110 ${task.completed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700 hover:text-primary-500'}`}
                                        >
                                            {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-sm font-semibold truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                                                {task.title}
                                            </h4>
                                            <div className="flex items-center gap-4 mt-1">
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                                    <Users size={12} />
                                                    <span className="truncate max-w-[120px]">{task.client_name || 'Individual'}</span>
                                                </div>
                                                {task.deadline && (
                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                                        <Calendar size={12} />
                                                        <span>{new Date(task.deadline).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-4 pr-2">
                                            <Badge variant={
                                                task.priority === 'Alta' ? 'danger' :
                                                    task.priority === 'Media' ? 'warning' : 'secondary'
                                            }>
                                                {task.priority === 'Alta' ? 'High' : task.priority === 'Media' ? 'Medium' : 'Low'}
                                            </Badge>

                                            {canDeleteTask && (
                                                <button
                                                    onClick={() => handleDeleteClick(task.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 rounded-md transition-colors"
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
                title="Create New Task"
                maxWidth="max-w-xl"
            >
                <form onSubmit={handleCreateTask} className="space-y-4">
                    <Input
                        label="Task Description"
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Schedule follow-up meeting"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Due Date"
                            type="datetime-local"
                            required
                            value={newDeadline}
                            onChange={(e) => setNewDeadline(e.target.value)}
                        />
                        <Select
                            label="Priority Level"
                            value={newPriority}
                            onChange={(e) => setNewPriority(e.target.value as 'Alta' | 'Media' | 'Baja')}
                        >
                            <option value="Baja">Low Priority</option>
                            <option value="Media">Medium Priority</option>
                            <option value="Alta">High Priority</option>
                        </Select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            isLoading={isSubmitting}
                        >
                            Create Task
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Task"
                message="Are you sure you want to delete this task? This action cannot be undone."
                confirmLabel="Delete Task"
                variant="danger"
                isLoading={isSubmitting}
            />
        </div>
    );
};

export default TasksView;
