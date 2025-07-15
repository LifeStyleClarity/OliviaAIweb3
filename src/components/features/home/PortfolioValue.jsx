import { TrendingUp, TrendingDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { portfolioService } from '../../../api'
import { useAuth } from '../../../contexts/AuthContext'

export default function PortfolioValue() {
  // State for animated values
  const [value, setValue] = useState(0)
  const [percentageChange, setPercentageChange] = useState(0)
  const [isPositive, setIsPositive] = useState(true)
  const [error, setError] = useState(null)
  const { userData, telegramUser, setTelegramUser } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const fetchPortfolio = async () => {
      try {
        setError(null);

        //console.log("userData: ", userData)
        if (!userData?.crypto_wallet_address) {
          setError('No wallet address found');
          return;
        }

        const portfolioData = await portfolioService.getPortfolio(userData.crypto_wallet_address);

        if (!isMounted) return;

        // Calculate total portfolio value
        const totalValue = portfolioData.reduce((sum, token) => sum + token.totalValue, 0);

        // Calculate 24h change percentage (weighted average)
        const weightedChange = portfolioData.reduce((sum, token) => {
          const weight = token.totalValue / totalValue;
          return sum + (token.pCh24h * weight);
        }, 0);

        // Animate to the new values
        animateValues(totalValue, weightedChange);
        setIsPositive(weightedChange >= 0);

      } catch (err) {
        if (!isMounted) return;
        setError('Failed to load portfolio data');
        console.error('Portfolio fetch error:', err);
      }
    };

    fetchPortfolio();

    return () => {
      isMounted = false;
    };
  }, [userData]); // Re-run when userData changes

  const animateValues = (targetValue, targetPercentage) => {
    const duration = 2000;
    const steps = 120;
    const interval = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;

      if (currentStep === steps) {
        setValue(targetValue);
        setPercentageChange(targetPercentage);
        clearInterval(timer);
      } else {
        const progress = currentStep / steps;
        const easing = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        setValue(targetValue * easing);
        setPercentageChange(targetPercentage * easing);
      }
    }, interval);

    return () => clearInterval(timer);
  };

  return (
    <div className="rounded-xl p-6 w-full z-10">
      <div className="flex flex-col items-center gap-2">
        {/* Label */}
        <span className="text-sm text-white/70">
          Total Portfolio Value
        </span>

        {/* Value */}
        <span className="text-4xl font-regular">
          ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>

        {/* Percentage change */}
        <div className="flex items-center gap-1.5">
          {percentageChange !== 0 && (
            <div className="animate-pop-in">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-[#4ED342]" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
          )}
          <span className={`text-sm font-medium ${percentageChange === 0
            ? 'text-white'
            : isPositive
              ? 'text-[#4ED342]'
              : 'text-red-500'
            }`}>
            {Math.abs(percentageChange).toFixed(2)}%
          </span>
        </div>
        {error && !telegramUser && (
          <span className="text-sm text-red-500 mt-2">{error}</span>
        )}
      </div>
    </div>
  );
}
