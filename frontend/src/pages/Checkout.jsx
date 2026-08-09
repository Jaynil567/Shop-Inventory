import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Printer, X, Save, ArrowLeft } from 'lucide-react';

const Checkout = () => {
  const { authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [billNo, setBillNo] = useState('...');
  const [saving, setSaving] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // Navigation key index inside modal
  const [modalSelectIdx, setModalSelectIdx] = useState(0); // 0: Print, 1: Skip

  const navigate = useNavigate();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('billData')) || [];
    if (data.length === 0) {
      navigate('/order');
      return;
    }
    setItems(data);

    // Fetch next bill number
    const getBillNo = async () => {
      try {
        const res = await authFetch('/orders/next-bill-no/');
        const json = await res.json();
        if (json.bill_no) {
          setBillNo(json.bill_no);
        }
      } catch (err) {
        console.error(err);
      }
    };
    getBillNo();

    // Modal navigation shortcuts
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        setModalSelectIdx(prev => (prev === 0 ? 1 : 0));
      }
      if (e.key === 'Enter') {
        // If modal is active, trigger select
        const modalEl = document.getElementById('print-modal-box');
        if (modalEl) {
          e.preventDefault();
          if (modalSelectIdx === 0) {
            handlePrintOption(true);
          } else {
            handlePrintOption(false);
          }
        } else if (!saving) {
          e.preventDefault();
          handleSaveBill();
        }
      }
      if (e.key === 'Escape') {
        setShowPrintModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalSelectIdx, saving, items]);

  const handleSaveBill = async () => {
    if (items.length === 0 || saving) return;
    setSaving(true);

    try {
      const res = await authFetch('/orders/save-bill/', {
        method: 'POST',
        body: JSON.stringify({
          bill_no: billNo,
          items: items
        })
      });
      const data = await res.json();
      
      if (res.ok && data.status === 'success') {
        setShowPrintModal(true);
      } else {
        alert('Failed to save bill!');
        setSaving(false);
      }
    } catch (err) {
      alert('Network error while saving bill!');
      setSaving(false);
    }
  };

  const handlePrintOption = (shouldPrint) => {
    setShowPrintModal(false);
    if (shouldPrint) {
      window.print();
    }
    localStorage.removeItem('billData');
    navigate('/order');
  };

  const grandTotal = items.reduce((sum, item) => sum + (item.price * item.count), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', padding: '24px 16px' }}>
      
      <div className="glass-panel no-print" style={{
        maxWidth: '800px',
        margin: '0 auto 24px auto',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Confirm Invoice</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Review and save the transaction</p>
        </div>
        <button className="btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => navigate('/order')} disabled={saving}>
          <ArrowLeft size={16} /> Back to POS
        </button>
      </div>

      {/* Bill Section (Target for printing) */}
      <div id="billSection" className="glass-panel" style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px',
        background: '#ffffff',
        color: '#111827',
        boxShadow: 'var(--shadow-lg)',
        borderRadius: '12px'
      }}>
        
        {/* Invoice Header */}
        <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e3a8a', margin: 0 }}>INVOICE RECEIPT</h1>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '4px' }}>Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Bill No: <span style={{ color: '#ef4444' }}>#{billNo}</span></h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>POS Terminal #1</p>
          </div>
        </div>

        {/* Invoice Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #d1d5db', textAlign: 'left' }}>
              <th style={{ padding: '12px 8px', color: '#374151', fontWeight: '600' }}>#</th>
              <th style={{ padding: '12px 8px', color: '#374151', fontWeight: '600' }}>Code</th>
              <th style={{ padding: '12px 8px', color: '#374151', fontWeight: '600' }}>Product Name</th>
              <th style={{ padding: '12px 8px', color: '#374151', fontWeight: '600', textAlign: 'right' }}>Price</th>
              <th style={{ padding: '12px 8px', color: '#374151', fontWeight: '600', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '12px 8px', color: '#374151', fontWeight: '600', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.code} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 8px', color: '#4b5563' }}>{index + 1}</td>
                <td style={{ padding: '12px 8px', fontFamily: 'monospace', color: '#4b5563' }}>{item.code}</td>
                <td style={{ padding: '12px 8px', fontWeight: '500' }}>{item.name}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#4b5563' }}>₹{item.price}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>{item.count}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>₹{item.price * item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Grand Total Area */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #e5e7eb', paddingTop: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1rem', color: '#4b5563', fontWeight: '500', marginRight: '15px' }}>Grand Total:</span>
            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981' }}>₹{grandTotal}</span>
          </div>
        </div>
      </div>

      {/* Invoice Actions Panel */}
      <div className="glass-panel no-print" style={{
        maxWidth: '800px',
        margin: '24px auto 0 auto',
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'between',
        alignItems: 'center'
      }}>
        <button className="btn-danger" onClick={() => {
          if(window.confirm("Clear current invoice data?")) {
            localStorage.removeItem('billData');
            navigate('/order');
          }
        }} disabled={saving}>
          Clear Invoice
        </button>

        <button className="btn-success" style={{ marginLeft: 'auto', padding: '14px 35px' }} onClick={handleSaveBill} disabled={saving}>
          <Save size={18} /> {saving ? 'Saving transaction...' : 'Save & Print Invoice'}
        </button>
      </div>

      {/* Print Confirmation Modal */}
      {showPrintModal && (
        <div className="modal-overlay no-print" id="print-modal-box">
          <div className="glass-panel modal-content animate-fade-in text-center" style={{ maxWidth: '400px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '10px' }}>Transaction Saved</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>Do you want to print this invoice?</p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className={`btn-success ${modalSelectIdx === 0 ? 'selected-btn' : ''}`}
                style={{ flex: 1, outline: modalSelectIdx === 0 ? '3px solid var(--accent-color)' : 'none' }}
                onClick={() => handlePrintOption(true)}
              >
                <Printer size={16} /> Yes, Print
              </button>
              <button
                className={`btn-secondary ${modalSelectIdx === 1 ? 'selected-btn' : ''}`}
                style={{ flex: 1, outline: modalSelectIdx === 1 ? '3px solid var(--accent-color)' : 'none' }}
                onClick={() => handlePrintOption(false)}
              >
                Skip
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '16px' }}>
              Use <kbd style={{ background: '#1e293b', padding: '2px 4px', borderRadius: '4px' }}>←</kbd> and <kbd style={{ background: '#1e293b', padding: '2px 4px', borderRadius: '4px' }}>→</kbd> keys to choose, then <kbd style={{ background: '#1e293b', padding: '2px 4px', borderRadius: '4px' }}>Enter</kbd>
            </p>
          </div>
        </div>
      )}

      {/* CSS print override styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #billSection, #billSection * {
            visibility: visible;
          }
          #billSection {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Checkout;
