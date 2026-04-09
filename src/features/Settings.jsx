import React, { useState, useEffect } from 'react';
import { dbRequest } from '../lib/db';
import { Lock, Database, Trash2, Download, ShieldCheck, UserPlus, Users, Power, PowerOff } from 'lucide-react';

const Settings = ({ role, user, onUpdateUser }) => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'employee' });
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (role === 'owner') {
      loadUsers();
    }
  }, [role]);

  const loadUsers = async () => {
    const data = await dbRequest('users', 'getAll');
    setUsers(data);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;
    
    await dbRequest('users', 'add', {
      ...newUser,
      status: 'active',
      createdAt: new Date().toISOString()
    });
    setNewUser({ username: '', password: '', name: '', role: 'employee' });
    loadUsers();
  };

  const toggleUserStatus = async (targetUser) => {
    if (targetUser.username === 'admin') return; // Cannot disable main admin
    const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    await dbRequest('users', 'put', { ...targetUser, status: newStatus });
    loadUsers();
  };

  const deleteUser = async (username) => {
    if (username === 'admin' || username === user.username) return;
    if (confirm('¿Eliminar este usuario?')) {
      await dbRequest('users', 'delete', username);
      loadUsers();
    }
  };

  const handleClearData = async () => {
    if (confirm('¿Estás SEGURO de que quieres borrar todos los datos? Esta acción es irreversible.')) {
      await dbRequest('products', 'clear');
      await dbRequest('sales', 'clear');
      alert('Datos borrados correctamente');
      window.location.reload();
    }
  };

  const handleExportData = async () => {
    const products = await dbRequest('products', 'getAll');
    const sales = await dbRequest('sales', 'getAll');
    const data = { products, sales, exportDate: new Date().toISOString() };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo_la_tienda_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="grid" style={{ gap: '32px', maxWidth: '1000px' }}>
      <header>
        <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>Configuración</h1>
        <p style={{ color: 'var(--text-muted)' }}>Gestiona los ajustes del sistema y seguridad</p>
      </header>

      {role === 'owner' && (
        <section className="card grid" style={{ gap: '24px' }}>
          <div className="flex">
            <Users color="var(--primary-color)" />
            <h3>Gestión de Personal</h3>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
            {/* New User Form */}
            <form onSubmit={handleAddUser} className="grid" style={{ gap: '16px', borderRight: '1px solid var(--border-color)', paddingRight: '32px' }}>
              <h4>Registrar Nuevo Empleado</h4>
              <div className="grid" style={{ gap: '4px' }}>
                <label style={{ fontSize: '0.8rem' }}>Username</label>
                <input required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
              </div>
              <div className="grid" style={{ gap: '4px' }}>
                <label style={{ fontSize: '0.8rem' }}>Nombre Completo</label>
                <input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              </div>
              <div className="grid" style={{ gap: '4px' }}>
                <label style={{ fontSize: '0.8rem' }}>Contraseña</label>
                <input type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                <UserPlus size={18} /> Crear Cuenta
              </button>
            </form>

            {/* User List */}
            <div className="grid" style={{ gap: '16px' }}>
              <h4>Usuarios del Sistema</h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Usuario</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Rol</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Estado</th>
                      <th style={{ textAlign: 'right', padding: '12px' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.username} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: '600' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span className="badge" style={{ fontSize: '0.65rem' }}>{u.role === 'owner' ? 'Dueño' : 'Empleado'}</span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span className={u.status === 'active' ? 'text-secondary' : 'text-danger'} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {u.status === 'active' ? <Power size={12} /> : <PowerOff size={12} />}
                            {u.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div className="flex" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                            {u.username !== 'admin' && (
                              <button 
                                onClick={() => toggleUserStatus(u)} 
                                className="btn-secondary" 
                                style={{ padding: '6px', color: u.status === 'active' ? 'var(--warning-color)' : 'var(--secondary-color)' }}
                                title={u.status === 'active' ? 'Desactivar' : 'Activar'}
                              >
                                {u.status === 'active' ? <PowerOff size={14} /> : <Power size={14} />}
                              </button>
                            )}
                            {u.username !== 'admin' && u.username !== user.username && (
                              <button onClick={() => deleteUser(u.username)} className="btn-secondary" style={{ padding: '6px', color: 'var(--danger-color)' }}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="card grid" style={{ gap: '24px' }}>
        <div className="flex">
          <Database color="var(--secondary-color)" />
          <h3>Base de Datos y Backup</h3>
        </div>

        <div className="flex" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <button className="btn-secondary" onClick={handleExportData}>
            <Download size={18} /> Exportar Respaldo
          </button>
          
          {role === 'owner' && (
            <button className="btn-danger" onClick={handleClearData}>
              <Trash2 size={18} /> Borrar Todo el Sistema
            </button>
          )}
        </div>
      </section>
      
      <div className="card" style={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'var(--primary-color)' }}>
        <h4 style={{ marginBottom: '8px' }}>Información del Sistema</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Versión 1.1.0 - Sistema de Gestión "La Tienda"</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sesión actual: {user.name} (@{user.username})</p>
      </div>
    </div>
  );
};

export default Settings;
