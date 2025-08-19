import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          backgroundColor: '#fee', 
          border: '5px solid #f00', 
          margin: '20px',
          fontSize: '18px',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1 style={{ color: '#d00', fontSize: '32px' }}>Error Detected</h1>
          <p style={{ color: '#900', fontSize: '20px', fontWeight: 'bold' }}>
            {this.state.error?.message || 'Unknown error occurred'}
          </p>
          <pre style={{ 
            backgroundColor: '#f9f9f9', 
            padding: '15px', 
            border: '1px solid #ccc',
            fontSize: '14px',
            overflow: 'auto'
          }}>
            {this.state.error?.stack || 'No stack trace available'}
          </pre>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#007cba',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '15px'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
) 