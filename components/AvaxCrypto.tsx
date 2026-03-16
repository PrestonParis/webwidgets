'use client'

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Data, Figure } from 'plotly.js'

interface ChartData {
    data: Data[];
    layout: Partial<Figure['layout']>;
}

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function CryptoDashboard() {
    const [chartData, setChartData] = useState<ChartData | null >(null);

    useEffect(() => {
        fetch('http://localhost:8000/crypto/api/avax-stats/')
            .then(res => res.json())
            .then(data => {
                setChartData(JSON.parse(data.plot))
        });
    }, []);
    if (!chartData) return <div>Loading Analysis...</div>;

    return (
        <div>
            <h1>AVAX Analysis</h1>
            <Plot 
                data={chartData.data}
                layout={chartData.layout}
                style={{ width: '100%', ehight: '500px'}}
            />
        </div>
    )
}