import { useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import * as authService from "../../api/services/auth.service";
import PropTypes from "prop-types";
import { useTokenCalculation } from "../../hooks/useTokenCalculation";
import { transactionService, tradeService, tokenService, socialService } from "../../api";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useTokenInfluencer } from "../../contexts/TokenInfluencerContext";

const SwapAction = ({
  meta,
  amount,
  swap_type,
  contract_address,
}) => {
  const wallet = useTonWallet();
  const walletAddress = wallet?.account?.address || "";
  const [isLoading, setIsLoading] = useState(false);
  // Transaction state
  const [trxStatus, setTrxStatus] = useState("");
  const [trxStatusAIMessage, setTrxStatusAIMessage] = useState("");
  const [transactionId, setTransactionId] = useState(null);
  const { userData } = useAuth();
  const { setTokenInfluencerData, selectedData } = useTokenInfluencer();
  // We don't need to store profile settings as state since we fetch them directly when needed

  // Function to convert raw token amount to UI amount
  const convertRawToUIAmount = (rawAmount, decimals) => {
    return Number(rawAmount) / Math.pow(10, decimals);
  };

  // Reference to track displayed statuses
  const displayedStatuses = useRef(new Set());
  const [tonConnectUI] = useTonConnectUI();
  const calculation = useTokenCalculation(
    amount,
    swap_type,
    Number(meta.dex_usd_price),
    walletAddress,
    contract_address
  );

  // Function to start polling for transaction verification
  const startVerificationPolling = async (walletAddress, contract_address, txData, maxAttempts = 10, interval = 3000) => {
    //console.log(`Starting verification polling for wallet: ${walletAddress}`);
    let attempts = 0;

    // Function to perform a single verification attempt
    const attemptVerification = async () => {
      attempts++;
      //console.log(`Verification attempt ${attempts}/${maxAttempts}`);

      try {
        const verificationResult = await transactionService.verifyTransaction(walletAddress);
        console.log(`Verification Result (attempt ${attempts}):`, verificationResult);

        if (verificationResult && verificationResult.success && verificationResult.data && verificationResult.data.transaction) {
          // Transaction verified successfully
          displayedStatuses.current.add("Transaction was successful");
          setTrxStatus("Transaction was successful");
          setTrxStatusAIMessage("Transaction was successful");

          // Save the transaction ID for the Tonscan link
          setTransactionId(verificationResult.data.transaction.eventId);

          // Create a trade if this is a successful swap
          if (verificationResult.data.transaction.actions &&
            verificationResult.data.transaction.actions[0] &&
            verificationResult.data.transaction.actions[0].JettonSwap &&
            verificationResult.data.transaction.actions[0].JettonSwap.amountOut) {

            try {
              try {
                // Get the raw amount and decimals
                const rawAmount = verificationResult.data.transaction.actions[0].JettonSwap.amountOut;
                const decimals = verificationResult.data.transaction.actions[0].JettonSwap.jettonMasterOut.decimals || 9; // Default to 9 if not available

                // Convert to UI amount
                const uiAmount = convertRawToUIAmount(rawAmount, decimals);

                // Get the latest user profile settings
                const settingsProfile = await authService.checkUserProfileSettingsExists(userData.user_id);

                // Get token information from our API
                let tokenInfo = null;
                try {
                  tokenInfo = await tokenService.getTokenByAddress(contract_address);
                  console.log("Token info from API:", tokenInfo);
                } catch (error) {
                  console.error("Error fetching token info:", error);
                }

                // Get the latest token price from Ston.fi API
                const tokenPriceResponse = await fetch(`https://api.ston.fi/v1/assets/search?search_string=${contract_address}`, {
                  method: 'POST',
                  headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                  }
                });

                const tokenPriceData = await tokenPriceResponse.json();

                // Get the price from the API response or fallback to meta.dex_usd_price
                let currentPrice = Number(meta.dex_usd_price);
                if (tokenPriceData &&
                  tokenPriceData.asset_list &&
                  tokenPriceData.asset_list.length > 0 &&
                  tokenPriceData.asset_list[0].dex_price_usd) {
                  currentPrice = Number(tokenPriceData.asset_list[0].dex_price_usd);
                  console.log("Using current price from Ston.fi API:", currentPrice);
                } else {
                  console.log("Falling back to meta price:", currentPrice);
                }

                // Create trade payload
                const payload = {
                  user_id: userData.user_id,
                  status: "Open",
                  type_of_trade: "AI",
                  cashtag: meta.symbol,
                  token_img_url: meta.image_url,
                  provider: "AI",
                  tags: [],
                  entry_price: currentPrice,
                  current_price: currentPrice,
                  stop_loss: currentPrice - currentPrice * (settingsProfile?.stop_loss || 0.2),
                  take_profit: currentPrice + currentPrice * (settingsProfile?.take_profit || 0.2),
                  percentage_change: 0,
                  extra_info: [],
                  contract_address: contract_address,
                  coin_name: meta.display_name,
                  tracking_price: [
                    {
                      created_at: new Date().toISOString(),
                      current_price: currentPrice,
                      percentage_change: 0.0,
                      balance: uiAmount,
                      total_price_usd: currentPrice * uiAmount
                    }
                  ],
                  price_usd: currentPrice * uiAmount,
                  balance: uiAmount,
                  coin_id: tokenInfo?.token_id
                };

                // Log the payload for debugging
                console.log("Creating trade with payload:", payload);

                // Create the AI trade
                const tradeCreated = await tradeService.createTrade(payload);

                console.log("AI Trade created successfully for swap");

                //here
                //now get trades from user
                const userTrades = await tradeService.getUserTrades(userData.user_id)

                const existingHoldingTrade = userTrades.find(
                  trade =>
                    trade.contract_address === contract_address &&
                    trade.type_of_trade === "Holding"
                );
                // console.log("existingHoldingTrade:", existingHoldingTrade);
                // console.log("existingHoldingTrade contract address:", existingHoldingTrade.contract_address);
                // console.log("contract address  coming from params:", contract_address);
                let updateData
                if (existingHoldingTrade) {
                  if (existingHoldingTrade.status == "Closed") {
                    // console.log("should re-open this one for dogs and update with trade_id:", existingHoldingTrade.trade_id);
                    updateData = {
                      current_price: currentPrice,
                      price_usd: currentPrice * uiAmount,
                      balance: uiAmount,
                      entry_price: currentPrice,
                      stop_loss: currentPrice - currentPrice * (settingsProfile?.stop_loss || 0.2),
                      take_profit: currentPrice + currentPrice * (settingsProfile?.take_profit || 0.2),
                      status: "Open",
                      provider: "AI",
                      tracking_price: [
                        {
                          created_at: new Date().toISOString(),
                          current_price: currentPrice,
                          percentage_change: 0.0,
                          balance: uiAmount,
                          total_price_usd: currentPrice * uiAmount
                        }
                      ],
                    };
                  } else {
                    // console.log("should just update this one for dogs and update with trade_id:", existingHoldingTrade.trade_id);
                    updateData = {
                      current_price: currentPrice,
                      price_usd: currentPrice * uiAmount,
                      balance: existingHoldingTrade.balance + uiAmount,
                    };
                  }
                  // console.log("bellow I sill update this one for dogs and update with trade_id:", existingHoldingTrade.trade_id);

                  const updateHoldingTrade = await tradeService.updateTrade(existingHoldingTrade.trade_id, updateData)
                  // User already has a holding trade for this token – update its details
                  // e.g., update balance, entry price, etc.

                } else {

                  const payloadToCreateTrade = {
                    user_id: userData.user_id,
                    status: "Open",
                    type_of_trade: "Holding",
                    cashtag: meta.symbol,
                    token_img_url: meta.image_url,
                    provider: "AI",
                    tags: [],
                    entry_price: currentPrice,
                    current_price: currentPrice,
                    stop_loss: currentPrice - currentPrice * (settingsProfile?.stop_loss || 0.2),
                    take_profit: currentPrice + currentPrice * (settingsProfile?.take_profit || 0.2),
                    percentage_change: 0,
                    extra_info: [],
                    contract_address: contract_address,
                    coin_name: meta.display_name,
                    tracking_price: [
                      {
                        created_at: new Date().toISOString(),
                        current_price: currentPrice,
                        percentage_change: 0.0,
                        balance: uiAmount,
                        total_price_usd: currentPrice * uiAmount
                      }
                    ],
                    price_usd: currentPrice * uiAmount,
                    balance: uiAmount,
                    coin_id: tokenInfo?.token_id
                  };

                  await tradeService.createTrade(payloadToCreateTrade);
                  console.log("Holding Trade created successfully for swap");
                  // No holding trade exists for this token – create a new one
                  // e.g., call tradeService.createTrade or similar logic
                }

                //if user comes from influencer give points to the influencer
                console.log("selected influencer data: ", selectedData);
                // console.log("influencerSelected:", influencerSelected);
                console.log(contract_address);
                if (selectedData.influencer !== null && selectedData.token !== null && selectedData.influencer.is_verified == true && selectedData.token.details.token_address == contract_address) {
                  const updateInfluencer = await socialService.updateInfluencersById(selectedData.influencer.id, {
                    influencer_points: selectedData.influencer.influencer_points + 1000,
                    community_trades_ids: [...selectedData.influencer.community_trades_ids, tradeCreated.trade_id]
                  });
                  console.log("updateInfluencer:", updateInfluencer);
                  console.log(`influencer ${selectedData.influencer.handle} as been successfully rewarded with 1000 points`);
                }

                const newTransaction = {
                  user_id: userData.user_id,
                  refunded: false,
                  status: "successful",
                  router_metadata: txData.routerMetadata,
                  simulation_data: txData.simulation,
                  pool_address: txData.simulation.poolAddress,
                  offer_address: txData.simulation.offerAddress,
                  ask_address: txData.simulation.askAddress,
                  fee_claimed: txData.feeClaimed,
                  vault_trx: txData.vaultTrxParamsStrings,
                  router_version: txData.routerVersion,
                };

                await transactionService.createTransaction(newTransaction);
                console.log("Transaction created successfully for swap");
              } catch (error) {
                console.error("Error in trade creation process:", error);
              }
            } catch (error) {
              console.error("Error creating trade for swap:", error);
            }
          }

          // Don't clear status - keep it visible so user can click the Tonscan link
          setIsLoading(false);

          return true; // Verification successful, stop polling
        } else {
          // Transaction not verified yet
          console.log(`Transaction not verified yet (attempt ${attempts}/${maxAttempts})`);
          setTrxStatus(`Verifying transaction... (${attempts}/${maxAttempts})`);

          if (attempts >= maxAttempts) {
            // Max attempts reached
            //console.log("Max verification attempts reached");
            setTrxStatus("Transaction sent. Please check your wallet for status.");

            // Clear status after a delay
            setTimeout(() => {
              setTrxStatus("");
              setTrxStatusAIMessage("");
              setIsLoading(false);
            }, 5000);

            return true; // Stop polling after max attempts
          }

          return false; // Continue polling
        }
      } catch (error) {
        console.error(`Error during verification attempt ${attempts}:`, error);

        if (attempts >= maxAttempts) {
          // Max attempts reached
          setTrxStatus("Transaction sent. Please check your wallet for status.");

          // Clear status after a delay
          setTimeout(() => {
            setTrxStatus("");
            setTrxStatusAIMessage("");
            setIsLoading(false);
          }, 5000);

          return true; // Stop polling after max attempts
        }

        return false; // Continue polling despite error
      }
    };

    // Start polling
    const poll = async () => {
      const shouldStop = await attemptVerification();

      if (!shouldStop && attempts < maxAttempts) {
        // Schedule next attempt
        setTimeout(poll, interval);
      }
    };

    // Start the first attempt
    poll();
  };

  const handleSwap = async () => {
    // If wallet is not connected, open the TonConnect modal
    if (!wallet) {
      tonConnectUI.openModal();
      return;
    }

    setIsLoading(true);
    setTrxStatus("Preparing transaction...");

    try {
      // Log parameters for debugging
      // console.log("Swap Parameters:", {
      //   contract_address,
      //   amount,
      //   swap_type,
      //   from: swap_type === "Buy" ? "TON" : meta.symbol,
      //   to: swap_type === "Buy" ? meta.symbol : "TON",
      //   walletAddress: wallet?.account?.address
      // });

      // Get transaction parameters
      const txData = await transactionService.getTransactionParams(
        wallet.account.address,
        amount,
        contract_address,
        swap_type
      );

      // Log the transaction data for debugging
      console.log("Transaction Data:", txData);
      console.log("selected influencer data: ", selectedData);
      // Check if we have the transaction parameters
      if (!txData || !txData.txParams) {
        throw new Error("Invalid transaction parameters received");
      }

      // Create transaction object for TON Connect UI
      const trx = {
        validUntil: Date.now() + 1000000, // Transaction validity period
        messages: [
          {
            address: txData.txParams.to, // DEX Router address
            amount: txData.txParams.value, // TON amount
            payload: txData.txParams.body, // The base64 payload
          }
        ],
        // network: `${import.meta.env.VITE_DEV_MODE == true ? "testnet" : "mainnet"}` // Specify the network, e.g., 'mainnet' or 'testnet'
        network: "mainnet" // Specify the network, e.g., 'mainnet' or 'testnet'
      };

      // Send the transaction using TON Connect UI
      setTrxStatus("Waiting for confirmation...");

      try {
        // Send the transaction (we don't use the result, but it's required for the Promise)
        await tonConnectUI.sendTransaction(trx);
        //console.log("Transaction Result:", result);

        // Transaction was sent to the wallet
        setTrxStatus("Processing transaction...");
        displayedStatuses.current.add("Processing Transaction");

        // Start polling for transaction verification
        //console.log("Starting verification process...");
        startVerificationPolling(wallet.account.address, contract_address, txData);
      } catch (error) {
        console.error("Transaction sending failed:", error);
        setTrxStatus("Transaction failed: " + (error.message || "Unknown error"));

        // Clear error message after 5 seconds
        setTimeout(() => {
          setTrxStatus("");
          setTrxStatusAIMessage("");
          setIsLoading(false);
        }, 5000);
      }
    } catch (error) {
      console.error("Swap failed:", error);
      setTrxStatus("Transaction failed: " + (error.message || "Unknown error"));

      // Clear error message after 5 seconds
      setTimeout(() => {
        setTrxStatus("");
        setTrxStatusAIMessage("");
        setIsLoading(false);
      }, 5000);
    }
  };

  return (
    <div className="mt-2">
      <div className="bg-gray-900/80 hover:bg-gray-900 rounded-xl p-3 transition-all duration-300">
        {/* Token Info */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center p-1.5">
            <img
              src={meta.image_url}
              alt={meta.display_name}
              className="w-full h-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">
                {meta.display_name}
              </span>
              <span className="text-xs text-gray-400 shrink-0">
                {meta.symbol}
              </span>
              {meta.tags?.includes("high_liquidity") && (
                <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded-full shrink-0">
                  High Liquidity
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">
                ${Number(meta.dex_usd_price).toFixed(8)}
              </span>
              {!calculation.loading && !calculation.error && (
                <span className="text-xs text-gray-500">
                  • ${calculation.tonPrice.toFixed(2)}/TON
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Swap Interface */}
        <div className="space-y-2">
          {/* From */}
          <div className="bg-gray-950/50 hover:bg-gray-950/80 rounded-lg p-2.5 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {swap_type === "Buy" ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                      <img
                        src="/toncoin-ton-logo.svg"
                        alt="TON"
                        className="w-4 h-4"
                      />
                    </div>
                    <span className="text-xs text-gray-400">TON</span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                      <img
                        src={meta.image_url}
                        alt={meta.symbol}
                        className="w-4 h-4"
                      />
                    </div>
                    <span className="text-xs text-gray-400">{meta.symbol}</span>
                  </>
                )}
              </div>
              <div className="text-right">
                <div>
                  <div className="text-sm font-medium">
                    {swap_type === "Buy" ? amount : `${amount}%`}
                  </div>
                  {swap_type === "Sell" &&
                    !calculation.loading &&
                    !calculation.error && (
                      <div className="text-[10px] text-gray-500">
                        Available: {calculation.availableAmount.toFixed(2)}
                      </div>
                    )}
                </div>
                {swap_type === "Buy" &&
                  !calculation.loading &&
                  !calculation.error && (
                    <div className="text-[10px] text-gray-500">
                      ≈ ${calculation.usdValue.toFixed(2)}
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center -my-1">
            <div className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors duration-200 group">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400 group-hover:text-gray-300 transition-colors duration-200"
              >
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* To */}
          <div className="bg-gray-950/50 hover:bg-gray-950/80 rounded-lg p-2.5 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {swap_type === "Buy" ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                      <img
                        src={meta.image_url}
                        alt={meta.symbol}
                        className="w-4 h-4"
                      />
                    </div>
                    <span className="text-xs text-gray-400">{meta.symbol}</span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                      <img
                        src="/toncoin-ton-logo.svg"
                        alt="TON"
                        className="w-4 h-4"
                      />
                    </div>
                    <span className="text-xs text-gray-400">TON</span>
                  </>
                )}
              </div>
              <div className="text-right">
                {swap_type === "Buy" ? (
                  <>
                    <div className="flex items-center justify-end gap-1.5">
                      {calculation.loading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                      ) : calculation.error ? (
                        <span className="text-red-400 text-xs">
                          Failed to calculate
                        </span>
                      ) : (
                        <div className="text-right">
                          <div>
                            <div className="text-sm font-medium">
                              ~{calculation.tokenAmount.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              Estimated amount
                            </div>
                            <div className="text-[10px] text-gray-400">
                              Current: {calculation.availableAmount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-end gap-1.5">
                      {calculation.loading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                      ) : calculation.error ? (
                        <span className="text-red-400 text-xs">
                          Failed to calculate
                        </span>
                      ) : (
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            ~
                            {(
                              calculation.usdValue / calculation.tonPrice
                            ).toFixed(2)}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Estimated TON
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Status */}
        {trxStatus && (
          <div className="mt-4 p-2 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              {/* Show different icons based on transaction status */}
              {trxStatus.includes("successful") ? (
                // Success icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#31F46E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-check-circle"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : trxStatus.includes("failed") ? (
                // Error icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF4A4A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-x-circle"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              ) : (
                // Loading spinner for other states
                <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
              )}
              <span className={`text-sm ${trxStatus.includes("successful") ? "text-[#31F46E]" : trxStatus.includes("failed") ? "text-[#FF4A4A]" : "text-gray-300"}`}>
                {trxStatus}
              </span>
            </div>
            {trxStatusAIMessage && (
              <p className="mt-1 text-xs text-gray-400">{trxStatusAIMessage}</p>
            )}

            {/* Tonscan Link Button */}
            {transactionId && (
              <div className="mt-2">
                <a
                  href={`https://tonscan.org/tx/${transactionId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-2 rounded-lg text-xs font-medium border border-[#31F46E] text-[#31F46E] hover:bg-[#31F46E]/10 transition-colors duration-200"
                >
                  View on Tonscan
                </a>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4">
          <button
            onClick={handleSwap}
            disabled={isLoading || calculation.loading || calculation.error}
            className={`w-full px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${isLoading || calculation.loading || calculation.error
              ? "bg-gray-800 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[#31F46E] to-[#0AFDE1] text-gray-900 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              }`}
          >
            {isLoading || calculation.loading ? (
              <div className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>{isLoading ? "Processing..." : "Calculating..."}</span>
              </div>
            ) : (
              `${swap_type} Token`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

SwapAction.propTypes = {
  meta: PropTypes.shape({
    symbol: PropTypes.string.isRequired,
    display_name: PropTypes.string.isRequired,
    image_url: PropTypes.string.isRequired,
    dex_usd_price: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string),
    coin_id: PropTypes.string,
  }).isRequired,
  amount: PropTypes.number.isRequired,
  swap_type: PropTypes.oneOf(["Buy", "Sell"]).isRequired,
  contract_address: PropTypes.string.isRequired,
};

export default SwapAction;
