import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Order from './pages/Order';
import Checkout from './pages/Checkout';
import BillsHistory from './pages/BillsHistory';
import BatchScan from './pages/BatchScan';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const HomeRoute = () => {
  const { token } = useAuth();
  if (token) return <Navigate to="/index" replace />;
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0b0f19 0%, #111827 100%)',
      padding: '20px'
    }}>
      <div className="glass-panel text-center animate-fade-in" style={{ padding: '50px 40px', maxWidth: '400px', width: '100%' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Inventory POS</h1>
        <p style={{ color: '#9ca3af', marginBottom: '30px', fontSize: '1.05rem' }}>Manage products, scanning & billing instantly</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <a href="/login" className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>Login to Account</a>
          <a href="/signup" className="btn-secondary" style={{ textDecoration: 'none', justifyContent: 'center' }}>Create New Account</a>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route path="/index" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />
          
          <Route path="/order" element={
            <ProtectedRoute>
              <Order />
            </ProtectedRoute>
          } />
          
          <Route path="/bill" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          
          <Route path="/bills" element={
            <ProtectedRoute>
              <BillsHistory />
            </ProtectedRoute>
          } />
          
          <Route path="/scan-stock" element={
            <ProtectedRoute>
              <BatchScan />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
