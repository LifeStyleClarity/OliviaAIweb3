// src/pages/Login.jsx
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const videoRef = useRef(null);

  // Authentication context
  const { setUserAuthenticated, setUserData, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg && tg.initData && tg.initDataUnsafe) {
      // Check if they're on Telegram WebApp
      // platform might be: 'android', 'ios', 'web', etc.
      if (tg.platform && tg.platform !== "web") {
        // => Official Telegram in‐app browser (mobile or desktop),
        //    not Telegram Web (browser).
        tg.expand();
        tg.disableVerticalSwipes();
        tg.onEvent("viewportChanged", () => {
          if (!tg.isExpanded) {
            tg.expand();
          }
        });
        return; // Keep normal flow
      }
    }

    // Auto-play video
    const video = videoRef.current;
    if (video) {
      video.play().catch(error => {
        console.log('Background video autoplay failed:', error);
      });
    }

  }, []);

  // Handle guest login
  const handleGuestLogin = () => {
    loginAsGuest();
    navigate('/home');
  };

  return (
    <>
      <div className="min-h-screen flex items-center relative justify-center px-4 safe-area-view">
        {/* Background Video */}
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          style={{
            width: '100%',
            height: '100vh',
            objectFit: 'cover'
          }}
        >
          <source src="/background-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="w-full max-w-[600px] flex flex-col items-center z-10">
          <img
            src="/olivia-logo-white.png"
            alt="Olivia AI"
            className="w-auto h-[40px] mb-10"
          />
          <h1 className="text-[32px] font-bold text-center text-[#ffffff] mb-4">
            The Communications Layer for AI-Powered Web3
          </h1>
          <p className="text-[#cccccc] text-[18px] text-center mb-12 max-w-[500px]">
            Enabling dApps, wallets, and bots to launch real-time, intelligent agents in seconds. Every interaction is measurable, monetizable, and on-chain.
          </p>
          <div className="w-full flex flex-col items-center justify-center gap-4">
            {/* Guest Button */}
            <Button
              onPress={handleGuestLogin}
              className="w-full max-w-[300px] h-[48px] bg-[#31F46E] hover:bg-[#28d15a] text-black font-medium text-sm rounded-lg flex items-center justify-center"
            >
              Continue as Guest
            </Button>
          </div>

        </div>
      </div>
    </>
  );
}
