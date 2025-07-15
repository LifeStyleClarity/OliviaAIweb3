import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ArrowDownRight,
  CreditCard,
  Info
} from 'lucide-react';
import PropTypes from 'prop-types';
import {
  useDisclosure,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody
} from '@heroui/react';
import Button from '../../ui/Button';
import TokenChart from './TokenChart';
import SellButton from './SellButton';
import TokenTradeHistory from './TokenTradeHistory';
import { startOliviaChat } from '../../../utils/olivia';
import { transactionService } from '../../../api';
import { useTonWallet } from "@tonconnect/ui-react";

export default function PortfolioAssets({ portfolioData, trades, isLoading, error }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { userData } = useAuth();
  const [selectedToken, setSelectedToken] = useState(null);
  const [buyingTon, setBuyingTon] = useState(false);
  const [buyTonError, setBuyTonError] = useState("");
  const [buyTonSuccess, setBuyTonSuccess] = useState(null);
  const wallet = useTonWallet();

  // State for changes received from TokenChart.
  const [chartChanges, setChartChanges] = useState({ percentage: 0, dollar: 0 });

  const calculatePortfolioPercentage = (token, allTokens) => {
    if (!token || !allTokens?.length) return '0.00';
    const totalPortfolioValue = allTokens.reduce((sum, t) => sum + t.totalValue, 0);
    return ((token.totalValue / totalPortfolioValue) * 100).toFixed(2);
  };

  const findTradeData = (token) => {
    if (!trades) return { holdingTrade: null, aiTrades: [] };
    
    // Find the Holding trade data specifically
    const holdingTrade = trades.find(trade => 
      trade.contract_address === token.contractAddress && 
      trade.type_of_trade === "Holding"
    );
    
    // Find all AI trades for this token
    const aiTrades = trades.filter(trade => 
      trade.contract_address === token.contractAddress && 
      trade.type_of_trade === "AI"
    );
    
    return { holdingTrade, aiTrades };
  };

  const handleTokenClick = (token) => {
    const { holdingTrade, aiTrades } = findTradeData(token);
    setSelectedToken({
      ...token,
      tradeData: holdingTrade,
      aiTrades: aiTrades
    });
    onOpen();
  };

  const handleBuyTonWithCreditCard = async () => {
    if (!wallet) {
      setBuyTonError("Please connect your wallet first");
      return;
    }
    try {
      setBuyingTon(true);
      setBuyTonError("");
      setBuyTonSuccess(null);
      const amount = 1;
      const result = await transactionService.buyTonWithCreditCard(
        wallet.account.address,
        amount
      );
      setBuyTonSuccess(result);
      const paymentUrl = result.payment_url || result.payinUrl || result.redirect_url;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        setBuyTonSuccess({
          ...result,
          message: "Transaction initiated. Please check your email for payment instructions."
        });
      }
    } catch (error) {
      console.error("Error buying TON with credit card:", error);
      setBuyTonError(error.message || "Failed to process transaction");
    } finally {
      setBuyingTon(false);
    }
  };

  const renderDrawerContent = () => (
    <div className="flex flex-col h-full text-white">
      <div className="flex flex-col items-center">
        {/* Token Icon */}
        <div className="w-[64px] h-[64px] rounded-full overflow-hidden">
          <img
            src={selectedToken?.imgUrl}
            alt={selectedToken?.name}
            className="w-full h-full object-cover border-2 border-white/10 bg-white/10 border-solid rounded-full"
          />
        </div>

        {/* Price Display */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-[40px] font-semibold">
            ${selectedToken?.totalValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <div className="flex items-center -mt-3">
            {/* Dollar change pill showing both the dollar and percentage change */}
            <div className={`
              rounded-full py-0.5 px-2 text-[12px] flex justify-center items-center gap-1 font-medium border transition-all duration-250
              ${chartChanges.percentage === 0
                ? 'text-white/70 bg-white/5 border-white/10'
                : chartChanges.percentage > 0
                  ? 'text-[#4ED342] bg-[#4ED342]/20 border-[#4ED342]/40'
                  : 'text-red-500 bg-red-500/20 border-red-500/40'}
            `}>
              {/* {chartChanges.dollar > 0 ? '+' : ''}$
              {Math.abs(chartChanges.dollar).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} */}
              <span className="ml-1">
                ({chartChanges.percentage > 0 ? '+' : ''}{chartChanges.percentage.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full max-w-md mt-8">
          {selectedToken?.name === 'Toncoin' && selectedToken?.symbol === 'TON' ? (
            <div className='flex w-full flex-col justify-center items-center'>
              <Button
                onPress={handleBuyTonWithCreditCard}
                className="flex-1 py-3 px-6 bg-gradient-to-r rounded-full from-[#31F46E] to-[#0AFDE1] hover:opacity-90 gap-2 text-black"
                size="md"
                isDisabled={true}
              >
                {buyingTon ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" /> Buy TON With Credit Card
                  </>
                )}
              </Button>
              {buyTonError && (
                <div className="w-full mt-2 p-2 bg-red-500/20 border border-red-500/40 rounded-lg">
                  <p className="text-xs text-red-500">{buyTonError}</p>
                </div>
              )}
              {buyTonSuccess && (
                <div className="w-full mt-2 p-2 bg-green-500/20 border border-green-500/40 rounded-lg">
                  <p className="text-xs text-green-500">Transaction initiated successfully!</p>
                </div>
              )}
              <div className="w-full text-center mt-2">
                <span className="text-xs text-white/50">
                  Powered by <a
                    href="https://changenow.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#31F46E] underline"
                  >
                    ChangeNOW
                  </a>
                </span>
              </div>
            </div>
          ) : (
            <>
              <Button
                onPress={() => startOliviaChat({
                  action: "quick_chat",
                  message: `Can you buy me $${selectedToken?.symbol}`,
                  suggestions: ["Portfolio overview", "Market analysis", "Trading opportunities"],
                  sendMessage: true
                })}
                className="flex-1 bg-gradient-to-r rounded-full from-[#31F46E] to-[#0AFDE1] hover:opacity-90 gap-2 text-black"
                size="md"
              >
                Buy <ArrowDownRight className="w-4 h-4 rotate-90" />
              </Button>
              <SellButton token={{
                name: selectedToken?.name,
                symbol: selectedToken?.symbol,
                amount: selectedToken?.amount,
                decimals: selectedToken?.decimals,
                price: selectedToken?.price,
                contractAddress: selectedToken?.contractAddress
              }} />
            </>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-md mt-4">
          <div className="bg-transparent border-1 border-solid border-[#2D394A] rounded-xl p-4">
            <div className='flex items-center gap-1 '>
              <span className="text-sm text-white/70">Entry Price</span>
              <div className="group relative">
                <Info className="w-3 h-3 text-white/50" />
                <div
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
               px-3 py-2 bg-[#344256] text-xs text-white/80 rounded-lg opacity-0 
               group-hover:opacity-100 transition-opacity z-50 w-[162px] max-w-[162px]
               text-center pointer-events-none"
                >
                  By the time you came to Olivia AI and we started tracking your trade
                </div>
              </div>
            </div>
            <p className="text-lg mt-1">
              ${selectedToken?.tradeData?.tracking_price?.[0]?.current_price?.toLocaleString('en-US', {
                minimumFractionDigits: 6,
                maximumFractionDigits: 6
              }) || '0.00'}
            </p>
          </div>
          <div className="bg-transparent border-1 border-solid border-[#2D394A] rounded-xl p-4">
            <span className="text-sm text-white/70">Current Price</span>
            <p className="text-lg mt-1">
              ${selectedToken?.tradeData?.tracking_price?.[selectedToken?.tradeData?.tracking_price?.length - 1]?.current_price?.toLocaleString('en-US', {
                minimumFractionDigits: 6,
                maximumFractionDigits: 6
              }) || '0.00'}
            </p>
          </div>
          <div className="bg-transparent border-1 border-solid border-[#2D394A] rounded-xl p-4">
            <span className="text-sm text-white/70">Quantity</span>
            <p className="text-lg mt-1">
              {selectedToken?.amount.toFixed(4)}
            </p>
          </div>
          <div className="bg-transparent border-1 border-solid border-[#2D394A] rounded-xl p-4">
            <span className="text-sm text-white/70">% of Portfolio</span>
            <p className="text-lg mt-1">{calculatePortfolioPercentage(selectedToken, portfolioData)}%</p>
          </div>
        </div>

          {/* Token Chart */}
          <div className="w-full max-w-md mt-4">
            <TokenChart
              trackingData={selectedToken?.tradeData?.tracking_price}
              tokenSymbol={selectedToken?.symbol}
              onLatestChange={setChartChanges}
            />
          </div>

          {/* Trade History */}
          <TokenTradeHistory 
            userId={userData?.user_id}
            contractAddress={selectedToken?.contractAddress}
            tokenSymbol={selectedToken?.symbol}
            tokenImgUrl={selectedToken?.imgUrl}
          />
        </div>
      </div>
    );

  const defaultToncoin = {
    coinId: "the-open-network",
    amount: 0,
    contractAddress: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
    chain: "the-open-network",
    name: "Toncoin",
    symbol: "TON",
    price: 3.4570835810859957,
    priceBtc: 0.000039084719410047316,
    imgUrl: "https://static.coinstats.app/coins/1685602314954.png",
    pCh24h: -5,
    rank: 15,
    volume: 197197876.69876286,
    totalValue: 0,
    formattedAmount: 0,
    decimals: 9
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="w-full mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-medium">Holdings</h2>
          </div>
          <div className="flex items-center justify-center p-4 rounded-xl bg-[#131820]">
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      );
    }
    if (isLoading) {
      return (
        <div className="w-full mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-medium">Holdings</h2>
          </div>
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-[#131820] animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                <div className="flex flex-col gap-1 flex-1">
                  <div className="h-4 w-24 bg-gray-700 rounded"></div>
                  <div className="h-3 w-20 bg-gray-700 rounded"></div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="h-4 w-24 bg-gray-700 rounded"></div>
                  <div className="h-3 w-16 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    const hasToncoin = portfolioData?.some(token =>
      token.name === "Toncoin" && token.symbol === "TON"
    );
    let displayPortfolioData = [...(portfolioData || [])];
    if (!hasToncoin && displayPortfolioData) {
      displayPortfolioData.push(defaultToncoin);
    }
    return (
      <div className="w-full mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-medium">Holdings</h2>
        </div>
        <div className="flex flex-col gap-2">
          {displayPortfolioData
            .filter(token => token.amount > 0 || (token.name === "Toncoin" && token.symbol === "TON"))
            .map((token) => (
              <div
                key={token.symbol}
                className="flex items-center gap-3 p-4 rounded-xl bg-[#131820] hover:bg-[#1a202b] transition-colors cursor-pointer"
                onClick={() => handleTokenClick(token)}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border-[#1B1B1B] border-solid border-2">
                  <img
                    src={token.imgUrl}
                    alt={token.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <div className='flex justify-start items-center gap-2'>
                    <span className="text-[16px]">{token.name}</span>
                    <span className="text-[12px] text-white/70 font-extralight">({token.symbol})</span>
                  </div>
                  <p className='text-[14px]'>
                    {token.amount}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm">
                    ${token.totalValue.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const { holdingTrade } = findTradeData(token);
                      const percentageChange =
                        holdingTrade?.tracking_price?.[
                          holdingTrade?.tracking_price?.length - 1
                        ]?.percentage_change || 0;
                      return (
                        <>
                          {percentageChange !== 0 && (
                            <>
                              {percentageChange > 0 ? (
                                <TrendingUp className="w-3 h-3 text-[#4ED342]" />
                              ) : (
                                <TrendingDown className="w-3 h-3 text-red-500" />
                              )}
                            </>
                          )}
                          <span className={`text-xs ${percentageChange === 0
                            ? 'text-white/70'
                            : percentageChange > 0
                              ? 'text-[#4ED342]'
                              : 'text-red-500'
                            }`}>
                            {Math.abs(percentageChange).toFixed(2)}%
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      <Drawer
        hideCloseButton
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="right"
        size="full"
      >
        <DrawerContent className="bg-gradient-to-t from-[#181818] to-[#000000]">
          {(onClose) => (
            <>
              <DrawerHeader className="relative flex items-center justify-center px-6 py-4">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={onClose}
                  className="absolute left-6 text-white bg-[#1D2530] rounded-full h-10 w-10"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <h4 className="text-[16px] font-medium text-white">{selectedToken?.name}</h4>
              </DrawerHeader>
              <DrawerBody>
                {selectedToken && renderDrawerContent()}
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}

PortfolioAssets.propTypes = {
  portfolioData: PropTypes.arrayOf(
    PropTypes.shape({
      symbol: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      imgUrl: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      totalValue: PropTypes.number.isRequired,
      pCh24h: PropTypes.number.isRequired,
      contractAddress: PropTypes.string.isRequired
    })
  ),
  trades: PropTypes.arrayOf(
    PropTypes.shape({
      contract_address: PropTypes.string.isRequired,
      entry_price: PropTypes.number.isRequired,
      current_price: PropTypes.number.isRequired,
      tracking_price: PropTypes.arrayOf(
        PropTypes.shape({
          created_at: PropTypes.string.isRequired,
          current_price: PropTypes.number.isRequired,
          total_price_usd: PropTypes.number.isRequired
        })
      ).isRequired
    })
  ),
  isLoading: PropTypes.bool,
  error: PropTypes.string
};
