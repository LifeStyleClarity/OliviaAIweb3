import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { TrendingUp, TrendingDown, Plus } from 'lucide-react'

export default function PortfolioHeader({ 
  portfolioData = null, 
  calculations = null, 
  isLoading = false, 
  error = null 
}) {
  // State for animated values
  const [value, setValue] = useState(0)
  const [percentageChange, setPercentageChange] = useState(0)
  const [dollarChange, setDollarChange] = useState(0)
  const [isPositive, setIsPositive] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Calculate total portfolio value
  const totalValue = portfolioData?.reduce((sum, token) => sum + token.totalValue, 0) || 0;

  useEffect(() => {
    if (!isLoading) {
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }

      // Set the total value directly
      setValue(totalValue);

      // Get percentage and dollar changes from calculations
      if (calculations) {
        setPercentageChange(calculations.percentageChange);
        setDollarChange(calculations.dollarChange);
        setIsPositive(calculations.isPositive);
      }
    }
  }, [calculations, isLoading, isInitialLoad, totalValue]);

  if (isLoading) {
    return (
      <div className="w-full z-10">
        <div className="flex flex-col gap-1">
          {/* Label */}
          <div className="h-4 w-28 bg-gray-700 rounded animate-pulse"></div>

          {/* Value and button */}
          <div className="flex items-center justify-between mt-1">
            <div className="h-7 w-36 bg-gray-700 rounded animate-pulse"></div>
            <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>
          </div>

          {/* Change values */}
          <div className="flex items-center gap-1 mt-1">
            <div className="h-3 w-20 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-3 w-3 bg-gray-700 rounded-full mx-1 animate-pulse"></div>
            <div className="h-3 w-16 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" rounded-xl w-full z-10">
      <div className="flex flex-col -gap-2">
        {/* Label */}
        <span className="text-[16px] font-extralight text-white/70">
          Portfolio Balance
        </span>

        {/* Value */}
        <div className="flex items-end justify-between">
          <span className="text-[40px] font-semibold">
            ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Change values */}
        <div className="flex items-center gap-2 -mt-1">
          {/* Dollar change in pill */}
          <div 
            className={`
              rounded-full py-1 px-3 text-[14px] font-medium border transition-all duration-250
              ${dollarChange === 0 
                ? 'text-white/70 bg-white/5 border-white/10' 
                : dollarChange > 0
                  ? 'text-[#4ED342] bg-[#4ED342]/20 border-[#4ED342]/40'
                  : 'text-red-500 bg-red-500/20 border-red-500/40'
              }
            `}
          >
            {dollarChange === 0 ? '$0.00' : (
              `${dollarChange > 0 ? '+' : '-'}$${Math.abs(dollarChange).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}`
            )}
          </div>

          {/* Percentage change */}
          <div className="flex items-center gap-1">
            {percentageChange !== 0 && (
              <div className="animate-pop-in">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-[#4ED342]" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
              </div>
            )}
        <span className={`text-[14px] font-medium transition-colors duration-250 ${
          !calculations || percentageChange === 0 
            ? 'text-white/70' 
            : isPositive 
              ? 'text-[#4ED342]' 
              : 'text-red-500'
        }`}>
          {!calculations || percentageChange === 0 ? '0.00%' : `${Math.abs(percentageChange).toFixed(2)}%`}
        </span>
          </div>
        </div>
        {error && (
          <span className="text-sm text-red-500 mt-2">{error}</span>
        )}
      </div>
    </div>
  );
}

PortfolioHeader.propTypes = {
  portfolioData: PropTypes.arrayOf(
    PropTypes.shape({
      totalValue: PropTypes.number.isRequired
    })
  ),
  calculations: PropTypes.shape({
    percentageChange: PropTypes.number.isRequired,
    dollarChange: PropTypes.number.isRequired,
    isPositive: PropTypes.bool.isRequired
  }),
  isLoading: PropTypes.bool,
  error: PropTypes.string
};
