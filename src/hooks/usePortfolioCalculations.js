import { useMemo, useCallback } from 'react';

/**
 * Helper: get the start date for a given period.
 * For YTD, we ignore this value and instead compute it from the data.
 * @param {string} period - one of '1d', '1w', '1m', '1y', 'ytd'
 * @returns {Date} start date for the period (for non-YTD)
 */
const getStartDate = (period) => {
  const now = new Date();
  switch (period) {
    case '1d':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
    case '1w':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    case '1m':
      return new Date(now.setMonth(now.getMonth() - 1)); // 1 month ago
    case '1y':
      return new Date(now.setFullYear(now.getFullYear() - 1)); // 1 year ago
    case 'ytd':
      // For YTD, we will compute the min timestamp from data.
      return null;
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // fallback to 1w
  }
};

/**
 * Helper: returns the bin interval (in milliseconds) for a given period.
 * For YTD, you might choose a different interval if needed.
 * @param {string} period - one of '1d', '1w', '1m', '1y', 'ytd'
 * @returns {number} interval in milliseconds
 */
const getIntervalMs = (period) => {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  switch (period) {
    case '1d':
      return 10 * minute; // 10-minute gap
    case '1w':
      return hour; // 1-hour gap
    case '1m':
      return 4 * day; // 4-day gap
    case '1y':
      return 7 * day; // 1-week gap
    case 'ytd':
      return 24 * hour; // For YTD, using 1-day bins (adjust as needed)
    default:
      return hour; // fallback gap
  }
};

/**
 * Helper: Given a timestamp and an array of tracking points (sorted ascending by created_at),
 * returns the closest point whose created_at is less than or equal to the timestamp.
 * If none exists (i.e. the bin is before the first tracking point), we return the earliest point.
 * @param {number} timestamp - time in milliseconds
 * @param {Array} points - array of tracking points
 * @returns {Object|null} tracking point or null if no points exist
 */
const getClosestPointOnOrBefore = (timestamp, points) => {
  let closest = null;
  for (let i = 0; i < points.length; i++) {
    const ptTime = new Date(points[i].created_at).getTime();
    if (ptTime <= timestamp) {
      closest = points[i];
    } else {
      break;
    }
  }
  if (!closest && points.length > 0) {
    return points[0];
  }
  return closest;
};

/**
 * usePortfolioCalculations
 *
 * Merges the tracking data from all 'active' trades into a single portfolio value timeline.
 * Bins the timeline into uniform gaps depending on the selected period.
 *
 * For normal periods ('1d', '1w', '1m', '1y'), it uses a fixed start date.
 * For 'ytd', it uses the earliest and latest created_at timestamps from all trades to build
 * a grid that covers all available data. Then it sums up the total_price_usd for each bin.
 *
 * Finally, it computes the percentage and dollar change.
 *
 * @param {Array} trades - array of user trades (each trade has a 'tracking_price' array)
 * @param {Array} portfolioData - array of user tokens (optional, not used here for binning)
 * @param {String} selectedPeriod - one of '1d', '1w', '1m', '1y', 'ytd'
 * @returns {Object} processed portfolio data with timeseries and stats
 */
export const usePortfolioCalculations = (trades = [], portfolioData = [], selectedPeriod = '1w') => {
  //console.log("TRADDDDDES: ", trades);

  const processedData = useMemo(() => {
    // If no trades, return defaults.
    if (!trades.length) {
      return {
        timeseriesData: [],
        currentValue: 0,
        percentageChange: 0,
        dollarChange: 0,
        isPositive: true
      };
    }

    // Determine the time range.
    let startTime, endTime;
    if (selectedPeriod === 'ytd') {
      // For YTD (or MAX), use the earliest and latest created_at across all trades.
      let minTime = Infinity;
      let maxTime = -Infinity;
      trades.forEach(trade => {
        trade.tracking_price.forEach(pt => {
          const ts = new Date(pt.created_at).getTime();
          if (ts < minTime) minTime = ts;
          if (ts > maxTime) maxTime = ts;
        });
      });
      startTime = minTime;
      endTime = maxTime;
    } else {
      startTime = getStartDate(selectedPeriod).getTime();
      endTime = Date.now();
    }

    const intervalMs = getIntervalMs(selectedPeriod);

    // Create a uniform time grid from startTime to endTime.
    const timestamps = [];
    for (let t = startTime; t <= endTime; t += intervalMs) {
      timestamps.push(t);
    }

    // Build timeseries data.
    const timeseries = timestamps.map((timestamp) => {
      let totalValue = 0;
      trades.forEach((trade) => {
        // Sort the tracking points.
        const sortedPoints = [...trade.tracking_price].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        const closestPoint = getClosestPointOnOrBefore(timestamp, sortedPoints);
        if (closestPoint) {
          totalValue += closestPoint.total_price_usd;
        }
      });
      return {
        timestamp,
        value: totalValue
      };
    });

    if (!timeseries.length) {
      return {
        timeseriesData: [],
        currentValue: 0,
        percentageChange: 0,
        dollarChange: 0,
        isPositive: true
      };
    }

    // Calculate final stats.
    const firstValue = timeseries[0].value;
    const lastValue = timeseries[timeseries.length - 1].value;
    const dollarChange = lastValue - firstValue;
    const percentageChange = firstValue === 0 ? 0 : (dollarChange / firstValue) * 100;

    return {
      timeseriesData: timeseries,
      currentValue: lastValue,
      percentageChange,
      dollarChange,
      isPositive: dollarChange >= 0
    };
  }, [trades, portfolioData, selectedPeriod]);

  //console.log("PROCESSED DATA: ", processedData);
  return processedData;
};
