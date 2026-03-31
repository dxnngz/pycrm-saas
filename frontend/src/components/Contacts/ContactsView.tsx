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
    Edit2,
    ChevronLeft,
    ChevronRight
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

const ContactsView = () => {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page] = useState(1);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { clients, loading, pagination, loadClients, createClient, updateClient, deleteClient } = useClients(page, 10, debouncedSearch);
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
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            loadClients(pagination.page, pagination.limit, debouncedSearch);
        } catch (error: unknown) {
            console.error(error);
            toast.error('Failed to save customer. Please try again.');
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
                loadClients(pagination.page - 1, pagination.limit, debouncedSearch);
            } else {
                loadClients(pagination.page, pagination.limit, debouncedSearch);
            }
        } catch (error: unknown) {
            console.error(error);
            toast.error('Failed to delete customer. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExportPDF = useCallback(() => {
        generateClientReport(clients);
    }, [clients]);

    const columns: VirtualColumn<Client>[] = [
        {
            header: 'Customer',
            width: '35%',
            accessor: (client: Client) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {client.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="truncate">
                        <div className="font-medium text-slate-900 dark:text-white truncate">{client.name}</div>
                        <div className="text-[10px] text-slate-400">ID: #{client.id.toString().padStart(4, '0')}</div>
                    </div>
                </div>
            ),
        },
        {
            header: 'Organization',
            accessor: 'company',
            width: '25%',
            className: 'hidden md:flex items-center',
        },
        {
            header: 'Contact',
            width: '25%',
            accessor: (client: Client) => (
                <div className="space-y-0.5 py-1 truncate">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                        <Mail size={12} className="flex-shrink-0" /> {client.email}
                    </div>
                    {client.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                            <Phone size={12} className="flex-shrink-0" /> {client.phone}
                        </div>
                    )}
                </div>
            ),
            className: 'hidden lg:flex items-center',
        },
        {
            header: 'Status',
            width: '10%',
            accessor: () => <Badge variant="success">Active</Badge>,
            align: 'center',
            className: 'flex items-center justify-center',
        },
        {
            header: 'Actions',
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
                        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors"
                        title="Timeline"
                    >
                        <History size={16} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewBrief(client);
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-md transition-colors"
                        title="AI Executive Brief"
                    >
                        <Sparkles size={16} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(client);
                        }}
                        className="p-1.5 text-slate-400 hover:text-primary-600 rounded-md transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={16} />
                    </button>
                    {canDeleteClient && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClient(client.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                            title="Delete"
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
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-4">
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
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Customers</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage your client database and communication history.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search (Cmd+K)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="md"
                        onClick={handleExportPDF}
                    >
                        <FileDown size={16} className="mr-2" />
                        Export
                    </Button>

                    {canCreateClient && (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => handleOpenModal()}
                        >
                            <UserPlus size={16} className="mr-2" />
                            New Client (Alt+N)
                        </Button>
                    )}
                </div>
            </div>

            <VirtualTable
                data={clients}
                columns={columns}
                isLoading={loading}
                emptyMessage="No customers found."
                height="600px"
            />

            {clients && clients.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Showing <span className="font-medium text-slate-900 dark:text-white">{clients.length}</span> of <span className="font-medium text-slate-900 dark:text-white">{pagination.total}</span> records
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === 1}
                            onClick={() => loadClients(pagination.page - 1, pagination.limit, debouncedSearch)}
                        >
                            <ChevronLeft size={14} className="mr-1" />
                            Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => loadClients(p, pagination.limit, debouncedSearch)}
                                    className={`w-8 h-8 rounded text-xs font-medium transition-colors ${pagination.page === p
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => loadClients(pagination.page + 1, pagination.limit, debouncedSearch)}
                        >
                            <span className="flex items-center gap-1">
                                Next <ChevronRight size={14} />
                            </span>
                        </Button>
                    </div>
                </div>
            )}

            {/* Modal for Create/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingClient ? "Edit Customer" : "New Customer"}
                maxWidth="max-w-xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Full Name"
                            type="text"
                            required
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. John Doe"
                        />
                        <Input
                            label="Company / Organization"
                            type="text"
                            required
                            value={newCompany}
                            onChange={(e) => setNewCompany(e.target.value)}
                            placeholder="e.g. Acme Corp"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Email Address"
                            type="email"
                            required
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="john@example.com"
                        />
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Phone Number</label>
                            <div className="flex gap-2">
                                <select 
                                    className="w-28 h-10 px-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer font-medium"
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
                                    className="flex-1 w-full h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400"
                                    value={newPhone.replace(/^\+\d+/, '').trim()}
                                    onChange={(e) => {
                                        const prefix = newPhone.match(/^\+\d+/)?.[0] || '+34';
                                        setNewPhone(`${prefix} ${e.target.value}`);
                                    }}
                                    placeholder="600 000 000"
                                />
                            </div>
                        </div>
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
                            {editingClient ? 'Update Customer' : 'Create Customer'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal for Timeline */}
            <Modal
                isOpen={isTimelineOpen}
                onClose={() => setIsTimelineOpen(false)}
                title={`Communication History: ${selectedClient?.name}`}
                maxWidth="max-w-4xl"
            >
                {selectedClient && <Timeline clientId={selectedClient.id} />}
            </Modal>

            {/* Modal for AI Brief */}
            <Modal
                isOpen={isBriefModalOpen}
                onClose={() => setIsBriefModalOpen(false)}
                title={`AI Executive Brief: ${selectedClient?.name}`}
                maxWidth="max-w-2xl"
            >
                {isBriefLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        <p className="text-sm text-slate-500 animate-pulse font-medium">Analyzing history and drafting brief...</p>
                    </div>
                ) : (
                    <div className="prose prose-slate dark:prose-invert max-w-none text-sm">
                        <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-xl p-6 text-slate-700 dark:text-slate-300 shadow-sm leading-relaxed">
                            <ReactMarkdown
                                components={{
                                    h1: ({ ...props }) => <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2" {...props} />,
                                    h2: ({ ...props }) => <h2 className="text-md font-bold text-slate-900 dark:text-white mt-4 mb-2 border-b border-slate-200 dark:border-slate-800 pb-1" {...props} />,
                                    ul: ({ ...props }) => <ul className="list-disc ml-4 space-y-1 my-2" {...props} />,
                                    li: ({ ...props }) => <li className="text-slate-600 dark:text-slate-400" {...props} />,
                                    strong: ({ ...props }) => <strong className="font-semibold text-slate-900 dark:text-white" {...props} />,
                                }}
                            >
                                {briefContent}
                            </ReactMarkdown>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button variant="outline" size="sm" onClick={() => setIsBriefModalOpen(false)}>
                                Close Brief
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
                title="Delete Customer"
                message={`Are you sure you want to delete ${clients.find(c => c.id === clientToDelete)?.name}? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                isLoading={isSubmitting}
            />
        </div>
    );
};

export default ContactsView;
