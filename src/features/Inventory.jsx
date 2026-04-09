import React, { useState, useEffect } from 'react';
import { dbRequest } from '../lib/db';
import { Plus, Trash2, Edit3, AlertCircle, FileUp, Save, X } from 'lucide-react';

const Inventory = ({ role, initialFilter = null, onClearFilter }) => {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    minStock: '5',
    expiryDate: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await dbRequest('products', 'getAll');
    setProducts(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      minStock: parseInt(formData.minStock),
      lastUpdated: new Date().toISOString(),
    };

    if (editingProduct) {
      await dbRequest('products', 'put', { ...productData, id: editingProduct.id });
    } else {
      await dbRequest('products', 'add', productData);
    }

    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', category: '', price: '', stock: '', minStock: '5', expiryDate: '' });
    loadProducts();
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      await dbRequest('products', 'delete', id);
      loadProducts();
    }
  };

  const isExpired = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isLowStock = (p) => p.stock <= p.minStock;

  const filteredItems = products.filter(p => {
    if (initialFilter === 'low') return isLowStock(p);
    if (initialFilter === 'expired') return isExpired(p.expiryDate);
    return true;
  });

  const handleImport = async (e) => {
    // ... same logic
  };

  return (
    <div className="grid" style={{ gap: '32px' }}>
      <header className="flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>Gestión de Inventario</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {initialFilter === 'low' ? '🚨 Mostrando solo productos con stock bajo' : 
             initialFilter === 'expired' ? '⚠️ Mostrando solo productos vencidos' : 
             'Administra tus productos y existencias'}
          </p>
          {initialFilter && (
            <button 
              className="btn-secondary" 
              style={{ marginTop: '12px', fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={onClearFilter}
            >
              <X size={14} /> Quitar Filtro (Ver Todo)
            </button>
          )}
        </div>
        <div className="flex">
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            <FileUp size={20} /> Importar CSV
            <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          {role === 'owner' && (
            <button className="btn-primary" onClick={() => { setEditingProduct(null); setFormData({ name: '', category: '', price: '', stock: '', minStock: '5', expiryDate: '' }); setIsModalOpen(true); }}>
              <Plus size={20} /> Nuevo Producto
            </button>
          )}
        </div>
      </header>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(51, 65, 85, 0.4)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <tr>
              <th style={{ padding: '16px 24px' }}>Producto</th>
              <th style={{ padding: '16px 24px' }}>Categoría</th>
              <th style={{ padding: '16px 24px' }}>Precio</th>
              <th style={{ padding: '16px 24px' }}>Stock</th>
              <th style={{ padding: '16px 24px' }}>Vencimiento</th>
              <th style={{ padding: '16px 24px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontWeight: '600' }}>{p.name}</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)' }}>{p.category}</span>
                </td>
                <td style={{ padding: '16px 24px' }}>${p.price.toFixed(2)}</td>
                <td style={{ padding: '16px 24px' }}>
                  <div className="flex">
                    <span style={{ color: isLowStock(p) ? 'var(--danger-color)' : 'inherit' }}>{p.stock}</span>
                    {isLowStock(p) && <AlertCircle size={14} color="var(--danger-color)" />}
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span className={isExpired(p.expiryDate) ? 'badge badge-danger' : 'badge'}>
                    {p.expiryDate || 'N/A'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div className="flex">
                    <button onClick={() => { setEditingProduct(p); setFormData(p); setIsModalOpen(true); }} className="btn-secondary" style={{ padding: '6px' }}><Edit3 size={16} /></button>
                    {role === 'owner' && (
                      <button onClick={() => handleDelete(p.id)} className="btn-secondary" style={{ padding: '6px', color: 'var(--danger-color)' }}><Trash2 size={16} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(15, 23, 42, 0.7)', 
          backdropFilter: 'blur(8px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card animate-fade-in" style={{ 
            width: '100%',
            maxWidth: '500px', 
            padding: '40px',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '32px', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="btn-secondary" 
                style={{ background: 'transparent', border: 'none', padding: '4px' }}
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid" style={{ gap: '24px' }}>
              <div className="grid" style={{ gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-muted)' }}>Nombre del Producto</label>
                <input 
                  required 
                  placeholder="Ej. Leche Entera"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  style={{ width: '100%' }}
                />
              </div>

              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="grid" style={{ gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-muted)' }}>Categoría</label>
                  <input 
                    required 
                    placeholder="Ej. Lácteos"
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                  />
                </div>
                <div className="grid" style={{ gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-muted)' }}>Precio ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    placeholder="0.00"
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="grid" style={{ gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-muted)' }}>Existencia Inicial</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="0"
                    value={formData.stock} 
                    onChange={e => setFormData({...formData, stock: e.target.value})} 
                  />
                </div>
                <div className="grid" style={{ gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-muted)' }}>Stock Mínimo</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.minStock} 
                    onChange={e => setFormData({...formData, minStock: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid" style={{ gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-muted)' }}>Fecha de Vencimiento</label>
                <input 
                  type="date" 
                  value={formData.expiryDate} 
                  onChange={e => setFormData({...formData, expiryDate: e.target.value})} 
                  style={{ width: '100%' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '16px', padding: '14px', width: '100%', fontSize: '1rem' }}>
                <Save size={20} /> {editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
