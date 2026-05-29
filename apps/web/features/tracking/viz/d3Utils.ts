import * as d3 from 'd3';

export interface ChartDims {
    width: number;
    height: number;
    marginTop?: number;
    marginRight?: number;
    marginBottom?: number;
    marginLeft?: number;
}

type DateValue = { date: Date; value: number };
type LabelValue = { label: string; value: number };
type XY = { x: number; y: number };

export function buildLineChart(
    svg: SVGSVGElement,
    data: DateValue[],
    dims: ChartDims,
    color = '#6366f1',
): void {
    const mt = dims.marginTop ?? 20;
    const mr = dims.marginRight ?? 20;
    const mb = dims.marginBottom ?? 30;
    const ml = dims.marginLeft ?? 40;
    const innerW = dims.width - ml - mr;
    const innerH = dims.height - mt - mb;

    d3.select(svg).selectAll('*').remove();

    const g = d3
        .select(svg)
        .append<SVGGElement>('g')
        .attr('transform', `translate(${ml},${mt})`);

    const xScale = d3
        .scaleTime()
        .domain(d3.extent(data, (d) => d.date) as [Date, Date])
        .range([0, innerW]);

    const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.value) ?? 1])
        .nice()
        .range([innerH, 0]);

    g.append<SVGGElement>('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(xScale).ticks(5));

    g.append<SVGGElement>('g').call(d3.axisLeft(yScale).ticks(5));

    const line = d3
        .line<DateValue>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.value))
        .curve(d3.curveMonotoneX);

    g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('d', line);

    g.selectAll<SVGCircleElement, DateValue>('circle')
        .data(data)
        .join('circle')
        .attr('cx', (d) => xScale(d.date))
        .attr('cy', (d) => yScale(d.value))
        .attr('r', 3)
        .attr('fill', color);
}

export function buildHeatmap(
    svg: SVGSVGElement,
    data: { date: string; value: number }[],
    weeks: number,
    colorScale: (v: number) => string,
): void {
    const cellSize = 14;
    const cellGap = 2;
    const step = cellSize + cellGap;

    d3.select(svg).selectAll('*').remove();

    const byDate = new Map(data.map((d) => [d.date, d.value]));
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - weeks * 7 + 1);

    const days: DateValue[] = [];
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        days.push({ date: new Date(d), value: byDate.get(key) ?? 0 });
    }

    const g = d3
        .select(svg)
        .append<SVGGElement>('g')
        .attr('transform', 'translate(4,4)');

    g.selectAll<SVGRectElement, DateValue>('rect')
        .data(days)
        .join('rect')
        .attr(
            'x',
            (d) => Math.floor(d3.timeDay.count(start, d.date) / 7) * step,
        )
        .attr('y', (d) => d.date.getDay() * step)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('rx', 2)
        .attr('fill', (d) => colorScale(d.value));
}

export function buildBarChart(
    svg: SVGSVGElement,
    data: LabelValue[],
    dims: ChartDims,
    color = '#6366f1',
): void {
    const mt = dims.marginTop ?? 20;
    const mr = dims.marginRight ?? 20;
    const mb = dims.marginBottom ?? 40;
    const ml = dims.marginLeft ?? 40;
    const innerW = dims.width - ml - mr;
    const innerH = dims.height - mt - mb;

    d3.select(svg).selectAll('*').remove();

    const g = d3
        .select(svg)
        .append<SVGGElement>('g')
        .attr('transform', `translate(${ml},${mt})`);

    const xScale = d3
        .scaleBand()
        .domain(data.map((d) => d.label))
        .range([0, innerW])
        .padding(0.2);

    const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.value) ?? 1])
        .nice()
        .range([innerH, 0]);

    g.append<SVGGElement>('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(xScale));

    g.append<SVGGElement>('g').call(d3.axisLeft(yScale).ticks(5));

    g.selectAll<SVGRectElement, LabelValue>('rect')
        .data(data)
        .join('rect')
        .attr('x', (d) => xScale(d.label) ?? 0)
        .attr('y', (d) => yScale(d.value))
        .attr('width', xScale.bandwidth())
        .attr('height', (d) => innerH - yScale(d.value))
        .attr('fill', color);
}

export function buildScatterPlot(
    svg: SVGSVGElement,
    pairs: XY[],
    dims: ChartDims,
    labels?: { x: string; y: string },
): void {
    const mt = dims.marginTop ?? 20;
    const mr = dims.marginRight ?? 20;
    const mb = dims.marginBottom ?? 40;
    const ml = dims.marginLeft ?? 40;
    const innerW = dims.width - ml - mr;
    const innerH = dims.height - mt - mb;

    const root = d3.select(svg);
    root.selectAll('*').remove();

    const g = root
        .append<SVGGElement>('g')
        .attr('transform', `translate(${ml},${mt})`);

    const xDomain = d3.extent(pairs, (d) => d.x) as [number, number];
    const yDomain = d3.extent(pairs, (d) => d.y) as [number, number];

    const xScale = d3.scaleLinear().domain(xDomain).nice().range([0, innerW]);
    const yScale = d3.scaleLinear().domain(yDomain).nice().range([innerH, 0]);

    g.append<SVGGElement>('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(xScale).ticks(5));
    g.append<SVGGElement>('g').call(d3.axisLeft(yScale).ticks(5));

    if (labels) {
        g.append<SVGTextElement>('text')
            .attr('x', innerW / 2)
            .attr('y', innerH + 35)
            .attr('text-anchor', 'middle')
            .attr('font-size', 12)
            .text(labels.x);
        g.append<SVGTextElement>('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerH / 2)
            .attr('y', -30)
            .attr('text-anchor', 'middle')
            .attr('font-size', 12)
            .text(labels.y);
    }

    g.selectAll<SVGCircleElement, XY>('circle')
        .data(pairs)
        .join('circle')
        .attr('cx', (d) => xScale(d.x))
        .attr('cy', (d) => yScale(d.y))
        .attr('r', 4)
        .attr('fill', '#6366f1')
        .attr('opacity', 0.7);
}
