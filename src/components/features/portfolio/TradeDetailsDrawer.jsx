import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { X, ArrowUpRight } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerBody,
  useDisclosure,
  Input
} from '@heroui/react';
import Button from '../../ui/Button';
import TokenChart from './TokenChart';
import { transactionService, tradeService } from '../../../api';
import { useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";
import { useAuth } from '../../../contexts/AuthContext';

export default function TradeDetailsDrawer({ trade, tokenSymbol, tokenImgUrl, onTradeUpdate, isOpen: externalIsOpen, onOpenChange: externalOnOpenChange }) {
  // Use internal state if external state is not provided
  const { isOpen: internalIsOpen, onOpen: internalOnOpen, onOpenChange: internalOnOpenChange } = useDisclosure();
  const { userData } = useAuth();

  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const onOpenChange = externalOnOpenChange || internalOnOpenChange;
  const onOpen = () => {
    if (externalOnOpenChange) {
      externalOnOpenChange(true);
    } else {
      internalOnOpen();
    }
  };
  const [sellAmount, setSellAmount] = useState({ preset: 100, custom: '' }); // Default to 100%
  const [isLoading, setIsLoading] = useState(false);
  const [trxStatus, setTrxStatus] = useState("");
  const [transactionId, setTransactionId] = useState(null);
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  // Validate percentage is between 1 and 100
  const isValidPercentage = (value) => {
    const numValue = Number(value);
    return numValue >= 1 && numValue <= 100;
  };

  // Get the current percentage value (from preset or custom)
  const currentPercentage = sellAmount.preset || (sellAmount.custom ? parseFloat(sellAmount.custom) : 0);

  // Check if we have a valid percentage selected
  const hasValidPercentage = isValidPercentage(currentPercentage);
  const isValidSellAmount = hasValidPercentage && !isLoading;

  const handlePresetAmount = (value) => {
    setSellAmount({ preset: value, custom: '' });
  };

  // Calculate PNL
  const calculatePnl = () => {
    const trackingPrices = trade.tracking_price || [];
    if (trackingPrices.length === 0) {
      return { percentageChange: 0, dollarChange: 0 };
    }

    const firstPrice = trackingPrices[0];
    const lastPrice = trackingPrices[trackingPrices.length - 1];

    let percentageChange = 0;
    let dollarChange = 0;

    if (trackingPrices.length > 1 && firstPrice.current_price > 0) {
      percentageChange = ((lastPrice.current_price - firstPrice.current_price) / firstPrice.current_price) * 100;
      dollarChange = lastPrice.total_price_usd - firstPrice.total_price_usd;
    } else if (trackingPrices.length === 1) {
      percentageChange = firstPrice.percentage_change || 0;
      dollarChange = 0;
    }

    return { percentageChange, dollarChange };
  };

  const { percentageChange, dollarChange } = calculatePnl();
  const isPositive = percentageChange >= 0;
  const sign = isPositive ? '+' : '-';

  // Function to start polling for transaction verification
  const startVerificationPolling = async (walletAddress, amountToSell, contract_address, txData, maxAttempts = 10, interval = 3000) => {
    let attempts = 0;

    // Function to perform a single verification attempt
    const attemptVerification = async () => {
      attempts++;

      try {
        const verificationResult = await transactionService.verifyTransaction(walletAddress);

        if (verificationResult && verificationResult.success && verificationResult.data && verificationResult.data.transaction) {
          // Transaction verified successfully
          setTrxStatus("Transaction was successful");

          // Save the transaction ID for the Tonscan link
          setTransactionId(verificationResult.data.transaction.eventId);

          try {
            // Calculate the amount sold based on the selected percentage
            const percentageToSell = currentPercentage;
            const amountSold = (trade.balance * (percentageToSell / 100));
            const remainingBalance = trade.balance - amountSold;
            let userTrades
            let existingHoldingTrade
            let existingAiTrades
            // Update trade status and balance in the database
            if (percentageToSell === 100) {
              // If selling 100%, update status to "Closed"
              await tradeService.updateTrade(trade.trade_id, {
                status: "Closed",
                balance: 0
              });
              // get all trades for this user
              //here
              //now get trades from user
              userTrades = await tradeService.getUserTrades(userData.user_id)
              //finds the ones with  same contract_address and  are holding
              existingHoldingTrade = userTrades.find(
                trade =>
                  trade.contract_address === contract_address &&
                  trade.type_of_trade === "Holding"
              );
              existingAiTrades = userTrades.filter(
                trade =>
                  trade.contract_address === contract_address &&
                  trade.type_of_trade === "AI" &&
                  trade.status === "Open"
              );
              let updateData
              console.log("existingAiTrades lenght", existingAiTrades);
              if (existingAiTrades.length > 1) {
                //if have more than 1 AI trade remove the amountToSell to the Holding balance(if provider is AI or Holding)
                updateData = {
                  balance: existingHoldingTrade.balance - amountToSell,
                };
                const updateHoldingTrade = await tradeService.updateTrade(existingHoldingTrade.trade_id, updateData)
                console.log("user have more than 1 AI trade updateHoldingTrade:", updateHoldingTrade);
              } else {
                //if have only 1 AI trade closes also the Holding one if provider is AI and changes the HoldingTrade.provider to Holding so it can be reopened on the portfolio page
                if (existingHoldingTrade.provider == "AI") {
                  updateData = {
                    balance: 0,
                    updated_at: new Date().toISOString(),
                    status: "Closed",
                    entry_price: 0,
                    current_price: 0,
                    stop_loss: 0,
                    take_profit: 0,
                    percentage_change: 0,
                    tracking_price: [],
                    provider: existingHoldingTrade.provider = "Holding"

                  };
                  const updateHoldingTrade = await tradeService.updateTrade(existingHoldingTrade.trade_id, updateData)
                  console.log("user sold 100% have only 1 AI trade and the holding trade was made with AI so close updateHoldingTrade:", updateHoldingTrade);
                } else {
                  updateData = {
                    balance: existingHoldingTrade.balance - amountToSell,
                  };
                  const updateHoldingTrade = await tradeService.updateTrade(existingHoldingTrade.trade_id, updateData)
                  console.log("user sold 100%  have only 1 AI trade but the holding trade was not made with AI so update updateHoldingTrade:", updateHoldingTrade);
                }
              }
            } else {
              //THIS ONE IS WORKING FINE
              // If selling less than 100%, just update the balance
              await tradeService.updateTrade(trade.trade_id, {
                balance: remainingBalance
              });
              userTrades = await tradeService.getUserTrades(userData.user_id)
              //finds the ones with  same contract_address and  are holding
              existingHoldingTrade = userTrades.find(
                trade =>
                  trade.contract_address === contract_address &&
                  trade.type_of_trade === "Holding"
              );
              // remove the amountToSell to the Holding balance(if provider is AI or Holding)
              const updateData = {
                balance: existingHoldingTrade.balance - amountToSell,
              };
              const updateHoldingTrade = await tradeService.updateTrade(existingHoldingTrade.trade_id, updateData)
              console.log("user did not sold 100%  have only 1 AI trade but the holding trade was not made with AI so update updateHoldingTrade:", updateHoldingTrade);
            }
            console.log("TXDATA:", txData);
            // Then create the transaction record
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
            console.log("TXDATA:", txData);
            console.log("Transaction created successfully for closing trade");
            // Refresh the trades data
            if (onTradeUpdate) {
              onTradeUpdate();
            }
          } catch (error) {
            console.error("Error updating trade:", error);
            // Continue with the flow even if the trade update fails
          }

          // Don't clear status - keep it visible so user can click the Tonscan link
          setIsLoading(false);

          return true; // Verification successful, stop polling
        } else {
          // Transaction not verified yet
          setTrxStatus(`Verifying transaction... (${attempts}/${maxAttempts})`);

          if (attempts >= maxAttempts) {
            // Max attempts reached
            setTrxStatus("Transaction sent. Please check your wallet for status.");

            // Clear status after a delay
            setTimeout(() => {
              setTrxStatus("");
              setIsLoading(false);
            }, 5000);

            return true; // Stop polling after max attempts
          }

          return false; // Continue polling
        }
      } catch {
        if (attempts >= maxAttempts) {
          // Max attempts reached
          setTrxStatus("Transaction sent. Please check your wallet for status.");

          // Clear status after a delay
          setTimeout(() => {
            setTrxStatus("");
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

  // Handle close position
  const handleClosePosition = async () => {
    // If wallet is not connected, open the TonConnect modal
    if (!wallet) {
      tonConnectUI.openModal();
      return;
    }

    // Check if a percentage is selected
    if (!hasValidPercentage) {
      setTrxStatus("Please select a valid percentage");
      setTimeout(() => setTrxStatus(""), 3000);
      return;
    }

    setIsLoading(true);
    setTrxStatus("Preparing transaction...");

    try {
      // Calculate the amount to sell based on the selected percentage
      const percentageToSell = currentPercentage;
      //this is the ammount to removed from balance on the holding AI or Holding
      const amountToSell = (trade.balance * (percentageToSell / 100)).toFixed(8);

      // Get transaction parameters for closing the specific trade position
      const txData = await transactionService.getSpecificSellTransactionParams(
        wallet.account.address,
        amountToSell, // The calculated amount based on percentage
        trade.contract_address
      );

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
        network: "mainnet"
      };

      // Send the transaction using TON Connect UI
      setTrxStatus("Waiting for wallet confirmation...");

      try {
        // Send the transaction to the wallet for user confirmation
        tonConnectUI.sendTransaction(trx)
          .then(() => {
            // User has confirmed the transaction in their wallet
            setTrxStatus("Transaction confirmed! Processing...");

            // Start polling for transaction verification on the blockchain
            startVerificationPolling(wallet.account.address, amountToSell, trade.contract_address, txData);
          })
          .catch(error => {
            // This error occurs if the user rejects the transaction in their wallet
            setTrxStatus("Transaction rejected: " + (error.message || "User declined transaction"));

            // Clear error message after 5 seconds
            setTimeout(() => {
              setTrxStatus("");
              setIsLoading(false);
            }, 5000);
          });
      } catch (error) {
        // This catches any errors in setting up the transaction (before sending to wallet)
        setTrxStatus("Transaction setup failed: " + (error.message || "Unknown error"));

        // Clear error message after 5 seconds
        setTimeout(() => {
          setTrxStatus("");
          setIsLoading(false);
        }, 5000);
      }
    } catch (error) {
      setTrxStatus("Transaction failed: " + (error.message || "Unknown error"));

      // Clear error message after 5 seconds
      setTimeout(() => {
        setTrxStatus("");
        setIsLoading(false);
      }, 5000);
    }
  };

  return (
    <>
      <div
        onClick={onOpen}
        className="bg-[#131820] text-white rounded-xl p-3 flex justify-between items-center cursor-pointer hover:bg-[#1a202b] transition-colors"
      >
        <div className="flex flex-col">
          <span className="text-sm">{new Date(trade.created_at).toLocaleDateString()}</span>
          <span className={`text-xs ${trade.status === "Open" ? "text-[#4ED342]" : "text-white/70"
            }`}>
            {trade.status} • {trade.balance.toFixed(4)} {tokenSymbol}
          </span>
        </div>
        <div className="flex flex-col items-end">
          {(() => {
            // Get first and last tracking price entries
            const trackingPrices = trade.tracking_price || [];
            if (trackingPrices.length === 0) {
              return (
                <>
                  <span className="text-sm">${trade.entry_price.toFixed(6)}</span>
                  <span className="text-xs text-white/70">New trade</span>
                </>
              );
            }

            const firstPrice = trackingPrices[0];
            const lastPrice = trackingPrices[trackingPrices.length - 1];

            // Calculate percentage change
            let percentageChange = 0;
            if (trackingPrices.length > 1 && firstPrice.current_price > 0) {
              percentageChange = ((lastPrice.current_price - firstPrice.current_price) / firstPrice.current_price) * 100;
            } else if (trackingPrices.length === 1) {
              // If only one entry, use the percentage_change from that entry
              percentageChange = firstPrice.percentage_change || 0;
            }

            return (
              <>
                <span className="text-sm">${lastPrice.current_price.toFixed(6)}</span>
                <span className={`text-xs ${percentageChange >= 0 ? "text-[#4ED342]" : "text-red-500"
                  }`}>
                  {percentageChange >= 0 ? "+" : ""}
                  {percentageChange.toFixed(2)}%
                </span>
              </>
            );
          })()}
        </div>
      </div>

      <Drawer
        hideCloseButton
        backdrop="opaque"
        isOpen={isOpen}
        onOpenChange={(newIsOpen) => {
          // Prevent closing the drawer during a transaction
          if (!newIsOpen && isLoading) {
            return;
          }
          if (onOpenChange) {
            onOpenChange(newIsOpen);
          }
        }}
        placement="bottom"
        size="5xl"
      >
        <DrawerContent className="bg-black text-white rounded-t-2xl">
          {(onClose) => (
            <>
              <DrawerBody className="px-4 py-6 relative">
                <Button
                  isIconOnly
                  size="md"
                  variant="light"
                  onPress={isLoading ? undefined : onClose}
                  isDisabled={isLoading}
                  className={`absolute right-4 top-4 text-white bg-transparent p-0 hover:bg-transparent z-10 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  <X className="w-6 h-6 text-[#5f5f5f]" />
                </Button>

                <div className="flex flex-col gap-6 overflow-y-auto max-h-[80vh] hide-scrollbar pb-4">
                  <div className="flex flex-col items-center">
                    {/* Token Icon */}
                    <div className="w-[48px] h-[48px] rounded-full overflow-hidden mb-2">
                      <img
                        src={tokenImgUrl || trade.token_img_url}
                        alt={tokenSymbol}
                        className="w-full h-full object-cover border-2 border-white/10 bg-white/10 border-solid rounded-full"
                      />
                    </div>

                    <div className='w-full justify-center items-center flex gap-2 '>
                      <h3 className="text-[24px] font-medium text-white">
                        {tokenSymbol}
                      </h3>

                      {/* Trade Status */}
                      <div className={`px-2 py-0.5 rounded-full text-xs ${trade.status === "Open"
                        ? "bg-[#4ED342]/20 text-[#4ED342] border border-[#4ED342]/40"
                        : "bg-white/10 text-white/70 border border-white/20"
                        }`}>
                        {trade.status}
                      </div>
                    </div>

                    {/* Trade Value */}
                    <div className="mt-4 text-[32px] font-semibold">
                      ${(trade.balance * trade.current_price).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>

                    {/* PNL Pill */}
                    <div className={`
                      mt-1 rounded-full py-0.5 px-3 text-[14px] flex justify-center items-center gap-1 font-medium border
                      ${isPositive
                        ? 'text-[#4ED342] bg-[#4ED342]/20 border-[#4ED342]/40'
                        : 'text-red-500 bg-red-500/20 border-red-500/40'
                      }
                    `}>
                      {sign}$
                      {Math.abs(dollarChange).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                      <span className="ml-1">
                        ({sign}{Math.abs(percentageChange).toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 w-full mt-4">
                    <div className="bg-transparent border-1 border-solid border-[#2D394A] rounded-xl p-4">
                      <span className="text-sm text-white/70">Entry Price</span>
                      <p className="text-lg mt-1">
                        $
                        {trade.entry_price.toLocaleString('en-US', {
                          minimumFractionDigits: 6,
                          maximumFractionDigits: 6
                        })}
                      </p>
                    </div>
                    <div className="bg-transparent border-1 border-solid border-[#2D394A] rounded-xl p-4">
                      <span className="text-sm text-white/70">Current Price</span>
                      <p className="text-lg mt-1">
                        $
                        {trade.current_price.toLocaleString('en-US', {
                          minimumFractionDigits: 6,
                          maximumFractionDigits: 6
                        })}
                      </p>
                    </div>
                    <div className="bg-transparent border-1 border-solid border-[#2D394A] rounded-xl p-4">
                      <span className="text-sm text-white/70">Quantity</span>
                      <p className="text-lg mt-1">
                        {trade.balance.toFixed(4)} {tokenSymbol}
                      </p>
                    </div>
                    <div className="bg-transparent border-1 border-solid border-[#2D394A] rounded-xl p-4">
                      <span className="text-sm text-white/70">Trade Date</span>
                      <p className="text-lg mt-1">
                        {new Date(trade.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Percentage Selection */}
                  {trade.status === "Open" && (
                    <>
                      <div className="mt-4">

                        <p className="text-[16px] text-white/70 text-center mb-2">
                          Select percentage to close
                        </p>

                        {/* Percentage Buttons */}
                        <div className="grid grid-cols-5 gap-2">
                          {[20, 40, 60, 80, 100].map((percent) => (
                            <Button
                              key={percent}
                              variant="bordered"
                              borderColor={sellAmount.preset === percent ? "#31F46E" : "#2D394A"}
                              className={`bg-transparent hover:bg-[#1a202b] text-sm h-[40px] w-full rounded-xl ${sellAmount.preset === percent ? 'text-[#31F46E]' : 'text-white/90'
                                }`}
                              onPress={() => handlePresetAmount(percent)}
                            >
                              {percent}%
                            </Button>
                          ))}
                        </div>

                        {/* Custom Input */}
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          classNames={{
                            base: "w-full input-level bg-transparent mt-2",
                            input: "bg-transparent text-white border-0 h-[40px] text-center text-sm placeholder:text-white/50",
                            innerWrapper: "bg-transparent rounded-xl",
                            mainWrapper: "bg-transparent",
                            inputWrapper: `bg-transparent text-white border-1 border-solid h-[40px] rounded-xl ${sellAmount.custom && !isValidPercentage(parseFloat(sellAmount.custom))
                              ? "border-red-500"
                              : "border-[#2D394A]"
                              }`,
                          }}
                          placeholder="Custom %"
                          value={sellAmount.custom}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty input for better UX
                            if (value === "" || isValidPercentage(parseFloat(value))) {
                              setSellAmount({ preset: null, custom: value });
                            }
                          }}
                          endContent={
                            <div className="pointer-events-none flex items-center">
                              <span className="text-white/50 text-small">%</span>
                            </div>
                          }
                        />

                        {/* Error message for invalid percentage */}
                        {sellAmount.custom && !isValidPercentage(parseFloat(sellAmount.custom)) && (
                          <div className="text-red-500 text-xs mt-1">
                            Please enter a percentage between 1 and 100
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Token Chart */}
                  <div className="w-full mt-4">
                    <TokenChart
                      trackingData={trade.tracking_price}
                      tokenSymbol={tokenSymbol}
                    />
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

                  {/* Close Position Button */}
                  <div className="mt-4 w-full">
                    <Button
                      className="w-full bg-gradient-to-r from-[#31F46E] to-[#0AFDE1] hover:opacity-90 text-black h-[48px] rounded-full text-[16px]"
                      onPress={handleClosePosition}
                      isLoading={isLoading}
                      isDisabled={!isValidSellAmount || trade.status !== "Open"}
                    >
                      Close Position <ArrowUpRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}

TradeDetailsDrawer.propTypes = {
  trade: PropTypes.shape({
    trade_id: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    status: PropTypes.string,
    type_of_trade: PropTypes.string,
    balance: PropTypes.number,
    entry_price: PropTypes.number,
    current_price: PropTypes.number,
    contract_address: PropTypes.string,
    token_img_url: PropTypes.string,
    tracking_price: PropTypes.arrayOf(
      PropTypes.shape({
        created_at: PropTypes.string.isRequired,
        current_price: PropTypes.number.isRequired,
        total_price_usd: PropTypes.number.isRequired,
        percentage_change: PropTypes.number
      })
    )
  }).isRequired,
  tokenSymbol: PropTypes.string.isRequired,
  tokenImgUrl: PropTypes.string,
  onTradeUpdate: PropTypes.func,
  isOpen: PropTypes.bool,
  onOpenChange: PropTypes.func
};
