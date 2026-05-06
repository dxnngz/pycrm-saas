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
import Modal from '../Common/Modal';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { sanitizePayload } from '../../utils/sanitize';
import { EmptyState } from '../Common/EmptyState';
import { demoService } from '../../services/demo.service';
import { useAuth } from '../../context/AuthContext';
import { formatMoney } from '../../utils/format';

const ProductsView = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('General');

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const res = await demoService.seed();
      toast.success(res.message || 'Datos de demostración creados');
      loadProducts();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo crear datos de demostración';
      toast.error(msg);
    } finally {
      setSeeding(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.products.create(sanitizePayload({
        name: newName,
        description: newDesc,
        price: newPrice,
        category: newCategory
      }));
      toast.success('Producto creado correctamente');
      setIsModalOpen(false);
      setNewName(''); setNewDesc(''); setNewPrice(''); setNewCategory('General');
      loadProducts();
    } catch {
      toast.error('No se pudo crear el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.products.getAll(1, 1000, search); // Increase limit for virtualization demo
      setProducts(res.products || []);
      setTotalItems(res.total || 0);
    } catch {
      console.error('Error loading products');
      toast.error('No se pudieron cargar los productos');
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
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
    try {
      await api.products.delete(id);
      toast.success('Producto eliminado correctamente');
      loadProducts();
    } catch {
      toast.error('No se pudo eliminar el producto');
    }
  };

  const avgPrice = products.length > 0
    ? products.reduce((acc, p) => acc + Number(p.price), 0) / products.length
    : 0;

  const uniqueCategories = new Set(products.map(p => p.category).filter(Boolean)).size;

  const columns: VirtualColumn<Product>[] = [
    {
      header: 'Producto / Servicio',
      width: '40%',
      accessor: (product: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-surface-muted-bg flex items-center justify-center text-surface-muted font-bold border border-surface-border uppercase">
            {product.name.charAt(0)}
          </div>
          <div className="truncate">
            <div className="font-medium text-surface-text leading-tight truncate">{product.name}</div>
            {product.description && <div className="text-[10px] text-surface-muted mt-0.5 truncate">{product.description}</div>}
          </div>
        </div>
      ),
    },
    {
      header: 'Categoría',
      width: '25%',
      accessor: (product: Product) => (
        <Badge variant="secondary">
          {product.category || 'General'}
        </Badge>
      ),
    },
    {
      header: 'Precio',
      width: '25%',
      accessor: (product: Product) => (
        <span className="font-medium text-surface-text tabular-nums">
          {formatMoney(Number(product.price))}
        </span>
      ),
    },
    {
      header: 'Acciones',
      width: '10%',
      align: 'right',
      accessor: (product: Product) => (
        <div className="flex items-center justify-end gap-1">
          <button className="p-1.5 text-surface-muted hover:text-primary-600 rounded-md transition-colors" title="Editar">
            <Edit2 size={16} />
          </button>
          <button onClick={() => handleDelete(product.id)} className="p-1.5 text-surface-muted hover:text-danger-icon rounded-md transition-colors" title="Eliminar">
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
          <h1 className="text-xl font-bold text-surface-text">Catálogo</h1>
          <p className="text-sm text-surface-muted mt-1 flex items-center gap-1.5">
            <Package size={14} className="text-primary-500" />
            Gestiona tus productos y servicios.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted group-focus-within:text-primary-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-surface-input border border-surface-border rounded-lg text-sm text-surface-text placeholder:text-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
            />
          </div>
          <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} className="mr-2" />
            Nuevo producto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ... (Stats remain the same) */}
        <div className="bg-surface-card p-4 rounded-lg border border-surface-border flex items-center gap-4">
          <div className="w-10 h-10 bg-info-bg text-info-icon rounded-md flex items-center justify-center">
            <Tag size={20} />
          </div>
          <div>
            <p className="text-[10px] text-surface-muted font-bold uppercase tracking-wider">Total</p>
            <p className="text-xl font-bold text-surface-text tabular-nums">{totalItems}</p>
          </div>
        </div>

        <div className="bg-surface-card p-4 rounded-lg border border-surface-border flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-md flex items-center justify-center">
            <BarChart2 size={20} />
          </div>
          <div>
            <p className="text-[10px] text-surface-muted font-bold uppercase tracking-wider">Precio medio</p>
            <p className="text-xl font-bold text-surface-text tabular-nums">
              {formatMoney(avgPrice)}
            </p>
          </div>
        </div>

        <div className="bg-surface-card p-4 rounded-lg border border-surface-border flex items-center gap-4">
          <div className="w-10 h-10 bg-success-bg text-success-icon rounded-md flex items-center justify-center">
            <Filter size={20} />
          </div>
          <div>
            <p className="text-[10px] text-surface-muted font-bold uppercase tracking-wider">Categorías</p>
            <p className="text-xl font-bold text-surface-text tabular-nums">{uniqueCategories}</p>
          </div>
        </div>
      </div>

      <VirtualTable
        data={products}
        columns={columns}
        isLoading={loading}
        emptyMessage="No se encontraron productos."
        emptyContent={
          <EmptyState
            title="No hay productos todavía"
            description="Crea tu primer producto o genera datos demo para que la app se vea completa."
            icon={Package}
            actionLabel="Crear producto"
            onAction={() => setIsModalOpen(true)}
            secondaryActionLabel={user?.role === 'admin' ? (seeding ? 'Creando…' : 'Crear datos demo') : undefined}
            onSecondaryAction={user?.role === 'admin' ? handleSeedDemo : undefined}
          />
        }
        height="500px"
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo producto" maxWidth="max-w-xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input 
            label="Nombre" 
            value={newName} 
            onChange={e => setNewName(e.target.value)} 
            required 
            placeholder="Ej: Licencia Enterprise" 
          />
          <Input 
            label="Descripción" 
            value={newDesc} 
            onChange={e => setNewDesc(e.target.value)} 
            placeholder="Características incluidas..." 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Precio (€)" 
              type="number" 
              step="0.01" 
              value={newPrice} 
              onChange={e => setNewPrice(e.target.value)} 
              required 
            />
            <Select 
              label="Categoría" 
              value={newCategory} 
              onChange={e => setNewCategory(e.target.value)}
            >
              <option value="General">General</option>
              <option value="Software">Software</option>
              <option value="Hardware">Hardware</option>
              <option value="Service">Servicio</option>
            </Select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Crear producto</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductsView;
