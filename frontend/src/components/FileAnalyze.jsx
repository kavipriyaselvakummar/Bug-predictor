import { useState } from 'react'
import axios from 'axios'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  Title
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  Title
)

function generateSuggestions(metrics) {
  const suggestions = []
  if (metrics.loc > 300) {
    suggestions.push({ type: 'warning', text: 'High LOC: Consider splitting the file into smaller modules.' })
  }
  if (metrics.avg_complexity > 10) {
    suggestions.push({ type: 'error', text: 'High Cyclomatic Complexity: Reduce nested conditions to improve maintainability.' })
  } else if (metrics.avg_complexity > 5) {
    suggestions.push({ type: 'warning', text: 'Moderate Complexity: Keep an eye on nested logic.' })
  }
  if (metrics.maintainability_index < 50) {
    suggestions.push({ type: 'error', text: 'Low Maintainability Index: Refactor code for better readability.' })
  } else if (metrics.maintainability_index < 65) {
    suggestions.push({ type: 'warning', text: 'Moderate Maintainability: Consider adding comments or simplifying expressions.' })
  }
  if (metrics.avg_halstead_volume > 1000) {
    suggestions.push({ type: 'warning', text: 'High Halstead Volume: Simplify logic and reduce variable assignments.' })
  }
  if (suggestions.length === 0) {
    suggestions.push({ type: 'success', text: 'Code looks clean! Excellent metrics across the board.' })
  }
  return suggestions
}


function FileAnalyze() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  function handleFileChange(e) {
    const selected = e.target.files[0]
    if (selected && !selected.name.endsWith('.py')) {
      setError('Only .py files are accepted')
      setFile(null)
      return
    }
    setFile(selected)
    setResult(null)
    setError(null)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setDragOver(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && !dropped.name.endsWith('.py')) {
      setError('Only .py files are accepted')
      setFile(null)
      return
    }
    setFile(dropped)
    setResult(null)
    setError(null)
  }

  async function handleAnalyze() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await axios.post('http://localhost:8000/analyze-file', formData)
      setResult(res.data)
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail)
      } else {
        setError('Could not connect to backend. Is it running on port 8000?')
      }
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

  const metricCard = (label, value, icon, accentColor) => (
    <div style={{
      background: '#1a1a24',
      border: '1px solid #2a2a3a',
      borderRadius: '8px',
      padding: '18px 20px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.3s, transform 0.2s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = accentColor
      e.currentTarget.style.transform = 'translateY(-2px)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = '#2a2a3a'
      e.currentTarget.style.transform = 'translateY(0)'
    }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, ${accentColor}, transparent)`
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '10px',
          color: '#6b6b80',
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}>{label}</span>
      </div>
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: '22px',
        fontWeight: 'bold',
        color: accentColor
      }}>{value}</div>
    </div>
  )

  return (
    <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '28px' }}>

      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#6b6b80', letterSpacing: '0.1em', marginBottom: '20px' }}>
        // ANALYZE PYTHON FILE
      </div>

      {/* Drop zone */}
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          display: 'block',
          border: `2px dashed ${dragOver ? '#7c6af7' : '#2a2a3a'}`,
          borderRadius: '8px',
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: '20px',
          transition: 'border-color 0.2s, background 0.2s',
          background: dragOver ? 'rgba(124,106,247,0.05)' : 'transparent'
        }}
      >
        <input type="file" accept=".py" onChange={handleFileChange} style={{ display: 'none' }} />
        <div style={{ fontSize: '28px', marginBottom: '12px' }}>🐍</div>
        <p style={{ color: '#6b6b80', fontSize: '14px' }}>
          Drop your Python file here or{' '}
          <span style={{ fontFamily: "'Space Mono', monospace", color: '#7c6af7', fontSize: '12px' }}>
            click to browse
          </span>
        </p>
        <p style={{ color: '#6b6b80', fontSize: '12px', marginTop: '8px' }}>
          Only .py files accepted — metrics extracted automatically via Radon
        </p>
        {file && (
          <div style={{
            marginTop: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(79,209,197,0.08)',
            border: '1px solid rgba(79,209,197,0.2)',
            borderRadius: '4px',
            padding: '6px 14px'
          }}>
            <span style={{ fontSize: '14px' }}>📄</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#4fd1c5' }}>
              {file.name}
            </span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#6b6b80' }}>
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
        )}
      </label>

      {/* Button */}
      <button
        onClick={handleAnalyze}
        disabled={!file || loading}
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '13px', fontWeight: '700',
          letterSpacing: '0.05em',
          background: loading
            ? 'linear-gradient(135deg, #7c6af7, #a78bfa)'
            : '#7c6af7',
          color: '#fff',
          border: 'none', borderRadius: '4px',
          padding: '12px 28px', marginBottom: '24px',
          cursor: (!file || loading) ? 'not-allowed' : 'pointer',
          opacity: (!file || loading) ? 0.6 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s'
        }}>
        {loading && (
          <span style={{
            display: 'inline-block',
            width: '14px', height: '14px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        )}
        {loading ? 'Analyzing...' : 'Analyze file'}
      </button>

      {/* Inline keyframes for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124,106,247,0); }
          50%      { box-shadow: 0 0 16px 4px rgba(124,106,247,0.15); }
        }
      `}</style>

      {/* Error */}
      {error && (
        <div style={{
          color: '#ff8888',
          fontFamily: "'Space Mono', monospace",
          fontSize: '12px',
          marginBottom: '16px',
          background: 'rgba(255,68,68,0.06)',
          border: '1px solid rgba(255,68,68,0.15)',
          borderRadius: '6px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '14px' }}>⚠️</span>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ animation: 'fadeSlideUp 0.4s ease' }}>

          {/* File summary header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid #2a2a3a'
          }}>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#6b6b80', letterSpacing: '0.1em', marginBottom: '4px' }}>
                // ANALYSIS RESULTS
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '14px', color: '#e8e8f0' }}>
                {result.filename} — <span style={{ color: '#7c6af7' }}>{result.functions_analyzed} function{result.functions_analyzed !== 1 ? 's' : ''}</span> analyzed
              </div>
            </div>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '11px',
              padding: '4px 12px',
              border: `1px solid ${riskColor(result.overall_prediction.risk_level)}`,
              color: riskColor(result.overall_prediction.risk_level),
              borderRadius: '2px',
              letterSpacing: '0.08em'
            }}>
              {result.overall_prediction.prediction}
            </div>
          </div>

          {/* TOP DASHBOARD CARDS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            
            {/* Risk Gauge Card */}
            <div style={{
              background: result.overall_prediction.prediction === 'Buggy' ? 'rgba(255,68,68,0.05)' : 'rgba(0,204,102,0.05)',
              border: `1px solid ${riskColor(result.overall_prediction.risk_level)}`,
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'pulseGlow 2s ease-in-out 1',
              position: 'relative'
            }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#6b6b80', marginBottom: '16px', letterSpacing: '0.1em', width: '100%', textAlign: 'left' }}>
                RISK GAUGE
              </div>
              <div style={{ width: '180px', height: '90px', position: 'relative' }}>
                <Doughnut 
                  data={{
                    labels: ['Bug Probability', 'Safe'],
                    datasets: [{
                      data: [result.overall_prediction.probability, 100 - result.overall_prediction.probability],
                      backgroundColor: [riskColor(result.overall_prediction.risk_level), '#2a2a3a'],
                      borderWidth: 0,
                      circumference: 180,
                      rotation: 270,
                    }]
                  }}
                  options={{
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    cutout: '80%',
                    maintainAspectRatio: false
                  }}
                />
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -10%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '24px', fontWeight: 'bold', color: riskColor(result.overall_prediction.risk_level) }}>
                    {result.overall_prediction.probability}%
                  </span>
                </div>
              </div>
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '18px', fontWeight: 'bold', color: riskColor(result.overall_prediction.risk_level) }}>
                  {result.overall_prediction.prediction}
                </div>
                <div style={{
                  display: 'inline-block', marginTop: '6px',
                  fontFamily: "'Space Mono', monospace", fontSize: '11px',
                  padding: '2px 8px', letterSpacing: '0.1em',
                  border: `1px solid ${riskColor(result.overall_prediction.risk_level)}`,
                  color: riskColor(result.overall_prediction.risk_level), borderRadius: '2px'
                }}>
                  {result.overall_prediction.risk_level} Risk
                </div>
              </div>
            </div>

            {/* Smart Suggestions Card */}
            <div style={{
              background: '#1a1a24',
              border: '1px solid #2a2a3a',
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#6b6b80', marginBottom: '16px', letterSpacing: '0.1em' }}>
                SMART SUGGESTIONS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', maxHeight: '200px' }}>
                {generateSuggestions(result.file_metrics).map((sugg, i) => {
                  let badgeColor = '';
                  let icon = '';
                  if (sugg.type === 'error') { badgeColor = '#ff4444'; icon = '🚨'; }
                  else if (sugg.type === 'warning') { badgeColor = '#ff8800'; icon = '⚠️'; }
                  else { badgeColor = '#00cc66'; icon = '✨'; }

                  return (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#111118', padding: '12px', borderRadius: '6px', borderLeft: `3px solid ${badgeColor}` }}>
                      <span style={{ fontSize: '14px' }}>{icon}</span>
                      <span style={{ fontSize: '13px', color: '#e8e8f0', lineHeight: 1.4 }}>{sugg.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>

          {/* Feature Importance Card Container */}
          <div style={{
            background: '#1a1a24',
            border: '1px solid #2a2a3a',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '28px'
          }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#6b6b80', marginBottom: '16px', letterSpacing: '0.1em' }}>
              METRIC IMPORTANCE (LOG SCALE)
            </div>
            <div style={{ height: '220px' }}>
              <Bar
                data={{
                  labels: ['LOC', 'Complexity', 'Maintainability', 'Halstead Vol'],
                  datasets: [{
                    label: 'Score',
                    data: [
                      result.file_metrics.loc,
                      result.file_metrics.avg_complexity,
                      result.file_metrics.maintainability_index,
                      result.file_metrics.avg_halstead_volume
                    ],
                    backgroundColor: ['#7c6af7', '#ff8800', '#4fd1c5', '#a78bfa'],
                    borderRadius: 4,
                  }]
                }}
                options={{
                  indexAxis: 'y',
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      type: 'logarithmic',
                      grid: { color: '#2a2a3a' },
                      ticks: { color: '#6b6b80', fontFamily: "'Space Mono', monospace" }
                    },
                    y: {
                      grid: { display: false },
                      ticks: { color: '#6b6b80', fontFamily: "'Space Mono', monospace" }
                    }
                  },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` ${ctx.raw.toFixed ? ctx.raw.toFixed(1) : ctx.raw}`
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Aggregated metrics grid */}
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#6b6b80', letterSpacing: '0.1em', marginBottom: '14px' }}>
            // FULL METRICS BREAKDOWN
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '28px'
          }}>
            {metricCard('Lines of Code', result.file_metrics.loc, '📏', '#7c6af7')}
            {metricCard('Cyclomatic Complexity', result.file_metrics.avg_complexity.toFixed(1), '🔀', '#ff8800')}
            {metricCard('Maintainability Index', result.file_metrics.maintainability_index.toFixed(1), '🛡️', '#4fd1c5')}
            {metricCard('Halstead Volume', result.file_metrics.avg_halstead_volume.toFixed(1), '📊', '#a78bfa')}
            {metricCard('Halstead Effort', result.file_metrics.avg_halstead_effort.toFixed(1), '⚡', '#f59e0b')}
            {metricCard('Halstead Bugs', result.file_metrics.avg_halstead_bugs.toFixed(4), '🐛', '#ff4444')}
          </div>

          {/* Per-function table */}
          {result.function_results && result.function_results.length > 0 && (
            <>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#6b6b80', letterSpacing: '0.1em', marginBottom: '14px' }}>
                // PER-FUNCTION BREAKDOWN
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      {['Function', 'LOC', 'v(g)', 'Volume', 'Probability', 'Prediction', 'Risk'].map(h => (
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
                    {result.function_results.map((fn, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #1a1a24' }}>
                        <td style={{ padding: '10px 12px', fontFamily: "'Space Mono', monospace", color: '#7c6af7' }}>
                          {fn.function_name}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: "'Space Mono', monospace" }}>
                          {fn.metrics.loc}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: "'Space Mono', monospace" }}>
                          {fn.metrics['v(g)']}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: "'Space Mono', monospace" }}>
                          {fn.metrics.v}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: "'Space Mono', monospace", color: riskColor(fn.prediction.risk_level) }}>
                          {fn.prediction.probability}%
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            fontFamily: "'Space Mono', monospace", fontSize: '10px',
                            padding: '2px 8px',
                            border: `1px solid ${riskColor(fn.prediction.risk_level)}`,
                            color: riskColor(fn.prediction.risk_level),
                            borderRadius: '2px'
                          }}>
                            {fn.prediction.prediction}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: "'Space Mono', monospace", color: riskColor(fn.prediction.risk_level) }}>
                          {fn.prediction.risk_level}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default FileAnalyze
