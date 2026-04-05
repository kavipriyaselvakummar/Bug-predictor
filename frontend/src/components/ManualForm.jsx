import { useState } from 'react'
import axios from 'axios'

const FIELDS = [
  { key: 'loc',               label: 'LOC',            placeholder: 'e.g. 150' },
  { key: 'v_g',               label: 'v(g) cyclomatic', placeholder: 'e.g. 5' },
  { key: 'ev_g',              label: 'ev(g) essential', placeholder: 'e.g. 3' },
  { key: 'iv_g',              label: 'iv(g) design',    placeholder: 'e.g. 4' },
  { key: 'n',                 label: 'N total operators', placeholder: 'e.g. 200' },
  { key: 'v',                 label: 'V volume',        placeholder: 'e.g. 400' },
  { key: 'l',                 label: 'L program length', placeholder: 'e.g. 0.05' },
  { key: 'd',                 label: 'D difficulty',    placeholder: 'e.g. 20' },
  { key: 'i',                 label: 'I intelligence',  placeholder: 'e.g. 30' },
  { key: 'e',                 label: 'E effort',        placeholder: 'e.g. 8000' },
  { key: 'b',                 label: 'B bugs estimated', placeholder: 'e.g. 0.1' },
  { key: 't',                 label: 'T time',          placeholder: 'e.g. 500' },
  { key: 'lOCode',            label: 'Lines of code',   placeholder: 'e.g. 120' },
  { key: 'lOComment',         label: 'Lines comment',   placeholder: 'e.g. 20' },
  { key: 'lOBlank',           label: 'Lines blank',     placeholder: 'e.g. 15' },
  { key: 'locCodeAndComment', label: 'Code+comment',    placeholder: 'e.g. 5' },
  { key: 'uniq_Op',           label: 'Unique operators', placeholder: 'e.g. 18' },
  { key: 'uniq_Opnd',         label: 'Unique operands', placeholder: 'e.g. 30' },
  { key: 'total_Op',          label: 'Total operators', placeholder: 'e.g. 100' },
  { key: 'total_Opnd',        label: 'Total operands',  placeholder: 'e.g. 100' },
  { key: 'branchCount',       label: 'Branch count',    placeholder: 'e.g. 8' },
]

function ManualForm() {
  const initialValues = {}
  FIELDS.forEach(f => { initialValues[f.key] = '' })

  const [values, setValues] = useState(initialValues)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleChange(key, value) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setResult(null)
    const API_URL = import.meta.env.VITE_API_URL;
    const body = {}
    FIELDS.forEach(f => { body[f.key] = parseFloat(values[f.key]) || 0 })
    try {
      const res = await axios.post(`${API_URL}/predict/json`, body)
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

      {/* Card title */}
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#6b6b80', letterSpacing: '0.1em', marginBottom: '20px' }}>
        // SOFTWARE METRICS
      </div>

      {/* Input grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {FIELDS.map(f => (
          <div key={f.key}>
            <label style={{ display: 'block', fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#6b6b80', marginBottom: '6px', letterSpacing: '0.05em' }}>
              {f.label}
            </label>
            <input
              type="number"
              value={values[f.key]}
              onChange={e => handleChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              style={{
                width: '100%',
                background: '#1a1a24',
                border: '1px solid #2a2a3a',
                borderRadius: '4px',
                color: '#e8e8f0',
                fontFamily: "'Space Mono', monospace",
                fontSize: '13px',
                padding: '8px 12px'
              }}
            />
          </div>
        ))}
      </div>

      {/* Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '13px',
          fontWeight: '700',
          letterSpacing: '0.05em',
          background: '#7c6af7',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '12px 28px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1
        }}>
        {loading ? 'Predicting...' : 'Run prediction'}
      </button>

      {/* Error */}
      {error && (
        <div style={{ marginTop: '16px', color: '#ff8888', fontFamily: "'Space Mono', monospace", fontSize: '12px' }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          marginTop: '24px',
          background: result.prediction === 'Buggy' ? 'rgba(255,68,68,0.05)' : 'rgba(0,204,102,0.05)',
          border: `1px solid ${riskColor(result.risk_level)}`,
          borderRadius: '8px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          <div style={{
            width: '90px', height: '90px',
            borderRadius: '50%',
            border: `3px solid ${riskColor(result.risk_level)}`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '20px', fontWeight: 'bold', color: riskColor(result.risk_level) }}>
              {result.probability}%
            </span>
            <span style={{ fontSize: '10px', color: '#6b6b80' }}>bug prob</span>
          </div>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '24px', fontWeight: 'bold', color: riskColor(result.risk_level) }}>
              {result.prediction}
            </div>
            <div style={{
              display: 'inline-block', marginTop: '8px',
              fontFamily: "'Space Mono', monospace", fontSize: '11px',
              padding: '3px 10px', letterSpacing: '0.1em',
              border: `1px solid ${riskColor(result.risk_level)}`,
              color: riskColor(result.risk_level), borderRadius: '2px'
            }}>
              {result.risk_level} Risk
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManualForm