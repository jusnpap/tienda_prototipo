import React from 'react';
import { Package, ShoppingCart, BarChart3, Settings, UserCircle, Store } from 'lucide-react';

const Sidebar = ({ activePage, setActivePage, role, userName, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tablero', icon: <BarChart3 size={20} /> },
    { id: 'inventory', label: 'Inventario', icon: <Package size={20} /> },
    { id: 'sales', label: 'Ventas', icon: <ShoppingCart size={20} /> },
    { id: 'settings', label: 'Ajustes', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="sidebar flex" style={{ flexDirection: 'column', padding: '24px', width: '260px', minWidth: '260px', gap: '40px' }}>
      <div className="flex" style={{ gap: '12px', fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)' }}>
        <Store size={32} />
        <span>La Tienda</span>
      </div>

      <nav className="flex" style={{ flexDirection: 'column', gap: '8px', flex: 1, width: '100%', alignItems: 'stretch' }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={activePage === item.id ? 'btn-primary' : 'btn-secondary'}
            style={{ 
              justifyContent: 'flex-start',
              border: activePage === item.id ? 'none' : '1px solid transparent',
              background: activePage === item.id ? 'var(--primary-color)' : 'transparent',
              padding: '12px 16px'
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="card flex" style={{ flexDirection: 'column', padding: '16px', gap: '12px', background: 'rgba(51, 65, 85, 0.4)' }}>
        <div className="flex" style={{ width: '100%', justifyContent: 'space-between', gap: '8px' }}>
          <div className="flex" style={{ gap: '8px', overflow: 'hidden' }}>
            <UserCircle size={20} className={role === 'owner' ? 'text-primary' : 'text-muted'} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName}
              </span>
              <span className="badge" style={{ fontSize: '0.6rem', width: 'fit-content', padding: '1px 5px' }}>
                {role === 'owner' ? 'Dueño' : 'Empleado'}
              </span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="badge badge-danger" 
            style={{ fontSize: '0.6rem', padding: '2px 8px', border: 'none', cursor: 'pointer' }}
          >
            Salir
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
