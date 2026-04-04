import {useState} from 'react'
import axios from 'axios'

const FIELDS = [
  {key:'loc', label:'LOC(lines of code)'},
  { key: 'v_g',              label: 'v(g) cyclomatic complexity' },
  { key: 'ev_g',             label: 'ev(g) essential complexity' },
  { key: 'iv_g',             label: 'iv(g) design complexity' },
  { key: 'n',                label: 'N total operators+operands' },
  { key: 'v',                label: 'V volume' },
  { key: 'l',                label: 'L program length' },
  { key: 'd',                label: 'D difficulty' },
  { key: 'i',                label: 'I intelligence' },
  { key: 'e',                label: 'E effort' },
  { key: 'b',                label: 'B bugs estimated' },
  { key: 't',                label: 'T time' },
  { key: 'lOCode',           label: 'Lines of code only' },
  { key: 'lOComment',        label: 'Lines of comment' },
  { key: 'lOBlank',          label: 'Lines blank' },
  { key: 'locCodeAndComment', label: 'Code and comment lines' },
  { key: 'uniq_Op',          label: 'Unique operators' },
  { key: 'uniq_Opnd',        label: 'Unique operands' },
  { key: 'total_Op',         label: 'Total operators' },
  { key: 'total_Opnd',       label: 'Total operands' },
  { key: 'branchCount',      label: 'Branch count' },
]

function ManualForm(){
    const initialValues ={}
    FIELDS.forEach(f=>{initialValues[f.key]=''})

    const [values,setValues] = useState(initialValues)
    const [result,setResult] = useState(null)
    const [loading,setLoading] = useState(false)
    const [error,setError] = useState(null)

    function handleChange(key,value){
        setValues(prev => ({...prev,[key]:value}))
    }

    async function handleSubmit(){
        setLoading(true)
        setError(null)
        setResult(null)

        const body ={}
        FIELDS.forEach(f=>{
            body[f.key] = parseFloat(values[f.key]) || 0
        })
        try{
            const res = await axios.post('http://localhost:8000/predict/json',body)
            setResult(res.data)
        }
        catch(err){
            setError('Could not connect to backend.Is it running?')
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
                display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',
                gap:'14px',
                marginBottom:'24px'
            }}>
              {FIELDS.map(f=>(
                <div key={f.key}>
                    <label style={{display:'block',fontSize:'11px',color:'#6b6b80',marginBottom:'6px'}}>
                        {f.label}
                    </label>
                    <input
                       type="number"
                       value={values[f.key]}
                       onChange={e=>handleChange(f.key,e.target.value)}
                       placeholder="0"
                       style={{
                        width:'100%',
                        background:'#1a1a24',
                        border:'1px solid #2a2a3a',
                        borderRadius:'4px',
                        color:'#e8e8f0',
                        fontSize:'13px',
                        padding:'8px 12px',
                        outline:'none'
                       }}
                    />
                </div>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                background:'#7c6af7',
                color:'#fff',
                border:'none',
                borderRadius:'4px',
                padding:'12px 28px',
                fontSize:'14px',
                cursor:loading ? 'not-allowed':'pointer',
                opacity:loading?0.6:1
              }}>
            {loading ? 'Predicting...':'Run Prediction'}
        </button>

        {error && (
            <div style={{marginTop:'16px',color:'#ff8888',fontSize:'13px'}}>
                {error}
            </div>
        )}
        {result && (
            <div style={{
                marginTop:'24px',
                background:'#1a1a24',
                border:`1px solid ${riskColor(result.risk_level)}`,
                borderRadius:'8px',
                padding:'24px',
                display:'flex',
                alignItems:'center',
                gap:'24px'
            }}>
                <div style={{
                    width:'90px',height:'90px',
                    borderRadius:'50px',
                    border:`3px solid ${riskColor(result.risk_level)}`,
                    display:'flex',flexDirection:'column',
                    alignItems:'center',justifyContent:'center',
                    flexShrink:0
                }}>
                <span style={{fontSize:'20px',fontWeight:'bold',color:riskColor(result.risk_level)}}>
                    {result.probability}%
                </span>
                <span style={{ fontSize:'10px',color:'#6b6b80'}}>bug prob</span>
                </div>

                <div>
                    <div style={{fontSize:'24px',fontWeight:'bold',color:riskColor(result.risk_level)}}>
                        {result.prediction}
                    </div>
                    <div style={{
                        display:'inline-block',
                        fontSize:'11px',
                        padding:'3px 10px',
                        border:`1px solid ${riskColor(result.risk_level)}`,
                        color:riskColor(result.risk_level),
                        borderRadius:'2px',
                        marginTop:'6px'
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
