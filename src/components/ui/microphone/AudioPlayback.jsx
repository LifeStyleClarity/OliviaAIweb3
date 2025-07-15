import { useState, useRef, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
import PropTypes from "prop-types";

const AudioPlayback = ({ audioBlob, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);

  useEffect(() => {
    if (waveformRef.current && audioBlob) {
      const timeout = setTimeout(() => {
        createWaveSurfer();
      }, 500); // Increase delay (try 500ms or 750ms)
      return () => {
        clearTimeout(timeout);
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }
      };
    }
  }, [audioBlob]);

  // Auto-play effect when component mounts
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (wavesurferRef.current && autoPlay) {
        wavesurferRef.current.play();
        setIsPlaying(true);
      }
    }, 750); // Slightly longer delay to ensure waveform is ready

    return () => clearTimeout(timeout);
  }, [autoPlay]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const createWaveSurfer = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#09a339 ",
      progressColor: "#31F46E",
      height: 32,
      width: 150,
      normalize: true,
      backend: "WebAudio",
      barWidth: 6,
      barGap: 2,
      barRadius: 8,
      responsive: true, // Add this option
    });

    const audioUrl = URL.createObjectURL(audioBlob);
    wavesurferRef.current.load(audioUrl);

    // When the waveform is ready
    wavesurferRef.current.on("ready", () => {
      // Force a redraw if the method exists
      if (
        wavesurferRef.current &&
        typeof wavesurferRef.current.drawBuffer === "function"
      ) {
        wavesurferRef.current.drawBuffer();
      }
    });

    wavesurferRef.current.on("finish", () => {
      setIsPlaying(false);
    });

    // Update current time during playback
    wavesurferRef.current.on("audioprocess", () => {
      setCurrentTime(formatTime(wavesurferRef.current.getCurrentTime()));
    });

    // Clean up URL when component unmounts
    return () => {
      URL.revokeObjectURL(audioUrl);
    };
  };

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      if (isPlaying) {
        wavesurferRef.current.pause();
      } else {
        wavesurferRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <button
        onClick={togglePlayPause}
        className="p-1 rounded-full text-gray-400 hover:text-gray-300 transition-colors duration-200"
      >
        {isPlaying ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="4" height="16" x="6" y="4" />
            <rect width="4" height="16" x="14" y="4" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>

      <div className="flex-1 flex items-center gap-2">
        <div
          ref={waveformRef}
          className="flex-1 h-[32px] rounded-lg overflow-hidden "
          onAnimationEnd={() => {
            if (
              wavesurferRef.current &&
              typeof wavesurferRef.current.drawBuffer === "function"
            ) {
              // Force a redraw after the animation ends.
              wavesurferRef.current.drawBuffer();
            }
          }}
        />
        <span className="text-gray-300 font-mono text-[14px] tabular-nums min-w-[40px]">
          {currentTime}
        </span>
      </div>
    </div>
  );
};

AudioPlayback.propTypes = {
  audioBlob: PropTypes.instanceOf(Blob).isRequired,
  autoPlay: PropTypes.bool,
};

export default AudioPlayback;
