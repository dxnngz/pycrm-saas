import { useState, useCallback } from 'react';
import { Mail, Phone, Users, MessageSquare, Plus, Loader2, Clock } from 'lucide-react';
import { api } from '../../services/api';
import type { Contact } from '../../types';
import { toast } from 'sonner';

interface TimelineProps {
    clientId: number;
}

const Timeline = ({ clientId }: TimelineProps) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [type, setType] = useState<'call' | 'email' | 'meeting' | 'note'>('note');
    const [description, setDescription] = useState('');

    const loadContacts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.contacts.getByClient(clientId);
            setContacts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.contacts.create({
                client_id: clientId,
                type,
                description,
                contact_date: new Date().toISOString()
            });
            toast.success('Actividad registrada');
            setDescription('');
            setIsAdding(false);
            loadContacts();
        } catch (error) {
            console.error(error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'call': return <Phone size={18} className="text-blue-500" />;
            case 'email': return <Mail size={18} className="text-purple-500" />;
            case 'meeting': return <Users size={18} className="text-emerald-500" />;
            default: return <MessageSquare size={18} className="text-slate-500" />;
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock size={20} className="text-primary-500" />
                    Historial de Actividad
                </h4>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 transition-colors"
                >
                    <Plus size={16} />
                    Registrar Interacción
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAddContact} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex gap-4">
                        {(['call', 'email', 'meeting', 'note'] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${type === t
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800'
                                    }`}
                            >
                                {t === 'call' ? 'Llamada' : t === 'email' ? 'Email' : t === 'meeting' ? 'Reunión' : 'Nota'}
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe la interacción..."
                        className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none min-h-[100px]"
                        required
                    />
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-6 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-primary-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            )}

            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent dark:before:from-slate-800 dark:before:via-slate-800">
                {contacts.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-slate-500 text-sm font-medium">No hay actividades registradas aún.</p>
                    </div>
                ) : (
                    contacts.map((contact) => (
                        <div key={contact.id} className="relative flex items-start gap-6 group">
                            <div className="absolute left-0 w-10 h-10 bg-white dark:bg-slate-900 rounded-full border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-sm z-10 group-hover:border-primary-500 transition-colors">
                                {getIcon(contact.type)}
                            </div>
                            <div className="flex-1 bg-white dark:bg-slate-900/50 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 group-hover:border-primary-500/20 transition-all ml-10">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {new Date(contact.contact_date).toLocaleString('es-ES', {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-lg">
                                        {contact.type}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                    {contact.description}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Timeline;