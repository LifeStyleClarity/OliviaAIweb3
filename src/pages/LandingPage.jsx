import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { useEffect, useRef } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  useEffect(() => {
    // Force play the video when component mounts
    const video = videoRef.current;
    if (video) {
      video.play().catch(error => {
        console.log('Video autoplay failed:', error);
      });
    }
  }, []);

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleLearnMore = () => {
    // Add your learn more action here
    console.log('Learn more clicked');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Background Video */}
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-contain"
        autoPlay
        muted
        playsInline
        preload="auto"
        onCanPlay={() => console.log('Video can play')}
        onError={(e) => console.log('Video error:', e)}
        onLoadStart={() => console.log('Video loading started')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      >
        <source src="/OLIVIA FOR PHONE .mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-end min-h-screen px-4 text-center pb-24">
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            size="md"
            className="bg-[#31F46E] hover:bg-[#28d15a] text-black font-bold px-6 py-3 md:px-8 md:py-4 text-base md:text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            onPress={handleGetStarted}
          >
            Get Started
          </Button>
          
          <Button
            size="md"
            variant="bordered"
            className="border-2 border-white text-white hover:bg-white hover:text-black font-bold px-6 py-3 md:px-8 md:py-4 text-base md:text-lg rounded-full transition-all duration-300 transform hover:scale-105"
            onPress={handleLearnMore}
          >
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
} 