import React, { useState, useEffect } from 'react';
import { dbRequest } from '../lib/db';
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle, Package, Tag, Filter } from 'lucide-react';

const Sales = ({ user, initialView = 'register' }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
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

  const categories = ['Todos', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const isExpired = (date) => date && new Date(date) < new Date();

  const addToCart = (product) => {
    if (product.stock <= 0) return;
    if (isExpired(product.expiryDate)) {
      alert('Producto vencido');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) return;
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
        sellerName: user?.name || user?.username || 'Desconocido',
        role: user?.role
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
      <header className="flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px' }}>Ventas</h1>
          <p style={{ color: 'var(--text-muted)' }}>Crea órdenes y gestiona el historial</p>
        </div>
        
        <div className="flex" style={{ background: 'rgba(51, 65, 85, 0.4)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setView('register')}
            className={view === 'register' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '10px 24px', border: 'none', borderRadius: '8px' }}
          >
            Registrar
          </button>
          <button 
            onClick={() => setView('history')}
            className={view === 'history' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '10px 24px', border: 'none', borderRadius: '8px' }}
          >
            Historial
          </button>
        </div>
      </header>

      {view === 'register' ? (
        <div className="sales-layout">
          {/* Main Content Area */}
          <div className="flex" style={{ flexDirection: 'column', gap: '24px', overflow: 'hidden' }}>
            {/* Search and Filters */}
            <div className="card grid" style={{ gap: '20px', padding: '24px' }}>
              <div className="flex" style={{ position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
                <input 
                  className="input-search"
                  style={{ width: '100%', paddingLeft: '48px', height: '54px', fontSize: '1.1rem', background: 'rgba(15, 23, 42, 0.3)' }} 
                  placeholder="Buscar productos por nombre o etiqueta..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex" style={{ overflowX: 'auto', paddingBottom: '8px', gap: '10px' }}>
                <div className="flex" style={{ color: 'var(--text-muted)', marginRight: '8px' }}>
                  <Filter size={16} /> <span style={{ fontSize: '0.8rem' }}>Categorías:</span>
                </div>
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {filteredProducts.map(p => (
                  <div 
                    key={p.id} 
                    className="card product-card animate-fade-in" 
                    style={{ 
                      padding: '20px',
                      cursor: p.stock <= 0 ? 'not-allowed' : 'pointer', 
                      opacity: p.stock <= 0 || isExpired(p.expiryDate) ? 0.6 : 1,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onClick={() => addToCart(p)}
                  >
                    <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-color)', fontSize: '1rem', padding: '6px 12px' }}>
                        ${p.price.toFixed(2)}
                      </span>
                      {p.stock <= p.minStock && (
                        <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Bajo Stock</span>
                      )}
                    </div>
                    
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '4px' }}>{p.name}</h3>
                    <div className="flex" style={{ gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
                      <Tag size={14} /> {p.category}
                    </div>

                    <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <span style={{ fontSize: '0.85rem' }}>En Stock: <strong>{p.stock}</strong></span>
                      <button className="btn-primary" style={{ padding: '6px', borderRadius: '50%' }}>
                        <Plus size={16} />
                      </button>
                    </div>

                    {isExpired(p.expiryDate) && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'var(--danger-color)', color: 'white', fontSize: '0.7rem', textAlign: 'center', padding: '2px' }}>
                        PRODUCTO VENCIDO
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div className="card flex" style={{ flexDirection: 'column', gap: '24px', height: '100%', background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(10px)' }}>
            <div className="flex" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Orden Actual</h2>
              <span className="badge" style={{ background: 'var(--primary-color)' }}>{cart.length} items</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '60px' }}>
                  <ShoppingCart size={64} style={{ marginBottom: '16px', opacity: 0.15 }} />
                  <p style={{ fontSize: '1.1rem' }}>Tu carrito está vacío</p>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Selecciona productos de la izquierda</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex" style={{ justifyContent: 'space-between', padding: '16px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>{item.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--primary-color)' }}>${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex" style={{ gap: '10px' }}>
                      <div className="flex" style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '4px' }}>
                        <button className="btn-secondary" style={{ padding: '2px', border: 'none' }} onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                        <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '700' }}>{item.quantity}</span>
                        <button className="btn-secondary" style={{ padding: '2px', border: 'none' }} onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                      </div>
                      <button className="btn-secondary" style={{ padding: '8px', border: 'none', color: 'var(--danger-color)' }} onClick={() => removeFromCart(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ borderTop: '2px dashed var(--border-color)', paddingTop: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <div className="flex" style={{ justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex" style={{ justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-main)' }}>
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              
              <button 
                className="btn-primary" 
                style={{ width: '100%', padding: '18px', fontSize: '1.1rem', fontWeight: '800', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)' }}
                disabled={cart.length === 0 || isSuccess}
                onClick={handleCheckout}
              >
                {isSuccess ? <><CheckCircle size={24} /> ¡Venta Hecha!</> : <><Package size={20} /> Finalizar Compra</>}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.4)' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Historial de Ventas</h3>
              <p style={{ color: 'var(--text-muted)' }}>{filterDate}</p>
            </div>
            <div className="badge badge-success" style={{ fontSize: '1.4rem', padding: '12px 24px', borderRadius: '12px' }}>
              Ventas del día: ${historyTotal.toFixed(2)}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'rgba(51, 65, 85, 0.6)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <tr>
                  <th style={{ padding: '20px 32px' }}>Hora</th>
                  <th style={{ padding: '20px 32px' }}>Producto</th>
                  <th style={{ padding: '20px 32px' }}>Categoría</th>
                  <th style={{ padding: '20px 32px' }}>Cant.</th>
                  <th style={{ padding: '20px 32px' }}>Total</th>
                  <th style={{ padding: '20px 32px' }}>Vendedor</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                      No hay ventas registradas.
                    </td>
                  </tr>
                ) : (
                  history.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '20px 32px', color: 'var(--text-muted)' }}>{new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ padding: '20px 32px', fontWeight: '700' }}>{s.productName}</td>
                      <td style={{ padding: '20px 32px' }}>
                        <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)' }}>General</span>
                      </td>
                      <td style={{ padding: '20px 32px' }}>x{s.quantity}</td>
                      <td style={{ padding: '20px 32px', fontWeight: '800', color: 'var(--secondary-color)' }}>${s.total.toFixed(2)}</td>
                      <td style={{ padding: '20px 32px' }}>
                        <div className="flex" style={{ gap: '8px' }}>
                           <div style={{ background: 'var(--primary-color)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '900' }}>
                             {s.sellerName?.charAt(0).toUpperCase() || 'U'}
                           </div>
                           <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{s.sellerName || 'Usuario'}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
