import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { dbRequest } from './lib/db';

// Feature Stubs (will be implemented in separate files)
import Dashboard from './features/Dashboard';
import Inventory from './features/Inventory';
import Sales from './features/Sales';
import Settings from './features/Settings';
import Login from './features/auth/Login';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar 
        activePage={activePage} 
        setActivePage={(p) => navigateTo(p)} 
        role={user?.role} 
        userName={user?.name || user?.username}
        onLogout={handleLogout}
      />
      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-color)' }}>
        <div className="container animate-fade-in">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
