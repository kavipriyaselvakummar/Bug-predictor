import {Doughnut,Bar} from 'react-chartjs-2'
import{
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement
} from 'chart.js'
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

function ResultCharts({results,buggy,clean}){
    const riskCounts = {Low:0,Medium:0,High:0,Critical:0}
    results.forEach(r=>{
        riskCounts[r.risk_level]++
    })
    const doughnutData={
        labels:['Buggy','Clean'],
        datasets:[{
            data:[buggy,clean],
            backgroundColor:['#ff4444','#00cc66'],
            borderColor:['#cc0000','#009944'],
            borderWidth:1
        }]
    }
    const barData={
        lables:['Low','Medium','High','Critical'],
        datasets:[{
            label:'Number of files',
            data:[
                riskCounts.Low,
                riskCounts.Medium,
                riskCounts.High,
                riskCounts.Critical
            ],
            backgroundColor:['#00cc66','#ffcc00','#ff8800','#ff4444'],
            borderRadius:4
        }]
    }

    const doughnutOptions={
        plugins:{
            legend:{
                labels:{color:'#e8e8f0'}
            }
        }
    }
    const barOptions={
        plugins:{
            legend:{
                labels:{color:'#e8e8f0'}
            }
        },
        scales:{
            x:{
                ticks:{color:'#6b6b80'},
                grid:{color:'#2a2a3a'}
            },
            y:{
                ticks:{color:'#6b6b80'},
                grid:{color:'#2a2a3a'}
            }
        }
    }
    return(
        <div style={{
            display:'grid',
            gridTemplateColumns:'1fr 2fr',
            gap:'24px',
            marginBottom:'32px'
        }}>

        <div style={{
            background:'#1a1a24',
            border:'1px solid #2a2a3a',
            borderRadius:'8px',
            padding:'20px'
        }}>
            <p style={{color:'#6b6b80',fontSize:'11px',marginBottom:'16px',textTransform:'uppercase'}}>
                Buggy vs Clean
            </p>
            <Doughnut data={doughnutData} options={doughnutOptions}/>
        </div>

        <div style={{
            background:'#1a1a24',
            border:'1px solid #2a2a3a',
            borderRadius:'8px',
            padding:'20px'
        }}>
            <p style={{color:'#6b6b80',fontSize:'11px',marginBottom:'16px',textTransform:'uppercase'}}>
                Risk level breakdown
            </p>
            <Bar data={barData} options={barOptions}/>
        </div>
        </div>

    )
}

export default ResultCharts