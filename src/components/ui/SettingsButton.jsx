import Button from './Button'
import { Settings2, ArrowLeft, Loader2 } from 'lucide-react'
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerBody,
  Input,
  useDisclosure as useHeroDisclosure
} from '@heroui/react'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { useProfileSettings } from '../../hooks/useProfileSettings'
import { useAuth } from '../../contexts/AuthContext'

export default function SettingsButton() {
  const { isOpen = false, onOpen = () => {}, onOpenChange = () => {} } = useHeroDisclosure()
  const { userData } = useAuth()
  const { 
    profileSettings,
    isLoading,
    updateSettings 
  } = useProfileSettings(userData?.user_id, userData?.wallet_address)
  
  const [stopLoss, setStopLoss] = useState({ preset: null, custom: '' })
  const [takeProfit, setTakeProfit] = useState({ preset: null, custom: '' })
  const [isSaving, setIsSaving] = useState(false)

  // Convert percentage to decimal (e.g., 10% -> 0.1)
  const percentageToDecimal = (value) => {
    if (!value) return 0
    const numValue = parseFloat(value)
    return numValue / 100
  }

  // Convert decimal to percentage for display (e.g., 0.1 -> 10)
  const decimalToPercentage = (value) => {
    if (!value && value !== 0) return ''
    return (value * 100).toString()
  }

  // Initialize values from profile settings
  useEffect(() => {
    if (profileSettings) {
      const stopLossPercentage = parseFloat(decimalToPercentage(profileSettings.stop_loss))
      const takeProfitPercentage = parseFloat(decimalToPercentage(profileSettings.take_profit))

      // Check if values match any presets
      const isStopLossPreset = [5, 10, 20].includes(stopLossPercentage)
      const isTakeProfitPreset = [5, 10, 20].includes(takeProfitPercentage)

      setStopLoss({ 
        preset: isStopLossPreset ? stopLossPercentage : null, 
        custom: isStopLossPreset ? '' : stopLossPercentage.toString()
      })
      
      setTakeProfit({ 
        preset: isTakeProfitPreset ? takeProfitPercentage : null,
        custom: isTakeProfitPreset ? '' : takeProfitPercentage.toString()
      })
    }
  }, [profileSettings])

  const handleStopLossPreset = (value) => {
    setStopLoss({ preset: value, custom: value.toString() })
  }

  const handleTakeProfitPreset = (value) => {
    setTakeProfit({ preset: value, custom: value.toString() })
  }

  const handleSave = async (onClose) => {
    try {
      setIsSaving(true)
      const updatedSettings = {
        stop_loss: percentageToDecimal(stopLoss.preset || stopLoss.custom),
        take_profit: percentageToDecimal(takeProfit.preset || takeProfit.custom)
      }
      
      await updateSettings(updatedSettings)
      toast.success("Settings saved successfully")
      onClose()
    } catch (err) {
      toast.error(err.message || "Failed to save settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Button 
        variant="ghost" 
        isIconOnly={true}
        size="sm"
        className="p-2"
        onPress={onOpen}
      >
        <Settings2 className="w-5 h-5" />
      </Button>

      <Drawer
        hideCloseButton
        backdrop="opaque"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="right"
        size="full"
      >
        <DrawerContent className="bg-gradient-to-t from-[#181818] to-[#000000]">
          {(onClose) => (
            <>
              <DrawerHeader className="relative flex items-center justify-center px-2 py-4">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={onClose}
                  isDisabled={isSaving}
                  className="absolute left-6 text-white bg-[#1D2530] rounded-full h-10 w-10"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <h4 className="text-[16px] font-medium text-white">Settings</h4>
              </DrawerHeader>

              <DrawerBody className="px-4">
                <div className="flex flex-col gap-8 h-screen justify-between">
                  <div className='w-full flex flex-col gap-8 mt-8'>

                    {/* Stop Loss Section */}
                    <div className="flex flex-col gap-4">
                      <h3 className="text-[16px] font-light text-white">Stop Loss</h3>
                      <div className="flex gap-4">
                        <div className="flex gap-1 flex-1">
                          <Button 
                            variant="bordered"
                            isIconOnly
                            isDisabled={isSaving}
                            borderColor={stopLoss.preset === 5 ? "#31F46E" : "#ffff"}
                            className={`bg-[#131820] hover:bg-[#1a202b] text-sm h-[40px] rounded-lg flex-1 ${
                              stopLoss.preset === 5 ? 'text-[#31F46E]' : 'text-white/90'
                            }`}
                            onPress={() => handleStopLossPreset(5)}
                          >
                            5%
                          </Button>
                          <Button 
                            variant="bordered"
                            isIconOnly
                            isDisabled={isSaving}
                            borderColor={stopLoss.preset === 10 ? "#31F46E" : "#ffff"}
                            className={`bg-[#131820] hover:bg-[#1a202b] text-sm h-[40px] rounded-lg flex-1 ${
                              stopLoss.preset === 10 ? 'text-[#31F46E]' : 'text-white/90'
                            }`}
                            onPress={() => handleStopLossPreset(10)}
                          >
                            10%
                          </Button>
                          <Button 
                            variant="bordered"
                            isIconOnly
                            isDisabled={isSaving}
                            borderColor={stopLoss.preset === 20 ? "#31F46E" : "#ffff"}
                            className={`bg-[#131820] hover:bg-[#1a202b] text-sm h-[40px] rounded-lg flex-1 ${
                              stopLoss.preset === 20 ? 'text-[#31F46E]' : 'text-white/90'
                            }`}
                            onPress={() => handleStopLossPreset(20)}
                          >
                            20%
                          </Button>
                        </div>
                        <Input
                          type="number"
                          isDisabled={isSaving}
                          classNames={{
                            base: "w-1/2 input-level bg-transparent",
                            input: "bg-transparent text-white border-0 h-9 text-sm",
                            innerWrapper: "bg-transparent rounded-lg",
                            mainWrapper: "bg-transparent",
                            inputWrapper: "bg-transparent border-1 border-[#ffff]/50 border-solid h-9",
                          }}
                          placeholder="Custom"
                          value={stopLoss.custom}
                          onChange={(e) => setStopLoss({ preset: null, custom: e.target.value })}
                          endContent={
                            <div className="pointer-events-none flex items-center">
                              <span className="text-default-400 text-small">%</span>
                            </div>
                          }
                        />
                      </div>
                    </div>

                    {/* Take Profit Section */}
                    <div className="flex flex-col gap-4">
                      <h3 className="text-[16px] font-light text-white">Take Profit</h3>
                      <div className="flex gap-4">
                        <div className="flex gap-1 flex-1">
                          <Button 
                            variant="bordered"
                            isIconOnly
                            isDisabled={isSaving}
                            borderColor={takeProfit.preset === 5 ? "#31F46E" : "#ffff"}
                            className={`bg-[#131820] h-[40px] hover:bg-[#1a202b] text-sm rounded-lg flex-1 ${
                              takeProfit.preset === 5 ? 'text-[#31F46E]' : 'text-white/90'
                            }`}
                            onPress={() => handleTakeProfitPreset(5)}
                          >
                            5%
                          </Button>
                          <Button 
                            variant="bordered"
                            isIconOnly
                            isDisabled={isSaving}
                            borderColor={takeProfit.preset === 10 ? "#31F46E" : "#ffff"}
                            className={`bg-[#131820] h-[40px] hover:bg-[#1a202b] text-sm rounded-lg flex-1 ${
                              takeProfit.preset === 10 ? 'text-[#31F46E]' : 'text-white/90'
                            }`}
                            onPress={() => handleTakeProfitPreset(10)}
                          >
                            10%
                          </Button>
                          <Button 
                            variant="bordered"
                            isIconOnly
                            isDisabled={isSaving}
                            borderColor={takeProfit.preset === 20 ? "#31F46E" : "#ffff"}
                            className={`bg-[#131820] h-[40px] hover:bg-[#1a202b] text-sm rounded-lg flex-1 ${
                              takeProfit.preset === 20 ? 'text-[#31F46E]' : 'text-white/90'
                            }`}
                            onPress={() => handleTakeProfitPreset(20)}
                          >
                            20%
                          </Button>
                        </div>
                        <Input
                          type="number"
                          isDisabled={isSaving}
                          classNames={{
                            base: "w-1/2 input-level bg-transparent",
                            input: "bg-transparent text-white border-0 h-9 text-sm",
                            innerWrapper: "bg-transparent rounded-lg",
                            mainWrapper: "bg-transparent",
                            inputWrapper: "bg-transparent border-1 border-[#ffff]/50 border-solid h-9",
                          }}
                          placeholder="Custom"
                          value={takeProfit.custom}
                          onChange={(e) => setTakeProfit({ preset: null, custom: e.target.value })}
                          endContent={
                            <div className="pointer-events-none flex items-center">
                              <span className="text-default-400 text-small">%</span>
                            </div>
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <Button
                    variant="primary"
                    className="w-full mb-8 p-5 rounded-full text-[16px]"
                    isDisabled={isSaving || isLoading}
                    onPress={() => handleSave(onClose)}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : 'Save'}
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
