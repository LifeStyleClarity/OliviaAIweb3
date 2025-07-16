import { Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import TopNavigation from './TopNavigation'
import BottomNavigation from './BottomNavigation'
import WelcomeDrawer from '../ui/WelcomeDrawer'
import { useAuth } from '../../contexts/AuthContext'

export default function Layout() {
  const [showWelcomeDrawer, setShowWelcomeDrawer] = useState(false)
  const location = useLocation()
  // Check if the current pathname is '/game'
  const isGamePage = location.pathname === '/game'
  const { telegramUser, setTelegramUser, userData, setUserData, isGuestUser } = useAuth();

  useEffect(() => {
    // Don't show welcome drawer for guest users
    if (isGuestUser) {
      setShowWelcomeDrawer(false)
      return
    }
    
    if (!userData) {
      setShowWelcomeDrawer(false)
      return
    }
    
    // In development, show drawer to everyone if enabled
    // const showInDev = import.meta.env.VITE_SHOW_WELCOME_DRAWER_DEV === 'true'
    let isNewUser
    // TODO: In production, check if user is new - from DB
    if (telegramUser) {
      isNewUser = false
    } else {
      isNewUser = userData.first_user // This should come from your user data/context
    }

    setShowWelcomeDrawer(isNewUser || false)
  }, [userData, telegramUser, isGuestUser])

  return (
    <div className={`h-screen hide-scrollbar w-full flex flex-col relative ${isGamePage ? "" : "pb-[65px]"}`}>
      {/* Top Navigation */}
      <TopNavigation />

      {/* Main content */}
      {/* <main className="flex-1 px-4"> */}
      <main className={`flex-1 ${isGamePage ? '' : 'px-4'}`}>
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Bottom spacing for navigation */}
      {/* <div className={`${isGamePage ? '' : 'h-[65px]'}`} /> */}

      {/* Welcome Drawer */}
      < WelcomeDrawer
        isOpen={showWelcomeDrawer}
        onClose={() => setShowWelcomeDrawer(false)}
      />
    </div>
  )
}
