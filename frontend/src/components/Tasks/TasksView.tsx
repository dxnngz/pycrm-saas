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
    Zap,
    Users,
    Calendar,
    ChevronDown,
    ShieldCheck
} from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { usePermissions } from '../../hooks/usePermissions';
import { sanitizePayload } from '../../utils/sanitize';
import { SkeletonTable } from '../Common/Skeletons';
import Modal from '../Common/Modal';
import type { Task } from '../../types';
import { Input } from '../Common/Input';
import { ConfirmModal } from '../Common/ConfirmModal';

const TasksView = () => {
    const { tasks, loading, loadTasks, createTask, toggleTask, deleteTask } = useTasks();
    const { canDeleteTask } = usePermissions();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState('Todas');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<number | null>(null);

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
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggle = async (id: number) => {
        try {
            await toggleTask(id);
        } catch (error: unknown) {
            console.error('Error toggling task:', error);
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
        } finally {
            setIsSubmitting(false);
        }
    };

    const safeTasks = Array.isArray(tasks) ? tasks : [];

    const filteredTasks = safeTasks.filter((task: Task) => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.client_name && task.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesPriority = filterPriority === 'Todas' || task.priority === filterPriority;
        return matchesSearch && matchesPriority;
    });

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-10 py-10 fade-in">
                <SkeletonTable />
            </div>
        );
    }

    const stats = {
        pendientes: safeTasks.filter((t: Task) => !t.completed).length,
        completadas: safeTasks.filter((t: Task) => t.completed).length,
        urgentes: safeTasks.filter((t: Task) => !t.completed && t.priority === 'Alta').length
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Tareas</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-emerald-500" />
                        Sistema de priorización de impacto
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-3 bg-primary-600 text-white px-8 h-14 rounded-2xl font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30 whitespace-nowrap"
                >
                    <Plus size={24} />
                    <span>Inyectar Tarea</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow flex items-center gap-6">
                    <div className="bg-primary-500/10 text-primary-600 dark:text-primary-400 p-5 rounded-2xl">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mb-1">Pendientes</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{stats.pendientes}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow flex items-center gap-6">
                    <div className="bg-emerald-500/10 text-emerald-600 p-5 rounded-2xl">
                        <CheckCircle2 size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mb-1">Ejecutadas</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{stats.completadas}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow flex items-center gap-6">
                    <div className="bg-rose-500/10 text-rose-600 p-5 rounded-2xl">
                        <AlertCircle size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mb-1">Críticas</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{stats.urgentes}</p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 p-2.5 rounded-[3rem] border border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row items-center gap-4">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="IA: Filtrar por protocolo o socio comercial..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 h-14 bg-white dark:bg-slate-900 rounded-[2rem] border border-transparent focus:border-primary-500/30 outline-none text-sm font-bold shadow-sm transition-all"
                    />
                </div>
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-64">
                        <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="w-full pl-12 pr-10 h-14 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm outline-none text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest appearance-none cursor-pointer hover:border-primary-500/30 transition-all"
                        >
                            <option value="Todas">Prioridad: Todas</option>
                            <option value="Alta">Alta - Impacto Inmediato</option>
                            <option value="Media">Media - Estándar</option>
                            <option value="Baja">Baja - Mantenimiento</option>
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTasks.length === 0 ? (
                        <div className="p-24 text-center">
                            <Zap size={56} className="mx-auto text-slate-200 dark:text-slate-800 mb-6 animate-pulse" />
                            <p className="text-slate-400 dark:text-slate-500 font-black uppercase text-xs tracking-[0.2em]">Frecuencia Libre: No se detectan objetivos</p>
                        </div>
                    ) : filteredTasks.map((task: Task) => (
                        <div key={task.id} className="p-8 hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-all flex items-center gap-8 group relative even:bg-slate-50/30 dark:even:bg-slate-900/10">
                            <button
                                onClick={() => handleToggle(task.id)}
                                className={`p-1.5 rounded-full transition-all transform hover:scale-110 shrink-0 ${task.completed ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-300 dark:text-slate-700 hover:text-primary-500 hover:bg-primary-500/10'}`}
                            >
                                {task.completed ? <CheckCircle2 size={36} /> : <Circle size={36} />}
                            </button>

                            <div className="flex-1 min-w-0">
                                <h4 className={`font-black text-xl tracking-tight truncate ${task.completed ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-900 dark:text-white'}`}>
                                    {task.title}
                                </h4>
                                <div className="flex flex-wrap items-center gap-6 mt-3">
                                    <div className="flex items-center gap-2.5 px-4 py-1.5 bg-primary-500/10 rounded-xl border border-primary-500/10">
                                        <Users size={14} className="text-primary-500" />
                                        <span className="text-[10px] text-primary-600 dark:text-primary-400 font-black uppercase tracking-widest">{task.client_name || 'Prospecto Libre'}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-slate-400 dark:text-slate-600">
                                        <Calendar size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                            {task.deadline ? new Date(task.deadline).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin Fecha Límite'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden sm:flex items-center gap-6 shrink-0">
                                <span className={`text-[10px] font-black px-5 py-2.5 rounded-2xl uppercase tracking-[0.15em] border shadow-sm transition-all ${task.priority === 'Alta'
                                    ? 'bg-rose-500 text-white border-rose-600 shadow-rose-500/20'
                                    : task.priority === 'Media'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                    }`}>
                                    {task.priority}
                                </span>
                                <div className="flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                    {canDeleteTask && (
                                        <button
                                            onClick={() => handleDeleteClick(task.id)}
                                            className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-2xl transition-all"
                                            title="Eliminar Objetivo"
                                        >
                                            <Trash2 size={22} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Creation Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nueva Tarea Estratégica"
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleCreateTask} className="space-y-8">
                    <Input
                        label="Definición del Objetivo"
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Ej: Seguimiento tras demo de producto"
                        icon={<Zap size={18} />}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Input
                            label="Fecha de Impacto"
                            type="datetime-local"
                            required
                            value={newDeadline}
                            onChange={(e) => setNewDeadline(e.target.value)}
                            placeholder=""
                            icon={<Calendar size={18} />}
                        />
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Prioridad del Sistema</label>
                            <div className="relative">
                                <AlertCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-primary-500" size={20} />
                                <select
                                    value={newPriority}
                                    onChange={(e) => setNewPriority(e.target.value as 'Alta' | 'Media' | 'Baja')}
                                    className="w-full pl-14 pr-10 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl focus:ring-4 focus:ring-primary-500/10 outline-none font-bold dark:text-white appearance-none hover:border-primary-500/30 transition-all cursor-pointer text-sm"
                                >
                                    <option value="Baja">Nivel 1: Mantenimiento</option>
                                    <option value="Media">Nivel 2: Estándar</option>
                                    <option value="Alta">Nivel 3: Crítico / Prioritario</option>
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                            </div>
                        </div>
                    </div>
                    <div className="pt-6">
                        <button
                            disabled={isSubmitting}
                            type="submit"
                            className="w-full py-6 bg-primary-600 text-white rounded-[2rem] font-black shadow-2xl shadow-primary-600/40 hover:bg-primary-700 transition-all disabled:opacity-50 active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
                        >
                            {isSubmitting ? 'Sincronizando...' : 'Solidificar Objetivo'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Eliminar Objetivo"
                message="¿Estás completamente seguro de que deseas purgar esta tarea? Esta acción eliminará permanentemente el registro de actividad y no podrá ser restaurado."
                confirmLabel="Purgar Tarea"
                variant="danger"
                isLoading={isSubmitting}
            />
        </div>
    );
};

export default TasksView;
