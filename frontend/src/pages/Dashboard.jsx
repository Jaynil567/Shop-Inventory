import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Package, Receipt, Scan, User, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user, logout, authFetch } = useAuth();
  const [stats, setStats] = useState({ products: 0, bills: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const prodRes = await authFetch('/products/');
        const products = await prodRes.json();
        
        const billRes = await authFetch('/orders/bills-history/');
        const bills = await billRes.json();
        
        let totalRevenue = 0;
        if (Array.isArray(bills)) {
          totalRevenue = bills.reduce((sum, b) => sum + (b.total || 0), 0);
        }

        setStats({
          products: Array.isArray(products) ? products.length : 0,
          bills: Array.isArray(bills) ? bills.length : 0,
          revenue: totalRevenue
        });
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const firstLetter = user?.name ? user.name[0].toUpperCase() : 'U';

  const menuItems = [
    {
      title: 'New Order',
      desc: 'Scan products & generate bill',
      icon: <ShoppingCart size={28} />,
      link: '/order',
      color: '#6366f1',
    },
    {
      title: 'Products Manager',
      desc: 'Manage products & stock level',
      icon: <Package size={28} />,
      link: '/products',
      color: '#10b981',
    },
    {
      title: 'Bills History',
      desc: 'View & reprint invoice records',
      icon: <Receipt size={28} />,
      link: '/bills',
      color: '#f59e0b',
    },
    {
      title: 'Batch Scan Stock',
      desc: 'Scan barcodes to add stock levels',
      icon: <Scan size={28} />,
      link: '/scan-stock',
      color: '#ec4899',
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', padding: '24px 16px' }}>
      
      {/* Top Navbar */}
      <div className="glass-panel" style={{
        maxWidth: '1200px',
        margin: '0 auto 30px auto',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Inventory Dashboard</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Store Management System</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: 'auto' }}>
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              color: 'white',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)'
            }}>
              {firstLetter}
            </div>
            <span style={{ fontWeight: '500', fontSize: '0.95rem' }} className="profile-name-text">{user?.name}</span>
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }} className="stats-grid">
          <div className="glass-panel text-center animate-fade-in" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: '0.05', color: '#6366f1' }}><Package size={100} /></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Products</p>
            <h3 style={{ fontSize: '2.25rem', fontWeight: '800' }}>{loading ? '...' : stats.products}</h3>
          </div>

          <div className="glass-panel text-center animate-fade-in" style={{ padding: '24px', position: 'relative', overflow: 'hidden', animationDelay: '0.1s' }}>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: '0.05', color: '#f59e0b' }}><Receipt size={100} /></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Invoices Created</p>
            <h3 style={{ fontSize: '2.25rem', fontWeight: '800' }}>{loading ? '...' : stats.bills}</h3>
          </div>

          <div className="glass-panel text-center animate-fade-in" style={{ padding: '24px', position: 'relative', overflow: 'hidden', animationDelay: '0.2s' }}>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: '0.05', color: '#10b981' }}><TrendingUp size={100} /></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Revenue</p>
            <h3 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#10b981' }}>{loading ? '...' : `₹${stats.revenue.toLocaleString()}`}</h3>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }} className="menu-grid">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className="glass-panel animate-fade-in"
              style={{
                padding: '30px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                transition: 'var(--transition)',
                borderLeft: `4px solid ${item.color}`,
                animationDelay: `${index * 0.1}s`
              }}
              onClick={() => navigate(item.link)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.4)';
                e.currentTarget.style.background = 'rgba(30, 41, 66, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                e.currentTarget.style.background = 'var(--glass-bg)';
              }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: `rgba(${item.color === '#6366f1' ? '99, 102, 241' : item.color === '#10b981' ? '16, 185, 129' : item.color === '#f59e0b' ? '245, 158, 11' : '236, 72, 153'}, 0.15)`,
                color: item.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 15px rgba(${item.color === '#6366f1' ? '99, 102, 241' : item.color === '#10b981' ? '16, 185, 129' : item.color === '#f59e0b' ? '245, 158, 11' : '236, 72, 153'}, 0.2)`
              }}>
                {item.icon}
              </div>
              <div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '4px' }}>{item.title}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
            gap: 15px !important;
          }
          .menu-grid {
            grid-template-columns: 1fr !important;
            gap: 15px !important;
          }
          .profile-name-text {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
