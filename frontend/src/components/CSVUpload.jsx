import { useState } from 'react'
import axios from 'axios'
import ResultCharts from './ResultCharts'

function CSVUpload() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleFileChange(e) {
    setFile(e.target.files[0])
    setResult(null)
    setError(null)
  }

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await axios.post('http://localhost:8000/predict/csv', formData)
      setResult(res.data)
    } catch (err) {
      setError('Could not connect to backend. Is it running on port 8000?')
    } finally {
      setLoading(false)
    }
  }

  function riskColor(risk) {
    if (risk === 'Critical') return '#ff4444'
    if (risk === 'High')     return '#ff8800'
    if (risk === 'Medium')   return '#ffcc00'
    return '#00cc66'
  }

  return (
    <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '28px' }}>

      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#6b6b80', letterSpacing: '0.1em', marginBottom: '20px' }}>
        // UPLOAD CSV FILE
      </div>

      {/* Drop zone */}
      <label style={{
        display: 'block',
        border: '2px dashed #2a2a3a',
        borderRadius: '8px',
        padding: '48px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        marginBottom: '20px',
        transition: 'border-color 0.2s'
      }}>
        <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />
        <div style={{ fontSize: '28px', marginBottom: '12px' }}>⬆</div>
        <p style={{ color: '#6b6b80', fontSize: '14px' }}>
          Drop your CSV file here or{' '}
          <span style={{ fontFamily: "'Space Mono', monospace", color: '#7c6af7', fontSize: '12px' }}>
            click to browse
          </span>
        </p>
        <p style={{ color: '#6b6b80', fontSize: '12px', marginTop: '8px' }}>Must have JM1 metric columns</p>
        {file && (
          <p style={{ marginTop: '12px', fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#4fd1c5' }}>
            {file.name}
          </p>
        )}
      </label>

      {/* Button */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '13px', fontWeight: '700',
          letterSpacing: '0.05em',
          background: '#7c6af7', color: '#fff',
          border: 'none', borderRadius: '4px',
          padding: '12px 28px', marginBottom: '24px',
          cursor: (!file || loading) ? 'not-allowed' : 'pointer',
          opacity: (!file || loading) ? 0.6 : 1
        }}>
        {loading ? 'Analysing...' : 'Analyse file'}
      </button>

      {error && (
        <div style={{ color: '#ff8888', fontFamily: "'Space Mono', monospace", fontSize: '12px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {result && (
        <div>
          {/* Summary cards */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { label: 'Total files', value: result.total, color: '#e8e8f0', border: '#2a2a3a' },
              { label: 'Buggy',       value: result.buggy, color: '#ff4444', border: '#ff4444' },
              { label: 'Clean',       value: result.clean, color: '#00cc66', border: '#00cc66' },
              { label: 'Bug rate',    value: ((result.buggy / result.total) * 100).toFixed(1) + '%', color: '#ff8800', border: '#ff8800' },
            ].map(s => (
              <div key={s.label} style={{ background: '#1a1a24', border: `1px solid ${s.border}`, borderRadius: '8px', padding: '16px 24px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '28px', fontWeight: 'bold', color: s.color }}>{s.value}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#6b6b80', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <ResultCharts results={result.results} buggy={result.buggy} clean={result.clean} />

          {/* Table */}
          <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Row', 'Probability', 'Prediction', 'Risk'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 12px',
                      borderBottom: '1px solid #2a2a3a',
                      fontFamily: "'Space Mono', monospace",
                      color: '#6b6b80', fontSize: '10px',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      position: 'sticky', top: 0, background: '#111118'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.results.map(r => (
                  <tr key={r.row} style={{ borderBottom: '1px solid #1a1a24' }}>
                    <td style={{ padding: '10px 12px', fontFamily: "'Space Mono', monospace" }}>#{r.row}</td>
                    <td style={{ padding: '10px 12px', fontFamily: "'Space Mono', monospace", color: riskColor(r.risk_level) }}>{r.probability}%</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', padding: '2px 8px', border: `1px solid ${riskColor(r.risk_level)}`, color: riskColor(r.risk_level), borderRadius: '2px' }}>
                        {r.prediction}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: "'Space Mono', monospace", color: riskColor(r.risk_level) }}>{r.risk_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default CSVUpload