import { useState } from 'react'
import ManualForm from './components/ManualForm'
import CSVUpload from './components/CSVUpload'

function App() {
  const [activeTab, setActiveTab] = useState('manual')

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* Tag */}
      <div style={{
        display: 'inline-block',
        fontFamily: "'Space Mono', monospace",
        fontSize: '11px',
        color: '#7c6af7',
        border: '1px solid #7c6af7',
        padding: '3px 10px',
        borderRadius: '2px',
        letterSpacing: '0.1em',
        marginBottom: '16px'
      }}>
        NASA JM1 · XGBoost
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: '44px',
        fontWeight: '700',
        letterSpacing: '-0.02em',
        marginBottom: '10px',
        lineHeight: 1.1
      }}>
        Bug<span style={{ color: '#7c6af7' }}>.</span>Predict
      </h1>

      <p style={{
        color: '#6b6b80',
        fontSize: '15px',
        fontWeight: '300',
        marginBottom: '40px'
      }}>
        Software defect prediction using Halstead & McCabe metrics
      </p>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '28px',
        borderBottom: '1px solid #2a2a3a'
      }}>
        {['manual', 'csv'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '12px',
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '0.05em',
              color: activeTab === tab ? '#7c6af7' : '#6b6b80',
              borderBottom: activeTab === tab ? '2px solid #7c6af7' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'all 0.2s'
            }}>
            {tab === 'manual' ? 'Manual Input' : 'CSV Upload'}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'manual' && <ManualForm />}
      {activeTab === 'csv' && <CSVUpload />}

    </div>
  )
}

export default App