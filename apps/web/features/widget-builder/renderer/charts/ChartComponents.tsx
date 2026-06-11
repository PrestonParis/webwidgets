'use client';

import {
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

const COLORS = [
    '#10b981',
    '#3b82f6',
    '#8b5cf6',
    '#f59e0b',
    '#ef4444',
    '#06b6d4',
];

interface ChartData {
    data: Record<string, unknown>[];
    xKey?: string;
    yKey?: string;
    nameKey?: string;
    valueKey?: string;
}

export function BarChartComponent({
    data,
    xKey = 'name',
    yKey = 'value',
}: ChartData) {
    return (
        <ResponsiveContainer width="100%" height={200}>
            <BarChart
                data={data}
                margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                    dataKey={xKey}
                    tick={{ fill: '#71717a', fontSize: 10 }}
                />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
                <Tooltip
                    contentStyle={{
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: 8,
                        fontSize: 11,
                    }}
                />
                <Bar dataKey={yKey} fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function LineChartComponent({
    data,
    xKey = 'name',
    yKey = 'value',
}: ChartData) {
    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart
                data={data}
                margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                    dataKey={xKey}
                    tick={{ fill: '#71717a', fontSize: 10 }}
                />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
                <Tooltip
                    contentStyle={{
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: 8,
                        fontSize: 11,
                    }}
                />
                <Line
                    type="monotone"
                    dataKey={yKey}
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

export function AreaChartComponent({
    data,
    xKey = 'name',
    yKey = 'value',
}: ChartData) {
    return (
        <ResponsiveContainer width="100%" height={200}>
            <AreaChart
                data={data}
                margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
            >
                <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.3}
                        />
                        <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                        />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                    dataKey={xKey}
                    tick={{ fill: '#71717a', fontSize: 10 }}
                />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
                <Tooltip
                    contentStyle={{
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: 8,
                        fontSize: 11,
                    }}
                />
                <Area
                    type="monotone"
                    dataKey={yKey}
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorValue)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export function PieChartComponent({
    data,
    nameKey = 'name',
    valueKey = 'value',
}: ChartData) {
    return (
        <ResponsiveContainer width="100%" height={200}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey={valueKey ?? 'value'}
                    nameKey={nameKey}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                >
                    {data.map((_, i) => (
                        <Cell
                            key={i}
                            fill={COLORS[i % COLORS.length] ?? '#10b981'}
                        />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: 8,
                        fontSize: 11,
                    }}
                />
                <Legend wrapperStyle={{ fontSize: 10, color: '#71717a' }} />
            </PieChart>
        </ResponsiveContainer>
    );
}

export function ScatterChartComponent({
    data,
    xKey = 'x',
    yKey = 'y',
}: ChartData) {
    return (
        <ResponsiveContainer width="100%" height={200}>
            <ScatterChart margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                    dataKey={xKey}
                    name={xKey}
                    tick={{ fill: '#71717a', fontSize: 10 }}
                />
                <YAxis
                    dataKey={yKey}
                    name={yKey}
                    tick={{ fill: '#71717a', fontSize: 10 }}
                />
                <Tooltip
                    contentStyle={{
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: 8,
                        fontSize: 11,
                    }}
                />
                <Scatter data={data} fill="#10b981" />
            </ScatterChart>
        </ResponsiveContainer>
    );
}
