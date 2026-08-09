import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Download, Trash2, CheckCircle2, XCircle, Home, Camera, Search, X } from 'lucide-react';

const Products = () => {
  const { authFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  
  const [resultData, setResultData] = useState({ code: '', barcode: '' });

  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');

  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      const res = await authFetch('/products/');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setGenLoading(true);

    try {
      const res = await authFetch('/products/', {
        method: 'POST',
        body: JSON.stringify({ name: newName, price: newPrice, stock: newStock }),
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setResultData({ code: data.code, barcode: data.barcode });
        setShowAddModal(false);
        setNewName('');
        setNewPrice('');
        setNewStock('');
        setShowResultModal(true);
        fetchProducts();
      } else {
        alert(data.message || 'Error generating product');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setGenLoading(false);
    }
  };

  const handleOpenEdit = (product) => {
    setEditCode(product.code);
    setEditName(product.name);
    setEditPrice(product.price);
    setEditStock(product.stock);
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/products/update/', {
        method: 'POST',
        body: JSON.stringify({ code: editCode, name: editName, price: editPrice, stock: editStock }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setShowEditModal(false);
        fetchProducts();
      } else {
        alert(data.message || 'Error updating product');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleToggleProduct = async (code, currentStatus) => {
    const nextStatus = currentStatus === 1 ? 0 : 1;
    const confirmMsg = nextStatus === 0 ? 'Disable this product?' : 'Enable this product?';
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await authFetch('/products/toggle/', {
        method: 'POST',
        body: JSON.stringify({ code, status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        fetchProducts();
      } else {
        alert('Error changing status');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const downloadBarcode = async (code) => {
    try {
      const res = await authFetch(`/products/download-barcode/${code}/`);
      if (!res.ok) throw new Error("Not found");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${code}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error downloading barcode");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', padding: '24px 16px' }}>
      
      {/* Top Header */}
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: 'linear-gradient(135deg, #10b981, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>📦 Products</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage products and inventory levels</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> Add Product
          </button>
          <Link to="/scan-stock" className="btn-success" style={{ textDecoration: 'none' }}>
            <Camera size={18} /> Scan & Add Stock
          </Link>
          <Link to="/index" className="btn-secondary" style={{ textDecoration: 'none' }}>
            <Home size={18} /> Home
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <span style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }}><Search size={18} /></span>
          <input
            type="text"
            placeholder="Search by product name or code..."
            className="custom-input"
            style={{ paddingLeft: '48px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Products Table Panel */}
        <div className="glass-panel animate-fade-in" style={{ padding: '20px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No products found</div>
          ) : (
            <>
              {/* Desktop view */}
              <div className="table-container desktop-only" style={{ margin: 0, border: 'none' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Barcode</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.code} style={{ opacity: p.is_active === 0 ? 0.6 : 1, transition: 'var(--transition)' }}>
                        <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{p.code}</td>
                        <td style={{ fontWeight: '500' }}>{p.name}</td>
                        <td>₹{p.price}</td>
                        <td style={{ fontWeight: '700', color: p.stock <= 5 ? '#f87171' : 'inherit' }}>{p.stock}</td>
                        <td>
                          {p.is_active === 1 ? (
                            <span className="badge badge-success">Active</span>
                          ) : (
                            <span className="badge badge-danger">Disabled</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn-secondary"
                            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                            onClick={() => downloadBarcode(p.code)}
                          >
                            <Download size={15} /> Download
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              className="btn-secondary"
                              style={{ padding: '8px 12px', borderColor: 'rgba(99, 102, 241, 0.25)' }}
                              onClick={() => handleOpenEdit(p)}
                            >
                              <Edit2 size={15} style={{ color: 'var(--accent-color)' }} />
                            </button>
                            <button
                              className={p.is_active === 1 ? 'btn-danger' : 'btn-success'}
                              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                              onClick={() => handleToggleProduct(p.code, p.is_active)}
                            >
                              {p.is_active === 1 ? 'Disable' : 'Enable'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card view */}
              <div className="mobile-only animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredProducts.map((p) => (
                  <div key={p.code} className="glass-card" style={{ opacity: p.is_active === 0 ? 0.6 : 1, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--accent-color)', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>{p.code}</span>
                      {p.is_active === 1 ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-danger">Disabled</span>
                      )}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{p.name}</h4>
                      <div style={{ display: 'flex', gap: '20px', marginTop: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <span>Price: <b style={{ color: 'var(--text-main)' }}>₹{p.price}</b></span>
                        <span>Stock: <b style={{ color: p.stock <= 5 ? '#f87171' : 'var(--text-main)' }}>{p.stock}</b></span>
                      </div>
                    </div>
                    <div style={{ height: '1px', background: 'var(--glass-border)' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '0.85rem', flex: 1, justifyContent: 'center' }}
                        onClick={() => downloadBarcode(p.code)}
                      >
                        <Download size={15} /> Barcode
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ padding: '8px 12px', borderColor: 'rgba(99, 102, 241, 0.25)', display: 'flex', justifyContent: 'center' }}
                        onClick={() => handleOpenEdit(p)}
                      >
                        <Edit2 size={15} style={{ color: 'var(--accent-color)' }} />
                      </button>
                      <button
                        className={p.is_active === 1 ? 'btn-danger' : 'btn-success'}
                        style={{ padding: '8px 16px', fontSize: '0.85rem', flex: 1.5, justifyContent: 'center' }}
                        onClick={() => handleToggleProduct(p.code, p.is_active)}
                      >
                        {p.is_active === 1 ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in">
            <button
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setShowAddModal(false)}
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px' }}>Add Product</h3>
            <form onSubmit={handleAddProduct}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Product Name</label>
                <input
                  type="text"
                  placeholder="Enter name"
                  className="custom-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Price (₹)</label>
                <input
                  type="number"
                  placeholder="Enter price"
                  className="custom-input"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Initial Stock</label>
                <input
                  type="number"
                  placeholder="Enter stock quantity"
                  className="custom-input"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={genLoading}>
                  {genLoading ? 'Generating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in">
            <button
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setShowEditModal(false)}
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px' }}>Edit Product ({editCode})</h3>
            <form onSubmit={handleUpdateProduct}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Product Name</label>
                <input
                  type="text"
                  className="custom-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Price (₹)</label>
                <input
                  type="number"
                  className="custom-input"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Stock Level</label>
                <input
                  type="number"
                  className="custom-input"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Update Details</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Result (Barcode Visual Preview) Modal */}
      {showResultModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in text-center" style={{ maxWidth: '400px' }}>
            <div style={{ color: 'var(--accent-success)', display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <CheckCircle2 size={48} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>Product Created</h3>
            <h4 style={{ fontFamily: 'monospace', fontSize: '1.25rem', marginBottom: '20px', color: 'var(--accent-color)' }}>{resultData.code}</h4>
            
            {resultData.barcode && (
              <div style={{ padding: '16px', background: 'white', borderRadius: '12px', display: 'inline-block', marginBottom: '24px', maxWidth: '100%' }}>
                <img src={resultData.barcode} alt="Barcode" style={{ maxWidth: '280px', height: 'auto', display: 'block' }} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = resultData.barcode;
                  a.download = `${resultData.code}.png`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }}
              >
                <Download size={18} /> Download Barcode Image
              </button>
              <button className="btn-secondary" onClick={() => setShowResultModal(false)}>Close Window</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Products;
