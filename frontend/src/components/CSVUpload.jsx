import {useState} from 'react'
import axios from 'axios'
import ResultCharts from './ResultCharts'

function CSVUpload(){
    const [file,setFile] = useState(null)
    const [result,setResult] = useState(null)
    const [loading,setLoading] = useState(false)
    const [error,setError] = useState(null)

    function handleFileChange(e){
        setFile(e.target.files[0])
        setResult(null)
        setError(null)
    }

    async function handleUpload(){
        if(!file) return

        setLoading(true)
        setError(null)
        setResult(null)

        const formData = new FormData()
        formData.append('file',file)

        try{
            const res = await axios.post('http://localhost:8000/predict/csv',formData)
            setResult(res.data)
        }
        catch(err){
            setError('Could not connect to backend. Is it running?')
        }
        finally{
            setLoading(false)
        }
    }

    function riskColor(risk){
        if(risk === 'Critical') return '#ff4444'
        if(risk === 'High') return '#ff8800'
        if(risk === 'Medium') return '#ffcc00'
        return '#00cc66'
    }

    return(
        <div>
            <div style={{
                border:'2px dashed #2a2a3a',
                borderRadius:'8px',
                padding:'40px',
                textAlign:'center',
                marginBottom:'20px'
            }}>
                <p style={{color:'#6b6b80',marginBottom:'16px'}}>
                    Upload your CSV file
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  style={{color:'#e8e8f0'}}
                />
                {file && (
                     <p style={{marginTop: '10px',color:'#7c6af7',fontSize:'13px'}}>
                        Selected:{file.name}
                    </p>
                )}
                </div>

                <button
                   onClick={handleUpload}
                   disabled={!file || loading}
                   style={{
                    background:'#7c6af7',
                    color:'#fff',
                    border:'none',
                    borderRadius:'4px',
                    padding:'12px 28px',
                    fontSize:'14px',
                    cursor:(!file || loading)? 'not-allowed' : 'pointer',
                    opacity:(!file || loading) ? 0.6:1,
                    marginBottom:'24px'
                   }}>
                    {loading ? 'Analysing...':'Analyse File'}
                </button>

                {error && (
                    <div style = {{color:'#ff8888',fontSize:'13px',marginBottom:'16px'}}>
                        {error}
                    </div>
                )}

                {result && (
                    <div>
                        <div style={{display:'flex',gap:'16px',marginBottom:'24px',flexWrap:'wrap'}}>
                            <div style={{background:'#1a1a24',border:'1px solid #2a2a3a',borderRadius:'8px',padding:'16px 24px',textAlign:'center'}}>
                                <div style={{fontSize:'28px',fontWeight:'bold'}}>{result.total}</div>
                                <div style={{fontSize:'11px',color:'#6b6b80',marginTop:'4px'}}>Total rows</div>
                            </div>
                            <div style={{ background: '#1a1a24', border: '1px solid #ff4444', borderRadius: '8px', padding: '16px 24px', textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff4444' }}>{result.buggy}</div>
                                <div style={{ fontSize: '11px', color: '#6b6b80', marginTop: '4px' }}>Buggy</div>
                           </div>
                           <div style={{ background: '#1a1a24', border: '1px solid #ff4444', borderRadius: '8px', padding: '16px 24px', textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00cc66' }}>{result.clean}</div>
                                <div style={{ fontSize: '11px', color: '#6b6b80', marginTop: '4px' }}>Clean</div>
                            </div>
                            <div style={{background:'#1a1a24',border:'1px solid #ff8800',borderRadius:'8px',padding:'16px 24px',textAlign:'center'}}>
                                <div style={{fontSize:'28px',fontWeight:'bold',color:'#ff8800'}}>
                                    {((result.buggy/result.total)*100).toFixed(1)}%
                                </div>
                                <div style={{fontSize:'11px',color:'#6b6b80',marginTop:'4px'}}>Bug rate</div>
                                </div>
                                </div>
                                <ResultCharts
                                   results={result.results}
                                   buggy={result.buggy}
                                   clean={result.clean}
                                />

                                <div sttyle={{overflowX:'auto',maxHeight:'400px',overflow:'auto'}}>
                                    <table style={{width:'100px',borderCollapse:'collapse',fontSize:'13px'}}>
                                        <thead>
                                            <tr>
                                                {['Row','Probability','Prediction','Risk'].map(h=>(
                                                    <th key={h} style={{
                                                        textAlign:'left',
                                                        padding:'10px 12px',
                                                        borderBottom:'1px solid #2a2a3a',
                                                        color:'#6b6b80',
                                                        fontSize:'11px',
                                                        textTransform:'uppercase',
                                                        position:'sticky',
                                                        top:0,
                                                        background:'#0f0f14'
                                                    }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                    <tbody>
                                        {result.results.map(r=>(
                                            <tr key={r.row} style={{ borderBottom:'1px solid #1a1a24'}}>
                                                <td style={{padding:'10px 12px'}}>#{r.row}</td>
                                                <td style={{padding:'10px 12px',color:riskColor(r.risk_level)}}>
                                                    {r.probability}%
                                                </td>
                                                <td style={{padding:'10px 12px'}}>
                                                    <span style={{
                                                        fontSize:'11px',
                                                        padding:'2px 8px',
                                                        border:`1px solid ${riskColor(r.risk_level)}`,
                                                        color:riskColor(r.risk_level),
                                                        borderRadius:'2px'
                                                    }}>
                                                        {r.prediction}
                                                    </span>
                                                    </td>
                                                    <td style={{padding:'10px 12px',color:riskColor(r.risk_level)}}>
                                                        {r.risk_level}
                                                    </td>
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