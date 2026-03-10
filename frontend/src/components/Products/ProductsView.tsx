import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Search,
  Plus,
  Tag,
  BarChart2,
  Edit2,
  Trash2,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';
import type { Product } from '../../types';
import { toast } from 'sonner';
import { VirtualTable, type Column as VirtualColumn } from '../UI/VirtualTable';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';

const ProductsView = () => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.products.getAll(1, 1000, search); // Increase limit for virtualization demo
      setProducts(res.products || []);
      setTotalItems(res.total || 0);
    } catch {
      console.error('Error loading products');
      toast.error('Failed to load products');
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
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.products.delete(id);
      toast.success('Product removed successfully');
      loadProducts();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const avgPrice = products.length > 0
    ? products.reduce((acc, p) => acc + Number(p.price), 0) / products.length
    : 0;

  const uniqueCategories = new Set(products.map(p => p.category).filter(Boolean)).size;

  const columns: VirtualColumn<Product>[] = [
    {
      header: 'Product / Service',
      width: '40%',
      accessor: (product: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700 uppercase">
            {product.name.charAt(0)}
          </div>
          <div className="truncate">
            <div className="font-medium text-slate-900 dark:text-white leading-tight truncate">{product.name}</div>
            {product.description && <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{product.description}</div>}
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      width: '25%',
      accessor: (product: Product) => (
        <Badge variant="secondary">
          {product.category || 'General'}
        </Badge>
      ),
    },
    {
      header: 'Unit Price',
      width: '25%',
      accessor: (product: Product) => (
        <span className="font-medium text-slate-900 dark:text-white tabular-nums">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)}
        </span>
      ),
    },
    {
      header: 'Actions',
      width: '10%',
      align: 'right',
      accessor: (product: Product) => (
        <div className="flex items-center justify-end gap-1">
          <button className="p-1.5 text-slate-400 hover:text-primary-600 rounded-md transition-colors">
            <Edit2 size={16} />
          </button>
          <button onClick={() => handleDelete(product.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      {/* ... (Header remains the same) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Product Catalog</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <Package size={14} className="text-primary-500" />
            Manage your inventory and commercial services.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
            />
          </div>
          <Button variant="primary" size="md">
            <Plus size={18} className="mr-2" />
            New Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ... (Stats remain the same) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md flex items-center justify-center">
            <Tag size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Items</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{totalItems}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-md flex items-center justify-center">
            <BarChart2 size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Avg. Price</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(avgPrice)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md flex items-center justify-center">
            <Filter size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Categories</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{uniqueCategories}</p>
          </div>
        </div>
      </div>

      <VirtualTable
        data={products}
        columns={columns}
        isLoading={loading}
        emptyMessage="No products found in catalog."
        height="500px"
      />
    </div>
  );
};

export default ProductsView;