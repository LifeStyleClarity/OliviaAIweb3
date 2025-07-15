import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { tradeService } from "../../../api";
import TradeDetailsDrawer from "./TradeDetailsDrawer";
import { Info } from "lucide-react";

export default function TokenTradeHistory({
  userId,
  contractAddress,
  tokenSymbol,
  tokenImgUrl,
}) {
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger a refresh
  const [openTradeId, setOpenTradeId] = useState(null); // Track which drawer is open

  // Function to refresh the trades data
  const refreshTrades = useCallback(() => {
    setRefreshKey((prevKey) => prevKey + 1);
  }, []);

  // Function to handle drawer open/close
  const handleDrawerChange = useCallback((tradeId, isOpen) => {
    setOpenTradeId(isOpen ? tradeId : null);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const fetchTrades = async () => {
      if (!userId || !contractAddress) {
        setIsLoading(false);
        return;
      }

      try {
        if (trades.length === 0) {
          setIsLoading(true);
        }
        setError(null);

        // Fetch all trades for the user
        const userTrades = await tradeService.getUserTrades(userId);

        // Filter trades by contract address and type_of_trade: "AI"
        const filteredTrades = userTrades.filter(
          (trade) =>
            trade.contract_address === contractAddress &&
            trade.type_of_trade === "AI"
        );

        if (isMounted) {
          // Update trades without recreating all components
          setTrades((prevTrades) => {
            // If there's an open drawer, we need to preserve its trade object
            // to prevent the drawer from closing and reopening
            if (openTradeId) {
              // Find the currently open trade in the new data
              const openTradeInNewData = filteredTrades.find(
                (trade) => trade.trade_id === openTradeId
              );

              // Find the currently open trade in the previous data
              const openTradeInPrevData = prevTrades.find(
                (trade) => trade.trade_id === openTradeId
              );

              // If we found both, merge the data but preserve the object reference
              if (openTradeInNewData && openTradeInPrevData) {
                // Create a new array with all trades except the open one
                const tradesWithoutOpenTrade = filteredTrades.filter(
                  (trade) => trade.trade_id !== openTradeId
                );

                // Create an updated version of the open trade
                // by merging the new data into the existing object
                const updatedOpenTrade = {
                  ...openTradeInPrevData,
                  ...openTradeInNewData,
                };

                // Return a new array with all trades, including the updated open trade
                return [...tradesWithoutOpenTrade, updatedOpenTrade].sort(
                  (a, b) => new Date(b.created_at) - new Date(a.created_at)
                ); // Sort by date
              }
            }

            // If there's no open drawer or we couldn't find the open trade,
            // just return the new filtered trades
            return filteredTrades;
          });

          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching trades:", err);
        if (isMounted) {
          setError("Failed to load trade history");
          setIsLoading(false);
        }
      }
    };

    fetchTrades();

    // Set up interval to refresh data every 30 seconds
    intervalId = setInterval(() => {
      if (isMounted) {
        fetchTrades();
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [userId, contractAddress, refreshKey, openTradeId]); // Add openTradeId to dependencies since we use it in fetchTrades

  if (isLoading) {
    return (
      <div className="w-full max-w-md mt-6">
        <div className="flex justify-start items-center gap-2 mb-2">
          <h3 className="text-sm font-medium">Your Trades</h3>

          <div className="group relative">
            <Info className="w-3 h-3 text-white/50" />
            <div
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
            px-3 py-2 bg-[#344256] text-xs text-white/80 rounded-lg opacity-0 
            group-hover:opacity-100 transition-opacity z-50 w-[162px] max-w-[162px]
            text-center pointer-events-none"
            >
              By the time you came to Olivia AI and we started tracking your
              trade
            </div>
          </div>
        </div>
        <div className="border-[#2D394A] border-1 border-solid rounded-2xl p-4">
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-[#131820] rounded-xl p-3 flex justify-between items-center animate-pulse"
              >
                <div className="flex flex-col gap-1">
                  <div className="h-4 w-24 bg-gray-700 rounded"></div>
                  <div className="h-3 w-20 bg-gray-700 rounded"></div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="h-4 w-20 bg-gray-700 rounded"></div>
                  <div className="h-3 w-16 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md mt-6">
        <div className="flex justify-start items-center gap-2 mb-2">
          {" "}
          <h3 className="text-sm font-medium">Your Trades</h3>
          <div className="group relative">
            <Info className="w-3 h-3 text-white/50" />
            <div
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
            px-3 py-2 bg-[#344256] text-xs text-white/80 rounded-lg opacity-0 
            group-hover:opacity-100 transition-opacity z-50 w-[162px] max-w-[162px]
            text-center pointer-events-none"
            >
              By the time you came to Olivia AI and we started tracking your
              trade
            </div>
          </div>
        </div>
        <div className="border-[#2D394A] border-1 border-solid rounded-2xl p-4 flex justify-center items-center">
          <span className="text-red-500 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="w-full max-w-md mt-6">
        <div className="flex justify-start items-center gap-2 mb-2">
          {" "}
          <h3 className="text-sm font-medium">Your Trades</h3>
          <div className="group relative">
            <Info className="w-3 h-3 text-white/50" />
            <div
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
            px-3 py-2 bg-[#344256] text-xs text-white/80 rounded-lg opacity-0 
            group-hover:opacity-100 transition-opacity z-50 w-[162px] max-w-[162px]
            text-center pointer-events-none"
            >
              By the time you came to Olivia AI and we started tracking your
              trade
            </div>
          </div>
        </div>
        <div className="border-[#2D394A] border-1 border-solid rounded-2xl p-4 flex justify-center items-center">
          <span className="text-white/50 text-sm">
            No trades made for this token yet. Buy a token via Olivia!
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mt-6 pb-8 ">
      <div className="flex justify-start items-center gap-2 mb-2">
        {" "}
        <h3 className="text-sm font-medium">Your Trades</h3>
        <div className="group relative">
          <Info className="w-3 h-3 text-white/50" />
          <div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
            px-3 py-2 bg-[#344256] text-xs text-white/80 rounded-lg opacity-0 
            group-hover:opacity-100 transition-opacity z-50 w-[162px] max-w-[162px]
            text-center pointer-events-none"
          >
            Trades that have been executed using Olivia AI.
          </div>
        </div>
      </div>
      <div className="border-[#2D394A] border-1 border-solid rounded-2xl p-2">
        <div className="flex flex-col gap-2">
          {trades.map((trade) => (
            <TradeDetailsDrawer
              key={trade.trade_id}
              trade={trade}
              tokenSymbol={tokenSymbol}
              tokenImgUrl={tokenImgUrl}
              onTradeUpdate={refreshTrades}
              isOpen={openTradeId === trade.trade_id}
              onOpenChange={(isOpen) =>
                handleDrawerChange(trade.trade_id, isOpen)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

TokenTradeHistory.propTypes = {
  userId: PropTypes.string,
  contractAddress: PropTypes.string,
  tokenSymbol: PropTypes.string,
  tokenImgUrl: PropTypes.string,
};
