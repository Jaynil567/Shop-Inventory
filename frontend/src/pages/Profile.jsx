import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, User, Phone, X, AlertTriangle } from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const firstLetter = user?.name ? user.name[0].toUpperCase() : 'U';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0b0f19 0%, #111827 100%)',
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in text-center" style={{ padding: '40px', width: '100%', maxWidth: '380px' }}>
        
        {/* Profile Logo Avatar */}
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.25rem',
          fontWeight: '800',
          color: 'white',
          margin: '0 auto 20px auto',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.45)',
          border: '2px solid rgba(255, 255, 255, 0.1)'
        }}>
          {firstLetter}
        </div>

        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '4px' }}>{user?.name}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '30px' }}>Active POS Operator</p>

        {/* User parameters list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', marginBottom: '30px' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', margin: 0 }}>
            <User size={16} style={{ color: 'var(--accent-color)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Display Name</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{user?.name}</div>
            </div>
          </div>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', margin: 0 }}>
            <Phone size={16} style={{ color: 'var(--accent-success)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Mobile</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{user?.mobile}</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/index')}>
            <Home size={18} /> Back to Dashboard
          </button>
          <button className="btn-danger" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowLogoutModal(true)}>
            <LogOut size={18} /> Close Session (Logout)
          </button>
        </div>

      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in text-center" style={{ maxWidth: '380px' }}>
            <div style={{ color: 'var(--accent-danger)', display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <AlertTriangle size={48} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>Confirm Logout</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>Are you sure you want to terminate your active workspace session?</p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={handleLogout}>
                Yes, Logout
              </button>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
