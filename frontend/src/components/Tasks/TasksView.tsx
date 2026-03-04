import { useState, useEffect } from 'react';
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
    Calendar
} from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { usePermissions } from '../../hooks/usePermissions';
import { sanitizePayload } from '../../utils/sanitize';
import { SkeletonTable } from '../Common/Skeletons';
import Modal from '../Common/Modal';
import type { Task } from '../../types';

const TasksView = () => {
    const { tasks, loading, loadTasks, createTask, toggleTask, deleteTask } = useTasks();
    const { canDeleteTask } = usePermissions();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState('Todas');

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

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;
        try {
            await deleteTask(id);
        } catch (error: unknown) {
            console.error('Error deleting task:', error);
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
            <div className="max-w-5xl mx-auto space-y-10 py-10 fade-in">
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
        <div className="max-w-5xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Tareas</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">Centraliza tus acciones y optimiza tu productividad diaria.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-3 bg-primary-600 text-white px-6 py-3.5 rounded-2xl font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30"
                >
                    <Plus size={24} />
                    <span>Nueva Tarea</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow flex items-center gap-5">
                    <div className="bg-primary-500/10 text-primary-600 dark:text-primary-400 p-4 rounded-2xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Pendientes</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.pendientes}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow flex items-center gap-5">
                    <div className="bg-emerald-500/10 text-emerald-600 p-4 rounded-2xl">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Éxito</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.completadas}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow flex items-center gap-5">
                    <div className="bg-rose-500/10 text-rose-600 p-4 rounded-2xl">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Urgentes</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.urgentes}</p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Filtrar por título o cliente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 rounded-[2rem] border border-transparent focus:border-primary-500/30 outline-none text-sm font-bold shadow-sm"
                    />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto px-4 md:px-0">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-6 py-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                        <Filter size={18} className="text-slate-400" />
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="bg-transparent outline-none text-sm font-black text-slate-700 dark:text-slate-200"
                        >
                            <option value="Todas">Prioridad: Todas</option>
                            <option value="Alta">Alta</option>
                            <option value="Media">Media</option>
                            <option value="Baja">Baja</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTasks.length === 0 ? (
                        <div className="p-20 text-center">
                            <Zap size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-6" />
                            <p className="text-slate-400 dark:text-slate-500 font-black uppercase text-sm tracking-widest">Sin tareas que coincidan</p>
                        </div>
                    ) : filteredTasks.map((task: Task) => (
                        <div key={task.id} className="p-8 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all flex items-center gap-6 group relative">
                            <button
                                onClick={() => handleToggle(task.id)}
                                className={`p-1.5 rounded-full transition-all transform group-hover:scale-110 ${task.completed ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-300 dark:text-slate-600 hover:text-primary-500 hover:bg-primary-500/10'}`}
                            >
                                {task.completed ? <CheckCircle2 size={32} /> : <Circle size={32} />}
                            </button>

                            <div className="flex-1">
                                <h4 className={`font-black text-lg tracking-tight ${task.completed ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-900 dark:text-white'}`}>
                                    {task.title}
                                </h4>
                                <div className="flex items-center gap-6 mt-3">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-primary-500/10 rounded-xl">
                                        <Users size={14} className="text-primary-500" />
                                        <span className="text-xs text-primary-600 dark:text-primary-400 font-black uppercase tracking-tighter">{task.client_name || 'Prospecto Libre'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                                        <Calendar size={14} />
                                        <span className="text-xs font-bold tracking-tight">
                                            {task.deadline ? new Date(task.deadline).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <span className={`text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-[0.1em] border shadow-sm ${task.priority === 'Alta'
                                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                    : task.priority === 'Media'
                                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
                                    }`}>
                                    {task.priority}
                                </span>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                    {canDeleteTask && (
                                        <button
                                            onClick={() => handleDelete(task.id)}
                                            className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-2xl transition-all"
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
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Tarea Estratégica">
                <form onSubmit={handleCreateTask} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Qué hay que hacer</label>
                        <input
                            type="text"
                            required
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold placeholder:text-slate-400 dark:text-white"
                            placeholder="Ej: Seguimiento tras demo de producto"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Fecha de Impacto</label>
                            <input
                                type="datetime-local"
                                required
                                value={newDeadline}
                                onChange={(e) => setNewDeadline(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Nivel de Prioridad</label>
                            <select
                                value={newPriority}
                                onChange={(e) => setNewPriority(e.target.value as 'Alta' | 'Media' | 'Baja')}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold dark:text-white"
                            >
                                <option value="Baja">Baja - Mantenimiento</option>
                                <option value="Media">Media - Estándar</option>
                                <option value="Alta">Alta - Crítica</option>
                            </select>
                        </div>
                    </div>
                    <button
                        disabled={isSubmitting}
                        type="submit"
                        className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black shadow-2xl shadow-primary-600/40 hover:bg-primary-700 transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                        {isSubmitting ? 'Inyectando Tarea...' : 'Crear Tarea en el Sistema'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default TasksView;
