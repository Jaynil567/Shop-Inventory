import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, Trash2, Save, Scan, Plus, Minus, Check, AlertCircle } from 'lucide-react';

const BatchScan = () => {
  const { authFetch } = useAuth();
  const [validProducts, setValidProducts] = useState(new Map());
  const [scannedList, setScannedList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scanner status
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('Camera initialization...');
  const qrScannerRef = useRef(null);

  // Toast notifications
  const [toastMsg, setToastMsg] = useState('');
  const [toastActive, setToastActive] = useState(false);

  // Audio references
  const beepRef = useRef(null);
  const errorSoundRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    beepRef.current = new Audio('/beep.mp3');
    errorSoundRef.current = new Audio('/error.mp3');

    // Load list of all active products for scanner validation
    const loadProducts = async () => {
      try {
        const res = await authFetch('/products/get-all/');
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.products)) {
          const map = new Map();
          data.products.forEach(p => {
            map.set(p.code.toUpperCase(), p.name);
          });
          setValidProducts(map);
        }
      } catch (err) {
        console.error("Error loading products mapping:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();

    // Start scanner on load
    startScanner();

    // Setup global keyboard event scanner capture (simulation like in Flask template)
    setupKeyboardScan();

    return () => {
      stopScanner();
    };
  }, []);

  const playBeep = () => {
    if (beepRef.current) {
      beepRef.current.currentTime = 0;
      beepRef.current.play().catch(err => {});
    }
  };

  const playError = () => {
    if (errorSoundRef.current) {
      errorSoundRef.current.currentTime = 0;
      errorSoundRef.current.play().catch(err => {});
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastActive(true);
    setTimeout(() => {
      setToastActive(false);
    }, 1600);
  };

  const addScannedCode = (code) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    const isValid = validProducts.has(cleanCode);
    
    if (isValid) {
      playBeep();
      setScannedList((prevList) => {
        const idx = prevList.findIndex(item => item.code === cleanCode && item.isValid);
        if (idx !== -1) {
          const updated = [...prevList];
          updated[idx].quantity += 1;
          return updated;
        } else {
          return [...prevList, {
            code: cleanCode,
            name: validProducts.get(cleanCode),
            quantity: 1,
            isValid: true
          }];
        }
      });
    } else {
      playError();
      showToast(`Unknown code: ${cleanCode}`);
      setScannedList((prevList) => {
        const idx = prevList.findIndex(item => item.code === cleanCode && !item.isValid);
        if (idx !== -1) {
          return prevList; // avoid duplicates for errors
        } else {
          return [...prevList, {
            code: cleanCode,
            name: '❌ Unknown Product',
            quantity: 0,
            isValid: false
          }];
        }
      });
    }
  };

  const changeQty = (index, delta) => {
    setScannedList((prevList) => {
      return prevList.map((item, idx) => {
        if (idx === index && item.isValid) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: newQty >= 0 ? newQty : 0 };
        }
        return item;
      });
    });
  };

  const setQtyVal = (index, val) => {
    const num = parseInt(val) || 0;
    setScannedList((prevList) => {
      return prevList.map((item, idx) => {
        if (idx === index && item.isValid) {
          return { ...item, quantity: num >= 0 ? num : 0 };
        }
        return item;
      });
    });
  };

  const removeRow = (index) => {
    setScannedList((prevList) => prevList.filter((_, idx) => idx !== index));
  };

  const clearAll = () => {
    if (window.confirm("Clear all scanned products?")) {
      setScannedList([]);
    }
  };

  const submitBatchUpdate = async () => {
    const validItems = scannedList.filter(item => item.isValid && item.quantity > 0);
    if (validItems.length === 0) {
      alert("No valid products to update!");
      return;
    }

    try {
      const res = await authFetch('/products/batch-stock-increment/', {
        method: 'POST',
        body: JSON.stringify({ products: validItems })
      });
      const data = await res.json();
      
      if (res.ok && data.status === 'success') {
        const totalStock = validItems.reduce((sum, item) => sum + item.quantity, 0);
        alert(`✅ Stock Updated!\n\n📦 ${data.updated} products\n📈 Total +${totalStock} stock`);
        setScannedList([]);
        playBeep();
      } else {
        alert("Error saving updates: " + (data.message || 'Server error'));
        playError();
      }
    } catch (err) {
      alert("Network error!");
      playError();
    }
  };

  // Keyboard Scanner buffer listener (for physical barcode scanners)
  const setupKeyboardScan = () => {
    let buffer = "";
    let lastTime = Date.now();

    const handleKey = (e) => {
      const now = Date.now();
      
      // physical scanners write extremely fast (usually <50ms between keys)
      if (now - lastTime > 100) {
        buffer = "";
      }
      lastTime = now;

      if (e.key === 'Enter') {
        if (buffer.length > 2) {
          addScannedCode(buffer);
          buffer = "";
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  };

  const startScanner = async () => {
    setScannerActive(true);
    setScannerStatus("Activating camera...");

    setTimeout(async () => {
      try {
        const qrScanner = new Html5Qrcode("batch-reader");
        qrScannerRef.current = qrScanner;

        let lastScanned = "";
        let lock = false;

        await qrScanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 320, height: 120 } }, // barcode size rectangle
          (decodedText) => {
            if (lock) return;
            if (decodedText === lastScanned) return;

            lock = true;
            lastScanned = decodedText;

            addScannedCode(decodedText);

            if (navigator.vibrate) navigator.vibrate(100);

            setTimeout(() => {
              lock = false;
              lastScanned = "";
            }, 1200);
          },
          (errorMessage) => {}
        );
        setScannerStatus("Scanner active. Scan barcodes sequentially.");
      } catch (err) {
        console.error(err);
        setScannerStatus("Camera failed to load.");
      }
    }, 100);
  };

  const stopScanner = () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      qrScannerRef.current.stop().then(() => {
        setScannerActive(false);
        qrScannerRef.current = null;
      }).catch(err => console.error(err));
    } else {
      setScannerActive(false);
    }
  };

  const validCount = scannedList.filter(p => p.isValid).length;
  const totalQty = scannedList.reduce((sum, p) => sum + (p.isValid ? p.quantity : 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', padding: '24px 16px 100px 16px' }}>
      
      {/* Navbar Panel */}
      <div className="glass-panel" style={{
        maxWidth: '700px',
        margin: '0 auto 24px auto',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scan size={20} style={{ color: 'var(--accent-color)' }} /> Batch Stock Add
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scan items to bulk update active stock</p>
        </div>
        <button className="btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => navigate('/index')}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        {/* Scanner Feed Panel */}
        <div className="glass-panel animate-fade-in" style={{ padding: '16px', marginBottom: '20px' }}>
          {scannerActive ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>{scannerStatus}</span>
                <button type="button" className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={stopScanner}>Pause</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div id="batch-reader" style={{ width: '100%', height: '180px', background: 'black', borderRadius: '8px', overflow: 'hidden' }}></div>
              </div>
            </div>
          ) : (
            <button type="button" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={startScanner}>
              <Scan size={18} /> Resume Camera Scanner
            </button>
          )}
        </div>

        {/* Loaded Stats Alert */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          color: '#c084fc',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px'
        }}>
          <Check size={16} /> {loading ? 'Loading catalog products...' : `Catalog products synced: ${validProducts.size}`}
        </div>

        {/* Scanned List Panel */}
        <div className="glass-panel animate-fade-in" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '16px' }}>
            <span style={{ fontWeight: '700' }}>Scanned Products</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              <b>{validCount}</b> items | Total Stock Delta: <b>+{totalQty}</b>
            </span>
          </div>

          {scannedList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <Scan size={40} style={{ opacity: 0.25, marginBottom: '12px' }} />
              <p>Scan barcodes sequentially using a handheld scanner or camera feed</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
              {scannedList.map((item, index) => (
                <div key={index} className="glass-card batch-scanned-card" style={{
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'between',
                  alignItems: 'center',
                  borderLeft: `4px solid ${item.isValid ? '#10b981' : '#ef4444'}`,
                  background: 'rgba(255, 255, 255, 0.01)',
                  margin: 0,
                  position: 'relative'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{item.name}</div>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>{item.code}</span>
                  </div>
                  
                  {item.isValid ? (
                    <div className="qty-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button className="btn-secondary" style={{ padding: '4px 8px', borderRadius: '6px' }} onClick={() => changeQty(index, -1)}>
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          className="custom-input"
                          style={{ width: '60px', padding: '6px', textAlign: 'center', fontSize: '0.85rem' }}
                          value={item.quantity}
                          onChange={(e) => setQtyVal(index, e.target.value)}
                          min="0"
                        />
                        <button className="btn-secondary" style={{ padding: '4px 8px', borderRadius: '6px' }} onClick={() => changeQty(index, 1)}>
                          <Plus size={12} />
                        </button>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', minWidth: '65px', textAlign: 'right' }}>+{item.quantity} stock</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-danger)' }}>Not in database</span>
                  )}

                  <button className="remove-btn btn-secondary" style={{ padding: '8px', border: 'none', marginLeft: '15px' }} onClick={() => removeRow(index)}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Save Actions Bar at the bottom */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px',
        background: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid var(--glass-border)',
        zIndex: 100
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', gap: '16px' }}>
          <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={clearAll} disabled={scannedList.length === 0}>
            <Trash2 size={16} /> Clear List
          </button>
          <button className="btn-success" style={{ flex: 2, justifyContent: 'center' }} onClick={submitBatchUpdate} disabled={scannedList.length === 0}>
            <Save size={16} /> Save Stock Update
          </button>
        </div>
      </div>

      {/* Invalid Toast Alert */}
      {toastActive && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--accent-danger)',
          color: 'white',
          padding: '14px 20px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <AlertCircle size={18} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Invalid Barcode!</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{toastMsg}</div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BatchScan;
