import { useState, useRef, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";
import PropTypes from "prop-types";

const MicrophoneRecorder = ({ onAudioRecorded, onRecordingStateChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState("0:00");
  const [selectedDevice, setSelectedDevice] = useState("");
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const recordRef = useRef(null);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    loadMicDevices();
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording && waveformRef.current) {
      createWaveSurfer();
    }
  }, [isRecording]);

  const createWaveSurfer = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#31F46E",
      progressColor: "#0AFDE1",
      barWidth: 3,
      barHeight: 4,
      barRadius: 3,
      barGap: 3,
      height: 32,
      normalize: true,
      partialRender: true,
      pixelRatio: 1,
      backgroundColor: "transparent",
      minPxPerSec: 1,
      fillParent: true,
      responsive: true,
      interact: false,
      cursorWidth: 0,
      hideScrollbar: true,
      barAlign: "bottom",
      mediaControls: false,
    });

    recordRef.current = wavesurferRef.current.registerPlugin(
      RecordPlugin.create({
        scrollingWaveform: true,
        renderRecordedAudio: true,
        renderRecordingAudio: true,
        audioBitsPerSecond: 128000,
        desiredSampRate: 44100,
        numberOfChannels: 1,
        bufferSize: 4096,
        timeInterval: 100,
      })
    );

    recordRef.current.on("record-progress", (time) => {
      updateProgress(time);
    });

    recordRef.current.on("record-end", (blob) => {
      // Only send the blob if it wasn't cancelled
      if (!isCancelledRef.current) {
        onAudioRecorded(blob);
      }
      setIsRecording(false);
      onRecordingStateChange(false);
      isCancelledRef.current = false;
    });

    // Start recording after wavesurfer is initialized
    startRecordingAfterInit();
  };

  const updateProgress = (time) => {
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    setRecordingTime(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
  };

  const loadMicDevices = async () => {
    try {
      const devices = await RecordPlugin.getAvailableAudioDevices();
      if (devices.length > 0) {
        setSelectedDevice(devices[0].deviceId);
      }
    } catch (error) {
      console.error("Error loading mic devices:", error);
    }
  };

  const validateMicrophoneDevice = async () => {
    try {
      const devices = await RecordPlugin.getAvailableAudioDevices();
      if (!devices.length) {
        throw new Error("No microphone devices found");
      }

      // Check if selected device is still available
      const deviceExists = devices.some(
        (device) => device.deviceId === selectedDevice
      );
      if (!deviceExists && devices.length > 0) {
        //console.log("Selected device not found, using first available device");
        setSelectedDevice(devices[0].deviceId);
        return devices[0].deviceId;
      }
      return selectedDevice;
    } catch (error) {
      console.error("Error validating microphone:", error);
      throw error;
    }
  };

  const startRecordingAfterInit = async () => {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // console.log(
        //   `Starting recording attempt ${retryCount + 1}/${maxRetries}`
        // );

        // Validate microphone before starting
        const validDeviceId = await validateMicrophoneDevice();

        if (!recordRef.current) {
          throw new Error("Record plugin not initialized");
        }

        await recordRef.current.startRecording({ deviceId: validDeviceId });
        //console.log("Recording started successfully");
        return;
      } catch (error) {
        console.error(
          `Error starting recording (attempt ${retryCount + 1}):`,
          error
        );
        retryCount++;

        if (retryCount === maxRetries) {
          console.error("Max retry attempts reached");
          setIsRecording(false);
          onRecordingStateChange(false);
          break;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  };

  const handleMouseDown = async () => {
    try {
      // Validate microphone access first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      isCancelledRef.current = false;
      setIsRecording(true);
      onRecordingStateChange(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      // Could add UI feedback here about microphone access denied
    }
  };

  const handleMouseUp = () => {
    if (recordRef.current) {
      recordRef.current.stopRecording();
    }
  };

  const handleCancel = () => {
    if (recordRef.current) {
      isCancelledRef.current = true;
      // Clean up recording state
      setIsRecording(false);
      onRecordingStateChange(false);
      setRecordingTime("0:00");

      // Stop the recording
      if (recordRef.current.mediaRecorder?.state === "recording") {
        recordRef.current.stopRecording();
      }

      // Clean up WaveSurfer
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    handleMouseDown();
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleMouseUp();
  };

  if (!isRecording) {
    return (
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="p-2 rounded-full text-gray-400 hover:text-gray-300 transition-colors duration-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      </button>
    );
  }

  return (
    <div className="flex w-full justify-between gap-3 backdrop-blur-sm rounded-xl transition-all duration-300">
      <button
        onClick={handleCancel}
        className="p-2 rounded-full text-gray-400 hover:text-gray-300 transition-colors duration-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>

      <div className="flex-1 flex items-center gap-3 min-w-0">
        <div style={{ overflow: "hidden" }} className="flex-1">
          <div
            ref={waveformRef}
            // className="h-[32px] rounded-lg"
            className="h-[32px] rounded-lg"
            style={{
              overflow: "hidden",
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          />
        </div>
        <span className="text-gray-300 font-mono text-[14px] tabular-nums">
          {recordingTime}
        </span>
      </div>

      <button
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="p-2 rounded-full bg-gradient-to-r from-[#31F46E] to-[#0AFDE1] text-black hover:opacity-90 transition-opacity duration-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
    </div>
  );
};

MicrophoneRecorder.propTypes = {
  onAudioRecorded: PropTypes.func.isRequired,
  onRecordingStateChange: PropTypes.func.isRequired,
};

export default MicrophoneRecorder;
