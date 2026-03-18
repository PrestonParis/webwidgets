'use client'

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Data, Figure } from 'plotly.js'

interface ChartData {
    data: Data[];
    layout: Partial<Figure['layout']>;
}

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Lyrics() {
    const [chartData, setChartData] = useState<ChartData | null >(null);
    const [wordAmount, setwordAmount] = useState(10)

    useEffect(() => {
        fetch('http://localhost:8000/api/lyrics/chart')
            .then(res => res.json())
            .then(data => {
                setChartData(JSON.parse(data.plot))
        });
    }, []);
    if (!chartData) return <div>Loading Analysis...</div>;

    return (
        <div>
            {/* Todo: Let Users determine amount of words to see */}

            <input 
                type="number" 
                value={wordAmount} 
                onChange={(e) => setwordAmount(parseInt(e.target.value) || 0)} 
                min="1" 
                max="500" 
            />
            <h2 className="project-link">Old Project: Lyric Analysis</h2>
            <Plot 
                data={chartData.data}
                layout={chartData.layout}
                style={{ width: '100%', ehight: '500px'}}
            />
        </div>
    )
}