import { useState } from 'react'
import ManualForm from './components/ManualForm'
import CSVUpload from './components/CSVUpload'

function App(){
  const [activeTab,setActiveTab] = useState('manual')

  return (
    <div style={{maxWidth:'900px',margin:'0 auto',padding:'40px 24px'}}>
      {/*Header*/}
      <h1 style={{fontSize:'32px',marginBottom:'8px'}}>
        Bug<span style={{color:'#7c6af7'}}>.</span>Predictor
      </h1>
      <p style={{color:'#6b6b80',marginBottom:'32px'}}>
        Software defect prediction using JM1 NASA dataset
      </p>

     {/*Tabs*/}
      <div style={{display:'flex',gap:'8px',marginBottom:'28px',borderBottom:'1px solid #2a2a3a'}}>
        <button
            onClick={() => setActiveTab('manual')}
            style={{
              padding:'10px 20px',
              background:'none',
              border:'none',
              cursor:'pointer',
              color:activeTab==='manual'? '#7c6af7':'#6b6b80',
              borderBottom:activeTab === 'manual'?'2px solid #7c6af7':'2px solid transparent',
              fontSize:'14px'
            }}>
            Manual Input
            </button>
            <button
             onClick={() => setActiveTab('csv')}
             style={{
              padding:'10px 20px',
              background:'none',
              border:'none',
              cursor:'pointer',
              color:activeTab==='csv'?'#7c6af7':'#6b6b80',
              borderBottom:activeTab==='csv'?'2px solid #7c6af7':'2px solid transparent',
              fontSize:'14px'
             }}>
            CSV Upload
            </button>
          </div>

          {activeTab==='manual' && <ManualForm/>}
          {activeTab==='csv' && <CSVUpload/>}
        </div>
  )
}

export default App