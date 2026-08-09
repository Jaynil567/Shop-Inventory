import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';
import { Home, RefreshCw, Camera, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';

const Order = () => {
  const { authFetch } = useAuth();
  const [productsMap, setProductsMap] = useState({});
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [syncing, setSyncing] = useState(false);
  
  // Scanner states
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('');
  const qrScannerRef = useRef(null);

  const navigate = useNavigate();

  // Audio effects
  const beepRef = useRef(null);
  const errorSoundRef = useRef(null);

  useEffect(() => {
    beepRef.current = new Audio('/beep.mp3');
    errorSoundRef.current = new Audio('/error.mp3');

    // Load active products for scanning map validation
    const loadProducts = async () => {
      try {
        const res = await authFetch('/products/get-all/');
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.products)) {
          const map = {};
          data.products.forEach(p => {
            map[p.code.toUpperCase()] = {
              name: p.name,
              price: p.price,
              stock: p.stock
            };
          });
          setProductsMap(map);
        }
      } catch (err) {
        console.error("Error loading products mapping:", err);
      }
    };
    loadProducts();

    // Focus input on load
    const inputField = document.getElementById('barcode-field');
    if (inputField) inputField.focus();

    // Keyboard shortcuts (Ctrl + Enter to Checkout)
    const handleKeyDown = (e) => {
      if ((e.ctrlKey && e.key === 'Enter') || (e.ctrlKey && (e.key === 's' || e.key === 'S'))) {
        e.preventDefault();
        goToBill();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup scanner on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
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

  const addBarcodeItem = (code) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    const product = productsMap[cleanCode];
    if (!product) {
      playError();
      alert(`Product code "${cleanCode}" not found!`);
      setBarcodeInput('');
      return;
    }

    playBeep();
    setCart((prevCart) => {
      const idx = prevCart.findIndex(item => item.code === cleanCode);
      if (idx !== -1) {
        const updated = [...prevCart];
        updated[idx].count += 1;
        return updated;
      } else {
        return [...prevCart, {
          code: cleanCode,
          name: product.name,
          price: product.price,
          stock: product.stock,
          count: 1
        }];
      }
    });

    setBarcodeInput('');
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    addBarcodeItem(barcodeInput);
  };

  const updateCount = (code, delta) => {
    setCart((prevCart) => {
      return prevCart.map(item => {
        if (item.code === code) {
          const newCount = item.count + delta;
          return newCount >= 1 ? { ...item, count: newCount } : item;
        }
        return item;
      });
    });
  };

  const setCount = (code, val) => {
    const num = parseInt(val) || 1;
    setCart((prevCart) => {
      return prevCart.map(item => {
        if (item.code === code) {
          return { ...item, count: num >= 1 ? num : 1 };
        }
        return item;
      });
    });
  };

  const deleteRow = (code) => {
    setCart((prevCart) => prevCart.filter(item => item.code !== code));
  };

  const syncProducts = async () => {
    setSyncing(true);
    try {
      const res = await authFetch('/products/get-all/');
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.products)) {
        const map = {};
        data.products.forEach(p => {
          map[p.code.toUpperCase()] = {
            name: p.name,
            price: p.price,
            stock: p.stock
          };
        });
        setProductsMap(map);
        alert("Products Synced ✅");
      }
    } catch (err) {
      alert("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const goToBill = () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }
    localStorage.setItem("billData", JSON.stringify(cart));
    navigate("/bill");
  };

  // Camera scanner handlers
  const startScanner = async () => {
    setScannerActive(true);
    setScannerStatus("Starting camera...");

    // Wait for the render element to load
    setTimeout(async () => {
      try {
        const qrScanner = new Html5Qrcode("reader");
        qrScannerRef.current = qrScanner;

        let lastScanned = "";
        let lock = false;

        await qrScanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (lock) return;
            if (decodedText === lastScanned) return;

            lock = true;
            lastScanned = decodedText;

            addBarcodeItem(decodedText);
            
            // Haptic feedback if supported
            if (navigator.vibrate) navigator.vibrate(100);

            setTimeout(() => {
              lock = false;
              lastScanned = "";
            }, 1200);
          },
          (errorMessage) => {}
        );
        setScannerStatus("Camera active. Align barcode inside scanner frame.");
      } catch (err) {
        console.error(err);
        setScannerStatus("Failed to start camera feed.");
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

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', padding: '24px 16px' }}>
      
      {/* Navbar Panel */}
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
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🛒 New Order POS</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Scan products and compile checkout invoices</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          <button className="btn-secondary" onClick={syncProducts} disabled={syncing}>
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Sync Products'}
          </button>
          <Link to="/index" className="btn-secondary" style={{ textDecoration: 'none' }}>
            <Home size={18} /> Home
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }} className="pos-layout">
          
          {/* Billing Console Panel */}
          <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={20} /> Cart Contents
            </h3>

            {/* Input scanning area */}
            <form onSubmit={handleInputSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <input
                id="barcode-field"
                type="text"
                placeholder="Scan or enter product barcode code..."
                className="custom-input"
                style={{ textTransform: 'uppercase' }}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
              />
              <button type="submit" className="btn-primary" style={{ padding: '14px 28px' }}>Add</button>
            </form>

            {/* Camera Frame Area */}
            {scannerActive ? (
              <div style={{ marginBottom: '24px', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '16px', background: 'rgba(0,0,0,0.3)', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>{scannerStatus}</span>
                  <button type="button" className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={stopScanner}>Stop Camera</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div id="reader" style={{ width: '100%', maxWidth: '350px', height: '250px', background: 'black', borderRadius: '8px', overflow: 'hidden' }}></div>
                </div>
              </div>
            ) : (
              <button type="button" className="btn-secondary" style={{ width: '100%', marginBottom: '20px', display: 'flex', justifyContent: 'center' }} onClick={startScanner}>
                <Camera size={18} /> Enable Camera Barcode Scanner
              </button>
            )}

            {/* Scanned Items Table */}
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <ShoppingBag size={48} style={{ opacity: 0.25, marginBottom: '12px' }} />
                <p>Scan barcodes or type product codes to build checkout</p>
              </div>
            ) : (
            <>
              {/* Desktop view */}
              <div className="table-container desktop-only" style={{ margin: 0 }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Code</th>
                      <th>Product Name</th>
                      <th>Price</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th>Stock</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, index) => (
                      <tr key={item.code}>
                        <td>{index + 1}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{item.code}</td>
                        <td style={{ fontWeight: '500' }}>{item.name}</td>
                        <td>₹{item.price}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <button type="button" className="btn-secondary" style={{ padding: '4px 8px', borderRadius: '6px' }} onClick={() => updateCount(item.code, -1)}>
                              <Minus size={12} />
                            </button>
                            <input
                              type="number"
                              className="custom-input"
                              style={{ width: '60px', padding: '6px', textAlign: 'center', fontSize: '0.9rem' }}
                              value={item.count}
                              onChange={(e) => setCount(item.code, e.target.value)}
                              min="1"
                            />
                            <button type="button" className="btn-secondary" style={{ padding: '4px 8px', borderRadius: '6px' }} onClick={() => updateCount(item.code, 1)}>
                              <Plus size={12} />
                            </button>
                          </div>
                        </td>
                        <td style={{ fontWeight: '600' }}>{item.stock}</td>
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{item.price * item.count}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button type="button" className="btn-secondary" style={{ padding: '8px 10px', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={() => deleteRow(item.code)}>
                            <Trash2 size={14} style={{ color: 'var(--accent-danger)' }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="mobile-only animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cart.map((item, index) => (
                  <div key={item.code} className="glass-card" style={{ padding: '14px 16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-muted)' }}>#{index + 1} | <span style={{ fontFamily: 'monospace', color: 'var(--accent-color)' }}>{item.code}</span></span>
                      <button type="button" className="btn-secondary" style={{ padding: '6px 8px', borderColor: 'rgba(239, 68, 68, 0.2)', height: '28px', width: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => deleteRow(item.code)}>
                        <Trash2 size={12} style={{ color: 'var(--accent-danger)' }} />
                      </button>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '600' }}>{item.name}</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span>Price: <b style={{ color: 'var(--text-main)' }}>₹{item.price}</b></span>
                        <span>Stock: <b style={{ color: 'var(--text-main)' }}>{item.stock}</b></span>
                      </div>
                    </div>
                    <div style={{ height: '1px', background: 'var(--glass-border)' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button type="button" className="btn-secondary" style={{ padding: '4px 8px', borderRadius: '6px' }} onClick={() => updateCount(item.code, -1)}>
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          className="custom-input"
                          style={{ width: '55px', padding: '4px', textAlign: 'center', fontSize: '0.85rem' }}
                          value={item.count}
                          onChange={(e) => setCount(item.code, e.target.value)}
                          min="1"
                        />
                        <button type="button" className="btn-secondary" style={{ padding: '4px 8px', borderRadius: '6px' }} onClick={() => updateCount(item.code, 1)}>
                          <Plus size={12} />
                        </button>
                      </div>
                      <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Total: ₹{item.price * item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
            )}
          </div>

          {/* Quick Invoice Overview Side-Panel */}
          <div className="glass-panel animate-fade-in" style={{ padding: '24px', height: 'fit-content', animationDelay: '0.1s' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px' }}>Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'between', color: 'var(--text-muted)' }}>
                <span>Total Items:</span>
                <span style={{ fontWeight: '600', color: 'var(--text-main)', marginLeft: 'auto' }}>{cart.reduce((sum, item) => sum + item.count, 0)}</span>
              </div>
              <div style={{ height: '1px', background: 'var(--glass-border)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'between', fontSize: '1.25rem' }}>
                <span>Grand Total:</span>
                <span style={{ fontWeight: '800', color: 'var(--accent-success)', marginLeft: 'auto' }}>₹{cart.reduce((sum, item) => sum + (item.price * item.count), 0)}</span>
              </div>
            </div>

            <button type="button" className="btn-success" style={{ width: '100%', justifyContent: 'center' }} onClick={goToBill}>
              Proceed to Bill
            </button>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
              Shortcut: press <kbd style={{ background: '#1e293b', padding: '2px 4px', borderRadius: '4px', fontFamily: 'monospace' }}>Ctrl+Enter</kbd> to invoice
            </p>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 992px) {
          .pos-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Order;
