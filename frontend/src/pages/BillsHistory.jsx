import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Receipt, Home, Eye, X, Printer } from 'lucide-react';

const BillsHistory = () => {
  const { authFetch } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedBill, setSelectedBill] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const res = await authFetch('/orders/bills-history/');
        const data = await res.json();
        if (Array.isArray(data)) {
          setBills(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  const handleOpenDetail = (bill) => {
    setSelectedBill(bill);
    setShowDetailModal(true);
  };

  const handlePrintReprint = () => {
    window.print();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', padding: '24px 16px' }}>
      
      {/* Top Header (Hidden on Print) */}
      <div className="glass-panel no-print" style={{
        maxWidth: '1000px',
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
            <span style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🧾 Bills History</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Browse and review previously compiled transactions</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          <Link to="/index" className="btn-secondary" style={{ textDecoration: 'none' }}>
            <Home size={18} /> Home
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Table Content (Hidden on Print) */}
        <div className="glass-panel animate-fade-in no-print" style={{ padding: '20px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading invoices...</div>
          ) : bills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No bills found</div>
          ) : (
            <>
              {/* Desktop view */}
              <div className="table-container desktop-only" style={{ margin: 0, border: 'none' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Bill No</th>
                      <th>Date Created</th>
                      <th>Sales Total</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((b) => (
                      <tr key={b.bill_no}>
                        <td style={{ fontWeight: '700', color: 'var(--accent-warning)' }}>#{b.bill_no}</td>
                        <td>{b.date}</td>
                        <td style={{ fontWeight: '600', color: '#10b981' }}>₹{b.total}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-primary"
                            style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.2)', boxShadow: 'none' }}
                            onClick={() => handleOpenDetail(b)}
                          >
                            <Eye size={14} /> View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {bills.map((b) => (
                  <div key={b.bill_no} className="glass-card" style={{ margin: 0, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '800', color: 'var(--accent-warning)', fontSize: '1.1rem' }}>#{b.bill_no}</span>
                      <span style={{ fontWeight: '700', color: '#10b981', fontSize: '1.1rem' }}>₹{b.total}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Date: <span style={{ color: 'var(--text-main)' }}>{b.date}</span>
                    </div>
                    <button
                      className="btn-primary"
                      style={{ width: '100%', padding: '10px', fontSize: '0.9rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.2)', boxShadow: 'none', justifyContent: 'center' }}
                      onClick={() => handleOpenDetail(b)}
                    >
                      <Eye size={14} /> View Invoice Details
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bill Details Modal */}
      {showDetailModal && selectedBill && (
        <div className="modal-overlay">
          
          {/* Detailed Invoice Box */}
          <div className="glass-panel modal-content animate-fade-in" id="printSection" style={{
            maxWidth: '650px',
            background: '#ffffff',
            color: '#111827',
            padding: '30px',
            borderRadius: '12px'
          }}>
            
            {/* Modal Close Button (Hidden on Print) */}
            <button
              className="no-print"
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer' }}
              onClick={() => setShowDetailModal(false)}
            >
              <X size={20} />
            </button>

            <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '16px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e3a8a', margin: 0 }}>INVOICE DETAILS</h3>
              <div style={{ display: 'flex', justifyContent: 'between', marginTop: '10px', fontSize: '0.85rem', color: '#4b5563' }}>
                <span>Bill Number: <b>#{selectedBill.bill_no}</b></span>
                <span style={{ marginLeft: 'auto' }}>Date: {selectedBill.date}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #d1d5db', textAlign: 'left' }}>
                  <th style={{ padding: '8px 4px', color: '#374151', fontWeight: '600' }}>Item Code</th>
                  <th style={{ padding: '8px 4px', color: '#374151', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '8px 4px', color: '#374151', fontWeight: '600', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '8px 4px', color: '#374151', fontWeight: '600', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '8px 4px', color: '#374151', fontWeight: '600', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedBill.items && selectedBill.items.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 4px', fontFamily: 'monospace', color: '#4b5563' }}>{item.code}</td>
                    <td style={{ padding: '8px 4px', fontWeight: '500' }}>{item.Name}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', color: '#4b5563' }}>₹{item.Price}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: '600' }}>{item.Qty}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: '600' }}>₹{item.Total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1.5px solid #e5e7eb', paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.9rem', color: '#4b5563', marginRight: '10px' }}>Grand Total:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981' }}>₹{selectedBill.total}</span>
              </div>
            </div>

            {/* Action Buttons (Hidden on Print) */}
            <div className="no-print" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" style={{ padding: '10px 18px', fontSize: '0.9rem' }} onClick={() => setShowDetailModal(false)}>Close</button>
              <button className="btn-success" style={{ padding: '10px 20px', fontSize: '0.9rem' }} onClick={handlePrintReprint}>
                <Printer size={16} /> Reprint Invoice
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Printing stylesheet overrides */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body * {
            visibility: hidden;
          }
          #printSection, #printSection * {
            visibility: visible;
          }
          #printSection {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            box-shadow: none;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BillsHistory;
