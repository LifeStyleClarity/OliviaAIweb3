import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';

const PERIODS = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '1Y', value: '1y' },
  { label: 'YTD', value: 'ytd' }
];

PortfolioChart.propTypes = {
  calculations: PropTypes.shape({
    timeseriesData: PropTypes.arrayOf(PropTypes.shape({
      timestamp: PropTypes.number.isRequired,
      value: PropTypes.number.isRequired,
      // percentageChange is no longer "isRequired" to avoid warnings if missing
      percentageChange: PropTypes.number 
    })).isRequired,
    currentValue: PropTypes.number.isRequired,
    percentageChange: PropTypes.number.isRequired,
    dollarChange: PropTypes.number.isRequired,
    isPositive: PropTypes.bool.isRequired
  }),
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  selectedPeriod: PropTypes.string,
  onPeriodChange: PropTypes.func
};

export default function PortfolioChart({ 
  calculations,
  isLoading = false, 
  error = null,
  selectedPeriod = '1w',
  onPeriodChange
}) {
  const svgRef = useRef(null);
  const data = calculations?.timeseriesData || [];

  useEffect(() => {
    if (!svgRef.current || !calculations || data.length === 0) return;

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up dimensions
    const width = svgRef.current.clientWidth;
    const height = 150;
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.timestamp))
      .range([0, innerWidth]);

    const yMin = d3.min(data, d => d.value) || 0;
    const yMax = d3.max(data, d => d.value) || 0;

    const yScale = d3.scaleLinear()
      .domain([yMin * 0.99, yMax * 1.01])
      .range([innerHeight, 0]);

    // Create line generator with smoothing
    const line = d3.line()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.value))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Create area generator with same smoothing
    const area = d3.area()
      .x(d => xScale(d.timestamp))
      .y0(innerHeight)
      .y1(d => yScale(d.value))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create gradient with unique ID
    const gradientId = `area-gradient-${Math.random().toString(36).substr(2, 9)}`;
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    // Get color based on trend
    const lineColor = calculations.isPositive ? '#45EF34' : '#ef4545';

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', lineColor)
      .attr('stop-opacity', 0.2);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', lineColor)
      .attr('stop-opacity', 0.02);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create hover line
    const hoverLine = g.append('line')
      .attr('class', 'hover-line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .style('stroke', lineColor)
      .style('stroke-width', '1px')
      .style('opacity', '0');

    // Create hover circle
    const hoverCircle = g.append('circle')
      .attr('class', 'hover-circle')
      .attr('r', 4)
      .style('fill', lineColor)
      .style('opacity', '0');

    // Create hover value text
    const hoverText = g.append('text')
      .attr('class', 'hover-text')
      .style('fill', lineColor)
      .style('font-size', '12px')
      .style('opacity', '0');

    // Add the area path
    g.append('path')
      .datum(data)
      .attr('class', 'area')
      .attr('d', area)
      .style('fill', `url(#${gradientId})`);

    // Add the line path
    g.append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', lineColor)
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add hover interaction
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event);
        const x0 = xScale.invert(mouseX - margin.left);
        const bisect = d3.bisector(d => d.timestamp).left;
        const index = bisect(data, x0);
        const d = data[index];

        if (d) {
          const x = xScale(d.timestamp);
          const y = yScale(d.value);
          hoverLine
            .attr('x1', x)
            .attr('x2', x)
            .style('opacity', '0.5');

          hoverCircle
            .attr('cx', x)
            .attr('cy', y)
            .style('opacity', '1');

          // Fallback to 0 if percentageChange is undefined
          const pc = d.percentageChange ?? 0;
          const sign = pc > 0 ? '+' : '';
          hoverText
            .attr('x', x)
            .attr('y', y - 10)
            .attr('text-anchor', x > innerWidth / 2 ? 'end' : 'start')
            .text(`$${d.value.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${sign}${pc.toFixed(2)}%)`)
            .style('opacity', '1');
        }
      })
      .on('mouseleave', function() {
        hoverLine.style('opacity', '0');
        hoverCircle.style('opacity', '0');
        hoverText.style('opacity', '0');
      });

  }, [data, calculations]);

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="w-full h-[150px] animate-pulse bg-[#131820] rounded-xl" />
        <div className="flex justify-between h-[40px] border-[#2D394A] border-solid border-1 rounded-full p-1 items-center w-full animate-pulse bg-[#131820]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full space-y-4">
        <div className="w-full h-[150px] flex items-center justify-center bg-[#131820] rounded-xl">
          <p className="text-red-500">Failed to load chart data</p>
        </div>
        <div className="flex justify-between h-[40px] border-[#2D394A] border-solid border-1 rounded-full p-1 items-center w-full" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center px-2">
        <span className="text-sm text-white/70">Portfolio Change</span>
        <span className={`text-sm font-medium ${
          !calculations || calculations.percentageChange === 0 
            ? 'text-white/70' 
            : calculations.isPositive 
              ? 'text-[#4ED342]' 
              : 'text-red-500'
        }`}>
          {!calculations || data.length === 0 ? '0.00%' : (
            `${calculations.percentageChange > 0 ? '+' : ''}${calculations.percentageChange.toFixed(2)}%`
          )}
        </span>
      </div>
      <div className="w-full h-[150px]">
        {data.length > 0 ? (
          <svg ref={svgRef} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#131820] rounded-xl">
            <p className="text-white/50">No data available</p>
          </div>
        )}
      </div>
      
      {/* Time period selector */}
      <div className="flex justify-between h-[40px] border-[#2D394A] border-solid border-1 rounded-full p-1 items-center w-full">
        {PERIODS.map(period => (
          <button
            key={period.value}
            className={`px-4 py-2 text-xs font-medium transition-all ${
              selectedPeriod === period.value
                ? 'text-[white] px-6 bg-[#2D394A] rounded-full'
                : 'text-white/50 hover:text-white'
            }`}
            onClick={() => onPeriodChange?.(period.value)}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}
