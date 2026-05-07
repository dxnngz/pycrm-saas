import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    Search,
    UserPlus,
    Mail,
    Phone,
    Trash2,
    History,
    Sparkles,
    Loader2,
    FileDown,
    Edit2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { streamClientBrief } from '../../services/ai';
import { useClients } from '../../hooks/useClients';
import { usePermissions } from '../../hooks/usePermissions';
import { generateClientReport } from '../../services/reportService';
import { sanitizePayload } from '../../utils/sanitize';
import Modal from '../Common/Modal';
import Timeline from './Timeline';
import type { Client } from '../../types';
import { Button } from '../UI/Button';
import { VirtualTable, type Column as VirtualColumn } from '../UI/VirtualTable';
import { Badge } from '../UI/Badge';
import { ConfirmModal } from '../Common/ConfirmModal';
import { Skeleton } from '../UI/Skeleton';
import { Input } from '../UI/Input';
import { EmptyState } from '../Common/EmptyState';
import { demoService } from '../../services/demo.service';
import { useAuth } from '../../context/AuthContext';

const ContactsView = () => {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [seeding, setSeeding] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { clients, loading, pagination, loadClients, loadMore, isLoadingMore, createClient, updateClient, deleteClient } = useClients(10, debouncedSearch);
    const { canCreateClient, canDeleteClient } = usePermissions();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<number | null>(null);

    // AI Brief states
    const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
    const [briefContent, setBriefContent] = useState('');
    const [isBriefLoading, setIsBriefLoading] = useState(false);

    // Form state
    const [newName, setNewName] = useState('');
    const [newCompany, setNewCompany] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newStatus, setNewStatus] = useState<'activo' | 'inactivo'>('activo');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenModal = useCallback((client: Client | null = null) => {
        if (client) {
            setEditingClient(client);
            setNewName(client.name);
            setNewCompany(client.company || '');
            setNewEmail(client.email || '');
            setNewPhone(client.phone || '');
            setNewStatus(client.status || 'activo');
        } else {
            setEditingClient(null);
            setNewName('');
            setNewCompany('');
            setNewEmail('');
            setNewPhone('');
            setNewStatus('activo');
        }
        setIsModalOpen(true);
    }, []);

    // Phase 15: Productivity Shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                handleOpenModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleOpenModal]);

    const handleOpenTimeline = useCallback((client: Client) => {
        setSelectedClient(client);
        setIsTimelineOpen(true);
    }, []);

    const handleViewBrief = useCallback(async (client: Client) => {
        setSelectedClient(client);
        setIsBriefModalOpen(true);
        setIsBriefLoading(true);
        setBriefContent('');

        try {
            await streamClientBrief(
                client.id,
                (text) => {
                    setIsBriefLoading(false);
                    setBriefContent(prev => prev + text);
                },
                () => {
                    setIsBriefLoading(false);
                }
            );
        } catch (error) {
            console.error(error);
            setIsBriefLoading(false);
            setBriefContent('Error al generar el resumen. Por favor, inténtelo de nuevo.');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const clientData: Partial<Client> = {
                name: newName,
                company: newCompany,
                email: newEmail,
                phone: newPhone,
                status: newStatus
            };
            const cleanPayload = sanitizePayload(clientData);
            if (editingClient) {
                await updateClient(editingClient.id, cleanPayload);
            } else {
                await createClient(cleanPayload);
            }
            setIsModalOpen(false);
            setEditingClient(null);
            loadClients();
        } catch (error: unknown) {
            console.error(error);
            toast.error('No se pudo guardar el cliente. Inténtalo de nuevo.');
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
            loadClients();
        } catch (error: unknown) {
            console.error(error);
            toast.error('No se pudo eliminar el cliente. Inténtalo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExportPDF = useCallback(() => {
        generateClientReport(clients);
    }, [clients]);

    const handleSeedDemo = async () => {
        setSeeding(true);
        try {
            const res = await demoService.seed();
            toast.success(res.message || 'Datos de demostración creados');
            await loadClients();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'No se pudo crear datos de demostración';
            toast.error(msg);
        } finally {
            setSeeding(false);
        }
    };

    const columns: VirtualColumn<Client>[] = [
        {
            header: 'Cliente',
            width: '35%',
            accessor: (client: Client) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="w-8 h-8 rounded-md bg-surface-muted-bg flex items-center justify-center text-[10px] font-bold text-surface-muted border border-surface-border">
                        {client.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="truncate">
                        <div className="font-medium text-surface-text truncate">{client.name}</div>
                        <div className="text-[10px] text-surface-muted">ID: #{client.id.toString().padStart(4, '0')}</div>
                    </div>
                </div>
            ),
        },
        {
            header: 'Empresa',
            accessor: 'company',
            width: '25%',
            className: 'hidden md:flex items-center',
        },
        {
            header: 'Contacto',
            width: '25%',
            accessor: (client: Client) => (
                <div className="space-y-0.5 py-1 truncate">
                    <div className="flex items-center gap-1.5 text-xs text-surface-muted truncate">
                        <Mail size={12} className="flex-shrink-0" /> {client.email}
                    </div>
                    {client.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-surface-muted truncate">
                            <Phone size={12} className="flex-shrink-0" /> {client.phone}
                        </div>
                    )}
                </div>
            ),
            className: 'hidden lg:flex items-center',
        },
        {
            header: 'Estado',
            width: '10%',
            accessor: (client: Client) => (
                <Badge variant={client.status === 'activo' ? 'success' : 'secondary'}>
                    {client.status === 'activo' ? 'Activo' : 'Inactivo'}
                </Badge>
            ),
            align: 'center',
            className: 'flex items-center justify-center',
        },
        {
            header: 'Acciones',
            width: '5%',
            align: 'right',
            className: 'flex items-center justify-end',
            accessor: (client: Client) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTimeline(client);
                        }}
                        className="p-1.5 text-surface-muted hover:text-surface-text rounded-md transition-colors"
                        title="Historial"
                    >
                        <History size={16} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewBrief(client);
                        }}
                        className="p-1.5 text-surface-muted hover:text-info-icon rounded-md transition-colors"
                        title="Resumen IA"
                    >
                        <Sparkles size={16} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(client);
                        }}
                        className="p-1.5 text-surface-muted hover:text-primary-600 rounded-md transition-colors"
                        title="Editar"
                    >
                        <Edit2 size={16} />
                    </button>
                    {canDeleteClient && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClient(client.id);
                            }}
                            className="p-1.5 text-surface-muted hover:text-danger-icon rounded-md transition-colors"
                            title="Eliminar"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            ),
        }
    ];

    if (loading && clients.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
                <div className="border border-surface-border rounded-xl overflow-hidden bg-surface-card shadow-sm">
                    <div className="p-4 border-b border-surface-border bg-surface-muted-bg/50 flex gap-4">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-4 flex-1" />)}
                    </div>
                    <div className="p-4 space-y-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="flex gap-4 items-center">
                                <Skeleton variant="circular" className="w-8 h-8 flex-shrink-0" />
                                <Skeleton className="h-4 flex-1" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-surface-text">Clientes</h1>
                    <p className="text-sm text-surface-muted mt-1">
                        Gestiona tu base de clientes y el historial de comunicación.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted group-focus-within:text-primary-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar (Cmd+K)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-surface-muted-bg border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="md"
                        onClick={handleExportPDF}
                    >
                        <FileDown size={16} className="mr-2" />
                        Exportar
                    </Button>

                    {canCreateClient && (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => handleOpenModal()}
                        >
                            <UserPlus size={16} className="mr-2" />
                            Nuevo cliente (Alt+N)
                        </Button>
                    )}
                </div>
            </div>

            <VirtualTable
                data={clients}
                columns={columns}
                isLoading={loading}
                emptyMessage="No se encontraron clientes."
                emptyContent={
                    <EmptyState
                        title="No hay clientes todavía"
                        description="Crea tu primer cliente o genera datos demo para que la app se vea completa."
                        icon={UserPlus}
                        actionLabel={canCreateClient ? 'Crear cliente' : undefined}
                        onAction={canCreateClient ? () => handleOpenModal() : undefined}
                        secondaryActionLabel={user?.role === 'admin' ? (seeding ? 'Creando…' : 'Crear datos demo') : undefined}
                        onSecondaryAction={user?.role === 'admin' ? handleSeedDemo : undefined}
                    />
                }
                height="600px"
            />

            {clients && clients.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 border-t border-surface-border">
                    <p className="text-xs text-surface-muted">
                        Mostrando <span className="font-medium text-surface-text">{clients.length}</span> de <span className="font-medium text-surface-text">{pagination.total}</span> registros
                    </p>
                    {pagination.hasMore && (
                        <Button variant="outline" size="sm" onClick={() => loadMore()} isLoading={isLoadingMore}>
                            Cargar más
                        </Button>
                    )}
                </div>
            )}

            {/* Modal for Create/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingClient ? "Editar cliente" : "Nuevo cliente"}
                maxWidth="max-w-xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nombre completo"
                            type="text"
                            required
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Ej: Juan Pérez"
                        />
                        <Input
                            label="Empresa / Organización"
                            type="text"
                            required
                            value={newCompany}
                            onChange={(e) => setNewCompany(e.target.value)}
                            placeholder="Ej: ACME S.L."
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Correo electrónico"
                            type="email"
                            required
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="john@example.com"
                        />
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-surface-muted uppercase tracking-wider">Estado</label>
                            <div className="flex p-1 bg-surface-muted-bg rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setNewStatus('activo')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newStatus === 'activo'
                                        ? 'bg-surface-card text-success-text shadow-sm'
                                        : 'text-surface-muted hover:text-surface-text'}`}
                                >
                                    Activo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewStatus('inactivo')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newStatus === 'inactivo'
                                        ? 'bg-surface-card text-surface-muted shadow-sm'
                                        : 'text-surface-muted hover:text-surface-text'}`}
                                >
                                    Inactivo
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-surface-muted uppercase tracking-wider">Teléfono</label>
                        <div className="flex gap-2">
                            <select
                                className="w-28 h-10 px-2 bg-surface-muted-bg border border-surface-border rounded-lg text-sm text-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer font-medium"
                                value={newPhone.match(/^\+\d+/)?.[0] || '+34'}
                                onChange={(e) => {
                                    const currentNumber = newPhone.replace(/^\+\d+/, '').trim();
                                    setNewPhone(`${e.target.value} ${currentNumber}`.trim());
                                }}
                            >
                                <option value="+34">🇪🇸 +34</option>
                                <option value="+1">🇺🇸 +1</option>
                                <option value="+44">🇬🇧 +44</option>
                                <option value="+52">🇲🇽 +52</option>
                                <option value="+54">🇦🇷 +54</option>
                                <option value="+57">🇨🇴 +57</option>
                                <option value="+56">🇨🇱 +56</option>
                            </select>
                            <input
                                type="tel"
                                className="flex-1 w-full h-10 px-4 bg-surface-input border border-surface-border rounded-lg text-sm text-surface-text focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-surface-muted"
                                value={newPhone.replace(/^\+\d+/, '').trim()}
                                onChange={(e) => {
                                    const prefix = newPhone.match(/^\+\d+/)?.[0] || '+34';
                                    setNewPhone(`${prefix} ${e.target.value}`);
                                }}
                                placeholder="600 000 000"
                            />
                        </div>
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
                            {editingClient ? 'Actualizar cliente' : 'Crear cliente'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal for Timeline */}
            <Modal
                isOpen={isTimelineOpen}
                onClose={() => setIsTimelineOpen(false)}
                title={`Historial de comunicación: ${selectedClient?.name}`}
                maxWidth="max-w-4xl"
            >
                {selectedClient && <Timeline clientId={selectedClient.id} />}
            </Modal>

            {/* Modal for AI Brief */}
            <Modal
                isOpen={isBriefModalOpen}
                onClose={() => setIsBriefModalOpen(false)}
                title={`Resumen IA: ${selectedClient?.name}`}
                maxWidth="max-w-2xl"
            >
                {isBriefLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        <p className="text-sm text-surface-muted animate-pulse font-medium">Analizando historial y generando resumen...</p>
                    </div>
                ) : (
                    <div className="prose prose-sm prose-surface max-w-none text-sm">
                        <div className="bg-info-bg border border-info-border rounded-xl p-6 text-surface-text shadow-sm leading-relaxed">
                            <ReactMarkdown
                                components={{
                                    h1: ({ ...props }) => <h1 className="text-lg font-bold text-surface-text mb-4 flex items-center gap-2" {...props} />,
                                    h2: ({ ...props }) => <h2 className="text-md font-bold text-surface-text mt-4 mb-2 border-b border-surface-border pb-1" {...props} />,
                                    ul: ({ ...props }) => <ul className="list-disc ml-4 space-y-1 my-2" {...props} />,
                                    li: ({ ...props }) => <li className="text-surface-muted" {...props} />,
                                    strong: ({ ...props }) => <strong className="font-semibold text-surface-text" {...props} />,
                                }}
                            >
                                {briefContent}
                            </ReactMarkdown>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button variant="outline" size="sm" onClick={() => setIsBriefModalOpen(false)}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Eliminar cliente"
                message={`¿Seguro que quieres eliminar a ${clients.find(c => c.id === clientToDelete)?.name}? Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar"
                variant="danger"
                isLoading={isSubmitting}
            />
        </div>
    );
};

export default ContactsView;
