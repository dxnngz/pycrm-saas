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
import { Table, type Column } from '../UI/Table';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';

const DocumentsView = () => {
  const { role } = usePermissions();
  const canDeleteDocument = role === 'admin' || role === 'manager';
  const [search, setSearch] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.documents.getAll(1, 100, search);
      setDocuments(res.documents || []);
    } catch {
      console.error('Error loading documents');
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadDocuments();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [loadDocuments]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.documents.delete(id);
      toast.success('Document deleted successfully');
      loadDocuments();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const pendingDocs = documents.filter(d => d.status.toLowerCase() === 'pending' || d.status.toLowerCase() === 'pendiente').length;
  const paidMothAmount = documents.filter(d => d.status.toLowerCase() === 'paid' || d.status.toLowerCase() === 'pagado').reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
  const quotesCount = documents.filter(d => d.type.toLowerCase() === 'quote' || d.type.toLowerCase() === 'presupuesto').length;

  const columns: Column<Document>[] = [
    {
      header: 'Document Name',
      accessor: (doc: Document) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-400 border border-slate-200 dark:border-slate-700">
            <FileText size={16} />
          </div>
          <div>
            <div className="font-medium text-slate-900 dark:text-white leading-tight">{doc.name}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{doc.type}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Client',
      accessor: (doc: Document) => (
        <span className="text-slate-600 dark:text-slate-400">
          {doc.client_name || `ID: #${doc.client_id}`}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (doc: Document) => {
        const s = doc.status.toLowerCase();
        const variant = (s === 'paid' || s === 'pagado' || s === 'signed' || s === 'firmado') ? 'success' :
          (s === 'pending' || s === 'pendiente') ? 'warning' : 'secondary';
        return <Badge variant={variant}>{doc.status}</Badge>;
      },
    },
    {
      header: 'Amount',
      accessor: (doc: Document) => (
        <span className="font-medium text-slate-900 dark:text-white tabular-nums">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(doc.amount || 0)}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: (doc: Document) => (
        <div className="flex items-center justify-end gap-1">
          <button className="p-1.5 text-slate-400 hover:text-primary-600 rounded-md transition-colors" title="Preview">
            <Eye size={16} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-primary-600 rounded-md transition-colors" title="Download">
            <Download size={16} />
          </button>
          {canDeleteDocument && (
            <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors" title="Delete">
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Document Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <FileSearch size={14} className="text-primary-500" />
            Manage quotes, contracts, and commercial billing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
            />
          </div>
          <Button variant="primary" size="md">
            <Plus size={18} className="mr-2" />
            Create Document
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-md flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Pending</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{pendingDocs}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md flex items-center justify-center">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Paid / Signed</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(paidMothAmount)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md flex items-center justify-center">
            <FileCode size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Quotes Issued</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{quotesCount}</p>
          </div>
        </div>
      </div>

      <Table
        data={documents}
        columns={columns}
        isLoading={loading}
        emptyMessage="No documents found in registry."
      />
    </div>
  );
};

export default DocumentsView;