import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { dbRequest } from './lib/db';
import { Menu } from 'lucide-react';

// Feature Stubs (will be implemented in separate files)
import Dashboard from './features/Dashboard';
import Inventory from './features/Inventory';
import Sales from './features/Sales';
import Settings from './features/Settings';
import Login from './features/auth/Login';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inventoryFilter, setInventoryFilter] = useState(null);
  const [salesView, setSalesView] = useState('register');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sessionUser');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('sessionUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sessionUser');
    setActivePage('dashboard');
  };

  const navigateTo = (page, params = {}) => {
    setActivePage(page);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
    if (page === 'inventory') {
      setInventoryFilter(params.filter || null);
    }
    if (page === 'sales') {
      setSalesView(params.view || 'register');
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard role={user?.role} onNavigate={navigateTo} />;
      case 'inventory': return <Inventory role={user?.role} initialFilter={inventoryFilter} onClearFilter={() => setInventoryFilter(null)} />;
      case 'sales': return <Sales role={user?.role} initialView={salesView} />;
      case 'settings': return <Settings role={user?.role} user={user} onUpdateUser={setUser} />;
      default: return <Dashboard role={user?.role} onNavigate={navigateTo} />;
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Mobile Top Bar */}
      <header className="mobile-only burger-menu">
        <div className="flex" style={{ gap: '12px', fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary-color)' }}>
          <span>La Tienda</span>
        </div>
        <button 
          className="btn-secondary" 
          onClick={() => setIsSidebarOpen(true)}
          style={{ padding: '8px', background: 'transparent', border: 'none' }}
        >
          <Menu size={24} />
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Sidebar 
          activePage={activePage} 
          setActivePage={(p) => navigateTo(p)} 
          role={user?.role} 
          userName={user?.name || user?.username}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-color)', width: '100%' }}>
          <div className="container animate-fade-in">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
