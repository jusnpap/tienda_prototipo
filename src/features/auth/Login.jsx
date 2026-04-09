import React, { useState } from 'react';
import { dbRequest } from '../../lib/db';
import { LogIn, Store, ShieldAlert, User, Lock } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await dbRequest('users', 'get', username);
      
      if (!user || user.password !== password) {
        setError('Usuario o contraseña incorrectos');
      } else if (user.status !== 'active') {
        setError('Tu cuenta ha sido desactivada. Contacta al dueño.');
      } else {
        onLogin(user);
      }
    } catch (err) {
      setError('Error al conectar con la base de datos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a)' 
    }}>
      <div className="card animate-fade-in" style={{ width: '400px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <div className="grid" style={{ gap: '32px', textAlign: 'center' }}>
          <div className="grid" style={{ gap: '12px', justifyContent: 'center' }}>
            <div style={{ background: 'var(--primary-color)', padding: '12px', borderRadius: '16px', color: 'white', width: 'fit-content', margin: '0 auto' }}>
              <Store size={40} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>La Tienda</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="grid" style={{ gap: '20px', textAlign: 'left' }}>
            {error && (
              <div className="flex badge badge-danger" style={{ padding: '12px', borderRadius: '8px', gap: '8px' }}>
                <ShieldAlert size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid" style={{ gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Usuario</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input 
                  required
                  style={{ width: '100%', paddingLeft: '40px' }}
                  placeholder="admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="grid" style={{ gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input 
                  required
                  type="password"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', padding: '14px', marginTop: '12px', fontSize: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Cargando...' : <><LogIn size={20} /> Entrar al Sistema</>}
            </button>
          </form>

          <footer style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            &copy; 2026 Sistema "La Tienda" v1.1
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;
