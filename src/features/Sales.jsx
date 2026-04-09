import React, { useState, useEffect } from 'react';
import { dbRequest } from '../lib/db';
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

const Sales = ({ role, initialView = 'register' }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [view, setView] = useState(initialView);
  const [history, setHistory] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadProducts();
    if (view === 'history') loadHistory();
  }, [view, filterDate]);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const loadProducts = async () => {
    const data = await dbRequest('products', 'getAll');
    setProducts(data);
  };

  const loadHistory = async () => {
    const data = await dbRequest('sales', 'getAll');
    const filtered = data.filter(s => s.date.startsWith(filterDate));
    setHistory(filtered.reverse());
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isExpired = (date) => date && new Date(date) < new Date();

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert('Producto agotado');
      return;
    }
    if (isExpired(product.expiryDate)) {
      alert('No se puede vender un producto vencido');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('No hay más stock disponible');
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const newQty = item.quantity + delta;
        if (newQty > 0 && newQty <= product.stock) {
          return { ...item, quantity: newQty };
        }
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const historyTotal = history.reduce((sum, s) => sum + s.total, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    for (const item of cart) {
      await dbRequest('sales', 'add', {
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        date: new Date().toISOString(),
        role: role
      });

      const product = products.find(p => p.id === item.id);
      await dbRequest('products', 'put', {
        ...product,
        stock: product.stock - item.quantity,
        lastUpdated: new Date().toISOString()
      });
    }

    setCart([]);
    setIsSuccess(true);
    loadProducts();
    if (view === 'history') loadHistory();
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="grid" style={{ gap: '24px' }}>
      <header className="flex" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Ventas</h1>
          <div className="flex" style={{ background: 'var(--surface-color)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setView('register')}
              className={view === 'register' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 20px', border: 'none' }}
            >
              Registrar
            </button>
            <button 
              onClick={() => setView('history')}
              className={view === 'history' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 20px', border: 'none' }}
            >
              Historial
            </button>
          </div>
        </div>
        {view === 'history' && (
          <div className="grid" style={{ gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Filtrar por Día</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          </div>
        )}
      </header>

      {view === 'register' ? (
        <div className="grid" style={{ gridTemplateColumns: '1fr 380px', gap: '32px', height: 'calc(100vh - 200px)' }}>
          {/* Product Selection container */}
          <div className="flex" style={{ flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
            <div className="flex" style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              <input 
                style={{ width: '100%', paddingLeft: '40px' }} 
                placeholder="Buscar por nombre o categoría..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {filteredProducts.map(p => (
                <div 
                  key={p.id} 
                  className="card" 
                  style={{ 
                    cursor: 'pointer', 
                    opacity: p.stock <= 0 || isExpired(p.expiryDate) ? 0.6 : 1,
                    border: isExpired(p.expiryDate) ? '1px solid var(--danger-color)' : '1px solid var(--border-color)'
                  }}
                  onClick={() => addToCart(p)}
                >
                  <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="badge badge-success">${p.price.toFixed(2)}</span>
                    <span className={p.stock < 5 ? 'text-danger' : 'text-muted'} style={{ fontSize: '0.8rem' }}>Stock: {p.stock}</span>
                  </div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>{p.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.category}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cart container */}
          <div className="card flex" style={{ flexDirection: 'column', gap: '20px', height: '100%' }}>
            <h2>Carrito</h2>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                  <ShoppingCart size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <p>El carrito está vacío</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex" style={{ justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.9rem' }}>{item.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>${item.price.toFixed(2)} c/u</p>
                    </div>
                    <div className="flex" style={{ gap: '8px' }}>
                      <button className="btn-secondary" style={{ padding: '4px' }} onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                      <span style={{ minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                      <button className="btn-secondary" style={{ padding: '4px' }} onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                      <button className="btn-secondary" style={{ padding: '4px', color: 'var(--danger-color)' }} onClick={() => removeFromCart(item.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '20px' }}>
              <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '20px', fontSize: '1.25rem', fontWeight: '800' }}>
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button 
                className="btn-primary" 
                style={{ width: '100%', padding: '16px' }}
                disabled={cart.length === 0}
                onClick={handleCheckout}
              >
                {isSuccess ? <><CheckCircle size={20} /> Venta Exitosa</> : 'Completar Venta'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Historial de Ventas - {filterDate}</h3>
            <div className="badge badge-success" style={{ fontSize: '1.1rem', padding: '8px 16px' }}>
              Total Día: ${historyTotal.toFixed(2)}
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(51, 65, 85, 0.4)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <tr>
                <th style={{ padding: '16px 24px' }}>Hora</th>
                <th style={{ padding: '16px 24px' }}>Producto</th>
                <th style={{ padding: '16px 24px' }}>Cant.</th>
                <th style={{ padding: '16px 24px' }}>Precio Unit.</th>
                <th style={{ padding: '16px 24px' }}>Total</th>
                <th style={{ padding: '16px 24px' }}>Vendedor</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay ventas registradas en esta fecha.
                  </td>
                </tr>
              ) : (
                history.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 24px' }}>{new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ padding: '16px 24px', fontWeight: '600' }}>{s.productName}</td>
                    <td style={{ padding: '16px 24px' }}>{s.quantity}</td>
                    <td style={{ padding: '16px 24px' }}>${s.price.toFixed(2)}</td>
                    <td style={{ padding: '16px 24px', fontWeight: '700' }}>${s.total.toFixed(2)}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className="badge" style={{ fontSize: '0.7rem' }}>{s.role === 'owner' ? 'Dueño' : 'Empleado'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Sales;
