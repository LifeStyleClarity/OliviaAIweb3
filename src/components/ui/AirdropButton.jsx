import { useState, useEffect } from 'react'
import { Gift, ArrowLeft, ChevronRight, ChevronLeft } from 'lucide-react'
import HalfRoundProgressBars from './HalfRoundProgressBars'
import {
  useDisclosure,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody
} from '@heroui/react'
import Button from './Button'
import { airdropService } from '../../api/services/airdrop.service'
import { useAuth } from '../../contexts/AuthContext'

export default function AirdropButton() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [isLoading, setIsLoading] = useState(false)
  const [currentSeason, setCurrentSeason] = useState(2)
  const { userData } = useAuth()
  const [airdropData, setAirdropData] = useState(null)

  const fetchAirdropData = async () => {
    try {
      const data = await airdropService.getAirdropData(userData.user_id)
      //console.log("airdropData: ", data)
      setAirdropData(data)
    } catch (error) {
      console.error("Failed to fetch airdrop data", error)
    }
  }

  useEffect(() => {
    fetchAirdropData()

    if (isOpen) {
      setIsLoading(true)
      // Simulate loading data
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Use season-specific points from the airdropData if available
  const AirdropPoints = airdropData
    ? currentSeason === 1
      ? (airdropData.chat_season_one_total_points ?? 0) +
      (airdropData.galaxy_blaster_season_one_total_points ?? 0) +
      (airdropData.onbassador_total_points ?? 0)
      : (airdropData.chat_season_two_total_points ?? 0) +
      (airdropData.galaxy_blaster_season_two_total_points ?? 0)
    : 0

  const maxPoints = 5000

  return (
    <>
      <Button
        variant="ghost"
        isIconOnly
        size="sm"
        className="p-2"
        onPress={onOpen}
      >
        <Gift className="w-5 h-5" />
      </Button>

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
                <h4 className="text-[16px] font-medium text-white">Airdrop</h4>
              </DrawerHeader>

              <DrawerBody>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#131820] animate-pulse mb-4" />
                    <div className="h-6 w-32 bg-[#131820] rounded animate-pulse" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-full max-w-md rounded-2xl mb-4 overflow-hidden">
                      <div className="relative flex justify-center">
                        <div className="absolute">
                          <HalfRoundProgressBars
                            value1={maxPoints}
                            total1={maxPoints}
                            season={currentSeason.toString()}
                            telegramUser={false}
                            backgroundFill={true}
                          />
                        </div>
                        <HalfRoundProgressBars
                          value1={AirdropPoints}
                          total1={maxPoints}
                          season={currentSeason.toString()}
                          telegramUser={false}
                        />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => setCurrentSeason(currentSeason === 2 ? 1 : 2)}
                            className="bg-[#1D2530] rounded-full h-8 w-8 flex items-center justify-center"
                          >
                            {currentSeason === 2 ? (
                              <ChevronRight className="w-5 h-5 text-white" />
                            ) : (
                              <ChevronLeft className="w-5 h-5 text-white" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="w-full max-w-md mx-auto overflow-hidden" style={{ height: '220px' }}>
                      <div className="relative w-full h-full">
                        <div
                          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${currentSeason === 2 ? 'translate-x-0' : '-translate-x-full'
                            }`}
                        >
                          <div className="w-full flex overflow-hidden justify-between items-end bg-[#131820] rounded-2xl">
                            <div className="w-[40%]">
                              <img src="/Olivia_pose_front.png" alt="Olivia Pose Front" />
                            </div>
                            <div className="w-[60%] flex flex-col justify-between items-start gap-7 p-2">
                              <span className="border-1 border-solid border-[#116D09] bg-[#041C02] text-[#22D911] px-2 py-1 text-[12px] rounded-full">
                                Airdrop Coming Soon
                              </span>
                              <div className="flex flex-col justify-start items-start">
                                <span className="text-white text-[16px]">Claimable Rewards</span>
                                <p className="text-white/80 text-[14px]">
                                  <span className="text-[#22D911] text-[20px]">
                                    {AirdropPoints}
                                  </span> Collectible Points
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${currentSeason === 1 ? 'translate-x-0' : 'translate-x-[100%]'
                            }`}
                        >
                          <div className="w-full bg-[#131820] rounded-2xl py-6 px-2">
                            <div className="flex flex-col items-center text-center">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[#FFD700]">⚡</span>
                                <p className="text-[#FFD700] text-[14px]">
                                  This round of Season 1 reward is now closed.
                                </p>
                              </div>
                              <p className="text-white/70 text-[12px] mb-6">
                                The airdrop is now closed. Stay tuned for future opportunities!
                              </p>
                              <div className="grid grid-cols-4 gap-2 w-full ">
                                {['DAYS', 'HOURS', 'MINUTES', 'SECONDS'].map((label) => (
                                  <div key={label} className="flex flex-col items-center bg-[#0A0C10] rounded-xl py-2">
                                    <span className="text-[#45EF34] text-[18px] font-bold mb-1">0</span>
                                    <span className="text-white/50 text-[10px]">{label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}
