import React, { useState, useEffect } from 'react';
import { dbRequest } from '../lib/db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, Package, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';

const Dashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    todayEarnings: 0,
    totalProducts: 0,
    lowStockCount: 0,
    expiredCount: 0,
    salesHistory: []
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const products = await dbRequest('products', 'getAll');
    const sales = await dbRequest('sales', 'getAll');

    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.date.startsWith(today));
    const todayEarnings = todaySales.reduce((sum, s) => sum + s.total, 0);

    const lowStock = products.filter(p => p.stock <= p.minStock).length;
    const expired = products.filter(p => p.expiryDate && new Date(p.expiryDate) < new Date()).length;

    // Process sales history for last 7 days
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const daySales = sales.filter(s => s.date.startsWith(dateStr));
      history.push({
        date: dateStr.split('-').slice(1).join('/'),
        total: daySales.reduce((sum, s) => sum + s.total, 0)
      });
    }

    setStats({
      todayEarnings,
      totalProducts: products.length,
      lowStockCount: lowStock,
      expiredCount: expired,
      salesHistory: history
    });
  };

  const statCards = [
    { label: 'Ventas de Hoy', value: `$${stats.todayEarnings.toFixed(2)}`, icon: <DollarSign />, color: 'var(--primary-color)', action: () => onNavigate('sales', { view: 'history' }) },
    { label: 'Productos Totales', value: stats.totalProducts, icon: <Package />, color: 'var(--secondary-color)', action: () => onNavigate('inventory') },
    { label: 'Stock Bajo', value: stats.lowStockCount, icon: <AlertTriangle />, color: 'var(--warning-color)', action: () => onNavigate('inventory', { filter: 'low' }) },
    { label: 'Productos Vencidos', value: stats.expiredCount, icon: <AlertTriangle />, color: 'var(--danger-color)', action: () => onNavigate('inventory', { filter: 'expired' }) },
  ];

  return (
    <div className="grid" style={{ gap: '32px' }}>
      <header>
        <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>Tablero de Control</h1>
        <p style={{ color: 'var(--text-muted)' }}>Resumen general del negocio</p>
      </header>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {statCards.map((stat, i) => (
          <div 
            key={i} 
            className="card flex" 
            style={{ 
              gap: '20px', 
              alignItems: 'center', 
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onClick={stat.action}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ padding: '12px', background: `${stat.color}20`, borderRadius: '12px', color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{stat.label}</p>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        <div className="card">
          <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3>Ventas Recientes (7 días)</h3>
            <TrendingUp size={20} color="var(--primary-color)" />
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.salesHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Line type="monotone" dataKey="total" stroke="var(--primary-color)" strokeWidth={3} dot={{ fill: 'var(--primary-color)', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Próximos a Vencer</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Requieren atención inmediata</p>
          {/* List items would go here, kept simple for now */}
          <div className="flex" style={{ flexDirection: 'column', gap: '12px' }}>
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <Calendar size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
              <p style={{ fontSize: '0.85rem' }}>No hay alertas críticas nuevas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
