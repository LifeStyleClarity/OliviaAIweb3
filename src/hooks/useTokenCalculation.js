import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Hook to calculate token amounts and values based on TON price
 * @param {number} amount - Amount of TON or token percentage
 * @param {string} swapType - "Buy" or "Sell"
 * @param {number} tokenPriceUsd - Token price in USD
 * @param {string} walletAddress - User's wallet address
 * @param {string} contractAddress - Token contract address
 */
export function useTokenCalculation(amount, swapType, tokenPriceUsd, walletAddress, contractAddress) {
    const [calculation, setCalculation] = useState({
        loading: true,
        error: null,
        tokenAmount: 0,
        tonPrice: 0,
        usdValue: 0,
        availableAmount: 0,
    });

    useEffect(() => {
        let mounted = true;

        const calculateAmount = async () => {
            try {
                // Fetch current TON price
                // const tonResponse = await axios.get("https://ton-api-t2mh.onrender.com/utils/ton-info");
                const tonResponse = await axios.get("https://ton-api-zq6zv.ondigitalocean.app/utils/ton-info");
                // const tonResponse = await axios.get("http://localhost:3009/utils/ton-info");
                console.log(tonResponse);
                const tonPrice = tonResponse.data.price;

                if (!mounted) return;

                // Get user's token balance for both Buy and Sell
                const portfolioResponse = await axios.post(
                    // "https://ton-api-t2mh.onrender.com/get-portfolio",
                    "https://ton-api-zq6zv.ondigitalocean.app/get-portfolio",
                    { walletAddress: walletAddress },
                    { headers: { 'Content-Type': 'application/json' } }
                );

                if (!mounted) return;

                const token = portfolioResponse.data.portfolio.find(
                    t => t.contractAddress === contractAddress
                );

                const currentAmount = token ? token.amount : 0;

                if (swapType === "Buy") {
                    // For Buy: amount is in TON
                    const usdValue = amount * tonPrice;
                    const tokenAmount = usdValue / tokenPriceUsd;

                    setCalculation({
                        loading: false,
                        error: null,
                        tokenAmount,
                        tonPrice,
                        usdValue,
                        availableAmount: currentAmount,
                    });
                } else {
                    // For Sell: Use token balance from portfolio
                    if (!token) {
                        setCalculation({
                            loading: false,
                            error: "Token not found in portfolio",
                            tokenAmount: 0,
                            tonPrice,
                            usdValue: 0,
                            availableAmount: 0,
                        });
                        return;
                    }

                    // Calculate sell amount based on percentage
                    const sellAmount = (token.amount * amount) / 100;
                    const usdValue = sellAmount * tokenPriceUsd;
                    setCalculation({
                        loading: false,
                        error: null,
                        tokenAmount: sellAmount,
                        tonPrice,
                        usdValue,
                        availableAmount: token.amount,
                    });
                }
            } catch (error) {
                if (!mounted) return;
                setCalculation(prev => ({
                    ...prev,
                    loading: false,
                    error: error.message,
                }));

                // If there's an error, we'll try again in 10 seconds
                if (mounted) {
                    setTimeout(calculateAmount, 10000);
                }
            }
        };

        // Initial calculation
        calculateAmount();

        // Set up polling interval for successful updates
        const intervalId = setInterval(calculateAmount, 10000); // 10 seconds

        // Cleanup interval and mounted flag on unmount
        return () => {
            mounted = false;
            clearInterval(intervalId);
        };
    }, [amount, swapType, tokenPriceUsd, walletAddress, contractAddress]);

    return calculation;
}
