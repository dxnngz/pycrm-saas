import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Search,
  Plus,
  Tag,
  BarChart2,
  MoreVertical,
  Edit2,
  Trash2,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';
import type { Product } from '../../types';
import { toast } from 'sonner';

const ProductsView = () => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.products.getAll(1, 100, search);
      setProducts(res.products);
      setTotalItems(res.total);
    } catch {
      console.error('Error loading products');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [loadProducts]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    try {
      await api.products.delete(id);
      toast.success('Producto eliminado correctamente');
      loadProducts();
    } catch {
      toast.error('Error al eliminar el producto');
    }
  };

  const avgPrice = products.length > 0
    ? products.reduce((acc, p) => acc + Number(p.price), 0) / products.length
    : 0;

  const uniqueCategories = new Set(products.map(p => p.category).filter(Boolean)).size;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Catálogo de Productos</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 flex items-center gap-2">
            <Package size={18} className="text-primary-500" />
            Gestión de inventario y servicios comerciales
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64 h-14 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-full pl-14 pr-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold shadow-sm"
            />
          </div>
          <button className="flex items-center gap-3 bg-primary-600 text-white px-8 h-14 rounded-2xl font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30">
            <Plus size={24} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Tag size={24} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest opacity-60">Total Items</span>
          </div>
          <p className="text-4xl font-black tracking-tighter mb-1">{totalItems}</p>
          <p className="text-xs font-bold opacity-80 uppercase tracking-widest">En catálogo</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center">
              <BarChart2 size={24} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Valor Medio</span>
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(avgPrice)}
          </p>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ticket promedio</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
              <Filter size={24} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Categorías</span>
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">{uniqueCategories}</p>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Segmentos de mercado</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm premium-shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-bold">Cargando productos...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-bold">No hay productos disponibles.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Producto / Servicio</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Categoría</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Precio Unitario</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 font-black group-hover:bg-primary-600 group-hover:text-white transition-all">
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-black text-slate-900 dark:text-white tracking-tight block">{product.name}</span>
                        {product.description && <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{product.description}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {product.category || 'General'}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900 dark:text-white tabular-nums">
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(product.price)}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-3 text-slate-400 hover:text-primary-500 hover:bg-primary-500/10 rounded-2xl transition-all">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all">
                        <Trash2 size={18} />
                      </button>
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

export default ProductsView;