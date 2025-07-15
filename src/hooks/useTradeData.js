import { useState, useEffect, useCallback, useRef } from 'react';
import { tradeService, portfolioService } from '../api';
import * as authService from '../api/services/auth.service';

const CACHE_DURATION = 10000; // 10 seconds
const POLL_INTERVAL = 3000; // 30 seconds

export function useTradeData(userId, walletAddress) {
  const [trades, setTrades] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [userProfileSettings, setUserProfileSettings] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loadingStates, setLoadingStates] = useState({
    profile: true,
    portfolio: true,
    trades: true
  });
  const [errors, setErrors] = useState({
    profile: null,
    portfolio: null,
    trades: null
  });

  // Cache ref to avoid re-renders
  const cache = useRef({
    trades: new Map(),
    portfolio: new Map(),
    profile: new Map(),
    lastFetch: new Map()
  });

  // This ref prevents the "create trades if empty" logic from running twice
  // in React 18 Strict Mode. If you want repeated creation logic on subsequent
  // polls, remove this or handle differently.
  const creationHasRunRef = useRef(false);

  // Transform and merge data
  const processTradeData = useCallback((tradesArray, portfolioArray) => {
    if (!tradesArray || !portfolioArray) return [];

    return tradesArray.map(trade => ({
      ...trade,
      // Attempt to match up with portfolio data by contract_address (normalized)
      portfolioData: portfolioArray.find(
        p => p.contractAddress === trade.contract_address
      ),
      // Example: currentValue
      currentValue:
        trade.balance *
        (portfolioArray.find(
          p => p.contractAddress === trade.contract_address
        )?.price || 0),
      // Example: formatted date
      formattedDate: new Date(trade.created_at).toLocaleString()
    }));
  }, []);

  // Check if cache is valid
  const isCacheValid = useCallback((key) => {
    const lastFetch = cache.current.lastFetch.get(key);
    return lastFetch && (Date.now() - lastFetch) < CACHE_DURATION;
  }, []);

  // Fetch profile settings with cache
  const fetchProfileSettings = useCallback(async (retries = 3) => {
    if (!userId) return;

    // Check cache
    if (isCacheValid('profile')) {
      const cachedData = cache.current.profile.get(userId);
      if (cachedData) {
        setUserProfileSettings(cachedData);
        setLoadingStates(prev => ({ ...prev, profile: false }));
        return;
      }
    }

    try {
      const settings = await authService.checkUserProfileSettingsExists(userId);
      //console.log("settings:", settings);
      // Update cache
      cache.current.profile.set(userId, settings);
      cache.current.lastFetch.set('profile', Date.now());

      setUserProfileSettings(settings);
      setLoadingStates(prev => ({ ...prev, profile: false }));
      setErrors(prev => ({ ...prev, profile: null }));
    } catch (err) {
      console.error('Error fetching profile settings:', err);
      if (retries > 0 && err.message?.includes('Network Error')) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchProfileSettings(retries - 1);
      }
      setErrors(prev => ({ ...prev, profile: err.message }));
      setLoadingStates(prev => ({ ...prev, profile: false }));
    }
  }, [userId, isCacheValid]);

  // Fetch trades and portfolio with cache
  const fetchTradesAndPortfolio = useCallback(async (retries = 3) => {
    if (!userId || !walletAddress) return;

    const cacheKey = `${userId}-${walletAddress}`;

    // Check cache
    if (isCacheValid('trades')) {
      const cachedTrades = cache.current.trades.get(cacheKey);
      const cachedPortfolio = cache.current.portfolio.get(cacheKey);
      if (cachedTrades && cachedPortfolio) {
        setTrades(cachedTrades);
        setPortfolio(cachedPortfolio);
        setLoadingStates(prev => ({
          ...prev,
          portfolio: false,
          trades: false
        }));
        return;
      }
    }

    try {
      let finalTradeData;

      // Fetch in parallel
      const [portfolioData, tradesData] = await Promise.all([
        portfolioService.getPortfolio(walletAddress),
        tradeService.getUserTrades(userId)
      ]);

      finalTradeData = tradesData;
      const settingsProfile = await authService.checkUserProfileSettingsExists(userId);

      //console.log("FINAL TRADES DATA: ", finalTradeData);

      // If no trades exist, attempt to create them from portfolio
      // if (!creationHasRunRef.current) {
      //   creationHasRunRef.current = true; // Prevent second run in Strict Mode

      //   try {
      //     const userPortfolioData = await portfolioService.getPortfolio(walletAddress);
      //     console.log("userPortfolioData:", userPortfolioData);
      //     const userHoldingTrades = await tradeService.getUserTrades(userId);

      //     // Create a map of existing trades keyed by lowercase contract_address
      //     const tradeDataMap = userHoldingTrades
      //       ? new Map(
      //         userHoldingTrades.map(trade => [
      //           trade.contract_address,
      //           trade
      //         ])
      //       )
      //       : new Map();

      //     // Create a set of existing contract addresses
      //     let tradeContractAddresses = userHoldingTrades
      //       ? new Set(
      //         userHoldingTrades.map(trade => trade.contract_address)
      //       )
      //       : new Set();

      //     for (const token of userPortfolioData) {
      //       // Always normalize the address
      //       const normalizedAddress = token.contractAddress;
      //       const portfolioAmount = token.amount;
      //       const existingTrade = tradeDataMap.get(normalizedAddress);

      //       // If trade exists, update if needed
      //       if (existingTrade) {
      //         if (portfolioAmount !== existingTrade.balance) {
      //           let trackingPrice, entryPrice, currentPrice;
      //           let stopLoss, takeProfit, percentageChange;

      //           if (portfolioAmount > 0 && existingTrade.tracking_price.length === 0) {
      //             trackingPrice = [
      //               {
      //                 created_at: new Date().toISOString(),
      //                 current_price: token.price,
      //                 percentage_change: 0.0,
      //                 balance: token.amount,
      //                 total_price_usd: token.price * token.amount
      //               }
      //             ];
      //             entryPrice = token.price;
      //             currentPrice = token.price;
      //             stopLoss = token.price - token.price * settingsProfile.stop_loss;
      //             takeProfit = token.price + token.price * settingsProfile.take_profit;
      //             percentageChange = 0.0;
      //           } else if (portfolioAmount > 0 && existingTrade.tracking_price.length > 0) {
      //             trackingPrice = existingTrade.tracking_price;
      //             entryPrice = existingTrade.entry_price;
      //             currentPrice = existingTrade.current_price;
      //             stopLoss = existingTrade.stop_loss;
      //             takeProfit = existingTrade.take_profit;
      //             percentageChange = existingTrade.percentage_change;
      //           } else {
      //             // If portfolioAmount == 0
      //             trackingPrice = [];
      //             entryPrice = 0.0;
      //             currentPrice = 0.0;
      //             stopLoss = 0.0;
      //             takeProfit = 0.0;
      //             percentageChange = 0.0;
      //           }

      //           const updatePayload = {
      //             ...existingTrade,
      //             balance: portfolioAmount,
      //             // Also store in DB as lowercase if possible
      //             contract_address: normalizedAddress,
      //             price_usd: token.price * portfolioAmount,
      //             updated_at: new Date().toISOString(),
      //             status: portfolioAmount > 0 ? "Open" : "Closed",
      //             entry_price: entryPrice,
      //             current_price: currentPrice,
      //             stop_loss: stopLoss,
      //             take_profit: takeProfit,
      //             percentage_change: percentageChange,
      //             tracking_price: trackingPrice
      //           };

      //           await tradeService.updateTrade(existingTrade.trade_id, updatePayload);
      //         }
      //       }
      //       // If trade does not exist, create it
      //       else if (token.amount > 0 && !tradeContractAddresses.has(normalizedAddress)) {
      //         const payload = {
      //           user_id: userId,
      //           status: "Open",
      //           type_of_trade: "Holding",
      //           cashtag: token.symbol,
      //           token_img_url: token.imgUrl,
      //           provider: "Holding",
      //           tags: [],
      //           entry_price: token.price,
      //           current_price: token.price,
      //           stop_loss: token.price - token.price * settingsProfile.stop_loss,
      //           take_profit: token.price + token.price * settingsProfile.take_profit,
      //           percentage_change: 0,
      //           extra_info: [],
      //           // Store addresses in lowercase
      //           contract_address: normalizedAddress,
      //           coin_name: token.name,
      //           tracking_price: [
      //             {
      //               created_at: new Date().toISOString(),
      //               current_price: token.price,
      //               percentage_change: 0.0,
      //               balance: token.amount,
      //               total_price_usd: token.price * token.amount
      //             }
      //           ],
      //           price_usd: token.price * token.amount,
      //           balance: token.amount,
      //           coin_id: token.coinId
      //         };

      //         const newTrade = await tradeService.createTrade(payload);
      //         tradeContractAddresses.add(normalizedAddress);
      //         //console.log("new trade created", newTrade);
      //       }
      //     }

      //     // Re-fetch trades after creation so future polls see updated DB state
      //     const updatedUserTrades = await tradeService.getUserTrades(userId);
      //     finalTradeData = updatedUserTrades;
      //   } catch (error) {
      //     console.error("Error in createTrades:", error);
      //     throw error;
      //   }
      // }

      if (!creationHasRunRef.current) {
        creationHasRunRef.current = true; // Prevent second run in Strict Mode

        try {
          const userPortfolioData = await portfolioService.getPortfolio(walletAddress);
          console.log("userPortfolioData:", userPortfolioData);
          const userHoldingTrades = await tradeService.getUserTrades(userId);
          console.log("userHoldingTrades:", userHoldingTrades);

          // Group trades by contract address instead of assuming one per address
          const tradeDataMap = {};
          if (userHoldingTrades) {
            userHoldingTrades.forEach((trade) => {
              const normalizedAddress = trade.contract_address;
              if (!tradeDataMap[normalizedAddress]) {
                tradeDataMap[normalizedAddress] = [];
              }
              tradeDataMap[normalizedAddress].push(trade);
            });
          }

          // Iterate over each token from the portfolio
          for (const token of userPortfolioData) {
            const normalizedAddress = token.contractAddress;
            const portfolioAmount = token.amount;
            const tradesForToken = tradeDataMap[normalizedAddress] || [];

            if (tradesForToken.length > 0) {
              // Update each existing trade for this token
              for (const trade of tradesForToken) {
                // For AI trades, update based on percentage change rather than the portfolio amount
                if (trade.type_of_trade === "AI" && trade.status !== "Closed") {
                  console.log("trade.type_of_trade", trade.type_of_trade);
                  console.log("trade.status", trade.status);
                  // Calculate the percentage change based on the entry price and current token price
                  const percentageChange = (token.price - trade.entry_price) / trade.entry_price;
                  // New balance is computed from the old balance and the percentage change
                  const newBalance = trade.balance + trade.balance * percentageChange;
                  const newPriceUsd = token.price * newBalance;

                  // Update tracking_price array: create it if empty or append a new tracking record
                  let trackingPrice = trade.tracking_price;
                  if (!trackingPrice || trackingPrice.length === 0) {
                    trackingPrice = [
                      {
                        created_at: new Date().toISOString(),
                        current_price: token.price,
                        percentage_change: percentageChange,
                        balance: newBalance,
                        total_price_usd: newPriceUsd,
                      },
                    ];
                  } else {
                    trackingPrice.push({
                      created_at: new Date().toISOString(),
                      current_price: token.price,
                      percentage_change: percentageChange,
                      balance: newBalance,
                      total_price_usd: newPriceUsd,
                    });
                  }

                  const updatePayload = {
                    ...trade,
                    balance: newBalance,
                    price_usd: newPriceUsd,
                    updated_at: new Date().toISOString(),
                    status: trade.status,
                    current_price: token.price,
                    stop_loss: token.price - token.price * settingsProfile.stop_loss,
                    take_profit: token.price + token.price * settingsProfile.take_profit,
                    percentage_change: percentageChange,
                    tracking_price: trackingPrice,
                  };

                  await tradeService.updateTrade(trade.trade_id, updatePayload);
                } else if (trade.type_of_trade !== "AI") {
                  console.log("trade id", trade.trade_id);
                  // For non-AI trades, update based on the portfolio amount if it's different from the trade's current balance
                  if (portfolioAmount !== trade.balance) {
                    let trackingPrice, entryPrice, currentPrice;
                    let stopLoss, takeProfit, percentageChange;

                    if (portfolioAmount > 0 && (!trade.tracking_price || trade.tracking_price.length === 0)) {
                      trackingPrice = [
                        {
                          created_at: new Date().toISOString(),
                          current_price: token.price,
                          percentage_change: 0.0,
                          balance: token.amount,
                          total_price_usd: token.price * token.amount,
                        },
                      ];
                      entryPrice = token.price;
                      currentPrice = token.price;
                      stopLoss = token.price - token.price * settingsProfile.stop_loss;
                      takeProfit = token.price + token.price * settingsProfile.take_profit;
                      percentageChange = 0.0;
                    } else if (portfolioAmount > 0 && trade.tracking_price && trade.tracking_price.length > 0) {
                      trackingPrice = trade.tracking_price;
                      entryPrice = trade.entry_price;
                      currentPrice = trade.current_price;
                      stopLoss = trade.stop_loss;
                      takeProfit = trade.take_profit;
                      percentageChange = trade.percentage_change;
                    } else {
                      trackingPrice = [];
                      entryPrice = 0.0;
                      currentPrice = 0.0;
                      stopLoss = 0.0;
                      takeProfit = 0.0;
                      percentageChange = 0.0;
                    }

                    const updatePayload = {
                      ...trade,
                      balance: portfolioAmount,
                      // Ensure the contract address is normalized
                      contract_address: normalizedAddress,
                      price_usd: token.price * portfolioAmount,
                      updated_at: new Date().toISOString(),
                      status: portfolioAmount > 0 ? "Open" : "Closed",
                      entry_price: entryPrice,
                      current_price: currentPrice,
                      stop_loss: stopLoss,
                      take_profit: takeProfit,
                      percentage_change: percentageChange,
                      tracking_price: trackingPrice,
                      provider: trade.provider == "AI" ? "Holding" : "Holding"
                    };
                    console.log("updatePayload:", updatePayload);

                    await tradeService.updateTrade(trade.trade_id, updatePayload);
                  }
                }
              }
            }
            // If there are no trades for this token and the portfolio has a balance, create a new trade
            else if (token.amount > 0) {
              const payload = {
                user_id: userId,
                status: "Open",
                type_of_trade: "Holding", // default type for new trades
                cashtag: token.symbol,
                token_img_url: token.imgUrl,
                provider: "Holding",
                tags: [],
                entry_price: token.price,
                current_price: token.price,
                stop_loss: token.price - token.price * settingsProfile.stop_loss,
                take_profit: token.price + token.price * settingsProfile.take_profit,
                percentage_change: 0,
                extra_info: [],
                // Store addresses in lowercase if needed
                contract_address: normalizedAddress,
                coin_name: token.name,
                tracking_price: [
                  {
                    created_at: new Date().toISOString(),
                    current_price: token.price,
                    percentage_change: 0.0,
                    balance: token.amount,
                    total_price_usd: token.price * token.amount,
                  },
                ],
                price_usd: token.price * token.amount,
                balance: token.amount,
                coin_id: token.coinId,
              };

              const newTrade = await tradeService.createTrade(payload);
              // Optionally, add the new trade to tradeDataMap if needed for later processing
              if (!tradeDataMap[normalizedAddress]) {
                tradeDataMap[normalizedAddress] = [];
              }
              tradeDataMap[normalizedAddress].push(newTrade);
            }
          }

          // Re-fetch trades after creation/update so future polls see updated DB state
          const updatedUserTrades = await tradeService.getUserTrades(userId);
          finalTradeData = updatedUserTrades;
        } catch (error) {
          console.error("Error in createTrades:", error);
          throw error;
        }
      }


      // Process and merge data
      const processedTrades = processTradeData(finalTradeData, portfolioData);

      // Update cache
      cache.current.trades.set(cacheKey, processedTrades);
      cache.current.portfolio.set(cacheKey, portfolioData);
      cache.current.lastFetch.set('trades', Date.now());

      setPortfolio(portfolioData);
      setTrades(processedTrades);
      setLoadingStates(prev => ({
        ...prev,
        portfolio: false,
        trades: false
      }));
      setErrors(prev => ({
        ...prev,
        portfolio: null,
        trades: null
      }));
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      if (retries > 0 && err.message?.includes('Network Error')) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchTradesAndPortfolio(retries - 1);
      }
      setErrors(prev => ({
        ...prev,
        portfolio: err.message,
        trades: err.message
      }));
      setLoadingStates(prev => ({
        ...prev,
        portfolio: false,
        trades: false
      }));
    }
  }, [userId, walletAddress, processTradeData, isCacheValid]);

  // Initial profile settings fetch
  useEffect(() => {
    if (!userId || !walletAddress) return;
    fetchProfileSettings();
  }, [userId, walletAddress, fetchProfileSettings]);

  // Polling effect for trades and portfolio
  useEffect(() => {
    if (!userId || !walletAddress) {
      setErrors(prev => ({
        ...prev,
        portfolio: 'Missing user data or wallet',
        trades: 'Missing user data or wallet'
      }));
      setLoadingStates(prev => ({
        ...prev,
        portfolio: false,
        trades: false
      }));
      return;
    }

    let isSubscribed = true;

    // Initial fetch
    if (isSubscribed) {
      fetchTradesAndPortfolio();
    }

    // Set up polling interval
    const intervalId = setInterval(() => {
      if (isSubscribed) {
        fetchTradesAndPortfolio();
      }
    }, POLL_INTERVAL);

    // Cleanup
    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, [userId, walletAddress, fetchTradesAndPortfolio]);

  return {
    trades,
    portfolio,
    userProfileSettings,
    lastUpdate,
    loadingStates,
    errors
  };
}
