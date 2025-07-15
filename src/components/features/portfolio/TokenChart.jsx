import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';

const PERIODS = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '1Y', value: '1y' },
  { label: 'YTD', value: 'ytd' }
];

TokenChart.propTypes = {
  trackingData: PropTypes.arrayOf(PropTypes.shape({
    created_at: PropTypes.string.isRequired,
    current_price: PropTypes.number.isRequired,
    total_price_usd: PropTypes.number.isRequired,
    percentage_change: PropTypes.number,
    balance: PropTypes.number
  })),
  tokenSymbol: PropTypes.string,
  onLatestChange: PropTypes.func // callback receives { percentage, dollar }
};

export default function TokenChart({ trackingData, tokenSymbol, onLatestChange }) {
  const svgRef = useRef(null);
  const [selectedPeriod, setSelectedPeriod] = useState('1w');

  // Determine the start date based on the selected period.
  const getStartDate = useCallback((period) => {
    const now = new Date();
    switch (period) {
      case '1d':
        return new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      case '1w':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '1m':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case 'ytd':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }, []);

  // Process the raw tracking data.
  const rawData = useMemo(() => {
    if (!trackingData?.length) return [];
    const computedStartDate = getStartDate(selectedPeriod).getTime();

    // Sort by date ascending.
    const sortedPoints = [...trackingData].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const earliestTimestamp = sortedPoints[0] && new Date(sortedPoints[0].created_at).getTime();
    // Use the earliest point if the computed start is earlier.
    const effectiveStartDate = earliestTimestamp && computedStartDate < earliestTimestamp
      ? earliestTimestamp
      : computedStartDate;

    // Find the last point before the effective start date as a baseline.
    const initialPoint = sortedPoints.filter(point => new Date(point.created_at).getTime() < effectiveStartDate).pop();
    // Get the points within the selected period.
    const periodPoints = sortedPoints.filter(point => new Date(point.created_at).getTime() >= effectiveStartDate);
    if (initialPoint && periodPoints.length > 0) {
      periodPoints.unshift(initialPoint);
    }
    const processedData = periodPoints.map(point => ({
      timestamp: new Date(point.created_at).getTime(),
      value: point.current_price,
      totalValue: point.total_price_usd,
      percentageChange: point.percentage_change || 0,
      balance: point.balance
    })).sort((a, b) => a.timestamp - b.timestamp);

    // Apply smoothing with an exponential moving average.
    const alpha = 0.3;
    let smoothedValue = processedData[0]?.value || 0;
    let smoothedPercentage = processedData[0]?.percentageChange || 0;
    return processedData.map(point => {
      smoothedValue = alpha * point.value + (1 - alpha) * smoothedValue;
      smoothedPercentage = alpha * point.percentageChange + (1 - alpha) * smoothedPercentage;
      return {
        ...point,
        value: smoothedValue,
        percentageChange: smoothedPercentage
      };
    });
  }, [trackingData, selectedPeriod, getStartDate]);

  // (Optional) Aggregate data for chart drawing.
  // Here we bucket data for smoother curves.
  const bucketIntervals = {
    '1d': 10 * 60 * 1000,       // 10 minutes
    '1w': 60 * 60 * 1000,        // 1 hour
    '1m': 4 * 24 * 60 * 60 * 1000, // 4 days
    '1y': 7 * 24 * 60 * 60 * 1000, // 1 week
    'ytd': 7 * 24 * 60 * 60 * 1000 // 1 week (adjust as needed)
  };

  const aggregateData = (data, bucketSize) => {
    const buckets = [];
    if (data.length === 0) return buckets;
    let bucketStart = data[0].timestamp;
    const endTime = data[data.length - 1].timestamp;
    let i = 0;
    while (bucketStart <= endTime) {
      const bucketEnd = bucketStart + bucketSize;
      const bucketPoints = [];
      while (i < data.length && data[i].timestamp < bucketEnd) {
        bucketPoints.push(data[i]);
        i++;
      }
      if (bucketPoints.length > 0) {
        // Average the values within the bucket.
        const sumPrice = bucketPoints.reduce((acc, p) => acc + p.value, 0);
        const sumTotal = bucketPoints.reduce((acc, p) => acc + p.totalValue, 0);
        const sumPercent = bucketPoints.reduce((acc, p) => acc + p.percentageChange, 0);
        buckets.push({
          timestamp: bucketPoints[0].timestamp,
          value: sumPrice / bucketPoints.length,
          totalValue: sumTotal / bucketPoints.length,
          percentageChange: sumPercent / bucketPoints.length
        });
      }
      bucketStart = bucketEnd;
    }
    return buckets;
  };

  const aggregatedData = useMemo(() => {
    if (!rawData.length) return [];
    const bucketSize = bucketIntervals[selectedPeriod];
    return aggregateData(rawData, bucketSize);
  }, [rawData, selectedPeriod]);

  // Compute changes directly from the raw (smoothed) data.
  const latestChange = useMemo(() => {
    if (rawData.length < 2) return 0;
    const initialValue = rawData[0].value;
    const finalValue = rawData[rawData.length - 1].value;
    return ((finalValue - initialValue) / initialValue) * 100;
  }, [rawData]);

  const dollarChange = useMemo(() => {
    if (rawData.length < 2) return 0;
    const initialTotal = rawData[0].totalValue;
    const finalTotal = rawData[rawData.length - 1].totalValue;
    return finalTotal - initialTotal;
  }, [rawData]);

  // Lift both changes to the parent.
  useEffect(() => {
    if (typeof onLatestChange === 'function') {
      onLatestChange({ percentage: latestChange, dollar: dollarChange });
    }
  }, [latestChange, dollarChange, onLatestChange]);

  // Draw the chart using the aggregated data.
  useEffect(() => {
    const data = aggregatedData;
    if (!svgRef.current || !data.length) return;
    d3.select(svgRef.current).selectAll("*").remove();
    const width = svgRef.current.clientWidth;
    const height = 120;
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.timestamp))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(data, d => d.value) * 0.99,
        d3.max(data, d => d.value) * 1.01
      ])
      .range([innerHeight, 0]);

    const line = d3.line()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.value))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const gradientId = `token-area-gradient-${Math.random().toString(36).substr(2, 9)}`;
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    const isPositive = latestChange >= 0;
    const lineColor = isPositive ? '#45EF34' : '#ef4545';
    const gradientStartOpacity = 0.2;
    const gradientEndOpacity = 0.02;

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', lineColor)
      .attr('stop-opacity', gradientStartOpacity);
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', lineColor)
      .attr('stop-opacity', gradientEndOpacity);

    const area = d3.area()
      .x(d => xScale(d.timestamp))
      .y0(innerHeight)
      .y1(d => yScale(d.value))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Hover elements.
    const hoverLine = g.append('line')
      .attr('class', 'hover-line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .style('stroke', lineColor)
      .style('stroke-width', '1px')
      .style('opacity', '0');
    const hoverCircle = g.append('circle')
      .attr('class', 'hover-circle')
      .attr('r', 4)
      .style('fill', lineColor)
      .style('opacity', '0');
    const hoverText = g.append('text')
      .attr('class', 'hover-text')
      .style('fill', lineColor)
      .style('font-size', '12px')
      .style('opacity', '0');

    g.append('path')
      .datum(data)
      .attr('class', 'area')
      .attr('d', area)
      .style('fill', `url(#${gradientId})`);
    g.append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', lineColor)
      .attr('stroke-width', 2)
      .attr('d', line);

    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mousemove', function (event) {
        const [mouseX] = d3.pointer(event);
        const x0 = xScale.invert(mouseX - margin.left);
        const bisect = d3.bisector(d => d.timestamp).left;
        const index = bisect(data, x0);
        const dPoint = data[index];
        if (dPoint) {
          const x = xScale(dPoint.timestamp);
          hoverLine.attr('x1', x).attr('x2', x).style('opacity', '0.5');
          hoverCircle.attr('cx', x).attr('cy', yScale(dPoint.value)).style('opacity', '1');
          const initialValue = data[0].value;
          const hoveredChange = ((dPoint.value - initialValue) / initialValue) * 100;
          hoverText
            .attr('x', x)
            .attr('y', yScale(dPoint.value) - 10)
            .attr('text-anchor', x > innerWidth / 2 ? 'end' : 'start')
            .text(`$${dPoint.value.toLocaleString('en-US', { minimumFractionDigits: 6 })} (${hoveredChange > 0 ? '+' : ''}${hoveredChange.toFixed(2)}%)`)
            .style('opacity', '1');
        }
      })
      .on('mouseleave', function () {
        hoverLine.style('opacity', '0');
        hoverCircle.style('opacity', '0');
        hoverText.style('opacity', '0');
      });
  }, [aggregatedData, latestChange]);

  return (
    <div className="w-full space-y-4">
      {/* Chart header showing overall PNL (percentage computed from raw data) */}
      <div className="w-full space-y-2">
        <div className="flex justify-between items-center px-2">
          <span className="text-sm text-white/70">PNL</span>
          <span className={`text-sm font-medium ${latestChange === 0
            ? 'text-white/70'
            : latestChange > 0
              ? 'text-[#4ED342]'
              : 'text-red-500'
            }`}>
            {latestChange > 0 ? '+' : ''}{latestChange.toFixed(2)}%
          </span>
        </div>
        <div className="w-full h-[120px]">
          {aggregatedData.length > 0 ? (
            <svg ref={svgRef} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#131820] rounded-xl">
              <p className="text-white/50">No price history available for {tokenSymbol || 'token'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Time period selector */}
      <div className="flex justify-between h-[40px] border-[#2D394A] border-solid border-1 rounded-full p-1 items-center w-full">
        {PERIODS.map(period => (
          <button
            key={period.value}
            className={`px-4 py-2 text-xs font-medium transition-all ${selectedPeriod === period.value
              ? 'text-[white] px-6 bg-[#2D394A] rounded-full'
              : 'text-white/50 hover:text-white'
              }`}
            onClick={() => setSelectedPeriod(period.value)}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}
