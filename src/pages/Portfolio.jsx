import { useState, useEffect, useMemo } from 'react'
import { usePortfolioCalculations } from '../hooks/usePortfolioCalculations'
import { portfolioService, tradeService } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useProfileSettings } from '../hooks/useProfileSettings'
import { useTradeData } from '../hooks/useTradeData'
import PortfolioHeader from '../components/features/portfolio/PortfolioHeader'
import PortfolioChart from '../components/features/portfolio/PortfolioChart'
import PortfolioAssets from '../components/features/portfolio/PortfolioAssets'

export default function Portfolio() {
  const { userData } = useAuth();
  const [portfolioData, setPortfolioData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('1w')

  // Get profile settings and trade data
  const {
    profileSettings,
    isLoading: profileLoading,
    error: profileError
  } = useProfileSettings(
    userData?.user_id,
    userData?.crypto_wallet_address
  );

  const {
    trades,
    isLoading: tradesLoading,
    error: tradesError
  } = useTradeData(
    userData?.user_id,
    userData?.crypto_wallet_address
  );


  useEffect(() => {
    let isMounted = true;

    const fetchPortfolio = async () => {
      try {
        setError(null);
        if (!userData?.crypto_wallet_address) {
          setError('No wallet address found');
          return;
        }
        const data = await portfolioService.getPortfolio(userData.crypto_wallet_address);
        if (!isMounted) return;
        //console.log("data.data for portfolio data: ", data)
        setPortfolioData(data);
      } catch (err) {
        if (!isMounted) return;
        setError('Failed to load portfolio data');
        console.error('Portfolio fetch error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPortfolio();

    return () => {
      isMounted = false;
    };
  }, [userData]);

  // Get active trades for portfolio calculations
  const activeTrades = useMemo(() => {
    if (!trades || !portfolioData) return [];
    return trades.filter(trade =>
      portfolioData.some(token =>
        token.contractAddress === trade.contract_address
      )
    );
  }, [trades, portfolioData]);

  // Calculate portfolio data
  const portfolioCalculations = usePortfolioCalculations(activeTrades, portfolioData, selectedPeriod);

  // Loading state
  const isPageLoading = isLoading || profileLoading || tradesLoading;
  const pageError = error || profileError || tradesError;

  return (
    <div className="flex flex-col gap-4 pt-10 pb-10">
      <div className="flex flex-col gap-4">
        <PortfolioHeader
          portfolioData={portfolioData}
          calculations={isPageLoading ? null : portfolioCalculations}
          isLoading={isPageLoading}
          error={pageError}
        />

        <PortfolioChart
          calculations={isPageLoading ? null : portfolioCalculations}
          isLoading={isPageLoading}
          error={pageError}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      </div>

      <PortfolioAssets
        portfolioData={portfolioData}
        trades={trades}
        profileSettings={profileSettings}
        isLoading={isLoading || tradesLoading || profileLoading}
        error={error || tradesError || profileError}
      />
    </div>
  )
}
