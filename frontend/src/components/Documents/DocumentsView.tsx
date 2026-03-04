import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Plus,
  FileCode,
  CheckCircle,
  Clock,
  MoreVertical,
  Download,
  Eye,
  Trash2
} from 'lucide-react';
import { api } from '../../services/api';
import type { Document } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { SkeletonTable } from '../Common/Skeletons';
import { toast } from 'sonner';

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
      setDocuments(res.documents);
    } catch {
      console.error('Error loading documents');
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
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) return;
    try {
      await api.documents.delete(id);
      toast.success('Documento eliminado correctamente');
      loadDocuments();
    } catch {
      toast.error('Error al eliminar el documento');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'pagado':
      case 'signed':
      case 'firmado':
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800';
      case 'pending':
      case 'pendiente':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800';
      case 'draft':
      case 'borrador':
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700';
    }
  };

  const pendingDocs = documents.filter(d => d.status.toLowerCase() === 'pending' || d.status.toLowerCase() === 'pendiente').length;
  const paidMothAmount = documents.filter(d => d.status.toLowerCase() === 'paid' || d.status.toLowerCase() === 'pagado').reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
  const quotesCount = documents.filter(d => d.type.toLowerCase() === 'quote' || d.type.toLowerCase() === 'presupuesto').length;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Gestión Documental</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 flex items-center gap-2">
            <FileText size={18} className="text-primary-500" />
            Control de presupuestos, contratos y facturación
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64 h-14 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-full pl-14 pr-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold shadow-sm"
            />
          </div>
          <button className="flex items-center gap-3 bg-primary-600 text-white px-8 h-14 rounded-2xl font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30">
            <Plus size={24} />
            <span>Generar Documento</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow flex items-center gap-6">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
            <Clock size={32} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{pendingDocs}</p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pendientes</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
            <CheckCircle size={32} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(paidMothAmount)}
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pagados/Firmados</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
            <FileCode size={32} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{quotesCount}</p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Presupuestos Emitidos</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow overflow-hidden">
        {loading ? (
          <SkeletonTable />
        ) : documents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-bold">No hay documentos disponibles.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Nombre del Documento</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Cliente</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Estado</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Importe</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 group-hover:text-primary-500 transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white tracking-tight block">{doc.name}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{doc.type}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-600 dark:text-slate-400">
                    {doc.client_name || `Cliente #${doc.client_id}`}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(doc.status)}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900 dark:text-white tabular-nums">
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(doc.amount || 0)}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-3 text-slate-400 hover:text-primary-500 hover:bg-primary-500/10 rounded-2xl transition-all" title="Vista Previa">
                        <Eye size={18} />
                      </button>
                      <button className="p-3 text-slate-400 hover:text-primary-500 hover:bg-primary-500/10 rounded-2xl transition-all" title="Descargar">
                        <Download size={18} />
                      </button>
                      {canDeleteDocument && (
                        <button onClick={() => handleDelete(doc.id)} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all" title="Eliminar">
                          <Trash2 size={18} />
                        </button>
                      )}
                      <button className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-2xl transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DocumentsView;