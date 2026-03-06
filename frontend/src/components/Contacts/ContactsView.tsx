import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    UserPlus,
    Mail,
    Phone,
    Trash2,
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
import Modal from '../Common/Modal';
import Timeline from './Timeline';
import type { Client } from '../../types';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';
import { Table, type Column } from '../UI/Table';
import { Badge } from '../UI/Badge';
import { ConfirmModal } from '../Common/ConfirmModal';

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

    // Form state
    const [newName, setNewName] = useState('');
    const [newCompany, setNewCompany] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const columns: Column<Client>[] = [
        {
            header: 'Customer',
            accessor: (client: Client) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {client.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                        <div className="font-medium text-slate-900 dark:text-white">{client.name}</div>
                        <div className="text-[10px] text-slate-400">ID: #{client.id.toString().padStart(4, '0')}</div>
                    </div>
                </div>
            ),
        },
        {
            header: 'Organization',
            accessor: 'company',
            className: 'hidden md:table-cell',
        },
        {
            header: 'Contact',
            accessor: (client: Client) => (
                <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Mail size={12} /> {client.email}
                    </div>
                    {client.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Phone size={12} /> {client.phone}
                        </div>
                    )}
                </div>
            ),
            className: 'hidden lg:table-cell',
        },
        {
            header: 'Status',
            accessor: () => <Badge variant="success">Active</Badge>,
            align: 'center',
        },
        {
            header: 'Actions',
            align: 'right',
            accessor: (client: Client) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => handleOpenTimeline(client)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors"
                        title="Timeline"
                    >
                        <History size={16} />
                    </button>
                    <button
                        onClick={() => handleOpenModal(client)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 rounded-md transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={16} />
                    </button>
                    {canDeleteClient && (
                        <button
                            onClick={() => handleDeleteClient(client.id)}
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
            loadClients(pagination.page, pagination.limit, debouncedSearch);
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
                loadClients(pagination.page - 1, pagination.limit, debouncedSearch);
            } else {
                loadClients(pagination.page, pagination.limit, debouncedSearch);
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
            <div className="p-8">
                <Table data={[]} columns={columns} isLoading={true} />
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
                            placeholder="Search customers..."
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
                            New Customer
                        </Button>
                    )}
                </div>
            </div>

            <Table
                data={clients}
                columns={columns}
                isLoading={loading}
                emptyMessage="No customers found."
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
                        <Input
                            label="Phone Number"
                            type="tel"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            placeholder="+1 (555) 000-0000"
                        />
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
