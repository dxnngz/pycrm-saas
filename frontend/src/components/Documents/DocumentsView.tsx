import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Plus,
  FileCode,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Trash2,
  FileSearch
} from 'lucide-react';
import { api } from '../../services/api';
import type { Document } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { toast } from 'sonner';
import { VirtualTable, type Column } from '../UI/VirtualTable';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import Modal from '../Common/Modal';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { sanitizePayload } from '../../utils/sanitize';
import { EmptyState } from '../Common/EmptyState';
import { demoService } from '../../services/demo.service';
import { useAuth } from '../../context/AuthContext';
import { formatMoney } from '../../utils/format';

const DocumentsView = () => {
  const { role } = usePermissions();
  const canDeleteDocument = role === 'admin' || role === 'manager';
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Quote');
  const [newAmount, setNewAmount] = useState('');
  const [newStatus, setNewStatus] = useState('Pending');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.documents.create(sanitizePayload({
        name: newName,
        type: newType,
        amount: Number(newAmount),
        status: newStatus
      }));
      toast.success('Document created successfully');
      setIsModalOpen(false);
      setNewName(''); setNewType('Quote'); setNewAmount(''); setNewStatus('Pending');
      loadDocuments();
    } catch {
      toast.error('Failed to create document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.documents.getAll(1, 100, search);
      setDocuments(res?.documents || []);
    } catch {
      console.error('Error loading documents');
      toast.error('No se pudieron cargar los documentos');
    } finally {
      setLoading(false);
    }
  }, [search]);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const res = await demoService.seed();
      toast.success(res.message || 'Datos de demostración creados');
      loadDocuments();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo crear datos de demostración';
      toast.error(msg);
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadDocuments();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [loadDocuments]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este documento?')) return;
    try {
      await api.documents.delete(id);
      toast.success('Documento eliminado correctamente');
      loadDocuments();
    } catch {
      toast.error('No se pudo eliminar el documento');
    }
  };

  const safeDocs = Array.isArray(documents) ? documents : [];
  const pendingDocs = safeDocs.filter(d => (d?.status ?? '').toLowerCase() === 'pending' || (d?.status ?? '').toLowerCase() === 'pendiente').length;
  const paidMothAmount = safeDocs.filter(d => (d?.status ?? '').toLowerCase() === 'paid' || (d?.status ?? '').toLowerCase() === 'pagado').reduce((acc, d) => acc + (Number(d?.amount) || 0), 0);
  const quotesCount = safeDocs.filter(d => (d?.type ?? '').toLowerCase() === 'quote' || (d?.type ?? '').toLowerCase() === 'presupuesto').length;

  const columns: Column<Document>[] = [
    {
      header: 'Documento',
      width: '40%',
      accessor: (doc: Document) => (
        <div className="flex items-center gap-3 py-1">
          <div className="p-2 bg-surface-muted-bg rounded-md text-surface-muted border border-surface-border">
            <FileText size={16} />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-surface-text leading-tight truncate">{doc?.name ?? 'Documento sin nombre'}</div>
            <div className="text-[10px] font-bold text-surface-muted uppercase tracking-tight">{doc?.type ?? 'Desconocido'}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Cliente',
      width: '20%',
      accessor: (doc: Document) => (
        <span className="text-surface-muted truncate">
          {doc?.client_name || (doc?.client_id ? `ID: #${doc.client_id}` : 'Sin cliente')}
        </span>
      ),
    },
    {
      header: 'Estado',
      width: '15%',
      accessor: (doc: Document) => {
        const s = (doc?.status ?? '').toLowerCase();
        const variant = (s === 'paid' || s === 'pagado' || s === 'signed' || s === 'firmado') ? 'success' :
          (s === 'pending' || s === 'pendiente') ? 'warning' : 'secondary';
        return <Badge variant={variant}>{doc?.status ?? 'Desconocido'}</Badge>;
      },
    },
    {
      header: 'Importe',
      width: '15%',
      accessor: (doc: Document) => (
        <span className="font-medium text-surface-text tabular-nums">
          {formatMoney(Number(doc?.amount) || 0)}
        </span>
      ),
    },
    {
      header: 'Acciones',
      width: '10%',
      align: 'right',
      accessor: (doc: Document) => (
        <div className="flex items-center justify-end gap-1">
          <button className="p-1.5 text-surface-muted hover:text-primary-600 rounded-md transition-colors" title="Vista previa">
            <Eye size={16} />
          </button>
          <button className="p-1.5 text-surface-muted hover:text-primary-600 rounded-md transition-colors" title="Descargar">
            <Download size={16} />
          </button>
          {canDeleteDocument && (
            <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-surface-muted hover:text-red-600 rounded-md transition-colors" title="Eliminar">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-text">Documentos</h1>
          <p className="text-sm text-surface-muted mt-1 flex items-center gap-1.5">
            <FileSearch size={14} className="text-primary-500" />
            Gestiona presupuestos, contratos y facturación comercial.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted group-focus-within:text-primary-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-surface-input border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
            />
          </div>
          <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} className="mr-2" />
            Crear documento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-card p-4 rounded-lg border border-surface-border flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-md flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] text-surface-muted font-bold uppercase tracking-wider">Pendientes</p>
            <p className="text-xl font-bold text-surface-text tabular-nums">{pendingDocs}</p>
          </div>
        </div>

        <div className="bg-surface-card p-4 rounded-lg border border-surface-border flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md flex items-center justify-center">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] text-surface-muted font-bold uppercase tracking-wider">Pagados / firmados</p>
            <p className="text-xl font-bold text-surface-text tabular-nums">
              {formatMoney(paidMothAmount)}
            </p>
          </div>
        </div>

        <div className="bg-surface-card p-4 rounded-lg border border-surface-border flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md flex items-center justify-center">
            <FileCode size={20} />
          </div>
          <div>
            <p className="text-[10px] text-surface-muted font-bold uppercase tracking-wider">Presupuestos</p>
            <p className="text-xl font-bold text-surface-text tabular-nums">{quotesCount}</p>
          </div>
        </div>
      </div>

      <VirtualTable
        data={safeDocs}
        columns={columns}
        isLoading={loading}
        emptyMessage="No se encontraron documentos."
        emptyContent={
          <EmptyState
            title="No hay documentos todavía"
            description="Crea tu primer documento o genera datos demo para que la app se vea completa."
            icon={FileText}
            actionLabel="Crear documento"
            onAction={() => setIsModalOpen(true)}
            secondaryActionLabel={user?.role === 'admin' ? (seeding ? 'Creando…' : 'Crear datos demo') : undefined}
            onSecondaryAction={user?.role === 'admin' ? handleSeedDemo : undefined}
          />
        }
        height="calc(100vh - 350px)"
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo documento" maxWidth="max-w-xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input 
            label="Nombre del documento" 
            value={newName} 
            onChange={e => setNewName(e.target.value)} 
            required 
            placeholder="Ej: Propuesta comercial Q3" 
          />
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Tipo" 
              value={newType} 
              onChange={e => setNewType(e.target.value)}
            >
              <option value="Quote">Presupuesto</option>
              <option value="Contract">Contrato</option>
              <option value="Invoice">Factura</option>
            </Select>
            <Select 
              label="Estado" 
              value={newStatus} 
              onChange={e => setNewStatus(e.target.value)}
            >
              <option value="Pending">Pendiente</option>
              <option value="Paid">Pagado/Firmado</option>
            </Select>
          </div>
          <Input 
            label="Importe (€)" 
            type="number" 
            step="0.01" 
            value={newAmount} 
            onChange={e => setNewAmount(e.target.value)} 
            placeholder="Opcional..."
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Crear documento</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DocumentsView;
