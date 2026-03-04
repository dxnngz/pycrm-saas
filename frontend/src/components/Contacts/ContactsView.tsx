import React, { useState, useEffect, useCallback, memo } from 'react';
import {
    Search,
    UserPlus,
    Mail,
    Phone,
    Building2,
    Globe,
    Trash2,
    ShieldCheck,
    FileDown,
    Edit2,
    ChevronLeft,
    ChevronRight,
    History
} from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { usePermissions } from '../../hooks/usePermissions';
import { generateClientReport } from '../../services/reportService';
import { sanitizePayload } from '../../utils/sanitize';
import { SkeletonTable } from '../Common/Skeletons';
import Modal from '../Common/Modal';
import Timeline from './Timeline';
import type { Client } from '../../types';
import { useFPSMonitor } from '../../hooks/useFPSMonitor';
import { Input } from '../Common/Input';
import { ConfirmModal } from '../Common/ConfirmModal';

const ClientRow = memo(({
    client,
    canDeleteClient,
    canEditClient,
    onOpenTimeline,
    onOpenModal,
    onDeleteClient
}: {
    client: Client,
    canDeleteClient: boolean,
    canEditClient: boolean,
    onOpenTimeline: (c: Client) => void,
    onOpenModal: (c: Client) => void,
    onDeleteClient: (id: number) => void
}) => {
    return (
        <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-all group even:bg-slate-50/30 dark:even:bg-slate-900/20">
            <td className="px-8 py-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-[1.25rem] flex items-center justify-center text-slate-600 dark:text-slate-300 font-black text-xl group-hover:from-primary-500 group-hover:to-primary-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        {client.name.charAt(0)}
                    </div>
                    <div>
                        <span className="font-black text-slate-900 dark:text-white text-lg tracking-tight block">{client.name}</span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-0.5 block">Cliente VIP</span>
                    </div>
                </div>
            </td>
            <td className="px-8 py-6 hidden md:table-cell">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-transparent group-hover:border-primary-500/20 transition-all inline-flex">
                    <Building2 size={18} className="text-primary-500" />
                    <span className="text-sm font-bold tracking-tight">{client.company}</span>
                </div>
            </td>
            <td className="px-8 py-6 hidden lg:table-cell">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-primary-500 transition-colors">
                        <Mail size={16} className="text-slate-400" />
                        {client.email}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-primary-500 transition-colors">
                        <Phone size={16} className="text-slate-400" />
                        {client.phone}
                    </div>
                </div>
            </td>
            <td className="px-8 py-6 text-right">
                <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                    <button
                        onClick={() => onOpenTimeline(client)}
                        className="p-3 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-2xl transition-all"
                        title="Ver Historial"
                    >
                        <History size={20} />
                    </button>
                    <button
                        onClick={() => generateClientReport([client])}
                        className="p-3 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-2xl transition-all"
                        title="Descargar Reporte"
                    >
                        <FileDown size={20} />
                    </button>
                    {canEditClient && (
                        <button
                            onClick={() => onOpenModal(client)}
                            className="p-3 text-slate-400 hover:text-primary-500 hover:bg-primary-500/10 rounded-2xl transition-all"
                            title="Editar Cliente"
                        >
                            <Edit2 size={20} />
                        </button>
                    )}
                    {canDeleteClient && (
                        <button
                            onClick={() => onDeleteClient(client.id)}
                            className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                            title="Eliminar Cliente"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
});

ClientRow.displayName = 'ClientRow';

const ContactsView = () => {
    const { clients, loading, pagination, loadClients, createClient, updateClient, deleteClient } = useClients();
    const { canCreateClient, canDeleteClient } = usePermissions();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<number | null>(null);

    // Form state
    const [newName, setNewName] = useState('');
    const [newCompany, setNewCompany] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Activar monitor de lentitud (si bajan los FPS, logueará métrica en RUM)
    useFPSMonitor('ContactsView', 40);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadClients(1, 10, search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, loadClients]);

    const handleOpenModal = useCallback((client: Client | null = null) => {
        if (client) {
            setEditingClient(client);
            setNewName(client.name);
            setNewCompany(client.company);
            setNewEmail(client.email);
            setNewPhone(client.phone || '');
        } else {
            setEditingClient(null);
            setNewName('');
            setNewCompany('');
            setNewEmail('');
            setNewPhone('');
        }
        setIsModalOpen(true);
    }, []);

    const handleOpenTimeline = useCallback((client: Client) => {
        setSelectedClient(client);
        setIsTimelineOpen(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const clientData: Partial<Client> = {
                name: newName,
                company: newCompany,
                email: newEmail,
                phone: newPhone
            };

            const cleanPayload = sanitizePayload(clientData);

            if (editingClient) {
                await updateClient(editingClient.id, cleanPayload);
            } else {
                await createClient(cleanPayload);
            }

            setIsModalOpen(false);
            setEditingClient(null);
            loadClients(pagination.page, pagination.limit, search);
        } catch (error: unknown) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClient = useCallback((id: number) => {
        setClientToDelete(id);
        setIsDeleteModalOpen(true);
    }, []);

    const confirmDelete = async () => {
        if (!clientToDelete) return;
        setIsSubmitting(true);
        try {
            await deleteClient(clientToDelete);
            setIsDeleteModalOpen(false);
            setClientToDelete(null);
            if (clients && clients.length === 1 && pagination.page > 1) {
                loadClients(pagination.page - 1, pagination.limit, search);
            } else {
                loadClients(pagination.page, pagination.limit, search);
            }
        } catch (error: unknown) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExportPDF = useCallback(() => {
        generateClientReport(clients);
    }, [clients]);

    if (loading && clients.length === 0) {
        return (
            <div className="max-w-[1600px] mx-auto p-10 pt-16">
                <SkeletonTable />
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Directorio de Clientes</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-emerald-500" />
                        Base de datos verificada y cifrada
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-6 h-14 rounded-2xl font-black hover:bg-slate-50 dark:hover:bg-slate-850 transition-all shadow-sm premium-shadow"
                    >
                        <FileDown size={20} />
                        <span className="hidden sm:inline">Exportar PDF</span>
                    </button>
                    <div className="relative flex-1 sm:w-64 h-14 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar socio..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-full pl-14 pr-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold shadow-sm"
                        />
                    </div>
                    {canCreateClient && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-3 bg-primary-600 text-white px-8 h-14 rounded-2xl font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30 whitespace-nowrap"
                        >
                            <UserPlus size={24} />
                            <span>Añadir</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Socio Comercial</th>
                                <th className="px-8 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] hidden md:table-cell">Organización</th>
                                <th className="px-8 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] hidden lg:table-cell">Puntos de Contacto</th>
                                <th className="px-8 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {!clients || clients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-24 text-center">
                                        <Globe size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-6 animate-pulse" />
                                        <p className="text-slate-400 dark:text-slate-500 font-black uppercase text-sm tracking-widest">
                                            No se han detectado registros en esta frecuencia.
                                        </p>
                                    </td>
                                </tr>
                            ) : clients.map((client: Client) => (
                                <ClientRow
                                    key={client.id}
                                    client={client}
                                    canDeleteClient={canDeleteClient}
                                    canEditClient={canCreateClient} // Using create permission as edit bound
                                    onOpenTimeline={handleOpenTimeline}
                                    onOpenModal={handleOpenModal}
                                    onDeleteClient={handleDeleteClient}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/30 dark:bg-slate-950/30">
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                        Mostrando <span className="text-slate-900 dark:text-white">{clients.length}</span> de <span className="text-slate-900 dark:text-white">{pagination.total}</span> registros
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => loadClients(pagination.page - 1, pagination.limit, search)}
                            className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                            {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => loadClients(p, pagination.limit, search)}
                                    className={`w-10 h-10 shrink-0 rounded-xl font-black text-xs transition-all ${pagination.page === p
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                        : 'hover:bg-white dark:hover:bg-slate-800 text-slate-500'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => loadClients(pagination.page + 1, pagination.limit, search)}
                            className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 disabled:opacity-30 transition-all"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal for Create/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingClient ? "Actualizar Socio Estratégico" : "Registro de Nuevo Socio"}
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Identidad del Cliente"
                            type="text"
                            required
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Ej: Ana María García"
                            icon={<UserPlus size={18} />}
                        />
                        <Input
                            label="Entidad Corporativa"
                            type="text"
                            required
                            value={newCompany}
                            onChange={(e) => setNewCompany(e.target.value)}
                            placeholder="Ej: Global Dynamics S.L."
                            icon={<Building2 size={18} />}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Correo Electrónico"
                            type="email"
                            required
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="ana@empresa.com"
                            icon={<Mail size={18} />}
                        />
                        <Input
                            label="Línea de Teléfono"
                            type="tel"
                            required
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            placeholder="+34 ..."
                            icon={<Phone size={18} />}
                        />
                    </div>
                    <div className="pt-4">
                        <button
                            disabled={isSubmitting}
                            type="submit"
                            className="w-full py-5 bg-primary-600 text-white rounded-[1.5rem] font-black shadow-2xl shadow-primary-600/40 hover:bg-primary-700 transition-all disabled:opacity-50 active:scale-[0.98] uppercase tracking-widest text-xs"
                        >
                            {isSubmitting ? 'Procesando...' : editingClient ? 'Solidificar Cambios' : 'Registrar Cliente'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal for Timeline */}
            <Modal
                isOpen={isTimelineOpen}
                onClose={() => setIsTimelineOpen(false)}
                title={`Historial: ${selectedClient?.name}`}
                maxWidth="max-w-4xl"
            >
                {selectedClient && <Timeline clientId={selectedClient.id} />}
            </Modal>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Eliminar Cliente"
                message={`¿Estás completamente seguro de que deseas eliminar a ${clients.find(c => c.id === clientToDelete)?.name}? Esta acción purgará de forma permanente todos los datos asociados y no podrá revertirse.`}
                confirmLabel="Purgar Registro"
                variant="danger"
                isLoading={isSubmitting}
            />
        </div>
    );
};

export default ContactsView;
