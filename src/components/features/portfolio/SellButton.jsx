import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { ArrowUpRight, X } from 'lucide-react'
import {
  useDisclosure,
  Drawer,
  DrawerContent,
  DrawerBody,
  Input
} from '@heroui/react'
import Button from '../../ui/Button'
import { transactionService, tradeService } from '../../../api'
import { useTonWallet, useTonConnectUI } from "@tonconnect/ui-react"
import { useTokenCalculation } from "../../../hooks/useTokenCalculation"
import { useAuth } from '../../../contexts/AuthContext'

export default function SellButton({ token }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [sellAmount, setSellAmount] = useState({ preset: null, custom: '' })
  const wallet = useTonWallet()
  const [tonConnectUI] = useTonConnectUI()
  const { userData } = useAuth()

  // Transaction state
  const [isLoading, setIsLoading] = useState(false)
  const [trxStatus, setTrxStatus] = useState("")
  const [trxStatusAIMessage, setTrxStatusAIMessage] = useState("")
  const [transactionId, setTransactionId] = useState(null)
  const displayedStatuses = useRef(new Set())

  // Get token price from API or use a default value
  const [tokenPrice, setTokenPrice] = useState(0)
  const [contractAddress, setContractAddress] = useState("")

  // Fetch token price and contract address when component mounts
  useEffect(() => {
    const fetchTokenInfo = async () => {
      try {
        // For demo purposes, we'll use a default price
        // In a real app, you would fetch this from an API
        setTokenPrice(token.price || 1.0)
        setContractAddress(token.contractAddress || "")
      } catch (error) {
        console.error("Error fetching token info:", error)
      }
    }

    fetchTokenInfo()
  }, [token])

  // Calculate estimated TON amount based on selected percentage
  const calculation = useTokenCalculation(
    sellAmount.preset || parseFloat(sellAmount.custom) || 0,
    "Sell",
    tokenPrice,
    wallet?.account?.address || "",
    contractAddress
  )

  // console.log("CALCULA`tION, ", calculation);

  // Validate percentage is between 1 and 100
  const isValidPercentage = (value) => {
    const numValue = Number(value)
    return numValue >= 1 && numValue <= 100
  }

  // Get the current percentage value (from preset or custom)
  const currentPercentage = sellAmount.preset || (sellAmount.custom ? parseFloat(sellAmount.custom) : 0)

  // Check if we have a valid percentage selected
  const hasValidPercentage = isValidPercentage(currentPercentage)

  const handlePresetAmount = (value) => {
    setSellAmount({ preset: value, custom: '' })
  }

  // Function to update trade statuses based on sell percentage
  const updateTradeStatuses = async (userId, cashtag, sellPercentage) => {
    try {
      // 1. Get all trades for the user
      const userTrades = await tradeService.getUserTrades(userId);

      // 2. Filter trades by cashtag
      const matchingTrades = userTrades.filter(trade => trade.cashtag === cashtag);

      if (matchingTrades.length === 0) {
        console.log(`No trades found for cashtag: ${cashtag}`);
        return;
      }

      // 3. Update trade statuses based on sell percentage
      if (sellPercentage === 100) {
        // If selling 100%, close all trades (both AI and Holding)
        for (const trade of matchingTrades) {
          if (trade.type_of_trade == "Holding") {
            const updateData = {
              balance: 0,
              updated_at: new Date().toISOString(),
              status: "Closed",
              entry_price: 0,
              current_price: 0,
              stop_loss: 0,
              take_profit: 0,
              percentage_change: 0,
              tracking_price: [],
              provider: trade.provider = "Holding"
            };
            await tradeService.updateTrade(trade.trade_id, updateData);
          } else {
            await tradeService.updateTrade(trade.trade_id, { status: "Closed" });
          }
        }
        setTrxStatusAIMessage("All trades closed successfully");
      } else {
        // If selling less than 100%, only close AI trades
        let aiTradesUpdated = false;
        for (const trade of matchingTrades) {
          const amountSold = (trade.balance * (sellPercentage / 100));
          if (trade.type_of_trade === "AI") {
            await tradeService.updateTrade(trade.trade_id, { status: "Closed" });
            aiTradesUpdated = true;
          } else {
            const updateData = {
              balance: trade.balance - amountSold,
            };
            await tradeService.updateTrade(trade.trade_id, updateData)
          }
        }
        if (aiTradesUpdated) {
          setTrxStatusAIMessage("AI trades closed successfully");
        } else {
          setTrxStatusAIMessage("No AI trades found to update");
        }
      }
    } catch (error) {
      console.error("Error updating trade statuses:", error);
      setTrxStatusAIMessage("Failed to update trade statuses");
    }
  };

  // Function to start polling for transaction verification
  const startVerificationPolling = async (walletAddress, txData, maxAttempts = 10, interval = 3000) => {
    let attempts = 0

    // Function to perform a single verification attempt
    const attemptVerification = async () => {
      attempts++

      try {
        const verificationResult = await transactionService.verifyTransaction(walletAddress)

        if (verificationResult && verificationResult.success && verificationResult.data && verificationResult.data.transaction) {
          // Transaction verified successfully
          displayedStatuses.current.add("Transaction was successful")
          setTrxStatus("Transaction was successful")
          setTrxStatusAIMessage("Transaction was successful")

          // Save the transaction ID for the Tonscan link
          setTransactionId(verificationResult.data.transaction.eventId)

          // Update trade statuses if user is authenticated
          if (userData && userData.user_id) {
            // Get the percentage to sell (1-100)
            const percentageToSell = sellAmount.preset || parseFloat(sellAmount.custom) || 0;
            // Update trade statuses
            await updateTradeStatuses(userData.user_id, token.symbol, percentageToSell);
            // Then create the transaction record
            console.log("TXDATA:", txData);
            //IN here is working fine the transaction creation
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
            console.log("Transaction created successfully for sell");
          } else {
            console.warn("User not authenticated, cannot update trade statuses");
          }

          // Don't clear status - keep it visible so user can click the Tonscan link
          setIsLoading(false)

          return true // Verification successful, stop polling
        } else {
          // Transaction not verified yet
          setTrxStatus(`Verifying transaction... (${attempts}/${maxAttempts})`)

          if (attempts >= maxAttempts) {
            // Max attempts reached
            setTrxStatus("Transaction sent. Please check your wallet for status.")

            // Clear status after a delay
            setTimeout(() => {
              setTrxStatus("")
              setTrxStatusAIMessage("")
              setIsLoading(false)
            }, 5000)

            return true // Stop polling after max attempts
          }

          return false // Continue polling
        }
      } catch {
        if (attempts >= maxAttempts) {
          // Max attempts reached
          setTrxStatus("Transaction sent. Please check your wallet for status.")

          // Clear status after a delay
          setTimeout(() => {
            setTrxStatus("")
            setTrxStatusAIMessage("")
            setIsLoading(false)
          }, 5000)

          return true // Stop polling after max attempts
        }

        return false // Continue polling despite error
      }
    }

    // Start polling
    const poll = async () => {
      const shouldStop = await attemptVerification()

      if (!shouldStop && attempts < maxAttempts) {
        // Schedule next attempt
        setTimeout(poll, interval)
      }
    }

    // Start the first attempt
    poll()
  }

  // Handle sell transaction
  const handleSell = async () => {
    // If wallet is not connected, open the TonConnect modal
    if (!wallet) {
      tonConnectUI.openModal()
      return
    }

    // Check if a percentage is selected
    if (!sellAmount.preset && !sellAmount.custom) {
      setTrxStatus("Please select a percentage to sell")
      setTimeout(() => setTrxStatus(""), 3000)
      return
    }

    // Check if we have contract address
    if (!contractAddress) {
      setTrxStatus("Contract address not available")
      setTimeout(() => setTrxStatus(""), 3000)
      return
    }

    setIsLoading(true)
    setTrxStatus("Preparing transaction...")

    try {
      // Get the percentage to sell (1-100)
      const percentageToSell = sellAmount.preset || parseFloat(sellAmount.custom) || 0

      // Get transaction parameters - pass the percentage directly
      const txData = await transactionService.getTransactionParams(
        wallet.account.address,
        percentageToSell, // Pass percentage directly (1-100)
        contractAddress,
        "Sell"
      )

      // Check if we have the transaction parameters
      if (!txData || !txData.txParams) {
        throw new Error("Invalid transaction parameters received")
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
        network: 'mainnet' // Specify the network, e.g., 'mainnet' or 'testnet'
      }

      // Send the transaction using TON Connect UI
      setTrxStatus("Waiting for wallet confirmation...")

      try {
        // Send the transaction to the wallet for user confirmation
        // This is a non-blocking call - it returns as soon as the transaction is sent to the wallet
        tonConnectUI.sendTransaction(trx)
          .then(() => {
            // User has confirmed the transaction in their wallet
            setTrxStatus("Transaction confirmed! Processing...")
            displayedStatuses.current.add("Transaction Confirmed")

            // Start polling for transaction verification on the blockchain
            startVerificationPolling(wallet.account.address, txData)
          })
          .catch(error => {
            // This error occurs if the user rejects the transaction in their wallet
            setTrxStatus("Transaction rejected: " + (error.message || "User declined transaction"))

            // Clear error message after 5 seconds
            setTimeout(() => {
              setTrxStatus("")
              setTrxStatusAIMessage("")
              setIsLoading(false)
            }, 5000)
          })

        // Update status immediately to show we're waiting for wallet confirmation
        setTrxStatus("Waiting for wallet confirmation...")
      } catch (error) {
        // This catches any errors in setting up the transaction (before sending to wallet)
        setTrxStatus("Transaction setup failed: " + (error.message || "Unknown error"))

        // Clear error message after 5 seconds
        setTimeout(() => {
          setTrxStatus("")
          setTrxStatusAIMessage("")
          setIsLoading(false)
        }, 5000)
      }
    } catch (error) {
      setTrxStatus("Transaction failed: " + (error.message || "Unknown error"))

      // Clear error message after 5 seconds
      setTimeout(() => {
        setTrxStatus("")
        setTrxStatusAIMessage("")
        setIsLoading(false)
      }, 5000)
    }
  }

  return (
    <>
      <Button
        className="flex-1 text-white bg-transparent border-1 border-solid border-[#2D394A] gap-2 rounded-full"
        size="md"
        onPress={onOpen}
      >
        Sell <ArrowUpRight className="w-4 h-4 text-white" />
      </Button>

      <Drawer
        hideCloseButton
        backdrop="opaque"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="bottom"
        size="2xl"
      >
        <DrawerContent className="bg-black rounded-t-2xl">
          {(onClose) => (
            <>
              <DrawerBody className="px-4 py-6 relative">
                <Button
                  isIconOnly
                  size="lg"
                  variant="light"
                  onPress={onClose}
                  className="absolute right-4 top-4 text-white bg-transparent p-0 hover:bg-transparent"
                >
                  <X className="w-6 h-6 text-[#5f5f5f]" />
                </Button>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-center">
                    <h3 className="text-[24px] mb-2 font-medium text-white">Sell {token.name}</h3>
                    <p className="text-[16px] text-white/70">
                      You have {token.amount} {token.symbol}
                    </p>
                    <p className="text-[16px] text-white/70 mt-1">
                      Select token amount you want to sell
                    </p>
                  </div>

                  {/* Percentage Buttons */}
                  <div className="grid grid-cols-5 gap-2 mt-4">
                    {[20, 40, 60, 80, 100].map((percent) => (
                      <Button
                        key={percent}
                        variant="bordered"
                        borderColor={sellAmount.preset === percent ? "#31F46E" : "#2D394A"}
                        className={`bg-transparent hover:bg-[#1a202b] text-sm h-[48px] w-[48px] rounded-xl ${sellAmount.preset === percent ? 'text-[#31F46E]' : 'text-white/90'
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
                      base: "w-full input-level bg-transparent mt-4",
                      input: "bg-transparent text-white border-0 h-[48px] text-center text-lg placeholder:text-white/50",
                      innerWrapper: "bg-transparent rounded-xl",
                      mainWrapper: "bg-transparent",
                      inputWrapper: `bg-transparent text-white border-1 border-solid h-[48px] rounded-xl ${sellAmount.custom && !isValidPercentage(parseFloat(sellAmount.custom))
                        ? "border-red-500"
                        : "border-[#2D394A]"
                        }`,
                    }}
                    placeholder="Custom %"
                    value={sellAmount.custom}
                    onChange={(e) => {
                      const value = e.target.value
                      // Allow empty input for better UX
                      if (value === "" || isValidPercentage(parseFloat(value))) {
                        setSellAmount({ preset: null, custom: value })
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

                  {/* Estimated TON Amount - Always show this section when a percentage is selected */}
                  {(sellAmount.preset || sellAmount.custom) && (
                    <div className="mt-4 p-3 bg-[#1a202b] rounded-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">You will receive approximately:</span>
                        {calculation.loading ? (
                          <div className="flex items-center">
                            <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/80 animate-spin mr-2" />
                            <span className="text-white/70">Calculating...</span>
                          </div>
                        ) : calculation.error ? (
                          <span className="text-red-400">Error calculating</span>
                        ) : (
                          <span className="text-[#31F46E] font-medium">
                            ~{(calculation.usdValue / calculation.tonPrice).toFixed(4)} TON
                          </span>
                        )}
                      </div>
                      {!calculation.loading && !calculation.error && (
                        <div className="text-xs text-white/50 mt-1">
                          Estimated value: ${calculation.usdValue.toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}

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

                  {/* Confirm Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-[#31F46E] to-[#0AFDE1] hover:opacity-90 text-black h-[48px] rounded-full text-[16px] mt-4"
                    onPress={handleSell}
                    isLoading={isLoading || calculation.loading}
                    isDisabled={
                      isLoading ||
                      calculation.loading ||
                      calculation.error ||
                      !hasValidPercentage
                    }
                  >
                    Confirm
                  </Button>
                </div>
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

SellButton.propTypes = {
  token: PropTypes.shape({
    symbol: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    decimals: PropTypes.number.isRequired,
    price: PropTypes.number,
    contractAddress: PropTypes.string,
    imgUrl: PropTypes.string, // Added imgUrl property
  }).isRequired,
}
