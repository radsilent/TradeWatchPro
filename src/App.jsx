/**
 * TradeWatch - Global Trade Intelligence Platform
 * © 2025 VectorStream Systems - Patent Pending
 * All Rights Reserved
 */

import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [mode, setMode] = useState('production'); // 'production' or 'diagnostic'
  const [step, setStep] = useState(1);
  const [ToasterComponent, setToasterComponent] = useState(null);
  const [PagesComponent, setPagesComponent] = useState(null);
  const [error, setError] = useState(null);
  
  // Try to load the full app directly
  useEffect(() => {
    if (mode === 'production') {
      const loadFullApp = async () => {
        try {
          console.log('Loading Toaster component...');
          const toasterModule = await import("@/components/ui/toaster");
          console.log('Toaster loaded successfully');
          
          console.log('Loading Pages component...');
          const pagesModule = await import("@/pages/index.jsx");
          console.log('Pages loaded successfully');
          
          setToasterComponent(() => toasterModule.Toaster);
          setPagesComponent(() => pagesModule.default);
          setError(null);
          console.log('Full app loaded successfully!');
        } catch (err) {
          console.error('Full app failed to load:', err);
          setError(err);
          // Don't automatically switch to diagnostic - let user see the error
        }
      };
      loadFullApp();
    }
  }, [mode]);
  
  // Load components when step changes - hooks must be at top level (for diagnostic mode)
  useEffect(() => {
    if (mode === 'diagnostic' && step === 2 && !ToasterComponent) {
      const loadToaster = async () => {
        try {
          const module = await import("@/components/ui/toaster");
          setToasterComponent(() => module.Toaster);
          setError(null);
        } catch (err) {
          setError(err);
        }
      };
      loadToaster();
    }
  }, [mode, step, ToasterComponent]);

  useEffect(() => {
    if (mode === 'diagnostic' && step === 3 && !PagesComponent) {
      const loadPages = async () => {
        try {
          const module = await import("@/pages/index.jsx");
          setPagesComponent(() => module.default);
          setError(null);
        } catch (err) {
          setError(err);
        }
      };
      loadPages();
    }
  }, [mode, step, PagesComponent]);

  // Production mode - try to load full app
  if (mode === 'production') {
    if (error) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fee', color: 'red' }}>
          <h1>App Loading Error</h1>
          <p><strong>Error:</strong> {error.message}</p>
          <p>Switching to diagnostic mode...</p>
          <div style={{ marginTop: '15px' }}>
            <button 
              onClick={() => setMode('diagnostic')}
              style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px' }}
            >
              Enter Diagnostic Mode
            </button>
            <button 
              onClick={() => { setError(null); setMode('production'); }}
              style={{ padding: '10px 20px', fontSize: '16px' }}
            >
              Retry Full App
            </button>
          </div>
        </div>
      );
    }

    if (!PagesComponent || !ToasterComponent) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#1e293b', color: 'white', textAlign: 'center' }}>
          <h1>TradeWatch</h1>
          <p>Loading maritime intelligence platform...</p>
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>...</div>
          </div>
        </div>
      );
    }

    // Full app loaded successfully
    return (
      <div style={{ position: 'relative' }}>
        <div style={{ 
          position: 'fixed', 
          top: '10px', 
          right: '10px', 
          zIndex: 9999,
          fontSize: '12px'
        }}>
          <button 
            onClick={() => setMode('diagnostic')}
            style={{ 
              padding: '5px 10px', 
              fontSize: '11px',
              backgroundColor: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Debug
          </button>
        </div>
        <PagesComponent />
        <ToasterComponent />
      </div>
    );
  }
  
  // Render based on current step
  if (step === 1) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#1e293b', minHeight: '100vh', color: 'white' }}>
        <h1>TradeWatch Loading Diagnostics</h1>
        <p>Step 1: Basic React + CSS OK</p>
        <button 
          onClick={() => setStep(2)}
          style={{ padding: '10px', fontSize: '16px', marginTop: '10px' }}
        >
          Load UI Components →
        </button>
      </div>
    );
  }
  
  if (step === 2) {
    if (error) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fee', color: 'red' }}>
          <h1>UI Components Error</h1>
          <p>{error.message}</p>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>{error.stack}</pre>
          <button onClick={() => { setStep(1); setError(null); }}>← Back</button>
        </div>
      );
    }

    if (!ToasterComponent) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#1e293b', minHeight: '100vh', color: 'white' }}>
          <h1>Loading UI Components...</h1>
          <p>Please wait...</p>
        </div>
      );
    }

    return (
      <div style={{ padding: '20px', backgroundColor: '#1e293b', minHeight: '100vh', color: 'white' }}>
        <h1>TradeWatch Loading Diagnostics</h1>
        <p>Step 1: Basic React + CSS OK</p>
        <p>Step 2: UI Components OK</p>
        <button 
          onClick={() => setStep(3)}
          style={{ padding: '10px', fontSize: '16px', marginTop: '10px' }}
        >
          Load Routing →
        </button>
        <ToasterComponent />
      </div>
    );
  }
  
  if (step === 3) {
    if (error) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fee', color: 'red' }}>
          <h1>Pages/Routing Error</h1>
          <p>{error.message}</p>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>{error.stack}</pre>
          <button onClick={() => { setStep(2); setError(null); }}>← Back to UI Test</button>
        </div>
      );
    }

    if (!PagesComponent || !ToasterComponent) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#1e293b', minHeight: '100vh', color: 'white' }}>
          <h1>Loading Full App...</h1>
          <p>Please wait...</p>
        </div>
      );
    }

    return (
      <div style={{ backgroundColor: '#1e293b', minHeight: '100vh' }}>
        <div style={{ padding: '20px', color: 'white', borderBottom: '1px solid #334155' }}>
          <h2>TradeWatch Fully Loaded</h2>
          <button 
            onClick={() => setStep(2)}
            style={{ padding: '5px 10px', fontSize: '14px' }}
          >
            ← Diagnostics Mode
          </button>
        </div>
        <PagesComponent />
        <ToasterComponent />
      </div>
    );
  }

  return null;
}

export default App 